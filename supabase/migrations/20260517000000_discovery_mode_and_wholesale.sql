-- P2: Discovery-Abo (JIT-Match pro Lieferung) + P6 Schritt 1: Wholesale-Preis pro Coffee
--
-- P2:
--   - subscriptions.discovery_mode  → Abo waehlt bei jedem Renewal einen
--     NEUEN Coffee aus dem Geschmackstyp des Kunden (kein fixer Coffee)
--   - subscription_deliveries       → Append-only-Log der bisher gelieferten
--     Coffees pro Subscription. Wird im Webhook als Exclude-Liste genutzt
--     ("nicht innerhalb der letzten N Lieferungen wiederholen")
--
-- P6 Schritt 1:
--   - coffees.wholesale_price_chf   → Einkaufspreis vom Roester pro Bag (weight_g).
--     Wird beim Order-Create als Snapshot auf order_items kopiert
--     (order_items.wholesale_price_chf existiert bereits).

------------------------------------------------------------------------
-- P2: subscriptions.discovery_mode
------------------------------------------------------------------------
alter table public.subscriptions
  add column if not exists discovery_mode boolean not null default false;

comment on column public.subscriptions.discovery_mode is
  'Wenn true: bei jeder Renewal-Order waehlt der Webhook einen neuen '
  'Coffee aus dem aktuellen Geschmackstyp des Customers (mit Exclude '
  'der letzten N gelieferten). Wenn false: jede Renewal nutzt die in '
  'subscription_items fixierten Coffees.';

------------------------------------------------------------------------
-- P2: subscription_deliveries — wer hat welchen Coffee wann bekommen
------------------------------------------------------------------------
create table if not exists public.subscription_deliveries (
  id              uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  order_id        uuid not null references public.orders(id) on delete cascade,
  coffee_id       uuid not null references public.coffees(id) on delete restrict,
  delivered_at    timestamptz not null default now()
);

create index if not exists subscription_deliveries_sub_idx
  on public.subscription_deliveries(subscription_id, delivered_at desc);
create index if not exists subscription_deliveries_coffee_idx
  on public.subscription_deliveries(coffee_id);

alter table public.subscription_deliveries enable row level security;

drop policy if exists "sub_deliveries_self_select" on public.subscription_deliveries;
create policy "sub_deliveries_self_select"
  on public.subscription_deliveries for select
  to authenticated
  using (
    exists (
      select 1 from public.subscriptions s
      where s.id = subscription_deliveries.subscription_id
        and s.customer_id = public.current_customer_id()
    )
  );

drop policy if exists "sub_deliveries_all_service" on public.subscription_deliveries;
create policy "sub_deliveries_all_service"
  on public.subscription_deliveries for all
  to service_role
  using (true) with check (true);

------------------------------------------------------------------------
-- P6 Schritt 1: coffees.wholesale_price_chf
------------------------------------------------------------------------
alter table public.coffees
  add column if not exists wholesale_price_chf numeric(10,2)
    check (wholesale_price_chf is null or wholesale_price_chf >= 0);

comment on column public.coffees.wholesale_price_chf is
  'Einkaufspreis vom Roester pro Bag (weight_g). Wird beim '
  'Order-Create als Snapshot auf order_items.wholesale_price_chf '
  'kopiert. Marge = unit_price_chf - wholesale_price_chf pro Item. '
  'NULL = noch nicht erfasst (Marge im Dashboard wird dann als '
  'gesamter Umsatz angezeigt).';
