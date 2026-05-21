-- ============================================================================
-- MANUELL AUSZUFÜHREN — NICHT Teil der automatischen Migrationskette
-- ============================================================================
-- HNSW-Index auf coffees.flavor_embedding (PRE_GO_LIVE P10).
--
-- WARUM nicht in supabase/migrations/:
--   Der Index-Build braucht mehr maintenance_work_mem als Supabase Free
--   bereitstellt (Default 32 MB → Build scheitert mit
--   "memory required is N MB, maintenance_work_mem is 32 MB"). Läge die Datei
--   in migrations/, würde `supabase db push` daran scheitern und die ganze
--   Kette blockieren. Deshalb manuell, bewusst, wenn die Voraussetzungen
--   stimmen.
--
-- WANN ausführen:
--   - Sobald der Katalog Richtung 300+ aktive Coffees geht, ODER
--   - die Latenz von rank_coffees_for_customer > ~200 ms steigt.
--   Bei < 300 Coffees ist der sequenzielle Scan ohnehin schneller — dann
--   NICHT anlegen.
--
-- VORAUSSETZUNG:
--   maintenance_work_mem muss für den Build hoch genug sein. Auf Supabase Free
--   ist das Session-SET unten nötig (und reicht evtl. nicht für sehr viele
--   Coffees). Sauberste Lösung: Supabase Pro, dann ist der Default höher.
--
-- AUSFÜHRUNG (Supabase SQL Editor, eine Session):
--   1. Den ganzen Block markieren und ausführen.
--   2. Danach prüfen: \d+ public.coffees  → Index muss gelistet sein.
--   3. EXPLAIN ANALYZE auf eine rank_coffees_for_customer-Query → der Plan
--      sollte den HNSW-Index statt Seq Scan nutzen.
-- ============================================================================

-- Nur für DIESE Session — hebt das Speicherlimit für den Index-Build an.
set maintenance_work_mem = '256MB';

-- Cosine-Distanz, weil flavor_embedding/taste_embedding L2-normalisiert sind
-- und das Ranking <=> (cosine) nutzt. m/ef_construction = pgvector-Defaults;
-- bei sehr grossem Katalog ef_construction hochsetzen (langsamerer Build,
-- bessere Recall).
create index concurrently if not exists coffees_flavor_embedding_hnsw_idx
  on public.coffees
  using hnsw (flavor_embedding vector_cosine_ops);

-- Hinweis: CREATE INDEX CONCURRENTLY darf NICHT in einer Transaktion laufen.
-- Im Supabase SQL Editor einzeln ausführen (nicht in einem BEGIN/COMMIT-Block).
