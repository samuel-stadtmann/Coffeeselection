-- =============================================================================
-- Migration 007 — Kommerz (Subscriptions, Orders, Shipments, Payments)
-- =============================================================================
-- Die Geschaefts-Schicht der Kunden-DB. Hier liegt das Geld:
--
--   * subscriptions          — Aktive Abos pro Kunde (Abo Fix / Discovery)
--   * subscription_items     — Welche Kaffees in einem "Fix"-Abo enthalten sind
--   * orders                 — Konkrete Bestellung (Header) mit Order-Nummer CS-YYYY-NNNNNN
--   * order_items            — Positionen mit "Snapshot" der damaligen Preise/Namen
--   * shipments              — Sendungen (1 Order kann mehrere haben)
--   * payments               — Zahlungen (Stripe / Datatrans / TWINT / Rechnung)
--
-- Plus: LTV-Trigger auf orders → aktualisiert customers.lifetime_value_chf,
-- total_orders, first_order_at, last_order_at automatisch bei Status 'paid'.
-- =============================================================================


-- 0) Sequenz fuer Bestell-Nummern --------------------------------------------
-- Format: CS-YYYY-NNNNNN (CS = Coffee Selection, YYYY = Jahr, NNNNNN = laufend).
-- Wir nutzen eine globale Sequenz (kein Reset pro Jahr) — einfacher und keine
-- Race Conditions beim Jahreswechsel.
create sequence public.order_number_seq start 1;

create or replace function public.generate_order_number()
returns text
language sql
volatile
as $$
  select 'CS-' || to_char(now(), 'YYYY') || '-' ||
         lpad(nextval('public.order_number_seq')::text, 6, '0');
$$;

comment on function public.generate_order_number() is
  'Erzeugt Bestellnummer im Format CS-YYYY-NNNNNN. Wird als Default fuer orders.order_number genutzt.';


-- 1) subscriptions ------------------------------------------------------------
-- Ein Abo gehoert immer einem Kunden. Zwei Typen:
--   * 'fix'       — feste Auswahl, definiert via subscription_items
--   * 'discovery' — KI/Kuratoren waehlen jede Lieferung neu
create table public.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  customer_id             uuid not null references public.customers(id) on delete restrict,

  subscription_type       text not null
                          check (subscription_type in ('fix','discovery')),

  -- Lieferintervall in Wochen (2/4/6/8 — andere Werte = ungueltig)
  interval_weeks          smallint not null
                          check (interval_weeks in (2,4,6,8)),

  -- Liefermenge pro Sendung (in Gramm) — Discovery-Abos ueblicherweise 250 oder 500
  quantity_g_per_delivery integer not null default 500
                          check (quantity_g_per_delivery > 0),

  -- Adressen (FK auf customer_addresses, koennen aber NULL sein bei Geschenkabos)
  shipping_address_id     uuid references public.customer_addresses(id) on delete set null,
  billing_address_id      uuid references public.customer_addresses(id) on delete set null,

  -- Preisrahmen (Snapshot — falls Preise sich aendern, gilt fuer dieses Abo der vereinbarte)
  price_chf_per_delivery  numeric(10,2) not null check (price_chf_per_delivery >= 0),
  shipping_chf            numeric(10,2) not null default 0 check (shipping_chf >= 0),

  -- Lifecycle
  status                  text not null default 'active'
                          check (status in ('active','paused','cancelled','completed')),
  started_at              timestamptz not null default now(),
  paused_at               timestamptz,
  cancelled_at            timestamptz,
  cancellation_reason     text,

  -- Naechste/letzte Lieferung
  next_delivery_on        date,
  last_delivery_on        date,
  total_deliveries        integer not null default 0 check (total_deliveries >= 0),

  -- Geschenk-Abo? Dann hat es ein festes Ende.
  is_gift                 boolean not null default false,
  gift_end_after_n        smallint check (gift_end_after_n is null or gift_end_after_n > 0),

  -- Stripe / Datatrans Subscription-IDs (extern)
  stripe_subscription_id  text unique,

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index subscriptions_customer_idx       on public.subscriptions(customer_id);
create index subscriptions_status_active_idx
  on public.subscriptions(status, next_delivery_on) where status = 'active';
create index subscriptions_next_delivery_idx
  on public.subscriptions(next_delivery_on) where status = 'active';

create trigger trg_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;

create policy "subscriptions_self_select"
  on public.subscriptions for select
  to authenticated
  using (customer_id = public.current_customer_id());

