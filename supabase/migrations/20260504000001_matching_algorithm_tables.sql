-- =============================================================================
-- Migration 011 — Matching-Algorithmus v1.0  (Schritt 9.2 / Playbook)
-- Logischer Name: 001_matching_algorithm_tables.sql
-- =============================================================================
-- Legt alle Tabellen für den Matching-Algorithmus v1.0 an gemaess
-- "Coffee_Selection_Matching_Algorithmus_Playbook" (Kapitel 3, 4, 5, 6, 8, 9.2).
--
-- Erstellt:
--   * taste_types                   — die 8 Geschmackstypen (Kap. 2)
--   * quiz_questions/options/scoring/responses/answers — Quiz-Modell (Kap. 3.5)
--   * taste_type_max_scores         — Cache der Maxima (Kap. 4.4)
--   * algorithm_config              — Gewichte und Lernraten (Kap. 1.1, 5.6, 6.3)
--   * customer_aroma_preferences    — Tag-Sentiment fuer Lernen (Kap. 6.4)
--   * coffee_allergens              — Allergen-Verknuepfung (Kap. 5.2)
--   * recommendation_snapshots      — Empfehlungs-Historie + Reserveliste (Kap. 7.5)
--   * test_quiz_profiles            — goldene Test-Profile (Kap. 4.9)
--
-- Erweitert:
--   * coffees       — Geschmacks-Dimensionen, Embedding, Qualitaets-Felder
--   * customers     — Geschmackstyp, Embedding, Restriktionen, Lern-Zaehler
--   * coffee_ratings — Tags, would_drink_again, processed_at fuer Lern-Worker
--
-- Konflikt-Aufloesung:
--   * coffees.roast_level (text) -> roast_level_text (umbenannt)
--     plus neue Spalte coffees.roast_level (smallint 1-5) gemaess Playbook,
--     mit automatischem Backfill-Mapping
--   * coffees.aroma_families (text[]) parallel zu coffee_flavor_notes (n:m);
--     beide werden synchron gehalten via Trigger
--   * Bestehende public.taste_quiz_responses bleibt unangetastet
--     (wird nicht mehr verwendet, aber nicht geloescht — Daten-Sicherheit)
-- =============================================================================


-- =============================================================================
-- Teil A — Konfigurations-Tabellen
-- =============================================================================

-- A.1) taste_types (Kap. 2.2 + 2.3) ------------------------------------------
-- Die 8 Geschmackstypen mit Ideal-Profilen ueber 7 Dimensionen.
create table public.taste_types (
  id                  smallint primary key,
  slug                text unique not null,                       -- 'classic','fruity', ...
  name_de             text not null,
  name_internal       text not null,
  description_de      text not null,

  -- Ideal-Profil (1-5 pro numerischer Dimension)
  acidity             smallint not null check (acidity     between 1 and 5),
  body                smallint not null check (body        between 1 and 5),
  sweetness           smallint not null check (sweetness   between 1 and 5),
  bitterness          smallint not null check (bitterness  between 1 and 5),
  roast_level         smallint not null check (roast_level between 1 and 5),
  complexity          smallint not null check (complexity  between 1 and 5),

  -- Aroma-Familien als Array (kategorisch, kein numerischer Wert)
  aroma_families      text[]   not null,

  -- Seed-Text fuer Embedding-Generierung (Kap. 5.5.3)
  embedding_seed_text text     not null,

  -- Geschaetzter Marktanteil (Kap. 2.2)
  market_share_pct    numeric(4,1),

  active              boolean  not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger trg_taste_types_updated_at
  before update on public.taste_types
  for each row execute function public.set_updated_at();

alter table public.taste_types enable row level security;

create policy "taste_types_read_all"
  on public.taste_types for select
  to anon, authenticated
  using (active = true);

create policy "taste_types_all_service"
  on public.taste_types for all
  to service_role
  using (true) with check (true);


-- A.2) algorithm_config (Kap. 1.1, 5.6, 6.3) ---------------------------------
-- Gewichte und Konstanten des Algorithmus — niemals im Code hardcoden!
create table public.algorithm_config (
  key             text primary key,
  value_numeric   numeric,
  value_text      text,
  description     text not null,
  updated_at      timestamptz not null default now()
);

