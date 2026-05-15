-- Rewards / Referrals Foundation: CHF-Ledger + Kampagnen + Customer-Code.
--
-- Drei Tabellen-Aenderungen, eine SQL-Funktion fuer den Saldo:
--
-- 1) customer_credits  — append-only CHF-Buchhaltung pro Kunde
--    (parallel zu loyalty_points, das integer-Punkte fuehrt — wir nutzen
--    hier explizit CHF, weil das UI-Konzept "CHF 10 Guthaben" ist und
--    nicht "100 Punkte = CHF 10")
--
-- 2) marketing_campaigns — Promo-Codes vom Marketing-Team mit
--    CHF-Reward und Einsatz-Limits
--
-- 3) customers.referral_code — pro Kunde EIN persoenlicher Code,
--    lazy-generiert beim ersten Besuch von /account/referrals
--    (Die bisherige referrals.referral_code-Unique-Constraint passt
--    nicht zum 1-Code-pro-Kunde-Modell — drop'n)
--
-- 4) customer_credit_balance(uuid) — Saldo-Funktion

------------------------------------------------------------------------
-- 1) customer_credits — CHF-Ledger (append-only)
------------------------------------------------------------------------
create table if not exists public.customer_credits (
  id             uuid primary key default gen_random_uuid(),
  customer_id    uuid not null references public.customers(id) on delete cascade,

  amount_chf     numeric(10,2) not null check (amount_chf <> 0),
  -- positiv = Gutschrift, negativ = Verbrauch / Einloesen
  reason         text not null
                 check (reason in (
                   'referral_referrer',  -- Werber bekommt fuer qualifizierte Empfehlung
                   'referral_referee',   -- Geworbener bekommt Willkommens-Bonus
                   'loyalty_bonus',      -- Treue-Bonus (z.B. jede 10. Bestellung)
                   'campaign_bonus',     -- Marketing-Kampagne via Code
                   'manual_credit',      -- Service / Kulanz, vom Team gebucht
                   'order_redemption',   -- Einloesen auf eine Bestellung (negativ)
                   'refund_reversal',    -- Refund: Credit zurueckziehen (negativ)
                   'expiration',         -- Verfall (negativ)
                   'correction'          -- Manuelle Korrektur (beide Vorzeichen)
                 )),

  -- Bezugs-Objekte (optional, je nach reason)
  order_id       uuid references public.orders(id) on delete set null,
  referral_id    uuid references public.referrals(id) on delete set null,
  campaign_id    uuid,  -- FK kommt unten nachdem marketing_campaigns existiert

  -- Verfallsdatum (NULL = unbegrenzt gueltig)
  expires_on     date,

  description    text,         -- z.B. 'Anna F. wurde Mitglied'
  description_de text,

  -- Wer hat gebucht (bei manual_credit / campaign_bonus = Admin)
  created_by     uuid references auth.users(id) on delete set null,

  created_at     timestamptz not null default now()
);

create index customer_credits_customer_idx
  on public.customer_credits(customer_id, created_at desc);
create index customer_credits_reason_idx
  on public.customer_credits(reason);
create index customer_credits_order_idx
  on public.customer_credits(order_id) where order_id is not null;
create index customer_credits_referral_idx
  on public.customer_credits(referral_id) where referral_id is not null;
create index customer_credits_expires_idx
  on public.customer_credits(expires_on) where expires_on is not null;

alter table public.customer_credits enable row level security;

drop policy if exists "credits_self_select" on public.customer_credits;
create policy "credits_self_select"
  on public.customer_credits for select
  to authenticated
  using (customer_id = public.current_customer_id());

drop policy if exists "credits_all_service" on public.customer_credits;
create policy "credits_all_service"
  on public.customer_credits for all
  to service_role
  using (true) with check (true);

-- Append-Only via Trigger (wiederverwendete prevent_consent_modify-Fn)
drop trigger if exists trg_customer_credits_no_update on public.customer_credits;
create trigger trg_customer_credits_no_update
  before update on public.customer_credits
  for each row execute function public.prevent_consent_modify();

