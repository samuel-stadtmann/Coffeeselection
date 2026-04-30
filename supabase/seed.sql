-- =============================================================================
-- seed.sql — Beispieldaten fuer Coffee Selection (Kaffee-DB)
-- =============================================================================
-- Idempotent: alle INSERTs verwenden ON CONFLICT DO NOTHING und referenzieren
-- Kataloge per slug (statt hardgecodeter UUIDs). Mehrfache Ausfuehrung ist
-- ungefaehrlich — bestehende Datensaetze werden uebersprungen.
--
-- Ausfuehren NACH den Migrations 001..004 in einem leeren oder frisch
-- migrierten public-Schema.
-- =============================================================================


-- 1) Roesterpartner -----------------------------------------------------------
insert into public.roasters
  (slug, name, legal_name, short_description, description, story,
   logo_url, website_url, instagram_handle,
   contact_email, contact_phone,
   street, postal_code, city, region, country, vat_number, status)
values
  ('atelier-espresso',
   'Atelier Espresso',
   'Atelier Espresso GmbH',
   'Boutique-Roesterei aus dem Zuercher Kreis 4 mit Fokus auf afrikanische Mikrolots.',
   'Atelier Espresso roestet seit 2018 mit einem 15kg-Probat in kleinen Chargen. Der Schwerpunkt liegt auf Direkt-Beziehungen zu Genossenschaften in Aethiopien und Kenia.',
   'Gegruendet von Lea und Marco nach drei Jahren in Melbourne. Ihre Mission: jede Charge so transparent wie moeglich machen — vom Farmer-Preis bis zum Roestkurven-Plot.',
   null, 'https://atelier-espresso.example.ch', 'atelierespressozh',
   'hallo@atelier-espresso.example.ch', '+41 44 123 45 67',
   'Langstrasse 142', '8004', 'Zuerich', 'ZH', 'CH', 'CHE-123.456.789 MWST',
   'active'),

  ('buendner-bohne',
   'Buendner Bohne',
   'Buendner Bohne AG',
   'Alpine Roesterei aus Chur — kraeftige Profile, ideal fuer Vollautomat und Espresso.',
   'Familienbetrieb in dritter Generation, seit 1962. Spezialisiert auf mittel-dunkle Roestungen mit Schweizer Trinkkultur im Blick.',
   'Was als kleine Roesterei am Bahnhof Chur begann, ist heute Bündens groesste Specialty-Marke. Drittes Familienmitglied uebernahm 2021 den Betrieb.',
   null, 'https://buendner-bohne.example.ch', 'buendnerbohne',
   'office@buendner-bohne.example.ch', '+41 81 555 12 34',
   'Bahnhofstrasse 4', '7000', 'Chur', 'GR', 'CH', 'CHE-987.654.321 MWST',
   'active'),

  ('cafe-volta',
   'Café Volta',
   'Volta Coffee Sàrl',
   'Genfer Roesterei mit Fokus auf zentralamerikanische Geisha- und Pacamara-Lots.',
   'Café Volta importiert direkt aus Panama, Costa Rica und Guatemala. Spezialitaet: helle, blumige Filter-Roestungen.',
   'Gegruendet 2020 von der Q-Grader-Crew Sophie + Antoine, beide ehemalige Coffeefest-Schweizer-Meister.',
   null, 'https://cafe-volta.example.ch', 'cafevolta',
   'contact@cafe-volta.example.ch', '+41 22 999 88 77',
   'Rue de Carouge 88', '1205', 'Genève', 'GE', 'CH', 'CHE-555.111.222 MWST',
   'active')
on conflict (slug) do nothing;


-- 2) Payout-Daten (vertraulich) ----------------------------------------------
insert into public.roasters_payout
  (roaster_id, bank_account_holder, payout_method, payout_currency,
   payout_threshold_chf, commission_pct,
   contract_start_on, contract_notes)
