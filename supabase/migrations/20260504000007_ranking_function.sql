-- =============================================================================
-- Migration 017 — Ranking-Funktion  (Schritt 9.8 / Playbook Kap. 5)
-- Logischer Name: 005_ranking_function.sql
-- =============================================================================
-- Stufe 2 des Matching-Algorithmus: nimmt einen Kunden und liefert eine
-- sortierte Liste der aktuell verfuegbaren Kaffees.
--
-- Phasen (Kap. 5):
--   1) Hartfilter         — get_eligible_coffees()
--   2) Soft-Scoring       — compute_scoring_score() ueber 7 Dimensionen
--   3) Vektor-Aehnlichkeit — pgvector cosine, Fallback wenn NULL
--   4) Final Score        — gewichtete Kombination aus algorithm_config
--   5) MMR-Diversitaet    — nur fuer Discovery, lambda=0.7
--
-- Aufruf:
--   SELECT * FROM rank_coffees_for_customer('<customer-uuid>', 'discovery', 3);
--   SELECT * FROM rank_coffees_for_customer('<customer-uuid>', 'fix', 1);
-- =============================================================================


-- =============================================================================
-- A) Helper: distance_score (Kap. 5.3)
-- =============================================================================
-- Lookup-Tabelle aus dem Playbook: |diff| -> Punkte.
--   diff 0 -> 100, 1 -> 75, 2 -> 40, 3 -> 15, 4+ -> 0
create or replace function public.distance_score(p_target int, p_coffee int)
returns numeric
language sql
immutable
as $$
  select case
    when p_target is null or p_coffee is null then null::numeric
    else case least(abs(p_target - p_coffee), 4)
      when 0 then 100::numeric
      when 1 then  75::numeric
      when 2 then  40::numeric
      when 3 then  15::numeric
      else         0::numeric
    end
  end;
$$;


-- =============================================================================
-- B) Helper: aroma_overlap_score (Kap. 5.3)
-- =============================================================================
-- Schnittmenge zwischen Ziel-Familien und Kaffee-Familien.
--   0 ueberlappende -> 0
--   1 ueberlappende -> 70
--   2+ ueberlappende -> 100
create or replace function public.aroma_overlap_score(p_target text[], p_coffee text[])
returns numeric
language sql
immutable
as $$
  select case
    when p_target is null or p_coffee is null then 0::numeric
    else case (
      select count(*)
      from unnest(p_target) t(elem)
      where elem = any(p_coffee)
    )
      when 0 then 0::numeric
      when 1 then 70::numeric
      else        100::numeric
    end
  end;
$$;


-- =============================================================================
-- C) compute_target_profile (Kap. 5.4)
-- =============================================================================
-- Mischt Primaer- und Sekundaertyp gemaess Confidence.
-- Rueckgabe als JSONB damit wir alle 7 Dimensionen + Aroma-Familien in einem
-- Wert herumreichen koennen.
create or replace function public.compute_target_profile(
  p_primary_id   smallint,
  p_secondary_id smallint,
  p_confidence   numeric
)
returns jsonb
language plpgsql
stable
as $$
declare
  v_mix_secondary numeric;
  v_primary       record;
  v_secondary     record;
  v_aroma_union   text[];