create trigger trg_algorithm_config_updated_at
  before update on public.algorithm_config
  for each row execute function public.set_updated_at();

alter table public.algorithm_config enable row level security;

create policy "algorithm_config_read_authenticated"
  on public.algorithm_config for select
  to authenticated
  using (true);

create policy "algorithm_config_all_service"
  on public.algorithm_config for all
  to service_role
  using (true) with check (true);


-- =============================================================================
-- Teil B — Quiz-Konfiguration (Kap. 3.5)
-- =============================================================================

-- B.1) quiz_questions --------------------------------------------------------
create table public.quiz_questions (
  question_code   text primary key,                       -- z.B. 'Q1_brewing_method'
  block           char(1) not null check (block in ('A','B','C','D')),
  position        integer not null,
  text_de         text not null,
  text_en         text,
  is_active       boolean not null default true,
  version         text not null default 'v1.0',
  created_at      timestamptz not null default now()
);

create unique index quiz_questions_position_idx
  on public.quiz_questions(version, position) where is_active = true;

alter table public.quiz_questions enable row level security;

create policy "quiz_questions_read_all"
  on public.quiz_questions for select
  to anon, authenticated
  using (is_active = true);

create policy "quiz_questions_all_service"
  on public.quiz_questions for all
  to service_role
  using (true) with check (true);


-- B.2) quiz_options ----------------------------------------------------------
create table public.quiz_options (
  id              uuid primary key default gen_random_uuid(),
  question_code   text not null references public.quiz_questions(question_code) on delete cascade,
  answer_code     text not null,                          -- z.B. 'A_espresso'
  text_de         text not null,
  text_en         text,
  position        integer not null,
  is_active       boolean not null default true,
  unique(question_code, answer_code)
);

create index quiz_options_question_idx on public.quiz_options(question_code, position);

alter table public.quiz_options enable row level security;

create policy "quiz_options_read_all"
  on public.quiz_options for select
  to anon, authenticated
  using (is_active = true);

create policy "quiz_options_all_service"
  on public.quiz_options for all
  to service_role
  using (true) with check (true);


-- B.3) quiz_scoring (DAS HERZSTUECK — Kap. 3.2) ------------------------------
-- Mapping Antwort -> Punkte fuer einen bestimmten Typ.
create table public.quiz_scoring (
  id              uuid primary key default gen_random_uuid(),
  question_code   text not null,
  answer_code     text not null,
  taste_type_id   smallint not null references public.taste_types(id) on delete cascade,
  points          integer not null check (points >= 0 and points <= 10),
  unique(question_code, answer_code, taste_type_id),
  foreign key (question_code, answer_code)
    references public.quiz_options(question_code, answer_code) on delete cascade
);

create index quiz_scoring_lookup_idx on public.quiz_scoring(question_code, answer_code);
create index quiz_scoring_type_idx   on public.quiz_scoring(taste_type_id);

alter table public.quiz_scoring enable row level security;

create policy "quiz_scoring_read_authenticated"
  on public.quiz_scoring for select
  to authenticated
  using (true);

create policy "quiz_scoring_all_service"
  on public.quiz_scoring for all
  to service_role
  using (true) with check (true);


-- B.4) taste_type_max_scores (Kap. 4.4 — Cache) ------------------------------
create table public.taste_type_max_scores (
  taste_type_id   smallint primary key references public.taste_types(id) on delete cascade,
  max_score       integer not null check (max_score > 0),
  computed_at     timestamptz not null default now(),
  quiz_version    text not null default 'v1.0'
);

