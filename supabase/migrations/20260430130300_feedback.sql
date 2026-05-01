-- =============================================================================
-- Migration 008 — Feedback & KI-Signale
-- =============================================================================
-- Alles, was Kunden ueber Kaffees und Roester sagen — strukturiert, damit die
-- Empfehlungs-Engine daraus lernen kann.
--
--   * coffee_ratings           — Sterne-Bewertung pro Kaffee (1-5), 1 pro Kunde+Kaffee
--   * coffee_tasting_notes     — Detaillierte Verkostungs-Notizen (Aroma-Beschreibung)
--   * roaster_reviews          — Bewertung des Roesters (Service, Versand)
--   * recommendation_history   — Welche Empfehlung wurde gezeigt? Geklickt? Gekauft?
--   * feedback_events          — High-Frequency Event-Stream (bigserial PK)
--
-- Pattern: Ratings/Reviews sind Kunden-eigentum (RLS via current_customer_id),
-- recommendation_history und feedback_events sind primary read-only fuer Kunden,
-- write-only fuer Backend.
-- =============================================================================


-- 1) coffee_ratings -----------------------------------------------------------
-- Pro (Kunde, Kaffee) genau eine Bewertung — bei Re-Rating wird der Datensatz
-- geupdated, nicht dupliziert. Das ist die "Hauptquelle" fuer das Profil-Lernen.
create table public.coffee_ratings (
  id                      uuid primary key default gen_random_uuid(),
  customer_id             uuid not null references public.customers(id) on delete cascade,
  coffee_id               uuid not null references public.coffees(id) on delete cascade,

  -- Optional: aus welcher Bestellung stammt diese Bewertung?
  order_id                uuid references public.orders(id) on delete set null,

  -- Hauptbewertung (Pflicht)
  rating                  smallint not null check (rating between 1 and 5),

  -- Detail-Dimensionen (optional, 1-5)
  acidity_perceived       smallint check (acidity_perceived       is null or acidity_perceived       between 1 and 5),
  sweetness_perceived     smallint check (sweetness_perceived     is null or sweetness_perceived     between 1 and 5),
  bitterness_perceived    smallint check (bitterness_perceived    is null or bitterness_perceived    between 1 and 5),
  body_perceived          smallint check (body_perceived          is null or body_perceived          between 1 and 5),
  intensity_perceived     smallint check (intensity_perceived     is null or intensity_perceived     between 1 and 5),

  -- Verhaltens-Signal (Gold fuer ML)
  would_buy_again         boolean,                              -- NULL = noch nicht beantwortet

  -- Optionaler Freitext
  comment                 text,

  -- Wo wurde die Bewertung abgegeben?
  source                  text not null default 'web'
                          check (source in ('web','app','email','support')),

  -- Sichtbarkeit fuer andere Kunden? (Default: privat — fuer KI, nicht oeffentlich)
  is_public               boolean not null default false,

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  unique (customer_id, coffee_id)
);

create index coffee_ratings_customer_idx on public.coffee_ratings(customer_id, created_at desc);
create index coffee_ratings_coffee_idx   on public.coffee_ratings(coffee_id, rating desc);
create index coffee_ratings_public_idx
  on public.coffee_ratings(coffee_id, created_at desc) where is_public = true;
create index coffee_ratings_buy_again_idx
  on public.coffee_ratings(coffee_id) where would_buy_again = true;

create trigger trg_coffee_ratings_updated_at
  before update on public.coffee_ratings
  for each row execute function public.set_updated_at();

alter table public.coffee_ratings enable row level security;

-- Kunde liest und schreibt eigene Bewertungen.
create policy "coffee_ratings_self_all"
  on public.coffee_ratings for all
  to authenticated
  using (customer_id = public.current_customer_id())
  with check (customer_id = public.current_customer_id());

-- Oeffentliche Bewertungen sind fuer alle lesbar.
create policy "coffee_ratings_public_select"
  on public.coffee_ratings for select
  to anon, authenticated
  using (is_public = true);

create policy "coffee_ratings_all_service"
  on public.coffee_ratings for all
  to service_role
  using (true) with check (true);


