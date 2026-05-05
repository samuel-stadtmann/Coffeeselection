-- =============================================================================
-- Migration 018 — Demo-Kaffees (Schritt A: 8 Kaffees, je einer pro Typ)
-- =============================================================================
-- Ziel: Ranking-Funktion rank_coffees_for_customer() sofort testbar machen.
-- Je ein Kaffee mit optimiertem Profil fuer einen der 8 Geschmackstypen.
-- Alle Kaffees erhalten data_quality_score > 75 (Ranking-Schwelle).
-- Flavour-Notes werden ueber coffee_flavor_notes eingefuegt; der Trigger
-- sync_coffee_aroma_families setzt coffees.aroma_families automatisch.
-- =============================================================================

-- =============================================================================
-- A) Demo-Roester
-- =============================================================================
insert into public.roasters (id, slug, name, status, country)
values (
  'a0000001-0000-0000-0000-000000000000',
  'demo-roaster',
  'Demo Roaster',
  'active',
  'CH'
)
on conflict (slug) do nothing;


-- =============================================================================
-- B) 8 Demo-Kaffees
-- =============================================================================
insert into public.coffees (
  id, slug, name, roaster_id,
  short_description, flavor_description,
  origin_id, region,
  processing_method_id,
  roast_level_text, roast_level,
  acidity, body, sweetness, bitterness, complexity,
  price_chf, weight_g, price_per_250g,
  stock_status, stock_kg, status,
  altitude_m_min, altitude_m_max,
  harvest_year, cupping_score,
  is_decaf, is_organic, is_direct_trade, is_blend
)
values

-- 1) Klassiker — Typ 1: chocolate / nutty / sugary
(
  'c0000001-0000-0000-0000-000000000000',
  'demo-brasil-cerrado-klassiker',
  'Brasilien Cerrado – Klassiker',
  'a0000001-0000-0000-0000-000000000000',
  'Vollmundiger Alltagskaffee mit Schokolade und Nüssen.',
  'Klassischer brasilianischer Natural aus dem Cerrado Mineiro mit Vollmilchschokolade, Haselnuss und Karamell. Sanfte Säure, voller Körper, sehr ausgewogen – ideal als Espresso oder im Vollautomaten.',
  (select id from public.origins_catalog           where slug = 'brazil'),
  'Cerrado Mineiro',
  (select id from public.processing_methods_catalog where slug = 'natural'),
  'medium', 3,
  2, 4, 4, 3, 3,
  19.50, 250, 19.50,
  'in_stock', 20.0, 'active',
  1000, 1200, 2024, 84.00,
  false, false, false, false
),

-- 2) Fruchtfreund — Typ 2: fruity / floral
(
  'c0000002-0000-0000-0000-000000000000',
  'demo-ethiopia-yirgacheffe-fruchtfreund',
  'Äthiopien Yirgacheffe – Fruchtfreund',
  'a0000001-0000-0000-0000-000000000000',
  'Lebhaft-fruchtiger Filter mit Blaubeere und Jasmin.',
  'Hell geröstet aus dem weltberühmten Yirgacheffe-Gebiet. Intensive Blaubeere, Jasmin und Zitronenzeste – belebende Säure, leichter Körper, lang anhaltender Abgang. Ein Referenz-Filterkaffee.',
  (select id from public.origins_catalog           where slug = 'ethiopia'),
  'Yirgacheffe',
  (select id from public.processing_methods_catalog where slug = 'washed'),
  'light', 1,
  5, 2, 4, 1, 4,
  23.90, 250, 23.90,
  'in_stock', 15.0, 'active',
  1800, 2200, 2024, 87.00,
  false, false, false, false
),

-- 3) Espresso-Enthusiast — Typ 3: chocolate / sugary / nutty (dunkel, kräftig)
(
  'c0000003-0000-0000-0000-000000000000',
  'demo-brasil-mogiana-espresso',
  'Brasilien Mogiana – Espresso Enthusiast',
  'a0000001-0000-0000-0000-000000000000',
  'Kräftiger Espresso mit dunkler Schokolade und Tabak.',
  'Dunkel geröstet aus der Mogiana-Region: intensive dunkle Schokolade, Haselnuss und ein Hauch Karamell. Kräftiger Körper, ausgeprägte Bitterkeit, cremige Crema – der ideale Espresso für Kenner.',
  (select id from public.origins_catalog           where slug = 'brazil'),
  'Mogiana',
  (select id from public.processing_methods_catalog where slug = 'natural'),
  'dark', 5,
  1, 5, 3, 5, 3,
  18.90, 250, 18.90,
  'in_stock', 25.0, 'active',
  900, 1100, 2024, 82.00,
  false, false, false, false
),

