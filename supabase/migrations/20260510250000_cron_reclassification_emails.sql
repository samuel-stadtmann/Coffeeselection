-- ============================================================================
-- pg_cron-Job — stuendlich die Edge Function send-reclassification-emails
-- ueber pg_net.http_post triggern.
--
-- Voraussetzungen (einmalig vom User vorbereitet):
--   * pg_net Extension aktiv (in Supabase by default verfuegbar)
--   * Supabase Edge Function 'send-reclassification-emails' deployt
--   * Edge Function Secrets gesetzt:
--       RESEND_API_KEY, RESEND_FROM_EMAIL
--   * Supabase Vault entry mit dem Service-Role-Key (wir wollen den
--     nicht in der Cron-Command-Spalte hardcoden):
--       SELECT vault.create_secret('SERVICE_ROLE_KEY', '<key>');
--     UND mit der Project-URL:
--       SELECT vault.create_secret('SUPABASE_URL', 'https://<ref>.supabase.co');
-- ============================================================================

create extension if not exists pg_net;

-- Bestehenden Job loeschen falls vorhanden (idempotenter Re-Run).
do $$
declare v_jobid bigint;
begin
  select jobid into v_jobid from cron.job where jobname = 'send-reclassification-emails';
  if v_jobid is not null then perform cron.unschedule(v_jobid); end if;
end $$;

-- Stuendlich. Liest Project-URL + Service-Role-Key aus dem Supabase Vault
-- (nicht im Klartext in cron.job hinterlegt) und macht einen POST mit
-- leerem JSON-Body — das triggert den "alle pending"-Pfad der Function.
select cron.schedule(
  'send-reclassification-emails',
  '15 * * * *',     -- jede volle Stunde + 15 Minuten (gibt dem Lern-Worker Zeit zu laufen)
  $$
    select net.http_post(
      url     := (select decrypted_secret from vault.decrypted_secrets where name = 'SUPABASE_URL') || '/functions/v1/send-reclassification-emails',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'SERVICE_ROLE_KEY')
      ),
      body    := '{}'::jsonb
    );
  $$
);

comment on extension pg_net is 'pg_net wird vom Reklassifikations-Cron-Job genutzt.';