-- 2) coffee_tasting_notes -----------------------------------------------------
-- Detaillierte Verkostungs-Notizen. Mehrere pro (Kunde, Kaffee) erlaubt
-- (z.B. unterschiedliche Bruehmethoden ergeben unterschiedliche Notizen).
create table public.coffee_tasting_notes (
  id                  uuid primary key default gen_random_uuid(),
  customer_id         uuid not null references public.customers(id) on delete cascade,
  coffee_id           uuid not null references public.coffees(id) on delete cascade,

  -- Optional: welche Brueh-Methode wurde verwendet?
  brewing_method_id   uuid references public.brewing_methods_catalog(id) on delete set null,

  -- Strukturierte Aroma-Wahrnehmungen (Array von flavor-slugs)
  detected_flavors    text[],                                  -- z.B. ['blueberry','dark_chocolate']

  -- Freitext-Notiz (Markdown ok)
  notes               text,

  -- Brueh-Parameter (optional, fuer fortgeschrittene Nutzer)
  dose_g              numeric(5,2) check (dose_g is null or dose_g > 0),
  yield_g             numeric(6,2) check (yield_g is null or yield_g > 0),
  brew_time_seconds   integer check (brew_time_seconds is null or brew_time_seconds > 0),
  water_temperature_c numeric(4,1) check (water_temperature_c is null or water_temperature_c between 0 and 100),
  grind_setting       text,                                    -- frei, da geraetespezifisch

  is_public           boolean not null default false,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index coffee_tasting_notes_customer_idx on public.coffee_tasting_notes(customer_id, created_at desc);
create index coffee_tasting_notes_coffee_idx   on public.coffee_tasting_notes(coffee_id);
create index coffee_tasting_notes_flavors_idx  on public.coffee_tasting_notes using gin(detected_flavors);

create trigger trg_coffee_tasting_notes_updated_at
  before update on public.coffee_tasting_notes
  for each row execute function public.set_updated_at();

alter table public.coffee_tasting_notes enable row level security;

create policy "coffee_tasting_notes_self_all"
  on public.coffee_tasting_notes for all
  to authenticated
  using (customer_id = public.current_customer_id())
  with check (customer_id = public.current_customer_id());

create policy "coffee_tasting_notes_public_select"
  on public.coffee_tasting_notes for select
  to anon, authenticated
  using (is_public = true);

create policy "coffee_tasting_notes_all_service"
  on public.coffee_tasting_notes for all
  to service_role
  using (true) with check (true);


-- 3) roaster_reviews ----------------------------------------------------------
-- Bewertung der Roesterei (Service, Verpackung, Versand) — getrennt vom Kaffee.
create table public.roaster_reviews (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid not null references public.customers(id) on delete cascade,
  roaster_id      uuid not null references public.roasters(id) on delete cascade,

  rating          smallint not null check (rating between 1 and 5),

  -- Detail-Dimensionen (optional)
  packaging       smallint check (packaging is null or packaging between 1 and 5),
  shipping_speed  smallint check (shipping_speed is null or shipping_speed between 1 and 5),
  freshness       smallint check (freshness is null or freshness between 1 and 5),

  comment         text,
  is_public       boolean not null default false,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (customer_id, roaster_id)
);

create index roaster_reviews_roaster_idx  on public.roaster_reviews(roaster_id, rating desc);
create index roaster_reviews_customer_idx on public.roaster_reviews(customer_id);
create index roaster_reviews_public_idx
  on public.roaster_reviews(roaster_id, created_at desc) where is_public = true;

create trigger trg_roaster_reviews_updated_at
  before update on public.roaster_reviews
  for each row execute function public.set_updated_at();

alter table public.roaster_reviews enable row level security;

create policy "roaster_reviews_self_all"
  on public.roaster_reviews for all
  to authenticated
  using (customer_id = public.current_customer_id())
  with check (customer_id = public.current_customer_id());

create policy "roaster_reviews_public_select"
  on public.roaster_reviews for select
  to anon, authenticated
  using (is_public = true);

create policy "roaster_reviews_all_service"
  on public.roaster_reviews for all
  to service_role
  using (true) with check (true);


-- 4) recommendation_history ---------------------------------------------------
-- Was hat die Empfehlungs-Engine gezeigt — und was hat der Kunde damit gemacht?
-- Wichtig fuer A/B-Tests und Modell-Evaluation.
create table public.recommendation_history (
  id                  uuid primary key default gen_random_uuid(),
  customer_id         uuid not null references public.customers(id) on delete cascade,
  coffee_id           uuid not null references public.coffees(id) on delete cascade,

  -- Welcher Algorithmus / welche Version?
  algorithm           text not null
                      check (algorithm in ('embedding_cosine','collaborative_filtering','editorial','hybrid','rule_based')),
  algorithm_version   text not null default 'v1',

  -- Ranking & Score
  rank                smallint not null check (rank > 0),       -- 1 = erste Empfehlung
  score               numeric(6,4) check (score is null or (score >= 0 and score <= 1)),

  -- Kontext: wo wurde die Empfehlung gezeigt?
  surface             text not null
                      check (surface in ('home','discovery_abo','email','quiz_result','similar_to','onboarding')),

  -- Funnel-Tracking
  shown_at            timestamptz not null default now(),
  clicked_at          timestamptz,
  added_to_cart_at    timestamptz,
  purchased_at        timestamptz,
  dismissed_at        timestamptz,                              -- Kunde hat "Nicht mein Geschmack" geklickt

  -- Optional: Gruende/Features (fuer Erklaerbarkeit)
  reasons             jsonb,                                    -- z.B. {"top_flavor":"blueberry","origin_match":true}

  created_at          timestamptz not null default now()
);