alter table public.taste_type_max_scores enable row level security;

create policy "taste_type_max_scores_read_authenticated"
  on public.taste_type_max_scores for select
  to authenticated
  using (true);

create policy "taste_type_max_scores_all_service"
  on public.taste_type_max_scores for all
  to service_role
  using (true) with check (true);


-- =============================================================================
-- Teil C — Quiz-Antworten (pro Kunde)
-- =============================================================================

-- C.1) quiz_responses (Header — Kap. 3.5) ------------------------------------
-- Eine Zeile pro Quiz-Durchgang. Bei Re-Quiz neue Zeile, alte mit is_active=false.
create table public.quiz_responses (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid not null references public.customers(id) on delete cascade,

  started_at      timestamptz not null default now(),
  completed_at    timestamptz,                                   -- NULL = abgebrochen

  -- Resultate der Klassifikation (gefuellt via classify_taste_type())
  taste_type_id     smallint references public.taste_types(id),
  secondary_type    smallint references public.taste_types(id),
  confidence        numeric(4,3) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  primary_score     numeric(5,1),                                -- 0-100
  secondary_score   numeric(5,1),

  is_active         boolean not null default true,               -- nur eine pro Kunde aktiv
  version           text not null default 'v1.0',

  created_at        timestamptz not null default now()
);

-- Maximal eine aktive Quiz-Response pro Kunde (Partial Unique Index)
create unique index quiz_responses_one_active_per_customer
  on public.quiz_responses(customer_id) where is_active = true;

create index quiz_responses_customer_idx on public.quiz_responses(customer_id, created_at desc);
create index quiz_responses_type_idx     on public.quiz_responses(taste_type_id) where is_active = true;

alter table public.quiz_responses enable row level security;

create policy "quiz_responses_self_select"
  on public.quiz_responses for select
  to authenticated
  using (customer_id = public.current_customer_id());

create policy "quiz_responses_all_service"
  on public.quiz_responses for all
  to service_role
  using (true) with check (true);


-- C.2) quiz_answers (Detail) --------------------------------------------------
create table public.quiz_answers (
  id              uuid primary key default gen_random_uuid(),
  response_id     uuid not null references public.quiz_responses(id) on delete cascade,
  question_code   text not null references public.quiz_questions(question_code) on delete restrict,
  answer_code     text not null,
  is_imputed      boolean not null default false,                -- Kap. 7.4
  answered_at     timestamptz not null default now(),

  unique(response_id, question_code),                            -- pro Frage 1 Antwort
  foreign key (question_code, answer_code)
    references public.quiz_options(question_code, answer_code) on delete restrict
);

create index quiz_answers_response_idx on public.quiz_answers(response_id);

alter table public.quiz_answers enable row level security;

create policy "quiz_answers_self_select"
  on public.quiz_answers for select
  to authenticated
  using (response_id in (
    select id from public.quiz_responses where customer_id = public.current_customer_id()
  ));

create policy "quiz_answers_all_service"
  on public.quiz_answers for all
  to service_role
  using (true) with check (true);


-- =============================================================================
-- Teil D — Erweiterungen an coffees (Kap. 8.1)
-- =============================================================================

-- D.1) Roast-Level umbenennen + neue numerische Spalte ------------------------
alter table public.coffees rename column roast_level to roast_level_text;

alter table public.coffees
  add column roast_level smallint check (roast_level is null or roast_level between 1 and 5);

-- Backfill: text -> int gemaess Playbook-Mapping
update public.coffees set roast_level = case roast_level_text
  when 'light'        then 1
  when 'medium_light' then 2
  when 'medium'       then 3
  when 'medium_dark'  then 4
  when 'dark'         then 5
end;

-- Nach Backfill NOT NULL setzen (es darf keine NULL geben, da roast_level_text NOT NULL war)
alter table public.coffees alter column roast_level set not null;


