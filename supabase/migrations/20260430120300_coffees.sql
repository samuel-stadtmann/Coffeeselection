-- =============================================================================
-- Migration 004 — Coffees + Junction-Tables
-- =============================================================================
-- Legt die Haupttabelle 'coffees' an plus drei n:m-Verbindungstabellen, die
-- jeden Kaffee mit Aromen, empfohlenen Brueh-Methoden und Zertifikaten
-- verbinden.
--
-- Konventionen: UUID-PKs, snake_case, _at-Suffix fuer Zeit, _chf-Suffix fuer
-- Geld, deleted_at fuer Soft-Delete (Geschaeftsdaten), Enums als TEXT mit
-- CHECK-Constraint, RLS auf jeder Tabelle.
-- =============================================================================


-- 1) Haupt-Tabelle ------------------------------------------------------------
create table public.coffees (
  id                  uuid primary key default gen_random_uuid(),

  -- Identitaet & Anzeige
  slug                text unique not null,
  name                text not null,
  roaster_id          uuid not null references public.roasters(id) on delete restrict,
  short_description   text,                                       -- 1-Satz-Pitch fuer Listen-Ansicht
  description         text,                                       -- Detail-Seite (Markdown ok)
  tasting_summary     text,                                       -- 1-2 Saetze "wie schmeckt's"
  image_url           text,
  gallery_urls        text[],                                     -- mehrere Bilder optional

  -- Herkunft (NULL erlaubt — Blends haben oft mehrere Origins)
  origin_id              uuid references public.origins_catalog(id),
  region                 text,                                    -- z.B. 'Yirgacheffe', 'Huila'
  farm                   text,                                    -- z.B. 'Hama Cooperative'
  producer               text,                                    -- z.B. 'Genji Challa'
  variety_id             uuid references public.varieties_catalog(id),
  processing_method_id   uuid references public.processing_methods_catalog(id),
  altitude_m_min         integer check (altitude_m_min is null or altitude_m_min between 0 and 4000),
  altitude_m_max         integer check (altitude_m_max is null or altitude_m_max between 0 and 4000),
  harvest_year           smallint check (harvest_year is null or harvest_year between 1900 and 2100),
  lot_number             text,

  -- Roestung
  roast_level         text not null
                      check (roast_level in ('light','medium_light','medium','medium_dark','dark')),
  roast_profile       text not null default 'omni'
                      check (roast_profile in ('espresso','filter','omni')),
  roast_date          date,                                       -- letzte Roestung (NULL bei on-demand)
  is_fresh_roast_on_demand boolean not null default false,

  -- Eigenschaften
  is_decaf            boolean not null default false,
  decaf_method        text                                        -- nur bei is_decaf=true sinnvoll
                      check (decaf_method is null or decaf_method in
                            ('swiss_water','co2','sugarcane_ea','solvent_ea','other')),
  is_blend            boolean not null default false,
  is_single_origin    boolean generated always as (not is_blend) stored,  -- Convenience
  sca_score           numeric(4,2) check (sca_score is null or (sca_score >= 0 and sca_score <= 100)),

  -- Kommerz (eine Standardgroesse pro Kaffee — Varianten kommen ggf. spaeter)
  price_chf           numeric(10,2) not null check (price_chf >= 0),
  weight_g            integer not null default 250 check (weight_g > 0),
  stock_status        text not null default 'in_stock'
                      check (stock_status in ('in_stock','low_stock','out_of_stock','discontinued')),
  min_order_qty       integer not null default 1 check (min_order_qty > 0),

  -- Lifecycle
  status              text not null default 'draft'
                      check (status in ('draft','active','paused','discontinued')),
  visible_from        timestamptz,                                 -- Marketing-Veroeffentlichung
  visible_until       timestamptz,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz,

  -- Logische Konsistenz: min <= max bei Hoehenlage
  constraint coffees_altitude_range_chk
    check (altitude_m_min is null or altitude_m_max is null or altitude_m_min <= altitude_m_max),
  -- Logische Konsistenz: visible_from <= visible_until
  constraint coffees_visible_range_chk
    check (visible_from is null or visible_until is null or visible_from <= visible_until)
);

