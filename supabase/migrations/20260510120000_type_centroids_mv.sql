-- ============================================================================
-- type_centroids_mv — durchschnittlicher taste_embedding-Vektor pro
-- Geschmackstyp. Wird gebraucht fuer:
--   * Cold-Start-Proxy in build_customer_embedding (wenn noch kein
--     einziger Kunde dieses Typs ein Embedding hat -> Fallback auf
--     embedding_seed_text der taste_types-Tabelle)
--   * Reklassifikations-Check (Playbook Kap. 6.5): liegt das aktuelle
--     Kunden-Embedding naeher an einem anderen Centroid als am eigenen?
--
-- Voraussetzung: pgvector >= 0.5 (avg(vector) verfuegbar).
-- Refresh: pg_cron, taeglich 03:00 UTC, CONCURRENTLY damit kein Lock.
-- ============================================================================

create extension if not exists pg_cron;

drop materialized view if exists public.type_centroids_mv cascade;

create materialized view public.type_centroids_mv as
select
  taste_type_id,
  count(*)                               as customer_count,
  avg(taste_embedding)::vector(1536)     as centroid
from public.customers
where taste_embedding is not null
  and taste_type_id   is not null
group by taste_type_id;

-- Unique Index: Voraussetzung fuer REFRESH MATERIALIZED VIEW CONCURRENTLY.
create unique index type_centroids_mv_pk
  on public.type_centroids_mv(taste_type_id);

-- ANN-Index auf den Centroid (cosine), fuer schnelle Reklassifikations-Suche.
create index type_centroids_mv_centroid_cos_idx
  on public.type_centroids_mv
  using ivfflat (centroid vector_cosine_ops)
  with (lists = 8);

-- Initial-Refresh damit die View Daten enthaelt.
refresh materialized view public.type_centroids_mv;

-- ============================================================================
-- pg_cron: taeglich 03:00 UTC refreshen.
-- Idempotent — bei wiederholter Ausfuehrung wird der Job aktualisiert.
-- ============================================================================

-- Bestehenden Job loeschen falls vorhanden (safe re-run).
do $$
declare
  v_jobid bigint;
begin
  select jobid into v_jobid
  from cron.job
  where jobname = 'refresh-type-centroids-mv';
  if v_jobid is not null then
    perform cron.unschedule(v_jobid);
  end if;
end $$;

select cron.schedule(
  'refresh-type-centroids-mv',
  '0 3 * * *',
  $$refresh materialized view concurrently public.type_centroids_mv$$
);

comment on materialized view public.type_centroids_mv is
  'Durchschnittliches taste_embedding pro Geschmackstyp. Refresh taeglich 03:00 via pg_cron.';