-- D.2) Geschmacks-Dimensionen (1-5) — Pflicht fuer Algorithmus ---------------
-- NULL erlaubt, weil bestehende Datensaetze diese Werte noch nicht haben.
-- Erst ab data_quality_score >= 75 wird ein Kaffee aktiv im Ranking genutzt.
alter table public.coffees
  add column acidity      smallint check (acidity      is null or acidity      between 1 and 5),
  add column body         smallint check (body         is null or body         between 1 and 5),
  add column sweetness    smallint check (sweetness    is null or sweetness    between 1 and 5),
  add column bitterness   smallint check (bitterness   is null or bitterness   between 1 and 5),
  add column complexity   smallint check (complexity   is null or complexity   between 1 and 5);

-- Aroma-Familien als Array (parallel zu coffee_flavor_notes n:m)
alter table public.coffees
  add column aroma_families text[] not null default '{}';

-- Freitext fuer Embedding-Generierung
alter table public.coffees
  add column flavor_description text;

-- Vector-Embedding (1536 Dim — text-embedding-3-small)
alter table public.coffees
  add column flavor_embedding vector(1536);


-- D.3) Filter-Felder (Kap. 5.2) ----------------------------------------------
alter table public.coffees
  add column is_organic       boolean not null default false,
  add column is_direct_trade  boolean not null default false;

-- Lagerbestand und Preis pro 250g (zusaetzlich zu bestehendem price_chf/weight_g)
alter table public.coffees
  add column stock_kg         numeric(8,2) not null default 0 check (stock_kg >= 0),
  add column price_per_250g   numeric(6,2) check (price_per_250g is null or price_per_250g >= 0);

-- Backfill price_per_250g aus price_chf/weight_g
update public.coffees
  set price_per_250g = round(price_chf::numeric * 250.0 / nullif(weight_g, 0), 2)
  where price_per_250g is null;


-- D.4) Qualitaets-Felder (Kap. 8.2) ------------------------------------------
alter table public.coffees
  add column data_quality_score smallint check (data_quality_score is null or data_quality_score between 0 and 100),
  add column cupping_score      numeric(4,2) check (cupping_score is null or (cupping_score >= 0 and cupping_score <= 100)),
  add column data_verified_by   uuid references auth.users(id) on delete set null,
  add column data_verified_at   timestamptz;


-- D.5) Indizes fuer Algorithmus-Phasen ---------------------------------------
create index coffees_dimensions_idx on public.coffees(roast_level, acidity, body)
  where deleted_at is null and status = 'active';

create index coffees_aroma_families_idx on public.coffees using gin(aroma_families);

create index coffees_filter_flags_idx on public.coffees(is_decaf, is_organic, is_direct_trade)
  where deleted_at is null;

create index coffees_stock_idx on public.coffees(stock_kg) where stock_kg > 0;

create index coffees_quality_active_idx on public.coffees(data_quality_score)
  where status = 'active' and deleted_at is null;

-- IVFFlat-Index fuer Vector-Cosine-Similarity (lists=100 Standard fuer < 1M Zeilen)
create index coffees_flavor_embedding_idx on public.coffees
  using ivfflat (flavor_embedding vector_cosine_ops) with (lists = 100);


-- =============================================================================
-- Teil E — coffee_allergens (Kap. 5.2)
-- =============================================================================
create table public.coffee_allergens (
  coffee_id   uuid not null references public.coffees(id) on delete cascade,
  allergen    text not null
              check (allergen in (
                'milk','soy','tree_nuts','peanut','gluten','sulfites',
                'sesame','egg','fish','shellfish','other'
              )),
  notes       text,
  created_at  timestamptz not null default now(),
  primary key (coffee_id, allergen)
);

create index coffee_allergens_allergen_idx on public.coffee_allergens(allergen);

alter table public.coffee_allergens enable row level security;

