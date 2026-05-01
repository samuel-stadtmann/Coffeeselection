-- =============================================================================
-- Migration 005 — Kunden-Identitaet
-- =============================================================================
-- Erste Migration der Kunden-Datenbank (Phase 2). Legt die Identitaets-Schicht
-- an: customers (Stammdaten), customer_addresses (Liefer-/Rechnungsadressen),
-- customer_consents (DSG/DSGVO-Einwilligungen, append-only), customer_tags
-- (Marketing-Segmente, n:m).
--
-- Plus zwei Helper:
--   * Funktion current_customer_id() — gibt customer.id fuer den eingeloggten
--     auth.users-Datensatz zurueck. Wird in allen folgenden Migrationen fuer
--     RLS-Policies verwendet, damit wir nicht 30x dieselbe Subquery schreiben.
--   * Trigger auf auth.users — bei jedem neuen Auth-User wird automatisch
--     ein customers-Eintrag angelegt (kein App-Code noetig).
--
-- Reihenfolge wichtig: customers wird ZUERST angelegt, weil current_customer_id()
-- darauf zugreift und 'language sql'-Funktionen zum Erstellungszeitpunkt geprueft
-- werden.
-- =============================================================================


-- 1) customers ----------------------------------------------------------------
create table public.customers (
  id                      uuid primary key default gen_random_uuid(),
  auth_user_id            uuid unique not null references auth.users(id) on delete cascade,

  -- Stammdaten
  email                   citext unique not null,
  first_name              text,
  last_name               text,
  phone                   text,                                 -- E.164-Format empfohlen
  language                text not null default 'de-CH'         -- 'de-CH','fr-CH','it-CH','en'
                          check (language in ('de-CH','fr-CH','it-CH','en')),
  date_of_birth           date,
  gender                  text check (gender is null or gender in ('m','f','d','prefer_not')),

  -- Akquise
  acquisition_source      text,                                 -- 'google_ads','instagram','referral', ...
  acquisition_campaign    text,

  -- Segmentierung
  customer_segment        text not null default 'new'
                          check (customer_segment in ('new','active','vip','at_risk','churned')),

  -- Aggregat-Caches (per Trigger auf orders aktualisiert — siehe Migration 007)
  lifetime_value_chf      numeric(10,2) not null default 0 check (lifetime_value_chf >= 0),
  total_orders            integer not null default 0           check (total_orders >= 0),
  first_order_at          timestamptz,
  last_order_at           timestamptz,

  -- Marketing & Payment
  marketing_opt_in        boolean not null default false,
  stripe_customer_id      text unique,

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  deleted_at              timestamptz                            -- Soft-Delete (DSG: anonymisieren statt loeschen)
);

create index customers_segment_idx          on public.customers(customer_segment) where deleted_at is null;
create index customers_acquisition_idx      on public.customers(acquisition_source);
create index customers_last_order_idx       on public.customers(last_order_at desc nulls last);
create index customers_deleted_at_idx       on public.customers(deleted_at) where deleted_at is not null;

create trigger trg_customers_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

alter table public.customers enable row level security;

-- Kunde sieht/aendert nur sich selbst.
create policy "customers_self_select"
  on public.customers for select
  to authenticated
  using (auth.uid() = auth_user_id and deleted_at is null);

create policy "customers_self_update"
  on public.customers for update
  to authenticated
  using (auth.uid() = auth_user_id and deleted_at is null)
  with check (auth.uid() = auth_user_id);

-- Inserts/Deletes nur via service_role (bzw. Auth-Trigger weiter unten).
create policy "customers_all_service"
  on public.customers for all
  to service_role
  using (true) with check (true);


-- 2) Auth-Trigger: bei neuem auth.users-Eintrag automatisch customers-Zeile ----
-- Diese Funktion laeuft als 'security definer' = mit postgres-Rechten, kann
-- also auch dann INSERT in public.customers machen, wenn der frisch registrierte
-- Nutzer noch keine RLS-Permissions hat.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.customers (auth_user_id, email, language)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'language', 'de-CH')
  )
  on conflict (auth_user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();


-- 3) Helper-Funktion: current_customer_id() ----------------------------------
-- Gibt die customers.id des aktuell eingeloggten Auth-Users zurueck oder NULL,
-- wenn niemand eingeloggt ist (anon) oder es noch keinen customer-Eintrag gibt.
-- security definer: laeuft mit Rechten des Erstellers (postgres), umgeht damit
-- RLS auf der customers-Tabelle (sonst wuerden RLS-Policies sich selbst aufrufen).
-- stable: gleicher Output pro Query, Postgres kann das Ergebnis cachen.
create or replace function public.current_customer_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.customers
  where auth_user_id = auth.uid() and deleted_at is null
  limit 1