begin
  -- Misch-Verhaeltnis aus Confidence-Band (Kap. 4.6 / 5.4)
  v_mix_secondary := case
    when p_confidence is null      then 0.30   -- defensiv: kein Profil -> mittlerer Mix
    when p_confidence >= 0.85      then 0.00   -- 100/0
    when p_confidence >= 0.65      then 0.15   -- 85/15
    when p_confidence >= 0.45      then 0.30   -- 70/30
    else                                 0.40  -- 60/40
  end;

  select * into v_primary   from public.taste_types where id = p_primary_id;
  if v_mix_secondary > 0 and p_secondary_id is not null then
    select * into v_secondary from public.taste_types where id = p_secondary_id;
  end if;

  -- Aroma-Familien: Vereinigung beider Sets bei Mischprofil
  if v_mix_secondary > 0 and v_secondary is not null then
    v_aroma_union := array(
      select distinct unnest(v_primary.aroma_families || v_secondary.aroma_families)
    );
  else
    v_aroma_union := v_primary.aroma_families;
  end if;

  return jsonb_build_object(
    'acidity',     round((1 - v_mix_secondary) * v_primary.acidity     + coalesce(v_mix_secondary * v_secondary.acidity,     0)),
    'body',        round((1 - v_mix_secondary) * v_primary.body        + coalesce(v_mix_secondary * v_secondary.body,        0)),
    'sweetness',   round((1 - v_mix_secondary) * v_primary.sweetness   + coalesce(v_mix_secondary * v_secondary.sweetness,   0)),
    'bitterness',  round((1 - v_mix_secondary) * v_primary.bitterness  + coalesce(v_mix_secondary * v_secondary.bitterness,  0)),
    'roast_level', round((1 - v_mix_secondary) * v_primary.roast_level + coalesce(v_mix_secondary * v_secondary.roast_level, 0)),
    'complexity',  round((1 - v_mix_secondary) * v_primary.complexity  + coalesce(v_mix_secondary * v_secondary.complexity,  0)),
    'aroma_families', v_aroma_union,
    'mix_secondary',  v_mix_secondary,
    'primary_id',     p_primary_id,
    'secondary_id',   p_secondary_id
  );
end;
$$;


-- =============================================================================
-- D) compute_scoring_score  (Phase 2 — Kap. 5.3)
-- =============================================================================
-- Gewichtete Summe der 7 Dimensionen. Wenn ein Wert beim Kaffee fehlt,
-- erhaelt die Dimension 0 (kein Wissen = kein Punkt).
-- Gewichte aus Kap. 5.3:
--   Aroma 25%, Saeure 20%, Roest 15%, Koerper 12%, Suesse 10%, Bitter 10%, Komplex 8%
create or replace function public.compute_scoring_score(p_target jsonb, p_coffee_id uuid)
returns numeric
language plpgsql
stable
as $$
declare
  c              record;
  s_aroma        numeric;
  s_acidity      numeric;
  s_body         numeric;
  s_sweetness    numeric;
  s_bitterness   numeric;
  s_roast        numeric;
  s_complexity   numeric;
  v_total        numeric;
begin
  select acidity, body, sweetness, bitterness, roast_level, complexity, aroma_families
    into c
    from public.coffees
    where id = p_coffee_id;

  if not found then
    return 0;
  end if;

  s_aroma      := public.aroma_overlap_score(
                    coalesce((p_target -> 'aroma_families')::jsonb::text[], '{}'),
                    coalesce(c.aroma_families, '{}')
                  );
  s_acidity    := coalesce(public.distance_score((p_target ->> 'acidity')::int,    c.acidity),    0);
  s_body       := coalesce(public.distance_score((p_target ->> 'body')::int,       c.body),       0);
  s_sweetness  := coalesce(public.distance_score((p_target ->> 'sweetness')::int,  c.sweetness),  0);
  s_bitterness := coalesce(public.distance_score((p_target ->> 'bitterness')::int, c.bitterness), 0);
  s_roast      := coalesce(public.distance_score((p_target ->> 'roast_level')::int, c.roast_level), 0);
  s_complexity := coalesce(public.distance_score((p_target ->> 'complexity')::int, c.complexity), 0);

  v_total :=
      0.25 * s_aroma
    + 0.20 * s_acidity
    + 0.15 * s_roast
    + 0.12 * s_body
    + 0.10 * s_sweetness
    + 0.10 * s_bitterness
    + 0.08 * s_complexity;

  return round(v_total, 2);
end;
$$;