create policy "coffee_allergens_read_all"
  on public.coffee_allergens for select
  to anon, authenticated
  using (true);

create policy "coffee_allergens_all_service"
  on public.coffee_allergens for all
  to service_role
  using (true) with check (true);


-- =============================================================================
-- Teil F — Erweiterungen an customers (Kap. 4 + 5 + 6)
-- =============================================================================

-- F.1) Geschmackstyp-Felder (aus aktuellster quiz_response)
alter table public.customers
  add column taste_type_id     smallint references public.taste_types(id) on delete set null,
  add column secondary_type    smallint references public.taste_types(id) on delete set null,
  add column confidence        numeric(4,3) check (confidence is null or (confidence >= 0 and confidence <= 1));


-- F.2) Embedding (1536 Dim)
alter table public.customers
  add column taste_embedding   vector(1536);


-- F.3) Lern-Statistik
alter table public.customers
  add column num_ratings_given        integer not null default 0 check (num_ratings_given >= 0),
  add column profile_last_updated_at  timestamptz,
  add column reclassification_suggested_at   timestamptz,
  add column reclassification_suggested_type smallint references public.taste_types(id) on delete set null;


-- F.4) Restriktionen (Hartfilter-Inputs Kap. 5.2)
alter table public.customers
  add column requires_decaf         boolean not null default false,
  add column requires_organic       boolean not null default false,
  add column requires_direct_trade  boolean not null default false,
  add column max_price_per_250g     numeric(6,2) check (max_price_per_250g is null or max_price_per_250g > 0);


-- F.5) Indizes
create index customers_taste_type_idx on public.customers(taste_type_id) where deleted_at is null;

create index customers_taste_embedding_idx on public.customers
  using ivfflat (taste_embedding vector_cosine_ops) with (lists = 100);


-- =============================================================================
-- Teil G — Erweiterungen an coffee_ratings (Kap. 6.1 + 6.7)
-- =============================================================================
alter table public.coffee_ratings
  add column would_drink_again text check (would_drink_again is null or would_drink_again in ('yes','no','maybe')),
  add column positive_tags     text[] not null default '{}',
  add column negative_tags     text[] not null default '{}',
  add column processed_at      timestamptz;                      -- gesetzt vom Lern-Worker

-- Index fuer Lern-Worker (alle unverarbeiteten Bewertungen)
create index coffee_ratings_unprocessed_idx
  on public.coffee_ratings(created_at) where processed_at is null;


-- =============================================================================
-- Teil H — customer_aroma_preferences (Kap. 6.4)
-- =============================================================================
create table public.customer_aroma_preferences (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid not null references public.customers(id) on delete cascade,
  aroma_tag       text not null,                                -- z.B. 'schokolade','beeren'
  sentiment       numeric(3,2) not null check (sentiment >= -1 and sentiment <= 1),
  count           integer not null default 1 check (count >= 1),
  last_seen_at    timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(customer_id, aroma_tag)
);

create index customer_aroma_preferences_customer_idx on public.customer_aroma_preferences(customer_id);
create index customer_aroma_preferences_positive_idx
  on public.customer_aroma_preferences(customer_id, sentiment desc) where sentiment > 0;

create trigger trg_customer_aroma_preferences_updated_at
  before update on public.customer_aroma_preferences
  for each row execute function public.set_updated_at();

alter table public.customer_aroma_preferences enable row level security;

create policy "customer_aroma_preferences_self_select"
  on public.customer_aroma_preferences for select
  to authenticated
  using (customer_id = public.current_customer_id());

create policy "customer_aroma_preferences_all_service"
  on public.customer_aroma_preferences for all
  to service_role
  using (true) with check (true);