drop trigger if exists trg_customer_credits_no_delete on public.customer_credits;
create trigger trg_customer_credits_no_delete
  before delete on public.customer_credits
  for each row execute function public.prevent_consent_modify();

------------------------------------------------------------------------
-- 2) marketing_campaigns — Promo-Codes mit CHF-Reward
------------------------------------------------------------------------
create table if not exists public.marketing_campaigns (
  id                       uuid primary key default gen_random_uuid(),

  -- Identifikation
  code                     text unique not null,
  name                     text not null,
  description              text,

  -- Reward in CHF (Gutschein-Wert) — wird beim Einloesen als
  -- customer_credits.amount_chf gebucht
  credit_chf               numeric(10,2) not null check (credit_chf > 0),

  -- Limits
  max_uses_per_customer    integer not null default 1
                           check (max_uses_per_customer >= 1),
  max_total_uses           integer  -- NULL = unbegrenzt
                           check (max_total_uses is null or max_total_uses > 0),
  current_uses             integer not null default 0,

  -- Gueltigkeit
  valid_from               timestamptz not null default now(),
  valid_until              timestamptz,  -- NULL = unbegrenzt
  active                   boolean not null default true,

  -- Metadaten fuer Reporting
  channel                  text,  -- z.B. 'email', 'instagram', 'partnership'
  notes                    text,  -- interne Anmerkung

  created_by               uuid references auth.users(id) on delete set null,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index marketing_campaigns_active_idx
  on public.marketing_campaigns(active) where active = true;
create index marketing_campaigns_valid_idx
  on public.marketing_campaigns(valid_until) where valid_until is not null;

create trigger trg_marketing_campaigns_updated_at
  before update on public.marketing_campaigns
  for each row execute function public.set_updated_at();

alter table public.marketing_campaigns enable row level security;

-- Lesen darf jeder authenticated User (Kunde gibt Code im Checkout ein,
-- App checkt ob valid). Schreiben nur service_role.
drop policy if exists "campaigns_authenticated_select" on public.marketing_campaigns;
create policy "campaigns_authenticated_select"
  on public.marketing_campaigns for select
  to authenticated
  using (true);

drop policy if exists "campaigns_all_service" on public.marketing_campaigns;
create policy "campaigns_all_service"
  on public.marketing_campaigns for all
  to service_role
  using (true) with check (true);

-- FK auf customer_credits.campaign_id nachreichen
alter table public.customer_credits
  add constraint customer_credits_campaign_fk
  foreign key (campaign_id) references public.marketing_campaigns(id) on delete set null;

------------------------------------------------------------------------
-- 3) customers.referral_code — 1 Code pro Kunde, lazy-generiert
------------------------------------------------------------------------
alter table public.customers
  add column if not exists referral_code text unique;

comment on column public.customers.referral_code is
  'Persoenlicher Empfehlungs-Code des Kunden. Lazy-generiert bei '
  'erstem Besuch der Referrals-Seite. Kunden teilen diesen Code; '
  'andere geben ihn beim Checkout ein.';

-- Bestehende Unique-Constraint auf referrals.referral_code aufheben —
-- in unserem Modell teilt ein Werber EINEN persoenlichen Code, jede
-- Empfehlung wird zur eigenen Zeile mit dem gleichen Code referenziert.
alter table public.referrals
  drop constraint if exists referrals_referral_code_key;

create index if not exists referrals_referral_code_idx
  on public.referrals(referral_code);

------------------------------------------------------------------------
-- 4) Saldo-Funktion
------------------------------------------------------------------------
create or replace function public.customer_credit_balance(p_customer_id uuid)
returns numeric
language sql
stable
as $$
  select coalesce(sum(amount_chf), 0)::numeric(10,2)
  from public.customer_credits
  where customer_id = p_customer_id
    and (expires_on is null or expires_on >= current_date);
$$;

comment on function public.customer_credit_balance(uuid) is
  'Aktueller CHF-Guthaben-Saldo des Kunden, Verfall beruecksichtigt. '
  'Summiert alle Eintraege in customer_credits.';
