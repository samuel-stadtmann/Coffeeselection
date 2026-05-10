-- ============================================================================
-- Kapitel 10 — Admin-Metriken-Dashboard
--
-- Die fuenf Metriken aus Playbook 10.1 als Views, damit das Admin-UI
-- (app/admin/metrics) sie sauber lesen kann. Wo das Playbook Spalten
-- erwartet die wir nicht haben (z.B. recommendation_snapshots.
-- override_reason), nutzen wir die naechstbeste Quelle aus unserem
-- Schema.
--
-- Alle Views sind READ-ONLY; sie haben RLS-Bypass durch security_invoker
-- nicht aktiviert -> service_role kann lesen, normale Customer nicht.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Durchschnittliche Bewertung pro Geschmackstyp (90-Tage-Fenster)
-- ----------------------------------------------------------------------------

create or replace view public.metrics_avg_rating_per_type as
select
  tt.id                                                       as taste_type_id,
  tt.name_de                                                  as taste_type_name,
  count(cr.id)                                                as num_ratings,
  round(avg(cr.rating)::numeric, 2)                           as avg_rating,
  round(
    count(*) filter (where cr.rating >= 4)::numeric
    / nullif(count(*), 0)::numeric * 100,
    1
  )                                                           as pct_positive
from public.taste_types tt
left join public.customers   c  on c.taste_type_id = tt.id
left join public.coffee_ratings cr
       on cr.customer_id = c.id
      and cr.created_at > now() - interval '90 days'
group by tt.id, tt.name_de
order by avg_rating desc nulls last;

comment on view public.metrics_avg_rating_per_type is
  'Playbook 10.1 Metrik 1: Ø Bewertung pro Typ + Anteil positiver (>=4) Ratings, 90-Tage-Fenster.';

-- ----------------------------------------------------------------------------
-- 2) Confidence-Score-Verteilung der letzten 30 Tage
-- ----------------------------------------------------------------------------

create or replace view public.metrics_confidence_distribution as
select
  case
    when confidence >= 0.85 then '1_sehr_hoch'
    when confidence >= 0.65 then '2_hoch'
    when confidence >= 0.45 then '3_mittel'
    when confidence >= 0.25 then '4_niedrig'
    else                          '5_sehr_niedrig'
  end                                                         as band,
  case
    when confidence >= 0.85 then 'Sehr hoch (≥0.85)'
    when confidence >= 0.65 then 'Hoch (0.65–0.84)'
    when confidence >= 0.45 then 'Mittel (0.45–0.64)'
    when confidence >= 0.25 then 'Niedrig (0.25–0.44)'
    else                          'Sehr niedrig (<0.25)'
  end                                                         as band_label,
  count(*)                                                    as num_customers,
  round(count(*)::numeric / sum(count(*)) over () * 100, 1)   as pct
from public.quiz_responses
where completed_at is not null
  and completed_at > now() - interval '30 days'
  and confidence  is not null
group by 1, 2
order by 1;

comment on view public.metrics_confidence_distribution is
  'Playbook 10.1 Metrik 2: Verteilung der Quiz-Confidence-Scores (30-Tage-Fenster).';

-- ----------------------------------------------------------------------------
-- 3) Reklassifikationsrate (Anteil Customers mit Reklass-Vorschlag im
--    letzten 30/90/365-Tage-Fenster — Playbook 10.1 Metrik 5)
-- ----------------------------------------------------------------------------

create or replace view public.metrics_reclassification_rate as
with active as (
  select count(*) as total
  from public.customers
  where taste_type_id is not null
)
select
  '30d' as window,
  active.total as customers_with_profile,
  count(*) filter (where c.reclassification_suggested_at > now() - interval '30 days') as suggested_recently,
  round(
    count(*) filter (where c.reclassification_suggested_at > now() - interval '30 days')::numeric
    / nullif(active.total, 0)::numeric * 100,
    2
  ) as rate_pct
from public.customers c, active
where c.taste_type_id is not null
group by active.total

union all

select
  '90d',
  active.total,
  count(*) filter (where c.reclassification_suggested_at > now() - interval '90 days'),
  round(
    count(*) filter (where c.reclassification_suggested_at > now() - interval '90 days')::numeric
    / nullif(active.total, 0)::numeric * 100,
    2
  )
from public.customers c, active
where c.taste_type_id is not null
group by active.total;