select r.id, r.legal_name, 'bank_transfer', 'CHF',
       100.00, 18.00,
       '2026-01-01'::date,
       'Standard-Vertrag Coffee Selection v1.0 — 18% Provision auf Endkundenpreis.'
from public.roasters r
where r.slug in ('atelier-espresso','buendner-bohne','cafe-volta')
on conflict (roaster_id) do nothing;


-- 3) Kaffees ------------------------------------------------------------------
-- Helper-Hinweis: roaster_id, origin_id, variety_id, processing_method_id
-- werden via slug-Lookup gesetzt. Damit ist die Datei auch dann lesbar, wenn
-- man die Datei in 6 Monaten nochmal anschaut.

insert into public.coffees
  (slug, name, roaster_id, short_description, description, tasting_summary, image_url,
   origin_id, region, farm, producer,
   variety_id, processing_method_id,
   altitude_m_min, altitude_m_max, harvest_year,
   roast_level, roast_profile, is_fresh_roast_on_demand,
   is_decaf, is_blend, sca_score,
   price_chf, weight_g, stock_status, status, visible_from)
select
  'yirgacheffe-reko-washed',
  'Yirgacheffe Reko (Washed)',
  r.id,
  'Helle Roestung mit Heidelbeere & Jasmin — der Klassiker fuer V60.',
  'Genji Challa Cooperative aus dem Yirgacheffe-Distrikt. 100% Heirloom, sauber gewaschen.',
  'Heidelbeere, Jasmin, schwarzer Tee, lange Sueße im Abgang.',
  null,
  o.id, 'Yirgacheffe', 'Genji Challa Coop', 'Genji Challa Genossenschaft',
  v.id, p.id,
  1900, 2100, 2025,
  'light', 'filter', true,
  false, false, 87.50,
  19.50, 250, 'in_stock', 'active', now()
from public.roasters r,
     public.origins_catalog o,
     public.varieties_catalog v,
     public.processing_methods_catalog p
where r.slug='atelier-espresso' and o.slug='ethiopia'
  and v.slug='heirloom'        and p.slug='washed'
on conflict (slug) do nothing;

insert into public.coffees
  (slug, name, roaster_id, short_description, description, tasting_summary,
   origin_id, region, farm, variety_id, processing_method_id,
   altitude_m_min, altitude_m_max, harvest_year,
   roast_level, roast_profile, is_decaf, is_blend, sca_score,
   price_chf, weight_g, stock_status, status, visible_from)
select
  'sidamo-natural',
  'Sidamo Natural',
  r.id,
  'Wilde Erdbeere und Kakao — Natural-Aufbereitung von ihrer schoensten Seite.',
  'Sun-dried Sidamo Lot 04 aus 2025. Drei Wochen auf Erhoehten Betten getrocknet.',
  'Erdbeere, Kakao, Kirsche, Wein.',
  o.id, 'Sidamo', 'Hama Trockenstation',
  v.id, p.id,
  1850, 2050, 2025,
  'light', 'filter', false, false, 88.25,
  21.00, 250, 'in_stock', 'active', now()
from public.roasters r, public.origins_catalog o,
     public.varieties_catalog v, public.processing_methods_catalog p
where r.slug='atelier-espresso' and o.slug='ethiopia'
  and v.slug='heirloom'        and p.slug='natural'
on conflict (slug) do nothing;

insert into public.coffees
  (slug, name, roaster_id, short_description, description, tasting_summary,
   origin_id, region, farm, variety_id, processing_method_id,
   altitude_m_min, altitude_m_max, harvest_year,
   roast_level, roast_profile, is_decaf, is_blend, sca_score,
   price_chf, weight_g, stock_status, status, visible_from)
