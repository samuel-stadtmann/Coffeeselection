-- =============================================================================
-- example_queries.sql — Haeufig benoetigte Queries fuer die Coffee-DB
-- =============================================================================
-- Zum Lernen: kopier eine Query in den Supabase SQL Editor und drueck Run.
-- Aendere Werte (z.B. den slug), um andere Roester/Kaffees abzufragen.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Q1) Alle Kaffees eines bestimmten Roesters
-- -----------------------------------------------------------------------------
-- Ersetze 'atelier-espresso' durch einen anderen Roester-slug.
-- 'deleted_at is null' filtert Soft-Deletes raus.
-- 'status = active' zeigt nur veroeffentlichte Kaffees.
select
  c.name        as kaffee,
  c.roast_level,
  c.price_chf,
  c.stock_status,
  o.name_de     as herkunft
from public.coffees c
join public.roasters r on r.id = c.roaster_id
left join public.origins_catalog o on o.id = c.origin_id
where r.slug = 'atelier-espresso'
  and c.deleted_at is null
  and c.status = 'active'
order by c.name;


-- -----------------------------------------------------------------------------
-- Q2) Alle Kaffees mit einem bestimmten Aroma (z.B. Schokolade)
-- -----------------------------------------------------------------------------
-- 'family = chocolate' wuerde alle Schoki-Aromen zusammenfassen.
-- Alternativ: einzelnes Aroma per slug ('choco_dark', 'choco_milk' etc.)
select
  c.name              as kaffee,
  r.name              as roester,
  c.roast_level,
  cfn.intensity       as aroma_intensitaet,
  f.name_de           as aroma
from public.coffees c
join public.roasters r            on r.id = c.roaster_id
join public.coffee_flavor_notes cfn on cfn.coffee_id = c.id
join public.flavor_notes_catalog f  on f.id = cfn.flavor_note_id
where f.family = 'chocolate'
  and c.deleted_at is null
  and c.status = 'active'
order by cfn.intensity desc, c.name;


-- -----------------------------------------------------------------------------
-- Q3) Top-bewertete Kaffees nach Herkunftsland (SCA-Score)
-- -----------------------------------------------------------------------------
-- 'where sca_score >= 87' filtert auf Specialty-Niveau.
-- Zeigt Land + Kaffee + Score.
select
  o.name_de       as herkunft,
  c.name          as kaffee,
  r.name          as roester,
  c.sca_score,
  c.roast_level,
  c.price_chf
from public.coffees c
join public.roasters r        on r.id = c.roaster_id
join public.origins_catalog o on o.id = c.origin_id
where c.sca_score is not null
  and c.deleted_at is null
  and c.status = 'active'
order by o.name_de, c.sca_score desc;


-- -----------------------------------------------------------------------------
-- Q4) Alle Kaffees, die fuer eine bestimmte Bruehmethode empfohlen sind
-- -----------------------------------------------------------------------------
-- Beispiel: alle V60-tauglichen, nur die explizit empfohlenen
select
  c.name           as kaffee,
  r.name           as roester,
  c.roast_level,
  c.roast_profile,
  c.price_chf
from public.coffees c
join public.roasters r              on r.id = c.roaster_id
join public.coffee_brewing_methods cbm on cbm.coffee_id = c.id
join public.brewing_methods_catalog b  on b.id = cbm.brewing_method_id
where b.slug = 'v60'
  and cbm.is_recommended = true
  and c.deleted_at is null
  and c.status = 'active'
order by c.sca_score desc nulls last, c.name;


-- -----------------------------------------------------------------------------
-- Q5) Vollstaendige Detailansicht eines Kaffees (alles was die Detailseite braucht)
-- -----------------------------------------------------------------------------
-- Aggregiert alle n:m-Verbindungen als Komma-Listen — eine einzige Zeile pro Kaffee.
select
  c.id,
  c.slug,
  c.name,
  c.short_description,
  c.description,
  c.tasting_summary,
  c.roast_level,
  c.roast_profile,
  c.price_chf,
  c.weight_g,
  c.stock_status,
  c.image_url,
  -- Roester
  r.name                  as roester_name,
  r.city                  as roester_stadt,
  r.website_url           as roester_website,
  -- Herkunft
  o.name_de               as herkunft_land,
  c.region                as herkunft_region,
  c.farm                  as herkunft_farm,
  v.name                  as varietaet,
  pm.name_de              as aufbereitung,
  c.altitude_m_min        as hoehe_min,
  c.altitude_m_max        as hoehe_max,
  c.harvest_year          as erntejahr,
  c.sca_score,
  -- Junctions (als Komma-Listen)
  (select string_agg(f.name_de, ', ' order by cfn.sort_order)
     from public.coffee_flavor_notes cfn
     join public.flavor_notes_catalog f on f.id = cfn.flavor_note_id
    where cfn.coffee_id = c.id)         as aromen,
  (select string_agg(b.name_de, ', ' order by b.sort_order)
     from public.coffee_brewing_methods cbm
     join public.brewing_methods_catalog b on b.id = cbm.brewing_method_id
    where cbm.coffee_id = c.id and cbm.is_recommended) as bruehmethoden,
  (select string_agg(ce.name, ', ')
     from public.coffee_certifications cc
     join public.certifications_catalog ce on ce.id = cc.certification_id
    where cc.coffee_id = c.id)          as zertifikate
from public.coffees c
join public.roasters r           on r.id = c.roaster_id
left join public.origins_catalog o      on o.id = c.origin_id
left join public.varieties_catalog v    on v.id = c.variety_id
left join public.processing_methods_catalog pm on pm.id = c.processing_method_id
where c.slug = 'panama-geisha-esmeralda'
  and c.deleted_at is null;


-- -----------------------------------------------------------------------------
-- Q6) Bestand-Dashboard: was hat wieviele Kaffees, was ist out_of_stock?
-- -----------------------------------------------------------------------------
select
  r.name                                                              as roester,
  count(c.id)                                                         as anzahl_kaffees,
  count(c.id) filter (where c.stock_status = 'in_stock')               as auf_lager,
  count(c.id) filter (where c.stock_status = 'low_stock')              as wenig_vorrat,
  count(c.id) filter (where c.stock_status = 'out_of_stock')           as ausverkauft,
  round(avg(c.price_chf)::numeric, 2)                                 as durchschnittspreis_chf
from public.roasters r
left join public.coffees c
       on c.roaster_id = r.id
      and c.deleted_at is null
      and c.status = 'active'
where r.deleted_at is null and r.status = 'active'
group by r.id, r.name
order by anzahl_kaffees desc;