create policy "subscriptions_self_update"
  on public.subscriptions for update
  to authenticated
  using (customer_id = public.current_customer_id())
  with check (customer_id = public.current_customer_id());

-- INSERT/DELETE nur via Backend (Stripe/Datatrans-Webhook erstellt Datensaetze).
create policy "subscriptions_all_service"
  on public.subscriptions for all
  to service_role
  using (true) with check (true);


-- 2) subscription_items (nur fuer 'fix'-Abos) --------------------------------
-- n:m zwischen subscriptions und coffees. Discovery-Abos haben keine Items —
-- die Auswahl wird pro order_items festgelegt.
create table public.subscription_items (
  id                  uuid primary key default gen_random_uuid(),
  subscription_id     uuid not null references public.subscriptions(id) on delete cascade,
  coffee_id           uuid not null references public.coffees(id) on delete restrict,

  quantity            smallint not null default 1 check (quantity > 0),
  weight_g            integer not null default 250 check (weight_g > 0),

  sort_order          smallint not null default 0,
  created_at          timestamptz not null default now(),

  unique (subscription_id, coffee_id)
);

create index subscription_items_subscription_idx on public.subscription_items(subscription_id);
create index subscription_items_coffee_idx       on public.subscription_items(coffee_id);

alter table public.subscription_items enable row level security;

-- Lesen erlaubt, wenn das Eltern-Abo dem Kunden gehoert.
create policy "subscription_items_self_select"
  on public.subscription_items for select
  to authenticated
  using (
    exists (
      select 1 from public.subscriptions s
      where s.id = subscription_items.subscription_id
        and s.customer_id = public.current_customer_id()
    )
  );

create policy "subscription_items_all_service"
  on public.subscription_items for all
  to service_role
  using (true) with check (true);


-- 3) orders -------------------------------------------------------------------
-- Eine konkrete Bestellung. Kann aus einem Abo entstehen (subscription_id NOT NULL)
-- oder ein Einzelkauf sein (subscription_id NULL).
create table public.orders (
  id                      uuid primary key default gen_random_uuid(),
  order_number            text unique not null default public.generate_order_number(),

  customer_id             uuid not null references public.customers(id) on delete restrict,
  subscription_id         uuid references public.subscriptions(id) on delete set null,

  -- Status (Lifecycle)
  status                  text not null default 'pending'
                          check (status in (
                            'pending',       -- erstellt, noch nicht bezahlt
                            'paid',          -- Zahlung erfolgreich
                            'processing',    -- in Vorbereitung beim Roester
                            'shipped',       -- versendet
                            'delivered',     -- zugestellt
                            'cancelled',     -- storniert
                            'refunded'       -- Geld zurueck
                          )),

  -- Adressen (Snapshot — FK auf customer_addresses + redundante Felder fuer Historie)
  shipping_address_id     uuid references public.customer_addresses(id) on delete set null,
  billing_address_id      uuid references public.customer_addresses(id) on delete set null,
  shipping_address_snapshot jsonb,                    -- vollstaendige Adresse zum Bestellzeitpunkt
  billing_address_snapshot  jsonb,

  -- Betraege (alle CHF, Snapshot)
  subtotal_chf            numeric(10,2) not null default 0 check (subtotal_chf >= 0),
  shipping_chf            numeric(10,2) not null default 0 check (shipping_chf >= 0),
  discount_chf            numeric(10,2) not null default 0 check (discount_chf >= 0),
  tax_chf                 numeric(10,2) not null default 0 check (tax_chf >= 0),
  total_chf               numeric(10,2) not null default 0 check (total_chf >= 0),

  -- Gutschein (optional)
  promo_code              text,

  -- Wichtige Zeitstempel
  placed_at               timestamptz not null default now(),
  paid_at                 timestamptz,
  shipped_at              timestamptz,
  delivered_at            timestamptz,
  cancelled_at            timestamptz,

  -- Sprache der Bestellung (fuer Belege/E-Mail)
  language                text not null default 'de-CH'
                          check (language in ('de-CH','fr-CH','it-CH','en')),

  -- Anmerkungen
  customer_note           text,                                -- Wunsch des Kunden
  internal_note           text,                                -- intern (nur service_role sichtbar via App-Logik)

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index orders_customer_idx          on public.orders(customer_id, placed_at desc);
create index orders_status_idx            on public.orders(status);
create index orders_subscription_idx      on public.orders(subscription_id) where subscription_id is not null;
create index orders_paid_at_idx           on public.orders(paid_at desc) where paid_at is not null;
create index orders_placed_at_idx         on public.orders(placed_at desc);

create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

alter table public.orders enable row level security;

create policy "orders_self_select"
  on public.orders for select
  to authenticated
  using (customer_id = public.current_customer_id());

-- Inserts/Updates nur via Backend (Checkout/Webhook).
create policy "orders_all_service"
  on public.orders for all
  to service_role
  using (true) with check (true);


-- 4) order_items --------------------------------------------------------------
-- Snapshot-Pattern: Wir kopieren Name, Preis, Gewicht zum Bestellzeitpunkt,
-- damit aenderungen am Kaffee (Preis-Update, Umbenennung, Loeschung) die
-- historische Bestellung NICHT veraendern.
create table public.order_items (
  id                      uuid primary key default gen_random_uuid(),
  order_id                uuid not null references public.orders(id) on delete cascade,
  coffee_id               uuid not null references public.coffees(id) on delete restrict,

  -- Snapshots
  coffee_name_snapshot    text not null,
  roaster_name_snapshot   text not null,
  roast_level_snapshot    text,

  -- Mengen
  quantity                smallint not null default 1 check (quantity > 0),
  weight_g                integer not null check (weight_g > 0),

  -- Preise (Snapshot zum Bestellzeitpunkt)
  unit_price_chf          numeric(10,2) not null check (unit_price_chf >= 0),
  -- Einkaufspreis vom Roester (fuer Marge — vertraulich, aber gleiche Tabelle)
  wholesale_price_chf     numeric(10,2) check (wholesale_price_chf is null or wholesale_price_chf >= 0),
  line_total_chf          numeric(10,2) not null check (line_total_chf >= 0),

  -- Optional: Gewuenschter Mahlgrad pro Position
  grind_preference        text check (grind_preference is null or grind_preference in
                          ('whole_bean','espresso','filter','french_press','aeropress','moka','other')),

  created_at              timestamptz not null default now()
);

