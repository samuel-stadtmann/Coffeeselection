-- ============================================================================
-- Idempotenz-Schutz fuer subscription_deliveries
-- ============================================================================
--
-- Bug-Audit: subscription_deliveries hatte nur PK auf id. Bei einem
-- Webhook-Re-Run (Stripe-Retry-Teilpfad) koennten doppelte Delivery-Logs
-- fuer dieselbe (subscription, order, coffee)-Kombi entstehen. Das
-- verfaelscht das Discovery-Exclude-Fenster (letzte N Lieferungen).
--
-- Fix: Unique-Constraint auf (subscription_id, order_id, coffee_id).
-- Der Webhook-Insert sollte ON CONFLICT DO NOTHING nutzen — bestehende
-- Inserts brechen sonst bei Doppel-Run hart ab. Da der Code aktuell
-- plain insert macht und Fehler nur loggt (nicht fatal), ist der
-- Constraint sicher: ein Doppel-Insert wird abgewiesen + geloggt, statt
-- eine Dublette zu schreiben.
--
-- Vorher etwaige bestehende Dubletten entfernen (aeltesten Eintrag pro
-- Kombi behalten), damit der Unique-Index angelegt werden kann.
-- ============================================================================

delete from public.subscription_deliveries a
using public.subscription_deliveries b
where a.subscription_id = b.subscription_id
  and a.order_id = b.order_id
  and a.coffee_id = b.coffee_id
  and a.id > b.id;

create unique index if not exists subscription_deliveries_unique_idx
  on public.subscription_deliveries(subscription_id, order_id, coffee_id);

comment on index public.subscription_deliveries_unique_idx is
  'Idempotenz: verhindert doppelte Delivery-Logs pro (subscription, order, coffee) bei Webhook-Retries.';
