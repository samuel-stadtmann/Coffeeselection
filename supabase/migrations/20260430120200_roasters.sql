-- =============================================================================
-- Migration 003 — Roasters (Roesterpartner)
-- =============================================================================
-- Legt zwei Tabellen an:
--   * roasters         — oeffentlich lesbar (Name, Adresse, Story, Kontakt)
--   * roasters_payout  — nur service_role (IBAN, Provision, Vertragsdetails)
--
-- Trennung sensibler Felder in eine eigene Tabelle ist sicherer als RLS-Filter
-- auf einzelnen Spalten: 'select *' kann keine vertraulichen Daten leaken.
-- =============================================================================


-- 1) Hauptdaten -------------------------------------------------------------
create table public.roasters (
  id              uuid primary key default gen_random_uuid(),

  -- Identitaet & Anzeige
  slug            text unique not null,                    -- URL-Identifier, z.B. 'mame-coffee'
  name            text not null,                            -- Anzeigename, z.B. 'MAME Coffee'
  legal_name      text,                                     -- Firmenname, z.B. 'MAME Specialty Coffee AG'

  -- Inhalt fuer Webseite
  short_description text,                                   -- 1-Satz-Pitch fuer Listen-Ansicht
  description       text,                                   -- ein paar Saetze fuer Detailseite
  story             text,                                   -- ausfuehrliche Roesterei-Geschichte (Markdown ok)
  logo_url          text,
  hero_image_url    text,
  website_url       text,
  instagram_handle  text,

  -- Kontakt (oeffentlich)
  contact_email     citext,
  contact_phone     text,

  -- Adresse (oeffentlich)
  street            text,
  street_additional text,
  postal_code       text,
  city              text,
  region            text,                                   -- Kanton
  country           text not null default 'CH',
  vat_number        text,                                   -- z.B. CH-UID 'CHE-123.456.789 MWST'

  -- Status & Lifecycle
  status            text not null default 'onboarding'
                    check (status in ('onboarding','active','paused','inactive')),

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz                             -- Soft-Delete, da Geschaeftsdaten
);

create index roasters_status_idx        on public.roasters(status) where deleted_at is null;
create index roasters_country_idx       on public.roasters(country);
create index roasters_deleted_at_idx    on public.roasters(deleted_at) where deleted_at is not null;

create trigger trg_roasters_updated_at
  before update on public.roasters
  for each row execute function public.set_updated_at();

alter table public.roasters enable row level security;

-- Oeffentlich lesbar: nur aktive, nicht geloeschte Roester
create policy "roasters_read_active"
  on public.roasters for select
  to anon, authenticated
  using (status = 'active' and deleted_at is null);

-- Schreiben: nur service_role (Admin-Tools, Edge Functions)
create policy "roasters_write_service"
  on public.roasters for all
  to service_role
  using (true) with check (true);


-- 2) Payout & Vertragsdaten (vertraulich) -----------------------------------
create table public.roasters_payout (
  roaster_id            uuid primary key references public.roasters(id) on delete cascade,

  -- Bankverbindung
  bank_account_holder   text,
  iban                  text,                               -- ohne Leerzeichen, z.B. 'CH9300762011623852957'
  bic                   text,                               -- bei Auslandsbanken
  bank_name             text,

  -- Auszahlung
  payout_method         text not null default 'bank_transfer'
                        check (payout_method in ('bank_transfer','twint','manual','none')),
  payout_currency       text not null default 'CHF'
                        check (char_length(payout_currency) = 3),
  payout_threshold_chf  numeric(10,2) not null default 0,   -- erst auszahlen ab Betrag

  -- Vertrag
  commission_pct        numeric(5,2)
                        check (commission_pct is null or (commission_pct >= 0 and commission_pct <= 100)),
  contract_start_on     date,
  contract_end_on       date,
  contract_notes        text,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create trigger trg_roasters_payout_updated_at
  before update on public.roasters_payout
  for each row execute function public.set_updated_at();

alter table public.roasters_payout enable row level security;

-- KEINE Read-Policy fuer anon/authenticated: ohne Policy = kein Zugriff = sicher.
-- Nur service_role darf alles.
create policy "roasters_payout_all_service"
  on public.roasters_payout for all
  to service_role
  using (true) with check (true);

comment on table public.roasters_payout is
  'Vertrauliche Zahlungs- und Vertragsdaten. Niemals oeffentlich abfragen. Zugriff nur via service_role.';
