-- ============================================================================
-- Migration: Kanonisiert Coffees-Spalten, die bisher nur in Code referenziert
-- waren (Edge Functions, Algorithmus, Forms) aber in keiner Migration explizit
-- angelegt wurden. Idempotent: IF NOT EXISTS verhindert Fehler falls die
-- Spalten schon ueber das Dashboard angelegt wurden.
-- Datum: 2026-05-12
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) flavor_description — narrativer Geschmacks-Text (algorithmus-relevant).
--    Wird von generate-coffee-embedding (Edge Function) und
--    build-customer-embedding (e3-Komponente) gelesen.
-- ----------------------------------------------------------------------------
alter table public.coffees
  add column if not exists flavor_description text;

comment on column public.coffees.flavor_description is
  'Narrative Geschmacks-Beschreibung. Wird vom Embedding-Generator '
  'als primaerer Text-Input verwendet. 2-4 Saetze, sensorisch '
  'beschreibend (NICHT Marketing-Floskeln).';

-- ----------------------------------------------------------------------------
-- 2) stock_kg — verfuegbare Lagermenge in kg.
--    Wird von get_eligible_coffees() als Hartfilter geprueft
--    (Coffees mit stock_kg < 0.25 werden ausgefiltert).
-- ----------------------------------------------------------------------------
alter table public.coffees
  add column if not exists stock_kg numeric(10,2)
    check (stock_kg is null or stock_kg >= 0);

comment on column public.coffees.stock_kg is
  'Verfuegbare Lagermenge in kg. NULL = unbekannt (Hartfilter zaehlt das '
  'als ausreichend Lager). < 0.25 = effektiv ausverkauft.';

-- ----------------------------------------------------------------------------
-- 3) wholesale_price_chf — Einkaufspreis vom Roester (Marge-Berechnung).
--    Wurde in 20260510290000_wholesale_price.sql bereits angelegt; hier
--    nochmals IF NOT EXISTS fuer den Fall einer DB ohne diese Migration.
-- ----------------------------------------------------------------------------
alter table public.coffees
  add column if not exists wholesale_price_chf numeric(10,2)
    check (wholesale_price_chf is null or wholesale_price_chf >= 0);

comment on column public.coffees.wholesale_price_chf is
  'Einkaufspreis: was Coffee Selection an den Roester pro Einheit zahlt. '
  'Vertraulich — niemals im Public-API-Pfad ausliefern.';

-- ----------------------------------------------------------------------------
-- 4) Index auf stock_kg-Filterung (haeufig in get_eligible_coffees gelesen).
-- ----------------------------------------------------------------------------
create index if not exists coffees_stock_kg_idx
  on public.coffees(stock_kg)
  where deleted_at is null and stock_kg is not null;
