-- =============================================================================
-- Migration 001 — Extensions & Hilfsfunktionen
-- =============================================================================
-- Aktiviert die für das gesamte Coffee-Selection-Schema benoetigten Postgres-
-- Erweiterungen und definiert die generische Trigger-Funktion set_updated_at(),
-- die in jeder folgenden Migration verwendet wird, um die updated_at-Spalten
-- automatisch zu pflegen.
-- =============================================================================

-- 1) Erweiterungen ------------------------------------------------------------
-- pgcrypto: liefert gen_random_uuid() fuer UUID-Primaerschluessel.
-- citext:   case-insensitive Textspalten (z.B. E-Mail in der spaeteren Kunden-DB).
-- vector:   pgvector — wird in Phase 2 (Kunden-DB) fuer Geschmacks-Embeddings genutzt.
--           Hier bereits aktivieren, damit kuenftige Migrationen es vorfinden.
-- pg_trgm:  Trigram-Index fuer Fuzzy-Suche (z.B. "Aethipien" findet "Äthiopien").
create extension if not exists "pgcrypto";
create extension if not exists "citext";
create extension if not exists "vector";
create extension if not exists "pg_trgm";


-- 2) Hilfsfunktion: updated_at automatisch setzen -----------------------------
-- Wird in jeder Tabelle mit einer updated_at-Spalte als BEFORE-UPDATE-Trigger
-- registriert. Vorteil: keine Anwendungslogik kann das jemals "vergessen".
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'BEFORE-UPDATE-Trigger: setzt updated_at auf now(). In jeder Tabelle mit updated_at-Spalte registrieren.';