create index order_items_order_idx   on public.order_items(order_id);
create index order_items_coffee_idx  on public.order_items(coffee_id);

alter table public.order_items enable row level security;

-- Lesen erlaubt, wenn die Eltern-Order dem Kunden gehoert.
-- ACHTUNG: wholesale_price_chf ist enthalten — Frontend muss diese Spalte
-- explizit ausschliessen (`select ... ohne wholesale_price_chf`) oder via View
-- arbeiten. TODO Phase 4: View `order_items_public` ohne wholesale_price_chf.
create policy "order_items_self_select"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.customer_id = public.current_customer_id()
    )
  );

create policy "order_items_all_service"
  on public.order_items for all
  to service_role
  using (true) with check (true);


-- 5) shipments ----------------------------------------------------------------
-- Eine Bestellung kann in mehreren Sendungen ausgeliefert werden (z.B. wenn
-- zwei Roester die Kaffees direkt versenden — Drop-Shipping-Modell).
create table public.shipments (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references public.orders(id) on delete cascade,
  roaster_id          uuid references public.roasters(id) on delete set null,

  carrier             text not null default 'post_ch'
                      check (carrier in ('post_ch','dpd','dhl','ups','manual','other')),
  tracking_number     text,
  tracking_url        text,

  status              text not null default 'pending'
                      check (status in ('pending','label_created','picked_up','in_transit','delivered','returned','lost')),

  shipped_at          timestamptz,
  delivered_at        timestamptz,

  weight_g            integer check (weight_g is null or weight_g > 0),
  shipping_cost_chf   numeric(10,2) check (shipping_cost_chf is null or shipping_cost_chf >= 0),

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index shipments_order_idx     on public.shipments(order_id);
create index shipments_roaster_idx   on public.shipments(roaster_id);
create index shipments_status_idx    on public.shipments(status);
create index shipments_tracking_idx  on public.shipments(tracking_number) where tracking_number is not null;

create trigger trg_shipments_updated_at
  before update on public.shipments
  for each row execute function public.set_updated_at();

alter table public.shipments enable row level security;

create policy "shipments_self_select"
  on public.shipments for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = shipments.order_id
        and o.customer_id = public.current_customer_id()
    )
  );

create policy "shipments_all_service"
  on public.shipments for all
  to service_role
  using (true) with check (true);