select
  'volcan-azul-honey',
  'Volcán Azul (Yellow Honey)',
  r.id,
  'Karamell und Orange aus dem Tarrazú-Hochland. Vielseitig fuer Filter und Espresso.',
  'Hacienda Volcán Azul, Tarrazú. Yellow-Honey-Aufbereitung mit 24h Mucilage.',
  'Karamell, Orange, brauner Zucker, weicher Koerper.',
  o.id, 'Tarrazú', 'Hacienda Volcán Azul',
  v.id, p.id,
  1700, 1900, 2025,
  'medium', 'omni', false, false, 86.75,
  17.50, 250, 'in_stock', 'active', now()
from public.roasters r, public.origins_catalog o,
     public.varieties_catalog v, public.processing_methods_catalog p
where r.slug='atelier-espresso' and o.slug='costa_rica'
  and v.slug='caturra'         and p.slug='honey_yellow'
on conflict (slug) do nothing;

insert into public.coffees
  (slug, name, roaster_id, short_description, description, tasting_summary,
   origin_id, region, farm, variety_id, processing_method_id,
   altitude_m_min, altitude_m_max, harvest_year,
   roast_level, roast_profile, is_decaf, is_blend, sca_score,
   price_chf, weight_g, stock_status, status, visible_from)
select
  'huila-direct',
  'Huila Direct',
  r.id,
  'Schokolade und Mandel aus Kolumbien. Tagesgeschaeft fuer Filter & Espresso.',
  'Kleine Finca im Huila-Departement, langjaehrige Direkt-Beziehung.',
  'Dunkle Schokolade, Mandel, weicher Saeurebogen.',
  o.id, 'Huila', 'Finca La Esperanza',
  v.id, p.id,
  1600, 1800, 2025,
  'medium', 'omni', false, false, 84.50,
  15.50, 250, 'in_stock', 'active', now()
from public.roasters r, public.origins_catalog o,
     public.varieties_catalog v, public.processing_methods_catalog p
where r.slug='buendner-bohne'   and o.slug='colombia'
  and v.slug='castillo'         and p.slug='washed'
on conflict (slug) do nothing;

insert into public.coffees
  (slug, name, roaster_id, short_description, description, tasting_summary,
   origin_id, region, variety_id, processing_method_id,
   altitude_m_min, altitude_m_max, harvest_year,
   roast_level, roast_profile, is_decaf, is_blend, sca_score,
   price_chf, weight_g, stock_status, status, visible_from)
select
  'brasil-cerrado',
  'Brasil Cerrado',
  r.id,
  'Klassischer Espresso-Kaffee aus dem Cerrado: Haselnuss, Karamell, kaum Saeure.',
  'Brasilien Cerrado Mineiro, Tagesernte 2025, sun-dried.',
  'Haselnuss, Karamell, Vollmilchschokolade.',
  o.id, 'Cerrado Mineiro',
  v.id, p.id,
  1100, 1300, 2025,
  'medium_dark', 'espresso', false, false, 83.00,
  14.50, 250, 'in_stock', 'active', now()
from public.roasters r, public.origins_catalog o,
     public.varieties_catalog v, public.processing_methods_catalog p
where r.slug='buendner-bohne' and o.slug='brazil'
  and v.slug='mundo_novo'    and p.slug='natural'
on conflict (slug) do nothing;

insert into public.coffees
  (slug, name, roaster_id, short_description, description, tasting_summary,
   origin_id, region, variety_id, processing_method_id,
   altitude_m_min, altitude_m_max, harvest_year,
   roast_level, roast_profile, is_decaf, decaf_method, is_blend, sca_score,
   price_chf, weight_g, stock_status, status, visible_from)
select
  'honduras-decaf-sw',
  'Honduras Decaf (Swiss Water)',
  r.id,
  'Entkoffeinierter Honduras — sanft, schokoladig, ohne den klassischen Decaf-Geschmack.',
  'Swiss-Water-entkoffeinierter Catuai aus Marcala. Frei von Loesungsmitteln.',
  'Milchschokolade, Karamell, weiche Nuss.',
  o.id, 'Marcala',
  v.id, p.id,
  1300, 1600, 2025,
  'medium', 'omni', true, 'swiss_water', false, 82.50,
  18.00, 250, 'in_stock', 'active', now()