-- =============================================================================
-- E) get_eligible_coffees  (Phase 1 — Kap. 5.2)
-- =============================================================================
-- Liefert nur die Kaffees, die alle Hartfilter passieren. Lockerungs-Flags
-- werden vom Fallback-Cascade-Mechanismus (Kap. 7.2) genutzt.
create or replace function public.get_eligible_coffees(
  p_customer_id uuid,
  p_subscription_type text default 'discovery',
  p_relax_roaster_cooldown boolean default false,
  p_relax_direct_trade     boolean default false,
  p_relax_price_band       numeric default 1.0
)
returns table (
  coffee_id  uuid,
  roaster_id uuid
)
language sql
stable
as $$
  with
  cust as (
    select
      id,
      requires_decaf,
      requires_organic,
      requires_direct_trade,
      coalesce(max_price_per_250g, 9999) as max_price
    from public.customers where id = p_customer_id
  ),
  cooldown_threshold as (
    select coalesce((select value_numeric::int from public.algorithm_config where key = 'cooldown_months_coffee'), 6) as months_coffee,
           coalesce((select value_numeric::int from public.algorithm_config where key = 'cooldown_count_roaster'), 3) as count_roaster
  ),
  recent_orders as (
    select oi.coffee_id, c.roaster_id, o.delivered_at
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    join public.coffees c on c.id = oi.coffee_id
    where o.customer_id = p_customer_id
      and o.delivered_at is not null
    order by o.delivered_at desc
  ),
  coffees_in_cooldown as (
    select coffee_id
    from recent_orders, cooldown_threshold
    where delivered_at > now() - (months_coffee || ' months')::interval
  ),
  roasters_in_cooldown as (
    select distinct roaster_id from (
      select roaster_id, row_number() over (order by delivered_at desc) as rn
      from recent_orders
    ) r, cooldown_threshold
    where r.rn <= count_roaster
  ),
  customer_allergens as (
    select array_agg(allergen) as allergens
    from public.customer_aroma_preferences
    where customer_id = p_customer_id and false
    -- Hinweis: Allergene-Tabelle pro Kunde existiert nicht direkt — Restriktionen
    -- liegen aktuell in customers.requires_*. Sobald customer_allergens-Tabelle
    -- existiert, hier ergaenzen. Vorerst leeres Array.
  ),
  quality_threshold as (
    select coalesce((select value_numeric::int from public.algorithm_config where key = 'quality_threshold_active'), 75) as min_score
  )
  select cf.id, cf.roaster_id
  from public.coffees cf
  cross join cust cp
  cross join quality_threshold qt
  where
        cf.status = 'active'
    and cf.deleted_at is null
    and cf.stock_kg >= 0.25
    and (cf.data_quality_score is null or cf.data_quality_score >= qt.min_score)
    -- Sichtbarkeitsfenster
    and (cf.visible_from  is null or cf.visible_from  <= now())
    and (cf.visible_until is null or cf.visible_until >  now())
    -- Preisband (mit optionaler Lockerung)
    and (cf.price_per_250g is null
         or cf.price_per_250g <= cp.max_price * p_relax_price_band)
    -- Decaf
    and (cp.requires_decaf = false or cf.is_decaf = true)
    -- Bio
    and (cp.requires_organic = false or cf.is_organic = true)
    -- Direct Trade (mit optionaler Lockerung)
    and (cp.requires_direct_trade = false
         or p_relax_direct_trade = true
         or cf.is_direct_trade = true)
    -- Allergene
    and not exists (
      select 1
      from public.coffee_allergens ca
      where ca.coffee_id = cf.id
        and ca.allergen in (
          select unnest(coalesce(allergens, '{}'::text[])) from customer_allergens
        )
    )
    -- Cooldown identischer Kaffee
    and cf.id not in (select coffee_id from coffees_in_cooldown)
    -- Cooldown gleicher Roester (nur Discovery, mit optionaler Lockerung)
    and (
      p_subscription_type = 'fix'
      or p_relax_roaster_cooldown = true
      or cf.roaster_id not in (select roaster_id from roasters_in_cooldown)
    );
$$;


-- =============================================================================
-- F) explain_coffee_match  — Erklaerbarkeit (Kap. 1.3)
-- =============================================================================
-- Erzeugt strukturiertes JSONB mit Begruendung pro Kaffee.
create or replace function public.explain_coffee_match(
  p_target jsonb,
  p_coffee_id uuid,
  p_scoring_score numeric,
  p_vector_similarity numeric
)
returns jsonb
language plpgsql
stable
as $$
declare
  c        record;
  reasons  jsonb;
