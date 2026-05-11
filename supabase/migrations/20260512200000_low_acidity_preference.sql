-- ============================================================================
-- Q-Frage 9: Saeure-Empfindlichkeit aus dem Quiz nutzbar machen.
--
-- Frage 9 ("Wie reagiert dein Magen auf Kaffee?") sammelt eine echte
-- Kunden-Praeferenz, die bisher KOMPLETT IGNORIERT wurde. Antworten
-- 'often' / 'always' = Kunde will saeurearme Sorten.
--
-- Diese Migration:
--   1. Spalte customers.prefers_low_acidity (boolean, default false)
--   2. algorithm_config-Tunable low_acidity_bonus_max (default 10 Punkte)
--   3. Helper acidity_match_bonus(p_customer_id, p_acidity) -> numeric
--   4. rank_coffees_for_customer um acidity_bonus erweitert (additiv,
--      Pattern wie brewing_match in 20260512100000).
--
-- Design:
--   - Bonus ist linear: max * (5 - acidity) / 4
--       acidity=1 (sehr mild)  -> max (full bonus)
--       acidity=2              -> 0.75 * max
--       acidity=3 (mittel)     -> 0.50 * max
--       acidity=4              -> 0.25 * max
--       acidity=5 (sehr sauer) -> 0
--     -> Sanftes Reranking, keine harten Ausschluesse
--   - Wenn prefers_low_acidity = false: bonus immer 0 (kein Effekt)
--   - Additiv zum bestehenden final_score, kein Rebalancing der
--     scoring/vector/diversity-Gewichte
--
-- Mappung Quiz Frage 9 -> prefers_low_acidity (siehe lib/db/quiz.ts):
--   'no-issues'  -> false
--   'sometimes'  -> false  (zu schwach, wuerde zu viele Coffees verlagern)
--   'often'      -> true
--   'always'     -> true
--
-- Datum: 2026-05-12
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Customer-Spalte
-- ----------------------------------------------------------------------------
alter table public.customers
  add column if not exists prefers_low_acidity boolean not null default false;

comment on column public.customers.prefers_low_acidity is
  'Soft-Praeferenz aus Quiz Frage 9. Wenn true, bekommen Coffees mit niedriger '
  'Saeure einen additiven Bonus im rank_coffees_for_customer (per Default '
  'bis +10 Punkte, tunable via algorithm_config.low_acidity_bonus_max).';

-- ----------------------------------------------------------------------------
-- 2) Tunable
-- ----------------------------------------------------------------------------
insert into public.algorithm_config (key, value_numeric, description)
values (
  'low_acidity_bonus_max',
  10,
  'Q-Frage 9: Max-Bonus auf final_score fuer saeurearme Coffees bei Kunden mit prefers_low_acidity=true. 0 = deaktiviert.'
)
on conflict (key) do nothing;

-- ----------------------------------------------------------------------------
-- 3) Helper
-- ----------------------------------------------------------------------------
create or replace function public.acidity_match_bonus(
  p_customer_id uuid,
  p_acidity     smallint
)
returns numeric
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_prefers boolean;
  v_max     numeric;
begin
  if p_acidity is null then
    return 0;
  end if;
  select prefers_low_acidity into v_prefers
    from public.customers where id = p_customer_id;
  if not coalesce(v_prefers, false) then
    return 0;
  end if;
  v_max := coalesce(
    (select value_numeric from public.algorithm_config where key = 'low_acidity_bonus_max'),
    10
  );
  -- Linear: 5 -> 0, 1 -> max. Clamp auf [0, max].
  return greatest(0, least(v_max, v_max * (5 - p_acidity) / 4.0));
end;
$$;

comment on function public.acidity_match_bonus(uuid, smallint) is
  'Q-Frage 9: Linearer Bonus fuer saeurearme Coffees, nur bei Kunden mit '
  'prefers_low_acidity=true. Sonst 0.';

