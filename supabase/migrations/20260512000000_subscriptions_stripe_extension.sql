-- ============================================================================
-- P1B-1: Subscriptions-Schema fuer echte Stripe-Subscriptions erweitern
--
-- Audit-Ergebnis (siehe Phase-1B-Plan):
--   * interval_weeks erlaubt nur (2,4,6,8) — fehlt 1 (woechentlich)
--   * stripe_price_id fehlt komplett — Stripe Subscriptions brauchen ein
--     Price-Objekt das wir referenzieren
--   * discount_percent fehlt — wir wollen 10% Abo-Rabatt snapshotten, damit
--     zukuenftige Rate-Aenderungen alte Abos nicht treffen
--   * stripe_current_period_end fehlt — Stripe sagt uns wann die naechste
--     Abbuchung ist; fuer UI "Naechste Lieferung am ..." nuetzlich
--
-- Nicht enthalten:
--   * trial_end (User-Entscheidung: kein Trial)
--   * Anderes Schema-Refactor (subscription_items reicht)
--
-- Idempotent: alle ALTER mit IF NOT EXISTS / DROP CONSTRAINT IF EXISTS.
-- Datum: 2026-05-12
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) interval_weeks: 1 (woechentlich) erlauben
-- ----------------------------------------------------------------------------
-- Alte Constraint loeschen und durch neue ersetzen. Subscriptions die schon
-- existieren haben Werte aus (2,4,6,8) — passt zur neuen Constraint, kein
-- Daten-Issue.
alter table public.subscriptions
  drop constraint if exists subscriptions_interval_weeks_check;

alter table public.subscriptions
  add constraint subscriptions_interval_weeks_check
  check (interval_weeks in (1, 2, 4, 6, 8));

-- ----------------------------------------------------------------------------
-- 2) stripe_price_id: welches Stripe-Price-Objekt zahlt diese Subscription
-- ----------------------------------------------------------------------------
alter table public.subscriptions
  add column if not exists stripe_price_id text;

comment on column public.subscriptions.stripe_price_id is
  'Stripe Price-ID (price_xxx) die diese Subscription bezahlt. Wird in '
  'P1B-2 entschieden ob dynamisch erzeugt (pro Subscription) oder '
  'vorkonfiguriert (pro Coffee+Interval+Size-Kombi).';

create index if not exists subscriptions_stripe_price_idx
  on public.subscriptions(stripe_price_id)
  where stripe_price_id is not null;

-- ----------------------------------------------------------------------------
-- 3) discount_percent: Abo-Rabatt-Snapshot
-- ----------------------------------------------------------------------------
-- Werte in 0.00-100.00 (Prozentpunkte). Default 0 = kein Rabatt.
-- Beispiel: 10.00 = 10% Abo-Rabatt zum Zeitpunkt der Abo-Anlage.
-- Wenn wir spaeter die globale Rabatt-Rate aendern, gilt fuer diese Subscription
-- weiter der gespeicherte Wert (kein Surprise fuer Kunden).
alter table public.subscriptions
  add column if not exists discount_percent numeric(5,2) not null default 0
  check (discount_percent >= 0 and discount_percent <= 100);

comment on column public.subscriptions.discount_percent is
  'Abo-Rabatt in Prozent zum Anlage-Zeitpunkt (Snapshot). Z.B. 10.00 = 10%. '
  'Aendert sich der globale Rabatt-Satz, bleibt fuer diese Subscription der '
  'urspruengliche Wert.';

-- ----------------------------------------------------------------------------
-- 4) stripe_current_period_end: naechste Abbuchung laut Stripe
-- ----------------------------------------------------------------------------
-- Wird vom Subscription-Webhook (P1B-6) bei jeder Renewal aktualisiert.
-- Frontend nutzt das fuer "Naechste Lieferung am ...".
alter table public.subscriptions
  add column if not exists stripe_current_period_end timestamptz;

comment on column public.subscriptions.stripe_current_period_end is
  'Stripe meldet bei jeder Renewal das Ende der aktuellen Billing-Periode. '
  'Frontend zeigt das als naechstes Abbuchung-/Lieferung-Datum (zusammen mit '
  'next_delivery_on, das wir intern berechnen).';

create index if not exists subscriptions_current_period_end_idx
  on public.subscriptions(stripe_current_period_end)
  where status = 'active';