begin
  select acidity, body, sweetness, bitterness, roast_level, complexity, aroma_families,
         is_decaf, is_organic, is_direct_trade
    into c
    from public.coffees where id = p_coffee_id;

  reasons := jsonb_build_object(
    'aroma_overlap',  public.aroma_overlap_score(
                        coalesce((p_target -> 'aroma_families')::jsonb::text[], '{}'),
                        coalesce(c.aroma_families, '{}')
                      ),
    'matched_aromas', (
      select jsonb_agg(elem)
      from unnest(coalesce((p_target -> 'aroma_families')::jsonb::text[], '{}')) elem
      where elem = any(coalesce(c.aroma_families, '{}'))
    ),
    'roast_match',     public.distance_score((p_target ->> 'roast_level')::int, c.roast_level),
    'acidity_match',   public.distance_score((p_target ->> 'acidity')::int,     c.acidity),
    'body_match',      public.distance_score((p_target ->> 'body')::int,        c.body),
    'sweetness_match', public.distance_score((p_target ->> 'sweetness')::int,   c.sweetness),
    'bitterness_match', public.distance_score((p_target ->> 'bitterness')::int, c.bitterness),
    'complexity_match', public.distance_score((p_target ->> 'complexity')::int, c.complexity),
    'scoring_score',    p_scoring_score,
    'vector_similarity', p_vector_similarity,
    'is_decaf',          c.is_decaf,
    'is_organic',        c.is_organic,
    'is_direct_trade',   c.is_direct_trade
  );

  return reasons;
end;
$$;


-- =============================================================================
-- G) rank_coffees_for_customer  — die Hauptfunktion (Kap. 5.8)
-- =============================================================================
-- Schritt 9.8 — vollstaendige Ranking-Logik mit Phase 1-5.
-- Wenn p_save_snapshot = true, schreibt einen Eintrag in recommendation_snapshots.
create or replace function public.rank_coffees_for_customer(
  p_customer_id        uuid,
  p_subscription_type  text default 'discovery',  -- 'discovery' | 'fix'
  p_limit              int default 3,
  p_save_snapshot      boolean default false,
  p_subscription_id    uuid default null,
  p_delivery_slot      date default null,
  p_algorithm_version  text default 'v1.0'
)
returns table (
  rank              smallint,
  coffee_id         uuid,
  coffee_name       text,
  roaster_id        uuid,
  final_score       numeric,
  scoring_score     numeric,
  vector_similarity numeric,
  reasons           jsonb
)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_customer       record;
  v_target         jsonb;
  v_w_scoring      numeric;
  v_w_vector       numeric;
  v_w_diversity    numeric;
  v_mmr_lambda     numeric;
  v_has_customer_emb boolean;
  v_pre_pool_size  int := 30;
  v_recommendations jsonb := '[]'::jsonb;
  r                record;
  -- MMR-Auswahl
  v_selected_ids   uuid[] := '{}';
  v_selected_embs  vector(1536)[] := '{}';
  v_pick           record;
  v_best_mmr       numeric;
  v_best_idx       int;
  v_curr_mmr       numeric;
  v_max_sim        numeric;
  i                int;
  v_rank_counter   smallint := 0;
