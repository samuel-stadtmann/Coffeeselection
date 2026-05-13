-- ============================================================================
-- PA-Loop3: Rating-Reminder-Tracking auf orders
--
-- Damit der Cron-Job (/api/cron/rating-reminders) idempotent ist und nicht
-- mehrfach Mails pro Order rausschickt, brauchen wir ein Tracking-Feld.
--
-- Logik:
--   - Cron laeuft stuendlich, findet orders mit:
--       paid_at > now() - 14 days
--       paid_at < now() - 5 days
--       rating_reminder_sent_at IS NULL
--   - Pro Order: Mail an Customer mit 1-Klick-Sterne-Links pro Coffee
--   - Nach Send: rating_reminder_sent_at = now()
--   - Ein-Mail-pro-Order-Garantie via UNIQUE-Constraint nicht noetig, der
--     IS NULL-Filter reicht
--
-- Alternative-Designs die wir bewusst NICHT nehmen:
--   * email_events-Tabelle als Single-Source: zu generisch, jeder Mail-Typ
--     muesste reinpassen, Race-Conditions schwerer zu handeln
--   * order_items.rating_reminder_sent_at: zu granular, eine Mail pro Order
--     mit allen Coffees ist UX-besser als N Mails
--
-- Datum: 2026-05-13
-- ============================================================================

alter table public.orders
  add column if not exists rating_reminder_sent_at timestamptz;

comment on column public.orders.rating_reminder_sent_at is
  'Wann die Bewertungs-Email-Reminder fuer diese Order versandt wurde. '
  'NULL = noch nicht gesendet (Cron-Job pickt sie dann auf). Nur fuer '
  'orders mit status="paid" und paid_at >= now()-14d <= now()-5d wird '
  'die Mail erzeugt.';

create index if not exists orders_rating_reminder_pending_idx
  on public.orders(paid_at)
  where status = 'paid' and rating_reminder_sent_at is null;
