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

------------------------------------------------------------------------
-- 1) algorithm_config — generische Key-Value-Tabelle fuer Tuning-Params
------------------------------------------------------------------------
create table if not exists public.algorithm_config (
  key         text primary key,
  value       jsonb not null,
  description text,
  updated_at  timestamptz not null default now()
);

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

-- Achsen-Gewichtung. Default: Saeure + Koerper am wichtigsten,
-- Komplexitaet am wenigsten. Werte koennen ueber UPDATE jederzeit
-- angepasst werden — der Code liest den aktuellen Wert pro Request.
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
-- Idempotent: alten Job entfernen falls vorhanden, dann neu anlegen.
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