-- 6) payments -----------------------------------------------------------------
-- Eine Bestellung kann mehrere Zahlungs-Versuche haben (failed → success).
-- Wir speichern jede einzelne, damit Stripe-/Datatrans-Webhooks idempotent
-- ablaufen koennen (per provider_payment_id).
create table public.payments (
  id                      uuid primary key default gen_random_uuid(),
  order_id                uuid not null references public.orders(id) on delete restrict,
  customer_id             uuid not null references public.customers(id) on delete restrict,

  provider                text not null
                          check (provider in ('stripe','datatrans','manual','invoice')),
  provider_payment_id     text,                                -- z.B. Stripe pi_xxx oder Datatrans Trxn-Id
  provider_customer_id    text,

  payment_method          text not null
                          check (payment_method in (
                            'card','twint','postfinance','apple_pay','google_pay',
                            'invoice','bank_transfer','manual'
                          )),

  amount_chf              numeric(10,2) not null check (amount_chf >= 0),
  currency                text not null default 'CHF' check (char_length(currency) = 3),

  status                  text not null default 'pending'
                          check (status in ('pending','authorized','succeeded','failed','refunded','partially_refunded','cancelled')),

  -- Refund-Tracking
  refunded_amount_chf     numeric(10,2) not null default 0 check (refunded_amount_chf >= 0),

  -- Failure-Details (bei status='failed')
  failure_code            text,
  failure_message         text,

  -- Roh-Payload vom Provider (zur Nachvollziehbarkeit / Debugging)
  provider_payload        jsonb,

  authorized_at           timestamptz,
  succeeded_at            timestamptz,
  failed_at               timestamptz,
  refunded_at             timestamptz,

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  unique (provider, provider_payment_id)
);

create index payments_order_idx       on public.payments(order_id);
create index payments_customer_idx    on public.payments(customer_id);
create index payments_status_idx      on public.payments(status);
create index payments_provider_idx    on public.payments(provider, provider_payment_id);

create trigger trg_payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

alter table public.payments enable row level security;

-- Kunde sieht nur eigene Zahlungen.
create policy "payments_self_select"
  on public.payments for select
  to authenticated
  using (customer_id = public.current_customer_id());

create policy "payments_all_service"
  on public.payments for all
  to service_role
  using (true) with check (true);


-- 7) LTV-Trigger: aktualisiert customers.lifetime_value_chf etc. -------------
-- Wird ausgeloest, wenn eine Order auf 'paid' (oder 'delivered') wechselt
-- bzw. wenn eine bezahlte Order zurueckgebucht wird ('refunded').
-- Idempotent: rechnet immer auf Basis aller bezahlten Orders neu.
create or replace function public.recalc_customer_aggregates(p_customer_id uuid)
returns void
language sql
as $$
  update public.customers c
  set
    lifetime_value_chf = coalesce((
      select sum(o.total_chf)
      from public.orders o
      where o.customer_id = p_customer_id
        and o.status in ('paid','processing','shipped','delivered')
    ), 0),
    total_orders = coalesce((
      select count(*)
      from public.orders o
      where o.customer_id = p_customer_id
        and o.status in ('paid','processing','shipped','delivered')
    ), 0),
    first_order_at = (
      select min(o.paid_at)
      from public.orders o
      where o.customer_id = p_customer_id and o.paid_at is not null
    ),
    last_order_at = (
      select max(o.paid_at)
      from public.orders o
      where o.customer_id = p_customer_id and o.paid_at is not null
    )
  where c.id = p_customer_id;
$$;

create or replace function public.trg_orders_update_customer_aggregates()
returns trigger
language plpgsql
as $$
begin
  -- Bei INSERT/UPDATE: customer_id der NEUEN Zeile aktualisieren
  if (tg_op = 'INSERT' or tg_op = 'UPDATE') then
    perform public.recalc_customer_aggregates(new.customer_id);
  end if;

  -- Bei UPDATE mit Wechsel des customer_id (selten, aber moeglich): auch alten Kunden refreshen
  if (tg_op = 'UPDATE' and old.customer_id is distinct from new.customer_id) then
    perform public.recalc_customer_aggregates(old.customer_id);
  end if;

  -- Bei DELETE: alten Kunden refreshen
  if (tg_op = 'DELETE') then
    perform public.recalc_customer_aggregates(old.customer_id);
    return old;
  end if;

  return new;
end;
$$;

create trigger trg_orders_aggregates
  after insert or update or delete on public.orders
  for each row execute function public.trg_orders_update_customer_aggregates();

comment on function public.recalc_customer_aggregates(uuid) is
  'Berechnet lifetime_value_chf, total_orders, first/last_order_at fuer einen Kunden neu. Idempotent.';