-- 4) Entdecker — Typ 4: fruity / spicy / floral (exotisch, komplex)
(
  'c0000004-0000-0000-0000-000000000000',
  'demo-panama-geisha-entdecker',
  'Panama Geisha – Entdecker',
  'a0000001-0000-0000-0000-000000000000',
  'Exotischer Geisha mit Mango, Jasmin und Zimt.',
  'Anaerobisch verarbeiteter Geisha aus Boquete mit explosiver Fruchtigkeit: Mango, tropische Exotik, Jasmin und ein feiner Zimthauch. Maximale Komplexität auf jedem Brew-Level – für Entdecker.',
  (select id from public.origins_catalog           where slug = 'panama'),
  'Boquete',
  (select id from public.processing_methods_catalog where slug = 'anaerobic'),
  'medium_light', 2,
  4, 3, 3, 2, 5,
  39.50, 250, 39.50,
  'in_stock', 8.0, 'active',
  1500, 1800, 2024, 91.00,
  false, false, true, false
),

-- 5) Sanfte — Typ 5: nutty / sugary / chocolate (mild, rund)
(
  'c0000005-0000-0000-0000-000000000000',
  'demo-colombia-huila-sanfte',
  'Kolumbien Huila – Sanfte',
  'a0000001-0000-0000-0000-000000000000',
  'Milder Washed mit Mandel, Honig und Schokolade.',
  'Gewaschen verarbeiteter Kaffee aus Huila: weiche Mandelnoten, sanfter Honig und Vollmilchschokolade im Abgang. Mittlerer Körper, sehr geringe Bitterkeit – zugänglich und rund für jeden Tag.',
  (select id from public.origins_catalog           where slug = 'colombia'),
  'Huila',
  (select id from public.processing_methods_catalog where slug = 'washed'),
  'medium', 3,
  2, 3, 4, 2, 2,
  21.50, 250, 21.50,
  'in_stock', 18.0, 'active',
  1400, 1800, 2024, 83.00,
  false, false, false, false
),

-- 6) Florale — Typ 6: floral / fruity
(
  'c0000006-0000-0000-0000-000000000000',
  'demo-rwanda-nyamasheke-florale',
  'Ruanda Nyamasheke – Florale',
  'a0000001-0000-0000-0000-000000000000',
  'Eleganter Filter mit Rose, Erdbeere und Orange.',
  'Hell gerösteter Washed aus Nyamasheke mit ausgeprägten Blumennoten: Rose, Erdbeere und ein Hauch Bitterorange. Leichter Körper, feine Säure und ein langer floraler Abgang – wie Tee auf Hochform.',
  (select id from public.origins_catalog           where slug = 'rwanda'),
  'Nyamasheke',
  (select id from public.processing_methods_catalog where slug = 'washed'),
  'light', 1,
  4, 2, 3, 1, 4,
  24.90, 250, 24.90,
  'in_stock', 12.0, 'active',
  1700, 2000, 2024, 86.00,
  false, true, false, false
),

-- 7) Erdige — Typ 7: earthy / spicy / roasted
(
  'c0000007-0000-0000-0000-000000000000',
  'demo-sumatra-mandheling-erdige',
  'Sumatra Mandheling – Erdige',
  'a0000001-0000-0000-0000-000000000000',
  'Erdiger Sumatra mit Holz, Zimt und Röstaromen.',
  'Wet-Hulled verarbeiteter Mandheling aus Nordsumatra: erdige Holznoten, würziger Zimt und kräftige Röstaromen. Maximaler Körper, dezente Säure – ein unverwechselbarer Kaffee für Fans von Tiefe.',
  (select id from public.origins_catalog           where slug = 'indonesia'),
  'Mandheling, Nordsumatra',
  (select id from public.processing_methods_catalog where slug = 'wet_hulled'),
  'medium_dark', 4,
  2, 5, 2, 4, 3,
  20.90, 250, 20.90,
  'in_stock', 22.0, 'active',
  1000, 1500, 2024, 84.00,
  false, false, false, false
),

-- 8) Süße — Typ 8: sugary / chocolate
(
  'c0000008-0000-0000-0000-000000000000',
  'demo-guatemala-antigua-suesse',
  'Guatemala Antigua – Süße',
  'a0000001-0000-0000-0000-000000000000',
  'Süßer Honey mit Karamell, braunem Zucker und Schokolade.',
  'Honey-verarbeiteter Kaffee aus dem vulkanischen Antigua: intensive Karamellsüße, brauner Zucker und cremige Vollmilchschokolade. Voller Körper, sehr geringe Säure – der perfekte Kaffee für Süßliebhaber.',
  (select id from public.origins_catalog           where slug = 'guatemala'),
  'Antigua',
  (select id from public.processing_methods_catalog where slug = 'honey'),
  'medium', 3,
  2, 4, 5, 2, 3,
  22.50, 250, 22.50,
  'in_stock', 16.0, 'active',
  1500, 1700, 2024, 85.00,
  false, false, false, false
)

on conflict (slug) do nothing;


-- =============================================================================
-- C) Flavor Notes verknüpfen
-- =============================================================================
-- Trigger sync_coffee_aroma_families setzt coffees.aroma_families automatisch.

insert into public.coffee_flavor_notes (coffee_id, flavor_note_id, intensity, sort_order)
values