-- =============================================================================
-- Teil I — recommendation_snapshots (Kap. 7.5)
-- =============================================================================
-- Persistente Empfehlungsliste mit Reserve-Optionen (Top 3 fuer Discovery,
-- Top 1 + Reserve fuer Fix). Wird vor jeder Lieferung berechnet und gespeichert.
create table public.recommendation_snapshots (
  id                uuid primary key default gen_random_uuid(),
  customer_id       uuid not null references public.customers(id) on delete cascade,
  subscription_id   uuid references public.subscriptions(id) on delete set null,

  computed_at       timestamptz not null default now(),
  delivery_slot     date not null,                              -- geplantes Lieferdatum

  -- Array von {rank, coffee_id, score, scoring_score, vector_sim, explanation}
  recommendations   jsonb not null,

  -- Welcher Rank wurde final gewaehlt (1, 2 oder 3)? NULL = noch nicht entschieden
  selected_rank     smallint check (selected_rank is null or selected_rank between 1 and 3),
  selected_coffee_id uuid references public.coffees(id) on delete set null,

  -- Falls Fallback aktiv: warum?
  override_reason   text,                                       -- 'roaster_cooldown_relaxed', etc.

  -- Algorithmus-Version (fuer A/B-Tests, Kap. 10.5)
  algorithm_version text not null default 'v1.0',

  is_processed      boolean not null default false,
  created_at        timestamptz not null default now()
);

create index recommendation_snapshots_customer_idx
  on public.recommendation_snapshots(customer_id, computed_at desc);

create index recommendation_snapshots_pending_idx
  on public.recommendation_snapshots(delivery_slot) where is_processed = false;

create index recommendation_snapshots_version_idx
  on public.recommendation_snapshots(algorithm_version, computed_at desc);

alter table public.recommendation_snapshots enable row level security;

create policy "recommendation_snapshots_self_select"
  on public.recommendation_snapshots for select
  to authenticated
  using (customer_id = public.current_customer_id());

create policy "recommendation_snapshots_all_service"
  on public.recommendation_snapshots for all
  to service_role
  using (true) with check (true);


