-- ============================================================================
-- PA-Loop1: Phase-A Embedding-Infrastruktur konsolidieren
--
-- Hintergrund:
--   Der Code (RPCs in 20260510170000, Edge Functions build-customer-embedding,
--   generate-coffee-embedding) referenziert drei Spalten + einen HNSW-Index
--   die in keiner Migration angelegt werden:
--
--     - customers.taste_embedding       vector(1536)
--     - coffees.flavor_embedding        vector(1536)
--     - taste_types.embedding_seed_text text
--     - HNSW-Index auf coffees.flavor_embedding
--
--   Vermutlich wurden sie historisch manuell in Supabase angelegt — was die
--   Migration-Pipeline brechen wuerde wenn ein neuer Branch oder eine neue
--   DB-Instanz aufgesetzt wird. Diese Migration ist idempotent (IF NOT EXISTS)
--   und macht den DB-State reproduzierbar.
--
--   Plus: embedding_seed_text wird aus den vorhandenen Marketing-Feldern
--   (tagline_de, hero_desc_de, aromas_de, Sensorik-Achsen) auto-generiert,
--   sodass die Cold-Start-Embeddings (siehe Playbook 5.5.3, e1-Komponente)
--   sofort funktionieren ohne dass der Roaster-Owner Text pflegen muss.
--
-- Datum: 2026-05-13
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) pgvector-Extension sicherstellen (falls fehlt)
-- ----------------------------------------------------------------------------
create extension if not exists vector;

-- ----------------------------------------------------------------------------
-- 2) Spalten anlegen — idempotent
-- ----------------------------------------------------------------------------
alter table public.customers
  add column if not exists taste_embedding vector(1536);

alter table public.coffees
  add column if not exists flavor_embedding vector(1536);

alter table public.taste_types
  add column if not exists embedding_seed_text text;

comment on column public.customers.taste_embedding is
  'OpenAI text-embedding-3-small (1536d) des Kunden-Geschmacksprofils. '
  'Wird von build-customer-embedding Edge Function geschrieben — nach Quiz '
  '(cold-start aus taste_type) und nach jeder neuen Bewertung (warm-start '
  'mit Top-Rated-Flavors). Wird im Recommender (rank_coffees_for_customer) '
  'gegen coffees.flavor_embedding via cosine-Distanz gematcht.';

comment on column public.coffees.flavor_embedding is
  'OpenAI text-embedding-3-small (1536d) des Coffee-Profils, generiert aus '
  'flavor_description + tasting_summary + aroma_families durch '
  'generate-coffee-embedding Edge Function. NULL bedeutet: Coffee ist '
  'noch nicht im Embedding-Match verfuegbar, faellt auf reine Sensorik-'
  'Distanz zurueck.';

comment on column public.taste_types.embedding_seed_text is
  'Domain-Text der den Geschmackstyp fuer OpenAI-Embedding beschreibt '
  '(siehe build-customer-embedding e1-Komponente). Auto-generiert aus '
  'tagline_de + hero_desc_de + aromas_de + Sensorik-Werten via UPDATE '
  'unten. Kann pro Typ manuell ueberschrieben werden wenn ein besseres '
  'Marketing-Text-Embedding gewuenscht ist.';

-- ----------------------------------------------------------------------------
-- 3) HNSW-Index auf coffees.flavor_embedding fuer Sub-100ms-Recommendations
-- ----------------------------------------------------------------------------
-- pgvector-HNSW-Defaults: m=16, ef_construction=64. Wir nehmen
-- ef_construction=128 fuer bessere Bau-Qualitaet (einmaliger Cost) und
-- m=16 fuer den Memory/Recall-Trade-off. cosine_ops weil unser
-- distance-Operator (<=>) cosine-Distanz erwartet.
create index if not exists coffees_flavor_embedding_hnsw_idx
  on public.coffees
  using hnsw (flavor_embedding vector_cosine_ops)
  with (m = 16, ef_construction = 128);

-- HNSW auf customers.taste_embedding ebenfalls — fuer Reklassifikations-
-- Centroids und type_centroids_mv-Refresh.
create index if not exists customers_taste_embedding_hnsw_idx
  on public.customers
  using hnsw (taste_embedding vector_cosine_ops)
  with (m = 16, ef_construction = 128);

-- ----------------------------------------------------------------------------
-- 4) taste_types.embedding_seed_text auto-seeden wenn leer
-- ----------------------------------------------------------------------------
-- Aus den vorhandenen Marketing-Feldern bauen wir einen ~200-300 Zeichen
-- langen domain-typischen Text. OpenAI text-embedding-3-small braucht
-- Substanz aber nicht Roman-Laenge.
--
-- Beispiel-Output:
--   "Geschmackstyp: Der Klassiker. Schokolade, Karamell, Nuss.
--   Ausgewogen, mittlere Saeure und Koerper, klassische Bohne fuer
--   den Espresso. Sensorik (1-5): Saeure 3, Koerper 4, Suesse 3,
--   Bitterkeit 3, Komplexitaet 3. Typische Aromen: chocolate, caramel,
--   nuts."
--
-- WHERE-Filter: nur befuellen wenn embedding_seed_text NULL UND
-- mindestens ein Sensorik-Wert gesetzt ist (sonst ist die Generierung
-- sinnlos).
update public.taste_types
set embedding_seed_text = format(
  'Geschmackstyp: %s. %s %s Sensorisches Profil (Skala 1-5): Saeure %s, Koerper %s, Suesse %s, Bitterkeit %s, Komplexitaet %s. Typische Aromen: %s.',
  coalesce(name_de, slug),
  coalesce(tagline_de, ''),
  coalesce(hero_desc_de, ''),
  acidity, body, sweetness, bitterness, complexity,
  coalesce(array_to_string(aromas_de, ', '), '')
)
where embedding_seed_text is null
  and acidity is not null;
