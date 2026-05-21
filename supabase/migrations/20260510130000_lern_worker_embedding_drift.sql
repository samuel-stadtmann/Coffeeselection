-- ============================================================================
-- M5c — Embedding-Drift im Lern-Worker (Playbook 6.3 + 6.5)
--
-- Erweitert die bestehende process_pending_ratings()-Function um:
--   1) Embedding-Drift: nach jeder Bewertung >= 4 oder <= 2 das
--      taste_embedding des Kunden Richtung (oder weg von) der
--      flavor_embedding des Kaffees ziehen. Adaptive Lernrate die mit
--      mehr Bewertungen kleiner wird ("Fine-Tuning" statt "Pull").
--   2) Centroid-Reklassifikations-Check: nach Drift pruefen ob ein
--      anderer Type-Centroid naeher liegt als der aktuelle. Wenn ja
--      und Aehnlichkeit > 0.85 -> reclassification_suggested_type
--      setzen (zusaetzlich zur bestehenden 3-Mal-No-Heuristik).
--
-- Aroma-Tag-Update + 3-No-Reclass + Stats-Update bleiben wie gehabt.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper: drift_customer_embedding
--   - In PL/pgSQL implementiert (statt vector-Operatoren) damit es auf jeder
--     pgvector-Version funktioniert.
--   - Skip wenn entweder Customer- oder Coffee-Embedding fehlt.
--   - Re-normalisiert auf Einheitslaenge (Cosine bleibt definiert).
-- ----------------------------------------------------------------------------

create or replace function public.drift_customer_embedding(
  p_customer_id uuid,
  p_coffee_id   uuid,
  p_alpha       numeric,                -- 0 < alpha < 1 (typisch 0.02 ... 0.10)
  p_sign        smallint                -- +1 = Pull Richtung Coffee, -1 = Push weg
) returns void
language plpgsql
security definer
as $$
declare
  v_old    real[];
  v_coffee real[];
  v_new    real[];
  v_norm   double precision := 0;
  v_dim    int;
  i        int;
begin
  -- Vektoren als float[] laden (cast vector -> real[]).
  select taste_embedding::real[] into v_old   from public.customers where id = p_customer_id;
  select flavor_embedding::real[] into v_coffee from public.coffees   where id = p_coffee_id;

  if v_old is null or v_coffee is null then
    return;
  end if;

  v_dim := array_length(v_old, 1);
  if v_dim is null or v_dim <> array_length(v_coffee, 1) then
    return;       -- Dimensions-Mismatch -> defensiv abbrechen
  end if;

  v_new := array_fill(0::real, array[v_dim]);

  if p_sign > 0 then
    -- Positive Bewertung: gewichtetes Mittel zwischen alt und Coffee.
    -- new = (1 - alpha) * old + alpha * coffee
    for i in 1..v_dim loop
      v_new[i] := (1 - p_alpha) * v_old[i] + p_alpha * v_coffee[i];
    end loop;
  else
    -- Negative Bewertung: vom Coffee weg bewegen, Massen-Erhalt.
    -- new = (1 + alpha) * old - alpha * coffee
    for i in 1..v_dim loop
      v_new[i] := (1 + p_alpha) * v_old[i] - p_alpha * v_coffee[i];
    end loop;
  end if;

  -- L2-Norm berechnen (pgvector hat l2_normalize() erst seit 0.7).
  for i in 1..v_dim loop
    v_norm := v_norm + v_new[i] * v_new[i];
  end loop;
  v_norm := sqrt(v_norm);

  if v_norm > 0 then
    for i in 1..v_dim loop
      v_new[i] := v_new[i] / v_norm;
    end loop;
  end if;

  update public.customers
  set
    taste_embedding         = v_new::vector,
    profile_last_updated_at = now()
  where id = p_customer_id;
end $$;

comment on function public.drift_customer_embedding(uuid, uuid, numeric, smallint) is
  'Playbook 6.3: bewegt customers.taste_embedding nach einer Bewertung Richtung (sign=+1) oder weg (sign=-1) von coffees.flavor_embedding. Re-normalisiert auf Einheitslaenge.';

-- ----------------------------------------------------------------------------
-- Helper: centroid_reclassification_check
--   - Findet den naechsten Type-Centroid zum aktuellen taste_embedding.
--   - Wenn != aktueller Typ und Cosine-Aehnlichkeit > 0.85: Spalten
--     reclassification_suggested_type / _at setzen (wenn nicht in den
--     letzten 30 Tagen schon gesetzt).
-- ----------------------------------------------------------------------------

create or replace function public.centroid_reclassification_check(
  p_customer_id uuid
) returns void
language plpgsql
security definer
as $$
declare
  v_current_type smallint;
  v_emb          vector;
  v_best_type    smallint;
  v_best_sim     numeric;
begin
  select taste_type_id, taste_embedding
  into v_current_type, v_emb
  from public.customers
  where id = p_customer_id;

  if v_current_type is null or v_emb is null then
    return;
  end if;

  -- Naechster Centroid (groesste Cosine-Aehnlichkeit = kleinste Cosine-Distanz).
  select taste_type_id, 1 - (centroid <=> v_emb)
  into v_best_type, v_best_sim
  from public.type_centroids_mv
  where centroid is not null
  order by centroid <=> v_emb
  limit 1;

  if v_best_type is null then
    return;       -- Centroid-MV noch leer
  end if;

  if v_best_type <> v_current_type and v_best_sim > 0.85 then
    update public.customers
    set
      reclassification_suggested_at   = now(),
      reclassification_suggested_type = v_best_type
    where id = p_customer_id
      and (
        reclassification_suggested_at is null
        or reclassification_suggested_at < now() - interval '30 days'
      );
  end if;
