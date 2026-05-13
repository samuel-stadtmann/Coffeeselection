-- ============================================================================
-- P1B-5: subscriptions.first_order_id — Linkage zur Initial-Order
--
-- Hintergrund:
--   Wenn ein Cart sowohl Abo- als auch Einmalkauf-Items hat, hat die
--   resultierende Order BEIDES enthalten. orders.subscription_id ist ein
--   einfacher FK (kann nur EINE Subscription referenzieren) — bei Mixed
--   Carts macht das keinen Sinn, weil:
--     a) Es nur 1 Order gibt aber evtl. >1 Subscription dahinter
--     b) Renewal-Orders (von Stripe-Webhook erzeugt) brauchen
--        orders.subscription_id fuer die Zuordnung
--
--   Wir machen es deswegen umgekehrt: jede Subscription kennt ihre
--   Initial-Order (first_order_id). Das ermoeglicht:
--     - Im Checkout: gegebene Order → alle assoziierten Subscriptions finden
--     - Im Webhook: Renewal anlegen ohne Mehrdeutigkeit
--     - Spaeter (Self-Service): "Erste Lieferung" anzeigen
--
--   orders.subscription_id BLEIBT als FK — wird nur fuer Renewal-Orders
--   gefuellt (eindeutig: 1 Renewal = 1 Subscription). Initial-Order hat
--   subscription_id=NULL.
--
-- Datum: 2026-05-13
-- ============================================================================

alter table public.subscriptions
  add column if not exists first_order_id uuid
  references public.orders(id) on delete set null;

comment on column public.subscriptions.first_order_id is
  'Initial-Order in der dieses Abo angelegt wurde (Cart-Checkout). '
  'Renewal-Orders haben stattdessen orders.subscription_id gesetzt. '
  'first_order_id wird in /api/orders/create gesetzt wenn Cart Abo-Items '
  'enthielt.';

create index if not exists subscriptions_first_order_idx
  on public.subscriptions(first_order_id)
  where first_order_id is not null;

-- ----------------------------------------------------------------------------
-- status erweitern: 'pending' fuer "Subscription in unserer DB angelegt aber
-- Stripe-Bezahlung noch nicht bestaetigt". Webhook setzt 'pending' → 'active'
-- bei erfolgreicher Initial-Zahlung.
--
-- Vorher: ('active','paused','cancelled','completed')
-- Nachher: ('pending','active','paused','cancelled','completed')
--
-- Bestehende Rows: alle haben einen der alten Werte → kompatibel.
-- ----------------------------------------------------------------------------
alter table public.subscriptions
  drop constraint if exists subscriptions_status_check;

alter table public.subscriptions
  add constraint subscriptions_status_check
  check (status in ('pending','active','paused','cancelled','completed'));

comment on column public.subscriptions.status is
  'Lifecycle: pending (DB angelegt, Stripe-Initial-Charge ausstehend) → '
  'active (Stripe bestaetigt, Renewals laufen) → paused/cancelled/completed. '
  'pending wird in /api/orders/create gesetzt, vom Webhook auf active gehoben.';

-- ----------------------------------------------------------------------------
-- order_items.is_subscription_item — Marker fuer Abo-Items in der Order
--
-- Bei Mixed Carts (Abo + Einmalkauf gemischt) hat eine Order beide Typen.
-- In /api/checkout/session muessen wir wissen welches order_item zur
-- Subscription gehoert (→ recurring price_data) und welches einmalig
-- berechnet wird (→ non-recurring price_data). Eine FK auf subscriptions
-- waere semantisch zu spezifisch — wir brauchen nur den Marker.
-- ----------------------------------------------------------------------------
alter table public.order_items
  add column if not exists is_subscription_item boolean not null default false;

comment on column public.order_items.is_subscription_item is
  'Wenn true: dieses Item ist die Initial-Lieferung der Subscription die '
  'in der gleichen Order angelegt wurde. In /api/checkout/session wird '
  'es als recurring Stripe-line_item behandelt. Renewal-Order-Items '
  'haben dieses Flag NICHT (sie sind technisch separate Einmal-Lieferungen, '
  'der Bezug zur Subscription ist via orders.subscription_id).';