-- Kaffee 1 — Klassiker: chocolate / nutty / sugary
('c0000001-0000-0000-0000-000000000000', (select id from public.flavor_notes_catalog where slug = 'choco_milk'),    5, 1),
('c0000001-0000-0000-0000-000000000000', (select id from public.flavor_notes_catalog where slug = 'caramel'),       4, 2),
('c0000001-0000-0000-0000-000000000000', (select id from public.flavor_notes_catalog where slug = 'nuts_hazelnut'), 4, 3),

-- Kaffee 2 — Fruchtfreund: fruity / floral
('c0000002-0000-0000-0000-000000000000', (select id from public.flavor_notes_catalog where slug = 'berry_blueberry'),  5, 1),
('c0000002-0000-0000-0000-000000000000', (select id from public.flavor_notes_catalog where slug = 'floral_jasmine'),   4, 2),
('c0000002-0000-0000-0000-000000000000', (select id from public.flavor_notes_catalog where slug = 'citrus_lemon'),     3, 3),

-- Kaffee 3 — Espresso-Enthusiast: chocolate / nutty / sugary (dunkel)
('c0000003-0000-0000-0000-000000000000', (select id from public.flavor_notes_catalog where slug = 'choco_dark'),    5, 1),
('c0000003-0000-0000-0000-000000000000', (select id from public.flavor_notes_catalog where slug = 'nuts_hazelnut'), 3, 2),
('c0000003-0000-0000-0000-000000000000', (select id from public.flavor_notes_catalog where slug = 'caramel'),       3, 3),

-- Kaffee 4 — Entdecker: fruity / spicy / floral
('c0000004-0000-0000-0000-000000000000', (select id from public.flavor_notes_catalog where slug = 'tropical_mango'),  5, 1),
('c0000004-0000-0000-0000-000000000000', (select id from public.flavor_notes_catalog where slug = 'floral_jasmine'),  4, 2),
('c0000004-0000-0000-0000-000000000000', (select id from public.flavor_notes_catalog where slug = 'spicy_cinnamon'), 3, 3),

-- Kaffee 5 — Sanfte: nutty / sugary / chocolate
('c0000005-0000-0000-0000-000000000000', (select id from public.flavor_notes_catalog where slug = 'nuts_almond'),  5, 1),
('c0000005-0000-0000-0000-000000000000', (select id from public.flavor_notes_catalog where slug = 'honey'),        4, 2),
('c0000005-0000-0000-0000-000000000000', (select id from public.flavor_notes_catalog where slug = 'choco_milk'),   3, 3),

-- Kaffee 6 — Florale: floral / fruity
('c0000006-0000-0000-0000-000000000000', (select id from public.flavor_notes_catalog where slug = 'floral_rose'),       5, 1),
('c0000006-0000-0000-0000-000000000000', (select id from public.flavor_notes_catalog where slug = 'berry_strawberry'),  4, 2),
('c0000006-0000-0000-0000-000000000000', (select id from public.flavor_notes_catalog where slug = 'citrus_orange'),     3, 3),

-- Kaffee 7 — Erdige: earthy / spicy / roasted
('c0000007-0000-0000-0000-000000000000', (select id from public.flavor_notes_catalog where slug = 'earthy_woody'),    5, 1),
('c0000007-0000-0000-0000-000000000000', (select id from public.flavor_notes_catalog where slug = 'spicy_cinnamon'),  4, 2),
('c0000007-0000-0000-0000-000000000000', (select id from public.flavor_notes_catalog where slug = 'roasted_toast'),   4, 3),

-- Kaffee 8 — Süße: sugary / chocolate
('c0000008-0000-0000-0000-000000000000', (select id from public.flavor_notes_catalog where slug = 'caramel'),       5, 1),
('c0000008-0000-0000-0000-000000000000', (select id from public.flavor_notes_catalog where slug = 'brown_sugar'),   4, 2),
('c0000008-0000-0000-0000-000000000000', (select id from public.flavor_notes_catalog where slug = 'choco_milk'),    3, 3)

on conflict do nothing;


-- =============================================================================
-- D) Quality Score neu berechnen (nach Trigger-Update der aroma_families)
-- =============================================================================
-- sync_coffee_aroma_families hat aroma_families gesetzt; jetzt nochmals
-- compute_coffee_quality_score auslösen damit der Score die Familien zaehlt.
update public.coffees
  set updated_at = now()
  where id in (
    'c0000001-0000-0000-0000-000000000000',
    'c0000002-0000-0000-0000-000000000000',
    'c0000003-0000-0000-0000-000000000000',
    'c0000004-0000-0000-0000-000000000000',
    'c0000005-0000-0000-0000-000000000000',
    'c0000006-0000-0000-0000-000000000000',
    'c0000007-0000-0000-0000-000000000000',
    'c0000008-0000-0000-0000-000000000000'
  );


-- =============================================================================
-- E) Smoke-Check
-- =============================================================================
-- Nach dem Einspielen sollte folgende Abfrage 8 Zeilen mit score >= 80 liefern:
--
--   select name, roast_level, acidity, body, sweetness, bitterness, complexity,
--          aroma_families, data_quality_score
--   from public.coffees
--   where id like 'c000000%'
--   order by id;
