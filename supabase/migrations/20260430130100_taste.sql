-- =============================================================================
-- Migration 006 — Geschmack & Praeferenzen
-- =============================================================================
-- Legt die Geschmacks-Schicht der Kunden-Datenbank an. Diese Migration speichert
-- alles, was wir ueber den individuellen Geschmack eines Kunden wissen:
--
--   * taste_profiles         — Geschmacksprofil (Skalenwerte 1-5 pro Dimension)
--   * taste_quiz_responses   — Rohantworten + berechnetes Profil aus dem Onboarding-Quiz
--   * flavor_preferences     — explizite Bewertungen einzelner Aromen (-2 bis +2)
--   * customer_brewing_methods — welche Brueh-Methoden ein Kunde nutzt (n:m)
--   * customer_equipment     — Maschinen, Muehlen, Waagen (1:n)
--   * taste_embeddings       — OpenAI-Embedding des Profils fuer vektorbasierte
--                              Aehnlichkeits-Suche (Produkt-Empfehlungen)
--
-- Alle Tabellen referenzieren public.customers und nutzen current_customer_id()
-- aus Migration 005 fuer RLS-Policies.
-- =============================================================================


-- 1) taste_profiles -----------------------------------------------------------
-- 1:1 zum Kunden. Fasst alle Geschmacks-Dimensionen in einem Datensatz zusammen.
-- Null bedeutet: diese Dimension noch nicht bewertet/ausgefuellt.
create table public.taste_profiles (
  id                      uuid primary key default gen_random_uuid(),
  customer_id             uuid unique not null references public.customers(id) on delete cascade,

  -- Geschmacks-Dimensionen (1 = sehr wenig / hell / leicht, 5 = sehr viel / dunkel / kraeftig)
  -- NULL = noch keine Angabe
  intensity               smallint check (intensity       is null or intensity       between 1 and 5),
  acidity                 smallint check (acidity         is null or acidity         between 1 and 5),
  sweetness               smallint check (sweetness       is null or sweetness       between 1 and 5),
  bitterness              smallint check (bitterness      is null or bitterness      between 1 and 5),
  body                    smallint check (body            is null or body            between 1 and 5),
  roast_preference        smallint check (roast_preference is null or roast_preference between 1 and 5),
  -- 1='light', 3='medium', 5='dark'

  -- Kategorische Praeferenzen
  preferred_origins       text[],                           -- z.B. ['ethiopia','colombia','peru']
  preferred_processing    text[],                           -- z.B. ['natural','washed']
  preferred_roast_profiles text[],                          -- z.B. ['filter','omni']

  -- Avoidances
  avoid_origins           text[],
  avoid_processing        text[],
  avoid_flavors           text[],                           -- Aroma-Slugs die nicht gemocht werden

  -- Sonderfaelle
  wants_decaf             boolean not null default false,
  wants_single_origin     boolean not null default true,

  -- Konfidenzniveau (0.00-1.00): wie sicher das Profil ist
  -- Steigt mit mehr Bewertungen/Quiz-Antworten
  profile_confidence      numeric(3,2) not null default 0.00
                          check (profile_confidence >= 0 and profile_confidence <= 1),

  -- Wann wurde das Profil zuletzt aus Ratings/Quiz neu berechnet?
  last_computed_at        timestamptz,

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- GIN-Indizes auf Array-Felder: ermoeglicht schnelles @> ("enthaelt Ethiopia?")
create index taste_profiles_origins_idx    on public.taste_profiles using gin(preferred_origins);
create index taste_profiles_processing_idx on public.taste_profiles using gin(preferred_processing);
create index taste_profiles_confidence_idx on public.taste_profiles(profile_confidence desc);

create trigger trg_taste_profiles_updated_at
  before update on public.taste_profiles
  for each row execute function public.set_updated_at();

alter table public.taste_profiles enable row level security;

-- Kunde liest und schreibt nur sein eigenes Profil.
create policy "taste_profiles_self_all"
  on public.taste_profiles for all
  to authenticated
  using (customer_id = public.current_customer_id())
  with check (customer_id = public.current_customer_id());

create policy "taste_profiles_all_service"
  on public.taste_profiles for all
  to service_role
  using (true) with check (true);


-- 2) taste_quiz_responses -----------------------------------------------------
-- Jede Quizteilnahme wird als eigener Datensatz gespeichert (append-only-Logik:
-- Updates werden zwar nicht verboten, aber in der App wird bei erneutem Quiz ein
-- neuer Datensatz angelegt — Historisierung inklusive).
create table public.taste_quiz_responses (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid not null references public.customers(id) on delete cascade,

  -- Version des Quiz-Fragebogens (damit Auswertungslogik quiz_v2 vs. quiz_v1 trennen kann)
  quiz_version    text not null default 'v1',

  -- Alle Antworten als JSONB — Struktur haengt von quiz_version ab.
  -- Beispiel: {"q1": "ethiopia", "q2": ["fruity","floral"], "q3": 4}
  answers         jsonb not null default '{}',

  -- Das aus den Antworten berechnete Profil (JSONB-Snapshot, wird in taste_profiles uebernommen)
  computed_profile jsonb,

  -- Wurde das Profil bereits auf taste_profiles angewendet?
  applied_at      timestamptz,

  -- Kontext: wo wurde der Quiz ausgefuellt?
  source          text not null default 'onboarding'
                  check (source in ('onboarding','re_quiz','email_campaign','app_prompt')),

  completed_at    timestamptz,                              -- NULL = abgebrochen
  created_at      timestamptz not null default now()
);

