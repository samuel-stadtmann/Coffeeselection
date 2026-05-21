-- ============================================================================
-- Audit-Cleanup (niedrige Prioritaet)
-- ============================================================================
-- 1) algorithm_config: SELECT-Policy von (authenticated, anon) auf nur
--    authenticated einschraenken. Die Match-Gewichte werden ausschliesslich
--    serverseitig gelesen (lib/db/recommendations.ts via Service-/Server-
--    Client) — anonyme Clients brauchen keinen Lesezugriff, und die Tuning-
--    Parameter sind faktisch internes IP.
-- 2) subscription_deliveries_coffee_idx entfernen: redundant. Die einzige
--    relevante Abfrage (Discovery-Exclude-Window) filtert nach
--    subscription_id + sortiert nach delivered_at → durch
--    subscription_deliveries_sub_idx bedient. Der reine coffee_id-Index
--    wird von keiner Query genutzt.
-- ============================================================================

drop policy if exists "algorithm_config_authenticated_select" on public.algorithm_config;
create policy "algorithm_config_authenticated_select"
  on public.algorithm_config for select
  to authenticated
  using (true);

drop index if exists public.subscription_deliveries_coffee_idx;
