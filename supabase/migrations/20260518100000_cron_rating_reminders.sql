-- ============================================================================
-- pg_cron-Job — taeglich /api/cron/rating-reminders triggern via pg_net.
--
-- Hintergrund:
--   Bewertungs-Email-Pipeline (Endpoint, Token, Cooldown-Log, Mail-Template)
--   existiert bereits. Trigger lief bislang ueber vercel.json/crons — auf
--   dem Hobby-Plan unzuverlaessig (Limit auf 2 Jobs, daily schedules nur).
--   pg_cron + pg_net.http_post macht das Supabase-seitig zuverlaessig.
--
-- Voraussetzungen (einmalig vom User vorbereitet):
--   * pg_net Extension aktiv (in Supabase by default verfuegbar)
--   * Supabase Vault-Eintraege:
--       SELECT vault.create_secret(
--         'https://staging.coffeeselection.ch',  -- bzw. produktion
--         'SITE_URL'
--       );
--       SELECT vault.create_secret(
--         '<CRON_SECRET aus Vercel Env-Vars>',
--         'CRON_SECRET'
--       );
--   * In Vercel CRON_SECRET als Env-Var setzen (Production + Preview)
--
-- Schedule: 09:00 UTC = 11:00 CEST. Trifft Customer typisch zur
-- Vormittagszeit, damit die Mail vor dem Mittag im Posteingang ist.
-- ============================================================================

create extension if not exists pg_net;

-- Bestehenden Job loeschen falls vorhanden (idempotenter Re-Run der Migration).
do $$
begin
  if exists (select 1 from cron.job where jobname = 'send-rating-reminders') then
    perform cron.unschedule('send-rating-reminders');
  end if;
end$$;

select cron.schedule(
  'send-rating-reminders',
  '0 9 * * *',  -- taeglich 09:00 UTC
  $$
    select net.http_get(
      url     := (select decrypted_secret from vault.decrypted_secrets where name = 'SITE_URL')
                 || '/api/cron/rating-reminders',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'CRON_SECRET')
      )
    );
  $$
);
