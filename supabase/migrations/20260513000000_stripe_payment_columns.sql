-- ============================================================================
-- C-1: Stripe-Payment-Spalten für Phase 1A (Einmalkauf-Checkout).
--
-- Was fehlt bisher:
--   - orders muss wissen welche Stripe-Checkout-Session sie erstellt hat
--     (fuer Return-Redirect Validation: /checkout/success?session_id=xxx)
--   - orders muss den Payment-Intent direkt referenzieren (fuer Lookup
--     beim Webhook-Event ohne JOIN ueber payments)
--   - payments braucht eine eindeutige Stripe-Event-ID fuer Webhook-
--     Idempotenz — Stripe verschickt Events mehrfach bei Netzwerk-Fehlern,
--     wir muessen Doppel-Processing verhindern
--
-- Bereits vorhanden (NICHT nochmal anlegen):
--   - customers.stripe_customer_id     (Migration 130100_customers)
--   - subscriptions.stripe_subscription_id (Migration 130200_commerce)
--   - payments.provider_payment_id     (= Stripe pi_xxx — passt fuer Stripe)
--   - payments.provider_customer_id    (= Stripe cus_xxx)
--   - payments.provider_payload        (= Stripe raw event JSON)
--
-- Datum: 2026-05-13
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Orders: Stripe Checkout Session + Payment Intent direkt referenzieren
-- ----------------------------------------------------------------------------
alter table public.orders
  add column if not exists stripe_checkout_session_id text;

alter table public.orders
  add column if not exists stripe_payment_intent_id text;

comment on column public.orders.stripe_checkout_session_id is
  'Stripe Checkout Session-ID (cs_xxx). Gesetzt beim Erstellen der Session, '
  'verwendet vom /checkout/success Handler zur Validierung des Redirects.';

comment on column public.orders.stripe_payment_intent_id is
  'Stripe Payment Intent-ID (pi_xxx). Wird beim Webhook checkout.session.completed '
  'aus session.payment_intent abgeleitet und hier gespeichert fuer schnellen '
  'Lookup ohne JOIN ueber payments.';

-- Index fuer den Webhook-Lookup: "welche Order gehoert zu diesem pi_xxx?"
create index if not exists orders_stripe_payment_intent_idx
  on public.orders(stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

-- Optional: Index fuer Checkout-Session-Lookup (z.B. Return-Validation)
create index if not exists orders_stripe_checkout_session_idx
  on public.orders(stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

-- ----------------------------------------------------------------------------
-- 2) Payments: Stripe Event-ID fuer Webhook-Idempotenz
-- ----------------------------------------------------------------------------
alter table public.payments
  add column if not exists stripe_event_id text;

comment on column public.payments.stripe_event_id is
  'Stripe Event-ID (evt_xxx) des Webhooks der diesen Payment-Record erzeugt '
  'oder geupdated hat. Stripe sendet Events bei Netzwerk-Fehlern mehrfach — '
  'wir nutzen diesen Wert als Idempotenz-Schluessel: gleiche Event-ID = '
  'skip processing.';

-- UNIQUE-Constraint sichert Idempotenz auf DB-Ebene: ein Event kann maximal
-- einmal einen Payment-Record erstellen/updaten. Bei Conflict wird der
-- Webhook-Handler einen "already processed" 200 OK zurueckgeben.
create unique index if not exists payments_stripe_event_uniq
  on public.payments(stripe_event_id)
  where stripe_event_id is not null;

-- ----------------------------------------------------------------------------
-- 3) Helper-View fuer schnelle Order-Status-Lookups beim Webhook
-- ----------------------------------------------------------------------------
-- Webhook braucht oft: "gegeben Stripe Session-ID, finde Order + Customer"
-- View statt MATERIALIZED VIEW weil's Live-Daten sind.
create or replace view public.orders_by_stripe as
select
  o.id as order_id,
  o.order_number,
  o.customer_id,
  o.status,
  o.subtotal_chf,
  o.tax_chf,
  o.shipping_chf,
  o.total_chf,
  o.stripe_checkout_session_id,
  o.stripe_payment_intent_id,
  c.email as customer_email
from public.orders o
join public.customers c on c.id = o.customer_id;

comment on view public.orders_by_stripe is
  'Lookup-View fuer Stripe-Webhook-Handler: order + customer in einem Query.';
