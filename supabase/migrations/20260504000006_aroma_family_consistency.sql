-- =============================================================================
-- Migration 016 — Aroma-Family-Konsistenz (Fix vor Ranking)
-- =============================================================================
-- Bug: aroma_families wurde an verschiedenen Stellen unterschiedlich befuellt.
--   * taste_types.aroma_families: deutsche Slugs ('schokoladig', 'fruchtig', ...)
--   * flavor_notes_catalog.family: englische Slugs ('chocolate', 'fruity', ...)
--   * Trigger sync_coffee_aroma_families: schrieb fnc.slug ('berry_blueberry')
--     statt fnc.family ('fruity')
--   * compute_coffee_quality_score: hardcoded 'erdig' (deutsch)
--
-- Fix: einheitlich auf flavor_notes_catalog.family-Werte (englisch) standardisieren.
-- Damit kann das Ranking (Schritt 9.8) Aroma-Overlap zwischen Kunde und Kaffee
-- ueber dieselben Werte berechnen.
--
-- Verfuegbare Familien (aus Migration 002 "catalogs"):
--   chocolate, fruity, nutty, sugary, floral, spicy, roasted, earthy
-- =============================================================================


-- =============================================================================
-- A) taste_types.aroma_families auf englische Familien-Slugs umstellen
-- =============================================================================
-- Mapping basiert auf den 7 SCA-naehen Aroma-Bereichen aus Playbook Kap. 2:
--   schokoladig/vollmilchschokolade -> chocolate
--   nussig                          -> nutty
--   karamellig/honigartig/vanille/toffee -> sugary
--   fruchtig/citrusartig/tropisch/exotisch/fermentiert/weinartig -> fruity
--   blumig/teeartig                 -> floral
--   erdig/holzig                    -> earthy
--   wuerzig                         -> spicy
--   tabakartig                      -> roasted

update public.taste_types set aroma_families = array['chocolate','nutty','sugary']
  where id = 1;  -- Klassiker

update public.taste_types set aroma_families = array['fruity','floral']
  where id = 2;  -- Fruchtfreund

update public.taste_types set aroma_families = array['chocolate','sugary','nutty']
  where id = 3;  -- Espresso-Enthusiast

update public.taste_types set aroma_families = array['fruity','spicy','floral']
  where id = 4;  -- Entdecker (exotisch/fermentiert/weinartig/tropisch -> fruity+spicy+floral)

update public.taste_types set aroma_families = array['nutty','sugary','chocolate']
  where id = 5;  -- Sanfte

update public.taste_types set aroma_families = array['floral','fruity']
  where id = 6;  -- Florale

update public.taste_types set aroma_families = array['earthy','spicy','roasted']
  where id = 7;  -- Erdige

update public.taste_types set aroma_families = array['sugary','chocolate']
  where id = 8;  -- Suesse


-- =============================================================================
-- B) Trigger sync_coffee_aroma_families: family statt slug
-- =============================================================================
-- Setzt coffees.aroma_families auf die distinct family-Werte aller verknuepften
-- flavor_notes — exakt die gleichen Werte wie taste_types.aroma_families.
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
    (select array_agg(distinct fnc.family order by fnc.family)
     from public.coffee_flavor_notes cfn
     join public.flavor_notes_catalog fnc on fnc.id = cfn.flavor_note_id
     where cfn.coffee_id = v_coffee_id
       and fnc.family is not null),
    '{}'
  )
  where c.id = v_coffee_id;

  return null;
end;
$$;


-- =============================================================================
-- C) Backfill bestehender coffees.aroma_families
-- =============================================================================
-- Falls Migration 011 schon ausgefuehrt wurde und coffees.aroma_families
-- bereits Slugs enthielt, ueberschreiben wir mit den richtigen family-Werten.
update public.coffees c
set aroma_families = coalesce(
  (select array_agg(distinct fnc.family order by fnc.family)
   from public.coffee_flavor_notes cfn
   join public.flavor_notes_catalog fnc on fnc.id = cfn.flavor_note_id
   where cfn.coffee_id = c.id
     and fnc.family is not null),
  '{}'
);


-- =============================================================================
-- D) compute_coffee_quality_score: 'erdig' -> 'earthy'
-- =============================================================================
create or replace function public.compute_coffee_quality_score()
returns trigger
language plpgsql
as $$
declare
  score integer := 0;
begin
  -- Basisfelder: 40 Punkte
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
  if new.roast_level is not null and new.bitterness is not null then
    if not (new.roast_level <= 2 and new.bitterness >= 4) then
      score := score + 5;
    end if;
  else
    score := score + 5;
  end if;

  if new.roast_level is not null and new.acidity is not null then
    if not (new.roast_level >= 4 and new.acidity = 5) then
      score := score + 5;
    end if;
  else
    score := score + 5;
  end if;

  -- 'earthy' (englisch) statt 'erdig' (deutsch)
  if new.roast_level is not null and new.aroma_families is not null then
    if not (new.roast_level = 1 and 'earthy' = any(new.aroma_families)) then
      score := score + 5;
    end if;
  else
    score := score + 5;
  end if;

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