-- GIN-Index auf JSONB: ermoeglicht Suche nach bestimmten Antworten
create index taste_quiz_responses_answers_idx
  on public.taste_quiz_responses using gin(answers);
create index taste_quiz_responses_customer_idx
  on public.taste_quiz_responses(customer_id, created_at desc);

alter table public.taste_quiz_responses enable row level security;

-- Kunde liest eigene Quiz-Antworten (schreiben nur via Backend/service_role).
create policy "taste_quiz_responses_self_select"
  on public.taste_quiz_responses for select
  to authenticated
  using (customer_id = public.current_customer_id());

create policy "taste_quiz_responses_all_service"
  on public.taste_quiz_responses for all
  to service_role
  using (true) with check (true);


-- 3) flavor_preferences -------------------------------------------------------
-- Explizite Aroma-Bewertungen des Kunden (aus Kaffee-Ratings oder direktem Feedback).
-- n:m zwischen customers und flavor_notes_catalog.
-- preference: -2 = mag ich gar nicht, -1 = eher nicht, 0 = neutral,
--              1 = mag ich, 2 = liebe ich.
create table public.flavor_preferences (
  customer_id     uuid not null references public.customers(id) on delete cascade,
  flavor_note_id  uuid not null references public.flavor_notes_catalog(id) on delete cascade,

  preference      smallint not null default 0
                  check (preference between -2 and 2),

  -- Wie viele Kaffeebewertungen liegen dieser Praeferenz zugrunde?
  signal_count    integer not null default 1 check (signal_count >= 1),

  updated_at      timestamptz not null default now(),
  primary key (customer_id, flavor_note_id)
);

create index flavor_preferences_flavor_idx on public.flavor_preferences(flavor_note_id);
create index flavor_preferences_positive_idx
  on public.flavor_preferences(customer_id, preference desc)
  where preference > 0;

create trigger trg_flavor_preferences_updated_at
  before update on public.flavor_preferences
  for each row execute function public.set_updated_at();

alter table public.flavor_preferences enable row level security;

create policy "flavor_preferences_self_all"
  on public.flavor_preferences for all
  to authenticated
  using (customer_id = public.current_customer_id())
  with check (customer_id = public.current_customer_id());

create policy "flavor_preferences_all_service"
  on public.flavor_preferences for all
  to service_role
  using (true) with check (true);


-- 4) customer_brewing_methods -------------------------------------------------
-- Welche Brueh-Methoden nutzt ein Kunde zu Hause? n:m zu brewing_methods_catalog.
-- is_primary = die bevorzugte Methode (max. 1 pro Kunde via Partial Unique Index).
create table public.customer_brewing_methods (
  customer_id         uuid not null references public.customers(id) on delete cascade,
  brewing_method_id   uuid not null references public.brewing_methods_catalog(id) on delete restrict,

  is_primary          boolean not null default false,
  frequency           text check (frequency is null or frequency in ('daily','weekly','occasionally')),

  created_at          timestamptz not null default now(),
  primary key (customer_id, brewing_method_id)
);