-- =============================================================================
-- Teil J — test_quiz_profiles (Kap. 4.9)
-- =============================================================================
-- Goldene Test-Profile, die nach jedem Algorithmus-Update durchlaufen muessen.
create table public.test_quiz_profiles (
  id                      uuid primary key default gen_random_uuid(),
  profile_name            text unique not null,
  description             text,
  expected_type           smallint not null references public.taste_types(id) on delete cascade,
  expected_min_confidence numeric(4,3) not null
                          check (expected_min_confidence >= 0 and expected_min_confidence <= 1),
  -- Array von {q: question_code, a: answer_code}
  answers                 jsonb not null,
  is_active               boolean not null default true,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create trigger trg_test_quiz_profiles_updated_at
  before update on public.test_quiz_profiles
  for each row execute function public.set_updated_at();

alter table public.test_quiz_profiles enable row level security;

-- Nur service_role darf lesen/schreiben (interne Test-Daten)
create policy "test_quiz_profiles_all_service"
  on public.test_quiz_profiles for all
  to service_role
  using (true) with check (true);


-- =============================================================================
-- Teil K — Trigger: Daten-Qualitaetsscore fuer coffees (Kap. 8.2)
-- =============================================================================
create or replace function public.compute_coffee_quality_score()
returns trigger
language plpgsql
as $$
declare
  score integer := 0;
begin
  -- Basisfelder: 40 Punkte (5 pro vorhandenes Pflichtfeld)
  if new.acidity            is not null then score := score + 5; end if;
  if new.body               is not null then score := score + 5; end if;
  if new.sweetness          is not null then score := score + 5; end if;
  if new.bitterness         is not null then score := score + 5; end if;
  if new.roast_level        is not null then score := score + 5; end if;
  if new.complexity         is not null then score := score + 5; end if;
  if array_length(new.aroma_families, 1) >= 1 then score := score + 5; end if;
  if new.flavor_description is not null
     and length(new.flavor_description) >= 50 then score := score + 5; end if;

  -- Herkunft & Verarbeitung: 20 Punkte
  if new.origin_id            is not null then score := score + 5; end if;
  if new.region               is not null then score := score + 5; end if;
  if new.processing_method_id is not null then score := score + 5; end if;
  if new.variety_id           is not null then score := score + 5; end if;

  -- Konsistenzpruefungen: 20 Punkte
  -- Helle Roestung sollte keine hohe Bitterkeit haben
  if new.roast_level is not null and new.bitterness is not null then
    if not (new.roast_level <= 2 and new.bitterness >= 4) then
      score := score + 5;
    end if;
  else
    score := score + 5;
  end if;

  -- Dunkle Roestung sollte keine sehr hohe Saeure haben
  if new.roast_level is not null and new.acidity is not null then
    if not (new.roast_level >= 4 and new.acidity = 5) then
      score := score + 5;
    end if;
  else
    score := score + 5;
  end if;

  -- Helle Roestung passt nicht zu 'erdig'
  if new.roast_level is not null and new.aroma_families is not null then
    if not (new.roast_level = 1 and 'erdig' = any(new.aroma_families)) then
      score := score + 5;
    end if;
  else
    score := score + 5;
  end if;

  -- Decaf sollte typischerweise nicht hoechste Bitterkeit haben
  if new.is_decaf is not null and new.bitterness is not null then
    if not (new.is_decaf = true and new.bitterness = 5) then
      score := score + 5;
    end if;
  else
    score := score + 5;
  end if;

  -- Optionale Qualitaets-Boni: 20 Punkte
  if new.altitude_m_min   is not null then score := score + 5; end if;
  if new.harvest_year     is not null then score := score + 5; end if;
  if new.cupping_score    is not null and new.cupping_score >= 80 then score := score + 5; end if;
  if new.flavor_embedding is not null then score := score + 5; end if;

  new.data_quality_score := score;
  return new;
end;
$$;

create trigger trg_coffee_quality_score
  before insert or update on public.coffees
  for each row execute function public.compute_coffee_quality_score();

comment on function public.compute_coffee_quality_score() is
  'Berechnet data_quality_score (0-100) bei jedem INSERT/UPDATE auf coffees. '
  'Ab Score >= 75 wird der Kaffee fuer Empfehlungen freigegeben (Kap. 8.2).';


-- =============================================================================
-- Teil L — Trigger: aroma_families synchron zu coffee_flavor_notes halten
-- =============================================================================
-- Wenn ein Eintrag in coffee_flavor_notes geaendert wird, aktualisieren wir
-- automatisch das aroma_families-Array auf coffees. Damit haben wir die
-- detaillierte n:m-Quelle UND das fuer den Algorithmus benoetigte Array.
create or replace function public.sync_coffee_aroma_families()
returns trigger
language plpgsql
as $$
declare
  v_coffee_id uuid;
begin
  v_coffee_id := coalesce(new.coffee_id, old.coffee_id);

  update public.coffees c
  set aroma_families = coalesce(
    (select array_agg(distinct fnc.slug order by fnc.slug)
     from public.coffee_flavor_notes cfn
     join public.flavor_notes_catalog fnc on fnc.id = cfn.flavor_note_id
     where cfn.coffee_id = v_coffee_id),
    '{}'
  )
  where c.id = v_coffee_id;

  return null;
end;
$$;

create trigger trg_sync_aroma_families_on_flavor_notes
  after insert or update or delete on public.coffee_flavor_notes
  for each row execute function public.sync_coffee_aroma_families();


-- =============================================================================
-- Hinweis: Seed-Daten (8 Typen, 12 Fragen, Scoring) folgen in Migration 002.
-- Hinweis: classify_taste_type() folgt in Migration 003 (Schritt 9.5).
-- Hinweis: rank_coffees_for_customer() folgt in Migration 004 (Schritt 9.8).
-- =============================================================================
