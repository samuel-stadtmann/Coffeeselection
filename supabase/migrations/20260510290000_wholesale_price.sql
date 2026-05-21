-- ============================================================================
-- Roaster-Onboarding — Wholesale-Preis pro Coffee
--
-- Roester pflegen im Self-Service-Formular zwei Preise:
--   - price_chf            (Verkaufspreis an den Endkunden)
--   - wholesale_price_chf  (was Coffee Selection an den Roester zahlt) NEU
--
-- Bisher gab es wholesale_price_chf nur als Snapshot auf
-- order_items.wholesale_price_chf (per Order). Damit Reporting/Marge-
-- Berechnung schon vor der Bestellung moeglich ist, kommt das Feld jetzt
-- auch auf coffees.
--
-- RLS-Hinweis: wholesale_price_chf ist vertraulich. Es wird in keinem
-- public-Lese-Pfad (Frontend) ausgegeben. Nur Admin- und Roaster-Self-
-- Service-Pfade duerfen es lesen/schreiben.
-- ============================================================================

alter table public.coffees
  add column if not exists wholesale_price_chf numeric(10,2)
    check (wholesale_price_chf is null or wholesale_price_chf >= 0);

comment on column public.coffees.wholesale_price_chf is
  'Einkaufspreis: was Coffee Selection an den Roester pro Einheit (250 g default) zahlt. Vertraulich — nicht im Public-API-Pfad ausliefern.';
