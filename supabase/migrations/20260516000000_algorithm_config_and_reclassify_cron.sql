-- C2 + C3: Algorithm-Config (Achsen-Gewichtung) + Reclassify-Cron-Schedule
--
-- C2: algorithm_config-Tabelle als Single-Source-of-Truth fuer den
--     Match-Algorithmus. Aktuell genutzt: 'match_weights' (Gewicht
--     pro Sensorik-Achse, hoeher = wichtiger).
--
-- C3: process_pending_ratings-Cron via pg_cron — laeuft alle 15 Min,
--     verarbeitet noch nicht prozessierte coffee_ratings: Embedding-
--     Drift + ggf. Reklassifikation des Customers in einen anderen
--     Geschmackstyp.
--
-- HINWEIS Schema-Kompatibilitaet: auf staging existierte
-- algorithm_config bereits mit (key, value_numeric, value_text,
-- description, updated_at). Diese Migration ergaenzt eine value-JSONB-
-- Spalte und seedet das Match-Weights-Setting dort. Code in
-- lib/db/recommendations.ts liest aus value (JSONB).

------------------------------------------------------------------------
-- 1) algorithm_config — Tabelle existieren lassen ODER anlegen
------------------------------------------------------------------------
create table if not exists public.algorithm_config (
  key         text primary key,
  value       jsonb,
  description text not null default '',
  updated_at  timestamptz not null default now()
);

-- Falls die Tabelle in einer aelteren Variante existiert (nur
-- value_numeric/value_text), die fehlende JSONB-Spalte nachreichen.
alter table public.algorithm_config
  add column if not exists value jsonb;

-- Trigger updated_at — idempotent.
drop trigger if exists trg_algorithm_config_updated_at on public.algorithm_config;
create trigger trg_algorithm_config_updated_at
  before update on public.algorithm_config
  for each row execute function public.set_updated_at();

alter table public.algorithm_config enable row level security;

drop policy if exists "algorithm_config_authenticated_select" on public.algorithm_config;
create policy "algorithm_config_authenticated_select"
  on public.algorithm_config for select
  to authenticated, anon
  using (true);

drop policy if exists "algorithm_config_all_service" on public.algorithm_config;
create policy "algorithm_config_all_service"
  on public.algorithm_config for all
  to service_role
  using (true) with check (true);

-- Seed match_weights — idempotent via ON CONFLICT.
insert into public.algorithm_config (key, value, description)
values (
  'match_weights',
  '{"acidity":1.5,"body":1.5,"sweetness":1.0,"bitterness":1.0,"complexity":0.7,"roast_level":1.0}'::jsonb,
  'Gewichte pro Sensorik-Achse in der Manhattan-Distanz. Hoeher = wichtiger. Wird live von lib/db/recommendations.ts gelesen.'
)
on conflict (key) do nothing;

------------------------------------------------------------------------
-- 2) C3: pg_cron-Schedule fuer process_pending_ratings (alle 15 Min)
------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from cron.job where jobname = 'process_pending_ratings'
  ) then
    perform cron.unschedule('process_pending_ratings');
  end if;
  perform cron.schedule(
    'process_pending_ratings',
    '*/15 * * * *',
    $cmd$ select public.process_pending_ratings(200); $cmd$
  );
end$$;