-- Maximal eine primaere Brueh-Methode pro Kunde.
create unique index customer_brewing_methods_one_primary
  on public.customer_brewing_methods(customer_id) where is_primary = true;

create index customer_brewing_methods_method_idx
  on public.customer_brewing_methods(brewing_method_id);

alter table public.customer_brewing_methods enable row level security;

create policy "customer_brewing_methods_self_all"
  on public.customer_brewing_methods for all
  to authenticated
  using (customer_id = public.current_customer_id())
  with check (customer_id = public.current_customer_id());

create policy "customer_brewing_methods_all_service"
  on public.customer_brewing_methods for all
  to service_role
  using (true) with check (true);


-- 5) customer_equipment -------------------------------------------------------
-- Auflistung der Geraete: eine Zeile pro Geraet (Maschine, Muehle, Waage, ...).
-- Freitext-Felder, weil Geraete-Vielfalt zu gross fuer feste Enums.
create table public.customer_equipment (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid not null references public.customers(id) on delete cascade,

  equipment_type  text not null
                  check (equipment_type in (
                    'espresso_machine','portafilter','capsule_machine',
                    'moka_pot','french_press','pour_over','aeropress',
                    'chemex','siphon','cold_brew',
                    'grinder_manual','grinder_electric',
                    'scale','kettle','other'
                  )),

  brand           text,                                     -- z.B. 'De'Longhi', 'Baratza'
  model           text,                                     -- z.B. 'Linea Mini', 'Encore ESP'
  purchase_year   smallint check (purchase_year is null or purchase_year between 1900 and 2100),
  notes           text,                                     -- Freitext-Anmerkungen

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index customer_equipment_customer_idx  on public.customer_equipment(customer_id);
create index customer_equipment_type_idx      on public.customer_equipment(equipment_type);

create trigger trg_customer_equipment_updated_at
  before update on public.customer_equipment
  for each row execute function public.set_updated_at();

alter table public.customer_equipment enable row level security;

create policy "customer_equipment_self_all"
  on public.customer_equipment for all
  to authenticated
  using (customer_id = public.current_customer_id())
  with check (customer_id = public.current_customer_id());

create policy "customer_equipment_all_service"
  on public.customer_equipment for all
  to service_role
  using (true) with check (true);


-- 6) taste_embeddings ---------------------------------------------------------
-- Speichert den OpenAI-Embedding-Vektor des Geschmacksprofils (1536 Dimensionen
-- fuer text-embedding-3-small / text-embedding-3-large).
-- Wird von der Empfehlungs-Engine genutzt: Kunden-Vektor <=> Kaffee-Vektor (cosine).
-- 1:1 zu customers; bei Profil-Update wird der Datensatz ersetzt (upsert).
create table public.taste_embeddings (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid unique not null references public.customers(id) on delete cascade,

  -- Der eigentliche Vektor (1536 Dim = text-embedding-3-small/large).
  embedding       vector(1536) not null,

  -- Metadaten zur Nachvollziehbarkeit
  embedding_model text not null default 'text-embedding-3-small',
  version         integer not null default 1,              -- inkrementieren bei Profil-Aenderung
  profile_hash    text,                                    -- SHA-256 des Quell-Profils (Change-Detection)

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- HNSW-Index fuer schnelle approximate nearest-neighbour-Suche (cosine distance).
-- ef_construction=128: Bau-Qualitaet (hoeher = genauer, langsamer zu erstellen).
-- m=16: Anzahl Verbindungen pro Knoten (Standard-Empfehlung pgvector).
create index taste_embeddings_hnsw_idx
  on public.taste_embeddings
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 128);

create trigger trg_taste_embeddings_updated_at
  before update on public.taste_embeddings
  for each row execute function public.set_updated_at();

alter table public.taste_embeddings enable row level security;

-- Kunde liest nur sein eigenes Embedding (kein Schreibrecht: nur Backend erstellt Vektoren).
create policy "taste_embeddings_self_select"
  on public.taste_embeddings for select
  to authenticated
  using (customer_id = public.current_customer_id());

create policy "taste_embeddings_all_service"
  on public.taste_embeddings for all
  to service_role
  using (true) with check (true);