create index recommendation_history_customer_idx
  on public.recommendation_history(customer_id, shown_at desc);
create index recommendation_history_coffee_idx
  on public.recommendation_history(coffee_id);
create index recommendation_history_algo_idx
  on public.recommendation_history(algorithm, algorithm_version, shown_at desc);
create index recommendation_history_converted_idx
  on public.recommendation_history(customer_id) where purchased_at is not null;

alter table public.recommendation_history enable row level security;

-- Kunde sieht eigene Empfehlungs-Historie (read-only).
create policy "recommendation_history_self_select"
  on public.recommendation_history for select
  to authenticated
  using (customer_id = public.current_customer_id());

create policy "recommendation_history_all_service"
  on public.recommendation_history for all
  to service_role
  using (true) with check (true);


-- 5) feedback_events (high-frequency, bigserial) -----------------------------
-- Generisches Event-Log fuer alles, was schnell viele Zeilen erzeugen kann:
-- Klicks, Page-Views, Time-on-Page, Hover, Filter-Anwendungen, Quiz-Schritte.
-- bigserial PK statt UUID = kompakter, schneller, sequentiell beschreibbar.
create table public.feedback_events (
  id              bigserial primary key,
  customer_id     uuid references public.customers(id) on delete set null,
  -- customer_id NULLable: anonyme Events vor Login werden auch erfasst,
  -- spaeter via session_id aufgeloest

  session_id      text,                                        -- anonyme Session
  event_type      text not null
                  check (event_type in (
                    'page_view','click','add_to_cart','remove_from_cart',
                    'quiz_step','quiz_completed','filter_applied','search',
                    'recommendation_shown','recommendation_clicked','recommendation_dismissed',
                    'rating_given','review_submitted',
                    'subscription_paused','subscription_resumed','subscription_cancelled',
                    'email_opened','email_clicked',
                    'login','logout','signup',
                    'other'
                  )),

  -- Bezugs-Objekt (optional, polymorph)
  entity_type     text check (entity_type is null or entity_type in
                  ('coffee','roaster','order','subscription','recommendation','flavor_note','quiz')),
  entity_id       uuid,

  -- Freie Properties (z.B. {"page":"/coffees/abc","duration_ms":12300})
  properties      jsonb,

  -- Tech-Kontext
  user_agent      text,
  ip_address      inet,

  occurred_at     timestamptz not null default now()
);

create index feedback_events_customer_idx
  on public.feedback_events(customer_id, occurred_at desc) where customer_id is not null;
create index feedback_events_session_idx
  on public.feedback_events(session_id, occurred_at desc) where session_id is not null;
create index feedback_events_type_time_idx
  on public.feedback_events(event_type, occurred_at desc);
create index feedback_events_entity_idx
  on public.feedback_events(entity_type, entity_id) where entity_id is not null;
create index feedback_events_properties_idx
  on public.feedback_events using gin(properties);

alter table public.feedback_events enable row level security;

-- Kunde sieht nur eigene Events.
create policy "feedback_events_self_select"
  on public.feedback_events for select
  to authenticated
  using (customer_id = public.current_customer_id());

-- Authentifizierte Kunden duerfen eigene Events SCHREIBEN (Frontend-Tracking).
-- WICHTIG: with check stellt sicher, dass keiner Events fuer FREMDE Kunden anlegen kann.
create policy "feedback_events_self_insert"
  on public.feedback_events for insert
  to authenticated
  with check (
    customer_id is null                                    -- anonyme Events ok
    or customer_id = public.current_customer_id()          -- oder eigene Events
  );

-- Anon (nicht eingeloggt): darf anonyme Events schreiben (customer_id muss NULL sein).
create policy "feedback_events_anon_insert"
  on public.feedback_events for insert
  to anon
  with check (customer_id is null);

create policy "feedback_events_all_service"
  on public.feedback_events for all
  to service_role
  using (true) with check (true);