end $$;

comment on function public.centroid_reclassification_check(uuid) is
  'Playbook 6.5: prueft ob ein anderer Type-Centroid signifikant naeher am Kunden-Embedding liegt als der aktuelle Typ. Setzt Reklassifikations-Vorschlag, throttled auf einmal pro 30 Tage.';

-- ----------------------------------------------------------------------------
-- Erweitertes process_pending_ratings — ergaenzt Embedding-Drift +
-- Centroid-Check pro Bewertung. Aroma-Tag-Logik + 3-No-Heuristik bleiben.
-- ----------------------------------------------------------------------------

create or replace function public.process_pending_ratings(p_batch_size integer default 100)
returns table(processed integer, skipped integer)
language plpgsql
security definer
as $$
declare
  v_rating             record;
  v_learning_rate      numeric;
  v_alpha              numeric;
  v_age_factor         numeric;
  v_num_ratings        integer;
  v_sign               smallint;
  v_reclass_threshold  int := 3;
  v_recent_no_count    int;
  v_tag                text;
  v_processed          int := 0;
  v_skipped            int := 0;
begin
  select coalesce(
    (select value_numeric from public.algorithm_config where key = 'learning_rate_base'),
    0.10
  ) into v_learning_rate;

  for v_rating in
    select
      r.id            as rating_id,
      r.customer_id,
      r.coffee_id,
      r.rating,
      r.would_drink_again,
      r.positive_tags,
      r.negative_tags
    from public.coffee_ratings r
    where r.processed_at is null
    order by r.created_at
    limit p_batch_size
    for update skip locked
  loop

    -- 1) Positive Tags: Sentiment anheben
    foreach v_tag in array coalesce(v_rating.positive_tags, '{}')
    loop
      if v_tag is not null and v_tag <> '' then
        insert into public.customer_aroma_preferences
          (customer_id, aroma_tag, sentiment, count, last_seen_at)
        values
          (v_rating.customer_id, v_tag, v_learning_rate, 1, now())
        on conflict (customer_id, aroma_tag) do update
          set
            sentiment = least(1.0, greatest(-1.0,
                (customer_aroma_preferences.sentiment * customer_aroma_preferences.count
                 + v_learning_rate)
                / (customer_aroma_preferences.count + 1)
              )),
            count        = customer_aroma_preferences.count + 1,
            last_seen_at = now();
      end if;
    end loop;

    -- 2) Negative Tags: Sentiment senken
    foreach v_tag in array coalesce(v_rating.negative_tags, '{}')
    loop
      if v_tag is not null and v_tag <> '' then
        insert into public.customer_aroma_preferences
          (customer_id, aroma_tag, sentiment, count, last_seen_at)
        values
          (v_rating.customer_id, v_tag, -v_learning_rate, 1, now())
        on conflict (customer_id, aroma_tag) do update
          set
            sentiment = least(1.0, greatest(-1.0,
                (customer_aroma_preferences.sentiment * customer_aroma_preferences.count
                 + (-v_learning_rate))
                / (customer_aroma_preferences.count + 1)
              )),
            count        = customer_aroma_preferences.count + 1,
            last_seen_at = now();
      end if;
    end loop;

    -- 3) NEU — Embedding-Drift (Playbook 6.3)
    --    rating >= 4 -> sign = +1 (toward coffee)
    --    rating <= 2 -> sign = -1 (away from coffee)
    --    rating  = 3 -> skip (neutral)
    if v_rating.rating is not null then
      v_sign := case
                  when v_rating.rating >= 4 then 1::smallint
                  when v_rating.rating <= 2 then -1::smallint
                  else null
                end;

      if v_sign is not null then
        select num_ratings_given into v_num_ratings
        from public.customers where id = v_rating.customer_id;

        -- alpha = base / (1 + num_ratings/10): bremst mit Erfahrung ab.
        v_age_factor := 1.0 + (coalesce(v_num_ratings, 0)::numeric / 10.0);
        v_alpha      := v_learning_rate / v_age_factor;

        perform public.drift_customer_embedding(
          v_rating.customer_id,
          v_rating.coffee_id,
          v_alpha,
          v_sign
        );

        -- 4) NEU — Centroid-Reklassifikations-Check nach Drift
        perform public.centroid_reclassification_check(v_rating.customer_id);
      end if;
    end if;

    -- 5) "3 mal No in 90 Tagen" -> bestehende Reklassifikation (unveraendert)
    if v_rating.would_drink_again = 'no' then
      select count(*) into v_recent_no_count
      from public.coffee_ratings
      where customer_id        = v_rating.customer_id
        and would_drink_again  = 'no'
        and created_at         > now() - interval '90 days';

      if v_recent_no_count >= v_reclass_threshold then
        update public.customers
        set reclassification_suggested_at = now()
        where id = v_rating.customer_id
          and (
            reclassification_suggested_at is null
            or reclassification_suggested_at < now() - interval '30 days'
          );
      end if;
    end if;

    -- 6) Stats-Pflege
    update public.customers
    set
      num_ratings_given       = num_ratings_given + 1,
      profile_last_updated_at = now()
    where id = v_rating.customer_id;

    -- 7) Bewertung als verarbeitet markieren
    update public.coffee_ratings
    set processed_at = now()
    where id = v_rating.rating_id;

    v_processed := v_processed + 1;
  end loop;

  return query select v_processed, v_skipped;
end $$;

comment on function public.process_pending_ratings(integer) is
  'M5c: verarbeitet Bewertungen aus coffee_ratings. Erweitert um Embedding-Drift (Playbook 6.3) und Centroid-Reklassifikations-Check (Playbook 6.5) zusaetzlich zur bestehenden Aroma-Tag- und 3-No-Logik.';