comment on view public.metrics_reclassification_rate is
  'Playbook 10.1 Metrik 5: Anteil Customers mit Reklassifikations-Vorschlag in 30/90 Tagen.';

-- ----------------------------------------------------------------------------
-- 4) Top empfohlene Coffees (90 Tage) — basiert auf recommendation_history,
--    nicht auf recommendation_snapshots da der Snapshot-Pfad p_save_snapshot
--    aktuell nicht aktiv ist.
-- ----------------------------------------------------------------------------

create or replace view public.metrics_top_recommended_coffees as
select
  c.id            as coffee_id,
  c.name          as coffee_name,
  c.slug          as coffee_slug,
  r.name          as roaster_name,
  count(rh.id)    as times_recommended,
  round(avg(rh.score)::numeric, 4)            as avg_recommendation_score,
  count(distinct rh.customer_id)              as distinct_customers,
  round(avg(cr.rating)::numeric, 2)           as avg_rating_when_recommended,
  count(cr.id)                                as num_ratings_after_recommendation
from public.recommendation_history rh
join public.coffees   c on c.id = rh.coffee_id
join public.roasters  r on r.id = c.roaster_id
left join public.coffee_ratings cr
       on cr.coffee_id   = rh.coffee_id
      and cr.customer_id = rh.customer_id
where rh.shown_at > now() - interval '90 days'
group by c.id, c.name, c.slug, r.name
order by times_recommended desc
limit 10;

comment on view public.metrics_top_recommended_coffees is
  'Playbook 10.1 Metrik 4 (adaptiert): Top-10-Coffees nach Empfehlungs-Frequenz mit Folge-Bewertungen.';

-- ----------------------------------------------------------------------------
-- 5) Single-Row-Summary fuer das Dashboard-Hero
-- ----------------------------------------------------------------------------

create or replace view public.metrics_summary as
select
  -- Bewertungen
  (select round(avg(rating)::numeric, 2)
     from public.coffee_ratings
     where created_at > now() - interval '90 days')                                as avg_rating_overall_90d,
  (select count(*)
     from public.coffee_ratings
     where created_at > now() - interval '30 days')                                as num_ratings_30d,
  -- Quiz
  (select round(avg(confidence)::numeric, 3)
     from public.quiz_responses
     where completed_at > now() - interval '30 days'
       and confidence is not null)                                                  as avg_confidence_30d,
  (select count(*)
     from public.quiz_responses
     where completed_at > now() - interval '30 days')                              as num_quiz_30d,
  -- Customer-Pool
  (select count(*) from public.customers where taste_type_id is not null)         as customers_with_profile,
  (select count(*) from public.customers
     where reclassification_suggested_at > now() - interval '30 days')            as reclass_suggested_30d,
  -- Coffee-Sortiment
  (select count(*) from public.coffees
     where status = 'active' and deleted_at is null)                              as active_coffees,
  (select count(*) from public.coffees
     where status = 'active' and deleted_at is null
       and flavor_embedding is not null)                                          as coffees_with_embedding,
  -- Recommender-Aktivitaet
  (select count(*) from public.recommendation_history
     where shown_at > now() - interval '30 days')                                 as recommendations_30d;

comment on view public.metrics_summary is
  'Hero-Single-Row fuer das Admin-Metriken-Dashboard. Aggregate Kennzahlen aus den letzten 30/90 Tagen.';

-- ----------------------------------------------------------------------------
-- 6) Lese-Rechte: Dashboard-View ist nur fuer service_role lesbar
--    (das Admin-UI ruft sie ueber den server-side Supabase-Client mit
--     service_role auf — kein direkter Customer-Zugriff).
-- ----------------------------------------------------------------------------

revoke all on public.metrics_avg_rating_per_type      from anon, authenticated;
revoke all on public.metrics_confidence_distribution  from anon, authenticated;
revoke all on public.metrics_reclassification_rate    from anon, authenticated;
revoke all on public.metrics_top_recommended_coffees  from anon, authenticated;
revoke all on public.metrics_summary                  from anon, authenticated;

grant select on public.metrics_avg_rating_per_type      to service_role;
grant select on public.metrics_confidence_distribution  to service_role;
grant select on public.metrics_reclassification_rate    to service_role;
grant select on public.metrics_top_recommended_coffees  to service_role;
grant select on public.metrics_summary                  to service_role;
