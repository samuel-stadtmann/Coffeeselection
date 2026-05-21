-- ============================================================================
-- M5d Followup #2 — safeupdate-Fix in rank_coffees_for_customer
--
-- Supabase aktiviert die `safeupdate`-Extension fuer authenticated/anon-Rollen.
-- Sie blockt UPDATE / DELETE ohne WHERE-Klausel — selbst in SECURITY DEFINER-
-- Functions, wenn der Aufrufer via PostgREST kommt. Beim Aufruf aus
-- /api/recommendation/next fiel uns das mit
--
--   ERROR: 21000 UPDATE requires a WHERE clause
--
-- auf. In den temporaeren Tabellen wollen wir aber alle Zeilen anfassen —
-- daher reicht ein 'WHERE true' (gleicher Effekt, befriedigt safeupdate).
-- ============================================================================

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
    coffee_id          uuid primary key,
    roaster_id         uuid,
    coffee_name        text,
    coffee_embedding   vector(1536),
    t_scoring_score    numeric,
    t_vector_sim       numeric,
    preliminary_final  numeric,
    reasons            jsonb
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
    null::numeric,
    null::jsonb
  from tmp_eligible e
  join public.coffees cf on cf.id = e.coffee_id;

  -- WHERE true: safeupdate-Extension blockt UPDATE ohne WHERE in PostgREST-
  -- Aufrufen. Wir wollen alle tmp_scored-Zeilen anpacken, daher 'true'.
  update tmp_scored ts
  set preliminary_final = round(
        v_w_scoring * ts.t_scoring_score
      + v_w_vector  * ts.t_vector_sim * 100
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
             ts.t_scoring_score, ts.t_vector_sim, ts.preliminary_final
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
      round(v_w_scoring * ts.t_scoring_score + v_w_vector * ts.t_vector_sim * 100, 2),
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

-- ----------------------------------------------------------------------------
-- Sekundaer: RLS-Policy fuer recommendation_history erweitern
--   Customer darf eigene Snapshots eintragen (sie sehen sie eh schon dank
--   der bestehenden self_select-Policy). Damit funktioniert der Best-Effort-
--   Snapshot in /api/recommendation/next ohne service_role-Client.
-- ----------------------------------------------------------------------------

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='recommendation_history'
      and policyname='recommendation_history_self_insert'
  ) then
    create policy "recommendation_history_self_insert"
      on public.recommendation_history for insert
      to authenticated
      with check (customer_id = public.current_customer_id());
  end if;
end $$;