from public.roasters r, public.origins_catalog o,
     public.varieties_catalog v, public.processing_methods_catalog p
where r.slug='buendner-bohne' and o.slug='honduras'
  and v.slug='catuai'        and p.slug='washed'
on conflict (slug) do nothing;

insert into public.coffees
  (slug, name, roaster_id, short_description, description, tasting_summary,
   origin_id, region, farm, variety_id, processing_method_id,
   altitude_m_min, altitude_m_max, harvest_year,
   roast_level, roast_profile, is_decaf, is_blend, sca_score,
   price_chf, weight_g, stock_status, status, visible_from)
select
  'panama-geisha-esmeralda',
  'Panama Geisha — Hacienda Esmeralda',
  r.id,
  'Premium-Lot mit Bergamotte, Jasmin und Pfirsich. Limitiert auf 30 kg.',
  'Hacienda Esmeralda, Boquete, Panama. Jaeger-Mass-Lot 2025, COE-Klasse.',
  'Bergamotte, Jasmin, Pfirsich, langer parfumiger Abgang.',
  o.id, 'Boquete', 'Hacienda Esmeralda',
  v.id, p.id,
  1600, 1850, 2025,
  'light', 'filter', false, false, 91.50,
  68.00, 100, 'low_stock', 'active', now()
from public.roasters r, public.origins_catalog o,
     public.varieties_catalog v, public.processing_methods_catalog p
where r.slug='cafe-volta'    and o.slug='panama'
  and v.slug='geisha'        and p.slug='washed'
on conflict (slug) do nothing;

insert into public.coffees
  (slug, name, roaster_id, short_description, description, tasting_summary,
   roast_level, roast_profile, is_decaf, is_blend,
   price_chf, weight_g, stock_status, status, visible_from)
select
  'volta-espresso-no1',
  'Volta Espresso No.1',
  r.id,
  'Hausblend fuer Espresso & Vollautomat — Schoko, Nuss, Karamell.',
  'Blend aus Brasilien Cerrado, Honduras Marcala und Aethiopien Sidamo. Mittel-dunkel geroestet.',
  'Vollmilchschokolade, Haselnuss, Karamell. Dichter Crema.',
  'medium_dark', 'espresso', false, true,
  13.50, 500, 'in_stock', 'active', now()
from public.roasters r where r.slug='cafe-volta'
on conflict (slug) do nothing;


-- 4) Aroma-Verknuepfungen (coffee_flavor_notes) -------------------------------
-- Pro Kaffee 2-4 Aromen mit Intensitaet 1-5.

insert into public.coffee_flavor_notes (coffee_id, flavor_note_id, intensity, sort_order)
select c.id, f.id, x.intensity, x.sort_order
from (values
  ('yirgacheffe-reko-washed', 'berry_blueberry',   5, 10),
  ('yirgacheffe-reko-washed', 'floral_jasmine',    4, 20),
  ('yirgacheffe-reko-washed', 'citrus_lemon',      3, 30),
  ('sidamo-natural',          'berry_strawberry',  5, 10),
  ('sidamo-natural',          'cocoa',             4, 20),
  ('sidamo-natural',          'stone_cherry',      3, 30),
  ('volcan-azul-honey',       'caramel',           4, 10),
  ('volcan-azul-honey',       'citrus_orange',     3, 20),
  ('volcan-azul-honey',       'brown_sugar',       4, 30),
  ('huila-direct',            'choco_dark',        4, 10),
  ('huila-direct',            'nuts_almond',       3, 20),
  ('brasil-cerrado',          'nuts_hazelnut',     5, 10),
  ('brasil-cerrado',          'caramel',           4, 20),
  ('brasil-cerrado',          'choco_milk',        4, 30),
  ('honduras-decaf-sw',       'choco_milk',        4, 10),
  ('honduras-decaf-sw',       'caramel',           3, 20),
  ('honduras-decaf-sw',       'nuts_walnut',       3, 30),
  ('panama-geisha-esmeralda', 'floral_bergamot',   5, 10),
  ('panama-geisha-esmeralda', 'floral_jasmine',    5, 20),
  ('panama-geisha-esmeralda', 'stone_peach',       4, 30),
  ('volta-espresso-no1',      'choco_milk',        5, 10),
  ('volta-espresso-no1',      'nuts_hazelnut',     4, 20),
  ('volta-espresso-no1',      'caramel',           4, 30)
) as x(coffee_slug, flavor_slug, intensity, sort_order)
join public.coffees             c on c.slug = x.coffee_slug
join public.flavor_notes_catalog f on f.slug = x.flavor_slug
on conflict (coffee_id, flavor_note_id) do nothing;