$$;

comment on function public.current_customer_id() is
  'Gibt customers.id des aktuell eingeloggten Auth-Users zurueck. Wird in RLS-Policies anderer Tabellen verwendet.';


-- 4) customer_addresses -------------------------------------------------------
create table public.customer_addresses (
  id                      uuid primary key default gen_random_uuid(),
  customer_id             uuid not null references public.customers(id) on delete cascade,

  type                    text not null default 'shipping'
                          check (type in ('shipping','billing')),
  is_default              boolean not null default false,

  recipient_name          text not null,
  company                 text,
  street                  text not null,
  street_additional       text,
  postal_code             text not null,
  city                    text not null,
  region                  text,                                  -- Kanton
  country                 text not null default 'CH',            -- ISO 3166-1 alpha-2
  delivery_instructions   text,

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index customer_addresses_customer_idx on public.customer_addresses(customer_id);
create index customer_addresses_country_idx  on public.customer_addresses(country);

-- Maximal eine Default-Adresse pro Typ pro Kunde (Partial Unique Index).
create unique index customer_addresses_one_default_per_type
  on public.customer_addresses(customer_id, type) where is_default = true;

create trigger trg_customer_addresses_updated_at
  before update on public.customer_addresses
  for each row execute function public.set_updated_at();

alter table public.customer_addresses enable row level security;

create policy "customer_addresses_self_all"
  on public.customer_addresses for all
  to authenticated
  using (customer_id = public.current_customer_id())
  with check (customer_id = public.current_customer_id());

create policy "customer_addresses_all_service"
  on public.customer_addresses for all
  to service_role
  using (true) with check (true);


-- 5) customer_consents (DSG/DSGVO, append-only) ------------------------------
create table public.customer_consents (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references public.customers(id) on delete cascade,
  consent_type  text not null check (consent_type in (
                  'marketing_email','analytics','profiling',
                  'third_party_sharing','cookie_functional','cookie_marketing')),
  granted       boolean not null,
  version       text not null,                              -- Version der Datenschutzerklaerung
  legal_basis   text not null default 'consent'
                check (legal_basis in ('consent','contract','legitimate_interest')),
  source        text not null,                              -- 'signup_form','checkout','settings','double_opt_in_email'
  ip_address    inet,
  user_agent    text,
  created_at    timestamptz not null default now()
);

create index customer_consents_lookup_idx
  on public.customer_consents(customer_id, consent_type, created_at desc);

alter table public.customer_consents enable row level security;

-- Kunde liest seine eigenen Einwilligungen.
create policy "customer_consents_self_select"
  on public.customer_consents for select
  to authenticated
  using (customer_id = public.current_customer_id());

-- Kunde kann neue Einwilligung/Widerruf erstellen (append-only).
create policy "customer_consents_self_insert"
  on public.customer_consents for insert
  to authenticated
  with check (customer_id = public.current_customer_id());

-- KEINE update/delete-Policy fuer authenticated → append-only auf RLS-Ebene.
create policy "customer_consents_all_service"
  on public.customer_consents for all
  to service_role
  using (true) with check (true);

-- Zusaetzlich: hartes Append-Only via Trigger (auch service_role-sicher,
-- ausser man umgeht den Trigger explizit).
create or replace function public.prevent_consent_modify()
returns trigger
language plpgsql
as $$
begin
  raise exception 'customer_consents ist append-only. Fuer Widerruf einen neuen Eintrag mit granted=false anlegen.';
end;
$$;

create trigger trg_customer_consents_no_update
  before update on public.customer_consents
  for each row execute function public.prevent_consent_modify();

create trigger trg_customer_consents_no_delete
  before delete on public.customer_consents
  for each row execute function public.prevent_consent_modify();


-- 6) customer_tags (n:m, Composite-PK) ---------------------------------------
create table public.customer_tags (
  customer_id   uuid not null references public.customers(id) on delete cascade,
  tag           text not null,                               -- 'vip','filter_fan','espresso_only','geschenk_abo'
  source        text not null default 'manual'
                check (source in ('manual','rule','ml')),
  assigned_at   timestamptz not null default now(),
  assigned_by   uuid references auth.users(id) on delete set null,
  primary key (customer_id, tag)
);

create index customer_tags_tag_idx on public.customer_tags(tag);

alter table public.customer_tags enable row level security;

-- Kunde liest eigene Tags. Schreiben nur via service_role (von Backend-Rules/ML).
create policy "customer_tags_self_select"
  on public.customer_tags for select
  to authenticated
  using (customer_id = public.current_customer_id());

create policy "customer_tags_all_service"
  on public.customer_tags for all
  to service_role
  using (true) with check (true);