begin
  ----------------------------------------------------------------------------
  -- 0) Kunden-Profil laden + Gewichte aus algorithm_config
  ----------------------------------------------------------------------------
  select c.id, c.taste_type_id, c.secondary_type, c.confidence, c.taste_embedding
    into v_customer
    from public.customers c
    where c.id = p_customer_id;

  if not found then
    raise exception 'rank_coffees_for_customer: Kunde % nicht gefunden', p_customer_id;
  end if;

  if v_customer.taste_type_id is null then
    raise exception 'rank_coffees_for_customer: Kunde % hat noch kein Geschmacksprofil — erst Quiz ausfuellen', p_customer_id;
  end if;

  v_w_scoring   := coalesce((select value_numeric from public.algorithm_config where key = 'scoring_weight'),   0.55);
  v_w_vector    := coalesce((select value_numeric from public.algorithm_config where key = 'vector_weight'),    0.35);
  v_w_diversity := coalesce((select value_numeric from public.algorithm_config where key = 'diversity_weight'), 0.10);
  v_mmr_lambda  := coalesce((select value_numeric from public.algorithm_config where key = 'mmr_lambda'),       0.70);

  -- Cold-Start: kein Embedding -> Vector-Anteil auf Scoring umverteilen
  v_has_customer_emb := v_customer.taste_embedding is not null;
  if not v_has_customer_emb then
    v_w_scoring   := v_w_scoring + v_w_vector * 0.7;
    v_w_diversity := v_w_diversity + v_w_vector * 0.3;
    v_w_vector    := 0;
  end if;

  ----------------------------------------------------------------------------
  -- 1) Target-Profil aus Primaer + Sekundaer + Confidence
  ----------------------------------------------------------------------------
  v_target := public.compute_target_profile(
    v_customer.taste_type_id,
    v_customer.secondary_type,
    v_customer.confidence
  );

  ----------------------------------------------------------------------------
  -- 2) Hartfilter mit Fallback-Cascade (Kap. 7.2)
  --    Wir versuchen nacheinander immer lockerere Filter, bis wir mind. 1
  --    Kandidat haben.
  ----------------------------------------------------------------------------
  create temporary table tmp_eligible (coffee_id uuid, roaster_id uuid) on commit drop;

  insert into tmp_eligible
    select * from public.get_eligible_coffees(p_customer_id, p_subscription_type, false, false, 1.0);

  if not exists (select 1 from tmp_eligible) then
    insert into tmp_eligible
      select * from public.get_eligible_coffees(p_customer_id, p_subscription_type, true, false, 1.0);
  end if;

  if not exists (select 1 from tmp_eligible) then
    insert into tmp_eligible
      select * from public.get_eligible_coffees(p_customer_id, p_subscription_type, true, true, 1.0);
  end if;

  if not exists (select 1 from tmp_eligible) then
    insert into tmp_eligible
      select * from public.get_eligible_coffees(p_customer_id, p_subscription_type, true, true, 1.20);
  end if;

  if not exists (select 1 from tmp_eligible) then
    -- Stufe 4: keine Empfehlung moeglich
    return;
  end if;

  ----------------------------------------------------------------------------
  -- 3+4) Soft-Scoring + Vector + vorlaeufiger Final-Score
  ----------------------------------------------------------------------------
  create temporary table tmp_scored (
    coffee_id           uuid primary key,
    roaster_id          uuid,
    coffee_name         text,
    coffee_embedding    vector(1536),
    scoring_score       numeric,
    vector_similarity   numeric,
    preliminary_final   numeric,
    reasons             jsonb
  ) on commit drop;

  insert into tmp_scored
  select
    e.coffee_id,
    e.roaster_id,
    cf.name as coffee_name,
    cf.flavor_embedding,
    public.compute_scoring_score(v_target, e.coffee_id) as scoring_score,
    case
      when v_has_customer_emb and cf.flavor_embedding is not null then
        round((1 - (cf.flavor_embedding <=> v_customer.taste_embedding))::numeric, 4)
      else 0::numeric
    end as vector_similarity,
    null::numeric, null::jsonb
  from tmp_eligible e
  join public.coffees cf on cf.id = e.coffee_id;

  update tmp_scored
  set preliminary_final = round(
        v_w_scoring   * scoring_score
      + v_w_vector    * vector_similarity * 100
      , 2);

  ----------------------------------------------------------------------------
  -- 5) Phase 5 — MMR fuer Discovery (lambda * relevance - (1-lambda) * max_sim_to_selected)
  --    Pre-Pool auf top v_pre_pool_size beschraenken (Performance, Kap. 5.8).
  --    Bei Fix-Abo oder fehlenden Embeddings: einfaches Top-N nach Score.
  --
  --    Wir sammeln die Auswahl zuerst in tmp_results, geben sie dann am Ende
  --    geschlossen zurueck — und schreiben optional einen Snapshot.
  ----------------------------------------------------------------------------
  create temporary table tmp_results (
    rank              smallint,
    coffee_id         uuid,
    coffee_name       text,
    roaster_id        uuid,
    scoring_score     numeric,
    vector_similarity numeric,
    final_score       numeric,
    reasons           jsonb
  ) on commit drop;

  if p_subscription_type = 'discovery'
     and v_has_customer_emb
     and (select count(*) from tmp_scored where coffee_embedding is not null) >= 2
  then
    -- MMR-Loop
    create temporary table tmp_pool on commit drop as
      select coffee_id, roaster_id, coffee_name, coffee_embedding,
             scoring_score, vector_similarity, preliminary_final
      from tmp_scored
      order by preliminary_final desc nulls last
      limit v_pre_pool_size;

    while v_rank_counter < p_limit and exists (select 1 from tmp_pool) loop
      v_best_mmr := -1e18;
      v_pick := null;

      for r in select * from tmp_pool loop
        if cardinality(v_selected_embs) = 0 or r.coffee_embedding is null then
          v_max_sim := 0;
        else
          select max(1 - (r.coffee_embedding <=> sel))
            into v_max_sim
            from unnest(v_selected_embs) sel;
        end if;

        v_curr_mmr := v_mmr_lambda * (r.preliminary_final / 100)
                    - (1 - v_mmr_lambda) * coalesce(v_max_sim, 0);

        if v_curr_mmr > v_best_mmr then
          v_best_mmr := v_curr_mmr;
          v_pick := r;
        end if;
      end loop;

      exit when v_pick is null;

      v_rank_counter := v_rank_counter + 1;
      insert into tmp_results values (
        v_rank_counter,
        v_pick.coffee_id,
        v_pick.coffee_name,
        v_pick.roaster_id,
        v_pick.scoring_score,
        v_pick.vector_similarity,
        round(v_pick.preliminary_final + v_w_diversity * v_best_mmr * 100, 2),
        public.explain_coffee_match(v_target, v_pick.coffee_id, v_pick.scoring_score, v_pick.vector_similarity)
      );

      if v_pick.coffee_embedding is not null then
        v_selected_embs := v_selected_embs || v_pick.coffee_embedding;
      end if;
      v_selected_ids := v_selected_ids || v_pick.coffee_id;
      delete from tmp_pool where tmp_pool.coffee_id = v_pick.coffee_id;
    end loop;

  else
    -- Fix-Abo oder kein Embedding -> einfaches Top-N
    for r in
      select * from tmp_scored
      order by preliminary_final desc nulls last
      limit p_limit
    loop
      v_rank_counter := v_rank_counter + 1;
      insert into tmp_results values (
        v_rank_counter,
        r.coffee_id,
        r.coffee_name,
        r.roaster_id,
        r.scoring_score,
        r.vector_similarity,
        r.preliminary_final,
        public.explain_coffee_match(v_target, r.coffee_id, r.scoring_score, r.vector_similarity)
      );
    end loop;
  end if;

  ----------------------------------------------------------------------------
  -- 6) Snapshot speichern (optional, Kap. 7.5)
  ----------------------------------------------------------------------------
  if p_save_snapshot and exists (select 1 from tmp_results) then
    select jsonb_agg(jsonb_build_object(
              'rank', t.rank,
              'coffee_id', t.coffee_id,
              'coffee_name', t.coffee_name,
              'roaster_id', t.roaster_id,
              'final_score', t.final_score,
              'scoring_score', t.scoring_score,
              'vector_similarity', t.vector_similarity,
              'reasons', t.reasons
           ) order by t.rank)
      into v_recommendations
      from tmp_results t;

    insert into public.recommendation_snapshots
      (customer_id, subscription_id, delivery_slot, recommendations, algorithm_version)
    values
      (p_customer_id, p_subscription_id,
       coalesce(p_delivery_slot, current_date + interval '7 days'),
       v_recommendations, p_algorithm_version);
  end if;

  ----------------------------------------------------------------------------
  -- 7) Resultate zurueckgeben
  ----------------------------------------------------------------------------
  return query
    select t.rank, t.coffee_id, t.coffee_name, t.roaster_id,
           t.final_score, t.scoring_score, t.vector_similarity, t.reasons
    from tmp_results t
    order by t.rank;
end;
$$;

comment on function public.rank_coffees_for_customer(uuid, text, int, boolean, uuid, date, text) is
  'Stufe 2 des Matching-Algorithmus (Kap. 5). Liefert die Top-N Kaffees fuer '
  'einen Kunden via Hartfilter -> Soft-Scoring -> Vector -> MMR (nur Discovery). '
  'Mit p_save_snapshot=true wird die Empfehlung in recommendation_snapshots persistiert.';