-- ----------------------------------------------------------------------------
-- 4) rank_coffees_for_customer erweitern. Volle Funktion wird ersetzt; sowohl
--    der Q-3 brewing_match-Bonus als auch der neue acidity-Bonus sind drin.
-- ----------------------------------------------------------------------------
create or replace function public.rank_coffees_for_customer(
  p_customer_id        uuid,
  p_subscription_type  text default 'discovery',
  p_limit              integer default 3,
  p_save_snapshot      boolean default false,
  p_subscription_id    uuid    default null,
  p_delivery_slot      date    default null,
  p_algorithm_version  text    default 'v1.0'
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
security definer
set search_path to 'public'
as $function$
#variable_conflict use_column
declare
  v_customer         record;
  v_target           jsonb;
  v_w_scoring        numeric;
  v_w_vector         numeric;
  v_w_diversity      numeric;
  v_mmr_lambda       numeric;
  v_has_customer_emb boolean;
  v_pre_pool_size    int := 30;
  r                  record;
  v_selected_ids     uuid[]         := '{}';
  v_selected_embs    vector(1536)[] := '{}';
  v_pick             record;
  v_best_mmr         numeric;
  v_curr_mmr         numeric;
  v_max_sim          numeric;
  i                  int;
  v_rank_counter     smallint := 0;
begin
  drop table if exists tmp_eligible;
  drop table if exists tmp_scored;
  drop table if exists tmp_results;
  drop table if exists tmp_pool;

  select c.id, c.taste_type_id, c.secondary_type, c.confidence, c.taste_embedding
    into v_customer
    from public.customers c
    where c.id = p_customer_id;

  if not found then
    raise exception 'rank_coffees_for_customer: Kunde % nicht gefunden', p_customer_id;
  end if;
  if v_customer.taste_type_id is null then
    raise exception 'rank_coffees_for_customer: Kunde % hat noch kein Geschmacksprofil', p_customer_id;
  end if;

  v_w_scoring   := coalesce((select value_numeric from public.algorithm_config where key = 'scoring_weight'),   0.55);
  v_w_vector    := coalesce((select value_numeric from public.algorithm_config where key = 'vector_weight'),    0.35);
  v_w_diversity := coalesce((select value_numeric from public.algorithm_config where key = 'diversity_weight'), 0.10);
  v_mmr_lambda  := coalesce((select value_numeric from public.algorithm_config where key = 'mmr_lambda'),       0.70);

  v_has_customer_emb := v_customer.taste_embedding is not null;
  if not v_has_customer_emb then
    v_w_scoring   := v_w_scoring + v_w_vector * 0.7;
    v_w_diversity := v_w_diversity + v_w_vector * 0.3;
    v_w_vector    := 0;
  end if;

  v_target := public.compute_target_profile(
    v_customer.taste_type_id,
    v_customer.secondary_type,
    v_customer.confidence
  );

  create temporary table tmp_eligible (coffee_id uuid, roaster_id uuid) on commit drop;

  insert into tmp_eligible select * from public.get_eligible_coffees(p_customer_id, p_subscription_type, false, false, 1.0);
  if not exists (select 1 from tmp_eligible) then
    insert into tmp_eligible select * from public.get_eligible_coffees(p_customer_id, p_subscription_type, true,  false, 1.0);
  end if;
  if not exists (select 1 from tmp_eligible) then
    insert into tmp_eligible select * from public.get_eligible_coffees(p_customer_id, p_subscription_type, true,  true,  1.0);
  end if;
  if not exists (select 1 from tmp_eligible) then
    insert into tmp_eligible select * from public.get_eligible_coffees(p_customer_id, p_subscription_type, true,  true,  1.20);
  end if;
  if not exists (select 1 from tmp_eligible) then
    return;
  end if;

  create temporary table tmp_scored (
    coffee_id            uuid primary key,
    roaster_id           uuid,
    coffee_name          text,
    coffee_embedding     vector(1536),
    t_scoring_score      numeric,
    t_vector_sim         numeric,
    t_brewing_bonus      numeric,    -- Q-3
    t_acidity_bonus      numeric,    -- Q-Frage 9 (NEU)
    preliminary_final    numeric,
    reasons              jsonb
  ) on commit drop;

  insert into tmp_scored
  select
    e.coffee_id,
    e.roaster_id,
    cf.name,
    cf.flavor_embedding,
    public.compute_scoring_score(v_target, e.coffee_id),
    case
      when v_has_customer_emb and cf.flavor_embedding is not null then
        round((1 - (cf.flavor_embedding <=> v_customer.taste_embedding))::numeric, 4)
      else 0::numeric
    end,
    public.brewing_match_bonus(p_customer_id, cf.roast_profile),
    public.acidity_match_bonus(p_customer_id, cf.acidity),
    null::numeric,
    null::jsonb
  from tmp_eligible e
  join public.coffees cf on cf.id = e.coffee_id;

  update tmp_scored ts
  set preliminary_final = round(
        v_w_scoring * ts.t_scoring_score
      + v_w_vector  * ts.t_vector_sim * 100
      + ts.t_brewing_bonus
      + ts.t_acidity_bonus
      , 2)
  where true;

  create temporary table tmp_results (
    r_rank              smallint,
    r_coffee_id         uuid,
    r_coffee_name       text,
    r_roaster_id        uuid,
    r_scoring_score     numeric,
    r_vector_similarity numeric,
    r_final_score       numeric,
    r_reasons           jsonb
  ) on commit drop;

  if p_subscription_type = 'discovery'
     and v_has_customer_emb
     and (select count(*) from tmp_scored ts2 where ts2.coffee_embedding is not null) >= 2
  then
    create temporary table tmp_pool on commit drop as
      select ts.coffee_id, ts.roaster_id, ts.coffee_name, ts.coffee_embedding,
             ts.t_scoring_score, ts.t_vector_sim,
             ts.t_brewing_bonus, ts.t_acidity_bonus,
             ts.preliminary_final
      from tmp_scored ts
      order by ts.preliminary_final desc nulls last
      limit v_pre_pool_size;

    while v_rank_counter < p_limit and exists (select 1 from tmp_pool) loop
      v_best_mmr := -1e18;
      v_pick     := null;

      for r in select tp.* from tmp_pool tp loop
        v_curr_mmr := v_mmr_lambda * r.preliminary_final;

        if array_length(v_selected_embs, 1) is not null and r.coffee_embedding is not null then
          v_max_sim := 0;
          for i in 1..array_length(v_selected_embs, 1) loop
            v_max_sim := greatest(v_max_sim, 1 - (r.coffee_embedding <=> v_selected_embs[i]));
          end loop;
          v_curr_mmr := v_curr_mmr - (1 - v_mmr_lambda) * v_max_sim * 100;
        end if;

        if v_curr_mmr > v_best_mmr then
          v_best_mmr := v_curr_mmr;
          v_pick     := r;
        end if;
      end loop;

      if v_pick is null then exit; end if;

      v_rank_counter  := v_rank_counter + 1;
      v_selected_ids  := array_append(v_selected_ids, v_pick.coffee_id);
      if v_pick.coffee_embedding is not null then
        v_selected_embs := array_append(v_selected_embs, v_pick.coffee_embedding);
      end if;

      declare v_div_bonus numeric := 0;
      begin
        if array_length(v_selected_embs, 1) > 1 and v_pick.coffee_embedding is not null then
          v_max_sim := 0;
          for i in 1..array_length(v_selected_embs, 1) - 1 loop
            v_max_sim := greatest(v_max_sim, 1 - (v_pick.coffee_embedding <=> v_selected_embs[i]));
          end loop;
          v_div_bonus := round((1 - v_max_sim) * 100, 2);
        end if;

        insert into tmp_results values (
          v_rank_counter,
          v_pick.coffee_id, v_pick.coffee_name, v_pick.roaster_id,
          v_pick.t_scoring_score, v_pick.t_vector_sim,
          round(
            v_w_scoring   * v_pick.t_scoring_score
          + v_w_vector    * v_pick.t_vector_sim * 100
          + v_w_diversity * v_div_bonus
          + v_pick.t_brewing_bonus
          + v_pick.t_acidity_bonus                          -- NEU
          , 2),
          public.explain_coffee_match(v_target, v_pick.coffee_id, v_pick.t_scoring_score, v_pick.t_vector_sim)
        );
      end;

      delete from tmp_pool tp where tp.coffee_id = v_pick.coffee_id;
    end loop;

  else
    insert into tmp_results
    select
      row_number() over (order by ts.preliminary_final desc)::smallint,
      ts.coffee_id, ts.coffee_name, ts.roaster_id,
      ts.t_scoring_score, ts.t_vector_sim,
      round(
          v_w_scoring * ts.t_scoring_score
        + v_w_vector  * ts.t_vector_sim * 100
        + ts.t_brewing_bonus
        + ts.t_acidity_bonus                                -- NEU
        , 2
      ),
      public.explain_coffee_match(v_target, ts.coffee_id, ts.t_scoring_score, ts.t_vector_sim)
    from tmp_scored ts
    order by ts.preliminary_final desc nulls last
    limit p_limit;
  end if;

  if p_save_snapshot and p_subscription_id is not null then
    insert into public.recommendation_snapshots
      (subscription_id, delivery_slot, algorithm_version, ranked_list, created_at)
    values (
      p_subscription_id, p_delivery_slot, p_algorithm_version,
      (select jsonb_agg(jsonb_build_object(
          'rank', tr.r_rank, 'coffee_id', tr.r_coffee_id, 'final_score', tr.r_final_score
        ) order by tr.r_rank)
       from tmp_results tr),
      now()
    );
  end if;

  return query
    select tr.r_rank, tr.r_coffee_id, tr.r_coffee_name, tr.r_roaster_id,
           tr.r_final_score, tr.r_scoring_score, tr.r_vector_similarity, tr.r_reasons
    from tmp_results tr
    order by tr.r_rank;
end;
$function$;