-- Indizes (haeufige Filter & Joins)
create index coffees_roaster_idx     on public.coffees(roaster_id);
create index coffees_origin_idx      on public.coffees(origin_id);
create index coffees_variety_idx     on public.coffees(variety_id);
create index coffees_processing_idx  on public.coffees(processing_method_id);
create index coffees_status_active_idx
  on public.coffees(status) where deleted_at is null and status = 'active';
create index coffees_deleted_at_idx
  on public.coffees(deleted_at) where deleted_at is not null;

create trigger trg_coffees_updated_at
  before update on public.coffees
  for each row execute function public.set_updated_at();

alter table public.coffees enable row level security;

-- Oeffentlich lesbar: nur aktive, nicht geloeschte, im Sichtbarkeitsfenster.
create policy "coffees_read_visible"
  on public.coffees for select
  to anon, authenticated
  using (
    status = 'active'
    and deleted_at is null
    and (visible_from  is null or visible_from  <= now())
    and (visible_until is null or visible_until >  now())
  );

create policy "coffees_write_service"
  on public.coffees for all
  to service_role
  using (true) with check (true);


-- 2) coffee_flavor_notes (n:m: Kaffee ↔ Aromen) ------------------------------
create table public.coffee_flavor_notes (
  coffee_id       uuid not null references public.coffees(id) on delete cascade,
  flavor_note_id  uuid not null references public.flavor_notes_catalog(id) on delete restrict,
  intensity       smallint check (intensity is null or intensity between 1 and 5),
  sort_order      smallint not null default 0,
  created_at      timestamptz not null default now(),
  primary key (coffee_id, flavor_note_id)
);

create index coffee_flavor_notes_flavor_idx on public.coffee_flavor_notes(flavor_note_id);

alter table public.coffee_flavor_notes enable row level security;

create policy "coffee_flavor_notes_read_all"
  on public.coffee_flavor_notes for select
  to anon, authenticated
  using (true);

create policy "coffee_flavor_notes_write_service"
  on public.coffee_flavor_notes for all
  to service_role
  using (true) with check (true);


-- 3) coffee_brewing_methods (n:m: Kaffee ↔ empfohlene Bruehmethoden) ---------
create table public.coffee_brewing_methods (
  coffee_id           uuid not null references public.coffees(id) on delete cascade,
  brewing_method_id   uuid not null references public.brewing_methods_catalog(id) on delete restrict,
  is_recommended      boolean not null default true,    -- false = "geht auch" / nicht primaer
  notes               text,                              -- z.B. Dosierung, Bruehzeit
  created_at          timestamptz not null default now(),
  primary key (coffee_id, brewing_method_id)
);

create index coffee_brewing_methods_method_idx on public.coffee_brewing_methods(brewing_method_id);

alter table public.coffee_brewing_methods enable row level security;

create policy "coffee_brewing_methods_read_all"
  on public.coffee_brewing_methods for select
  to anon, authenticated
  using (true);

create policy "coffee_brewing_methods_write_service"
  on public.coffee_brewing_methods for all
  to service_role
  using (true) with check (true);


-- 4) coffee_certifications (n:m: Kaffee ↔ Zertifikate) -----------------------
create table public.coffee_certifications (
  coffee_id         uuid not null references public.coffees(id) on delete cascade,
  certification_id  uuid not null references public.certifications_catalog(id) on delete restrict,
  certified_until   date,                                -- optional: Ablaufdatum
  certificate_url   text,                                -- Link zum PDF/Beweis
  created_at        timestamptz not null default now(),
  primary key (coffee_id, certification_id)
);

create index coffee_certifications_cert_idx on public.coffee_certifications(certification_id);

alter table public.coffee_certifications enable row level security;

create policy "coffee_certifications_read_all"
  on public.coffee_certifications for select
  to anon, authenticated
  using (true);

create policy "coffee_certifications_write_service"
  on public.coffee_certifications for all
  to service_role
  using (true) with check (true);
