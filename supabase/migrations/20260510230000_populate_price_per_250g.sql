-- ============================================================================
-- P9 / Hard-Filter Hygiene — coffees.price_per_250g aus price_chf + weight_g
-- ableiten wenn NULL.
--
-- get_eligible_coffees nutzt cf.price_per_250g fuer die Budget-Filter.
-- Bei den Demo-Coffees war die Spalte leer — der Filter
-- 'price_per_250g IS NULL OR ...' machte ihn zur No-Op und der Hartfilter
-- blieb wirkungslos.
--
-- Idempotent: betrifft nur Coffees die noch keinen Wert haben.
-- ============================================================================

update public.coffees
set price_per_250g = round(price_chf * 250.0 / nullif(weight_g, 0), 2)
where price_per_250g is null
  and weight_g is not null
  and weight_g > 0
  and price_chf is not null;