-- 5) Empfohlene Bruehmethoden (coffee_brewing_methods) -----------------------
insert into public.coffee_brewing_methods (coffee_id, brewing_method_id, is_recommended)
select c.id, b.id, x.recommended
from (values
  ('yirgacheffe-reko-washed', 'v60',         true),
  ('yirgacheffe-reko-washed', 'chemex',      true),
  ('yirgacheffe-reko-washed', 'aeropress',   true),
  ('sidamo-natural',          'v60',         true),
  ('sidamo-natural',          'aeropress',   true),
  ('volcan-azul-honey',       'espresso',    true),
  ('volcan-azul-honey',       'v60',         true),
  ('volcan-azul-honey',       'fully_auto',  true),
  ('huila-direct',            'espresso',    true),
  ('huila-direct',            'fully_auto',  true),
  ('huila-direct',            'frenchpress', true),
  ('brasil-cerrado',          'espresso',    true),
  ('brasil-cerrado',          'fully_auto',  true),
  ('brasil-cerrado',          'moka',        true),
  ('honduras-decaf-sw',       'espresso',    true),
  ('honduras-decaf-sw',       'fully_auto',  true),
  ('honduras-decaf-sw',       'v60',         false),
  ('panama-geisha-esmeralda', 'v60',         true),
  ('panama-geisha-esmeralda', 'chemex',      true),
  ('panama-geisha-esmeralda', 'kalita',      true),
  ('volta-espresso-no1',      'espresso',    true),
  ('volta-espresso-no1',      'fully_auto',  true),
  ('volta-espresso-no1',      'moka',        true)
) as x(coffee_slug, method_slug, recommended)
join public.coffees                c on c.slug = x.coffee_slug
join public.brewing_methods_catalog b on b.slug = x.method_slug
on conflict (coffee_id, brewing_method_id) do nothing;


-- 6) Zertifikate (coffee_certifications) -------------------------------------
insert into public.coffee_certifications (coffee_id, certification_id)
select c.id, ce.id
from (values
  ('yirgacheffe-reko-washed', 'direct_trade'),
  ('yirgacheffe-reko-washed', 'sca_specialty'),
  ('sidamo-natural',          'direct_trade'),
  ('sidamo-natural',          'sca_specialty'),
  ('volcan-azul-honey',       'sca_specialty'),
  ('huila-direct',            'direct_trade'),
  ('honduras-decaf-sw',       'fairtrade'),
  ('honduras-decaf-sw',       'eu_organic'),
  ('panama-geisha-esmeralda', 'cup_of_excellence'),
  ('panama-geisha-esmeralda', 'sca_specialty')
) as x(coffee_slug, cert_slug)
join public.coffees                c  on c.slug  = x.coffee_slug
join public.certifications_catalog ce on ce.slug = x.cert_slug
on conflict (coffee_id, certification_id) do nothing;
