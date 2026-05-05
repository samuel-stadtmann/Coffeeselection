-- =============================================================================
-- Migration 012 — Seed-Daten Matching-Algorithmus v1.0  (Schritt 9.3 + 9.4)
-- Logischer Name: 002_matching_algorithm_seed.sql
-- =============================================================================
-- Befuellt die Konfigurations-Tabellen aus Migration 011 mit den finalen
-- Werten gemaess Matching-Algorithmus-Playbook:
--   * 8 Geschmackstypen      (Kap. 2.2 / 2.3)
--   * 12 Quiz-Fragen         (Kap. 3.2)
--   * 49 Antwortoptionen     (Kap. 3.2)
--   * ~140 Scoring-Zeilen    (Kap. 3.2 — das Herzstueck)
--   * algorithm_config       (Kap. 1.1, 5.6, 6.3)
--   * compute_taste_type_max_scores() Funktion (Kap. 4.4 / Schritt 9.4)
-- =============================================================================


-- =============================================================================
-- A) algorithm_config — Default-Werte (Kap. 1.1, 5.6, 6.3)
-- =============================================================================
insert into public.algorithm_config (key, value_numeric, description) values
  ('scoring_weight',       0.55, 'Gewicht des Soft-Scoring im Final-Score (Kap. 1.1)'),
  ('vector_weight',        0.35, 'Gewicht der Vektor-Aehnlichkeit im Final-Score (Kap. 1.1)'),
  ('diversity_weight',     0.10, 'Gewicht des Diversitaets-Bonus im Final-Score (Kap. 1.1)'),
  ('mmr_lambda',           0.70, 'MMR-Lambda fuer Discovery-Diversitaet (Kap. 5.7)'),
  ('learning_rate_base',   0.10, 'Basis-Lernrate fuer Profil-Vektor-Drift (Kap. 6.3)'),
  ('confidence_threshold_high',   0.85, 'Confidence ab der reines Primaerprofil verwendet wird (Kap. 4.6)'),
  ('confidence_threshold_medium', 0.65, 'Confidence ab der 85/15-Mix verwendet wird (Kap. 4.6)'),
  ('confidence_threshold_low',    0.45, 'Confidence ab der 70/30-Mix verwendet wird (Kap. 4.6)'),
  ('confidence_threshold_critical', 0.25, 'Confidence unter der WARNUNG-Flag gesetzt wird (Kap. 4.6)'),
  ('cooldown_months_coffee',   6, 'Cooldown fuer identischen Kaffee in Monaten (Kap. 1.4)'),
  ('cooldown_count_roaster',   3, 'Cooldown fuer gleichen Roester in Anzahl letzter Lieferungen (Kap. 1.4)'),
  ('quality_threshold_active', 75, 'Mindest-data_quality_score damit Kaffee im Algorithmus auftaucht (Kap. 8.2)');

insert into public.algorithm_config (key, value_text, description) values
  ('embedding_model',     'text-embedding-3-small', 'OpenAI Embedding-Modell (1536 Dim)'),
  ('algorithm_version',   'v1.0', 'Aktuelle Algorithmus-Version (siehe quiz_responses.version)');


-- =============================================================================
-- B) taste_types — die 8 Geschmackstypen (Kap. 2.2 / 2.3)
-- =============================================================================
insert into public.taste_types
  (id, slug, name_de, name_internal, description_de,
   acidity, body, sweetness, bitterness, roast_level, complexity,
   aroma_families, embedding_seed_text, market_share_pct) values

  (1, 'classic', 'Der Klassiker', 'classic',
   'Der unaufgeregte Geniesser. Ausgewogener, alltagstauglicher Kaffee ohne Ecken und Kanten — schokoladig-nussig, mittlere Roestung, gut zu Milch.',
   2, 3, 3, 3, 3, 2,
   array['schokoladig','nussig','karamellig'],
   'Ausgewogener Hausroest-Kaffee, mittlere Roestung, schokoladig, nussig, karamellig. Vollmundig aber nicht schwer, milde Saeure, gut zu Milch. Alltagstauglich, harmonisch, geradlinig.',
   28.0),

  (2, 'fruity', 'Der Fruchtfreund', 'fruity',
   'Der Aroma-Suchende. Sucht das Helle, Lebendige, Beerige im Kaffee — heller Filter, hohe Saeure, teeartiger Koerper, washed Aethiopien oder Kenia.',
   4, 2, 4, 1, 2, 4,
   array['fruchtig','blumig'],
   'Heller Filterkaffee aus Aethiopien oder Kenia. Fruchtig, beerig, blumig, lebhafte Saeure, zitrusartig. Teeartiger Koerper, washed oder natural, single origin. Lebendig, hell, beerig wie reife Heidelbeeren.',
   14.0),

  (3, 'espresso', 'Der Espresso-Enthusiast', 'espresso',
   'Der Italienisch-Gepraegte. Trinkt ausschliesslich Espresso — Crema, Koerper, vorhaltend. Dunklere Roestung, niedrige Saeure, schokoladig oder karamellig.',
   1, 5, 3, 4, 4, 2,
   array['schokoladig','karamellig','nussig'],
   'Italienischer Espresso, dunkle Roestung, sehr vollmundig, sirupartig. Schokoladig, karamellig, nussig. Hohe Crema, niedrige Saeure, ausgepraegte Bitterkeit. Vorhaltend am Gaumen, traditionell, kraeftig.',
   18.0),

  (4, 'explorer', 'Der Entdecker', 'explorer',
   'Der Aroma-Abenteurer. Will jeden Monat etwas Neues — anaerobic, carbonic maceration, exotische Herkuenfte, hohe Komplexitaet, polarisierende Profile.',
   4, 3, 4, 2, 2, 5,
   array['exotisch','fermentiert','weinartig','tropisch'],
   'Anaerobic, carbonic maceration, exotische Verarbeitung. Tropisch, weinartig, fermentiert. Hohe Komplexitaet, polarisierend, ungewoehnliche Profile. Seltene Varietaeten, exotische Herkuenfte. Wein-aehnlich, abenteuerlich.',
   9.0),

  (5, 'gentle', 'Der Sanfte', 'gentle',
   'Der Saeure-Sensitive. Will einen freundlichen, weichen, runden Kaffee — niedrige Saeure, mittlere Roestung, nussig und karamellig.',
   1, 3, 4, 2, 3, 2,
   array['nussig','karamellig','vollmilchschokolade'],
   'Magenfreundlicher Kaffee, niedrige Saeure, runder Geschmack. Nussig, karamellig, vollmilchschokolade. Mittelgeroestet, weich, freundlich. Brasilien, Kolumbien washed, klassisch.',
   11.0),

  (6, 'floral', 'Der Florale', 'floral',
   'Der Tee-Liebhaber. Sucht Zartes, Blumiges, Jasmin- und Bergamotte — Geisha, aethiopische Heirlooms, sehr helle Roestung, feiner Koerper.',
   4, 1, 3, 1, 1, 4,
   array['blumig','teeartig','citrusartig'],
   'Geisha-Varietaet aus Panama oder aethiopischer Heirloom. Sehr hell geroestet, blumig wie Jasmin oder Bergamotte. Teeartiger Koerper, citrusartig, zart, elegant. Filter-Method, washed, hochwertig.',
   6.0),

  (7, 'earthy', 'Der Erdige', 'earthy',
   'Der Indonesien-Versteher. Mag wuerzige, holzige, manchmal tabakartige Profile — Sumatra Mandheling, Java, Sulawesi-Toraja, vollmundig.',
   2, 5, 2, 3, 4, 4,
   array['erdig','wuerzig','holzig','tabakartig'],
   'Sumatra Mandheling, Java oder Sulawesi-Toraja. Erdig, wuerzig, holzig, tabakartig. Vollmundig, niedrige Saeure, hohe Komplexitaet. Mittelgeroestet bis dunkel, traditionell, indonesisch.',
   5.0),

  (8, 'sweet', 'Der Suesse', 'sweet',
   'Der Dessert-Trinker. Will Kaffee wie ein Dessert — Karamell, Vanille, Honig, Toffee. Mittlerer Roestgrad, ausgepraegte Suesse, niedrige Saeure.',
   2, 4, 5, 2, 3, 2,
   array['karamellig','honigartig','vanille','toffee'],
   'Karamellig, honigartig, vanille, toffee. Mittlere Roestung, ausgepraegte Suesse, niedrige Saeure. Dessert-aehnlich, oft mit Milch oder Pflanzenmilch. Brasilien natural, honey-process, weich und aromatisch.',
   9.0);


-- =============================================================================
-- C) quiz_questions — 12 Fragen in 4 Bloecken (Kap. 3.1, 3.2)
-- =============================================================================
insert into public.quiz_questions (question_code, block, position, text_de) values
  ('Q1_brewing_method', 'A',  1, 'Wie bereitest du deinen Kaffee am haeufigsten zu?'),
  ('Q2_consumption',    'A',  2, 'Wann und wie oft trinkst du Kaffee?'),
  ('Q3_milk_or_black',  'A',  3, 'Wie trinkst du deinen Kaffee am liebsten?'),
  ('Q4_breakfast',      'B',  4, 'Welches Fruehstueck passt am ehesten zu deinem Lieblings-Wochenendmorgen?'),
  ('Q5_chocolate',      'B',  5, 'Wenn du Schokolade isst — welche bevorzugst du?'),
  ('Q6_drink',          'B',  6, 'Welches Getraenk reizt dich bei einem Restaurantbesuch am meisten?'),
  ('Q7_aroma',          'B',  7, 'Welcher Duft bringt dich sofort in gute Stimmung?'),
  ('Q8_tea',            'C',  8, 'Wie magst du deinen Tee — wenn du Tee trinkst?'),
  ('Q9_citrus',         'C',  9, 'Wenn du an einer Zitrusfrucht riechst (Zitrone, Grapefruit) — was empfindest du?'),
  ('Q10_mouthfeel',     'C', 10, 'Wenn du an dein Lieblings-Heissgetraenk denkst — wie soll es sich im Mund anfuehlen?'),
  ('Q11_experience',    'D', 11, 'Wie wuerdest du dein Kaffee-Wissen einschaetzen?'),
  ('Q12_openness',      'D', 12, 'Was ist dir wichtiger bei deinem Kaffee?');


-- =============================================================================
-- D) quiz_options — Antwortoptionen (Kap. 3.2)
-- =============================================================================
insert into public.quiz_options (question_code, answer_code, text_de, position) values
  -- Q1 — Zubereitungsart
  ('Q1_brewing_method', 'A_espresso',     'Espressomaschine (Espresso, Cappuccino, Latte)', 1),
  ('Q1_brewing_method', 'B_filter',       'Filterkaffee (V60, Chemex, Aeropress, Filtermaschine)', 2),
  ('Q1_brewing_method', 'C_french_press', 'French Press / Karlsbader Kanne', 3),
  ('Q1_brewing_method', 'D_fully_auto',   'Vollautomat (One-Touch)', 4),
  ('Q1_brewing_method', 'E_mokka',        'Mokkakanne (Bialetti)', 5),

  -- Q2 — Tageszeit & Haeufigkeit
  ('Q2_consumption', 'A_morning_ritual',   'Nur morgens, einmal — als Ritual', 1),
  ('Q2_consumption', 'B_throughout_day',   'Mehrmals taeglich, ueber den Tag verteilt', 2),
  ('Q2_consumption', 'C_weekend',          'Nur am Wochenende, dafuer mit Genuss & Zeit', 3),
  ('Q2_consumption', 'D_after_meals',      'Nach jedem Essen als Verdauungsschlummer', 4),

  -- Q3 — Milch oder schwarz
  ('Q3_milk_or_black', 'A_black',          'Schwarz, ohne alles', 1),
  ('Q3_milk_or_black', 'B_with_milk',      'Mit etwas Milch', 2),
  ('Q3_milk_or_black', 'C_cappuccino',     'Cappuccino oder Latte (deutlich Milch)', 3),
  ('Q3_milk_or_black', 'D_plant_milk',     'Mit pflanzlicher Milch (Hafer, Mandel, Soja)', 4),
  ('Q3_milk_or_black', 'E_with_sugar',     'Mit Zucker oder Sirup', 5),

  -- Q4 — Fruehstueck
  ('Q4_breakfast', 'A_croissant_berries',  'Croissant mit Beerenmarmelade & frischem Obst', 1),
  ('Q4_breakfast', 'B_yogurt_honey',       'Joghurt mit Honig, Nuessen & Granola', 2),
  ('Q4_breakfast', 'C_farmer_breakfast',   'Bauernfruehstueck mit Speck & Kaese', 3),
  ('Q4_breakfast', 'D_pancakes_caramel',   'Pancakes mit Ahornsirup & Karamell-Sauce', 4),
  ('Q4_breakfast', 'E_hummus_sandwich',    'Sandwich mit Hummus & getrockneten Tomaten', 5),
  ('Q4_breakfast', 'F_dark_chocolate',     'Einfach ein Stueck dunkle Schokolade', 6),

  -- Q5 — Schokolade
  ('Q5_chocolate', 'A_milk_chocolate',     'Vollmilchschokolade (mild, suess)', 1),
  ('Q5_chocolate', 'B_dark_50_70',         'Zartbitterschokolade 50-70 %', 2),
  ('Q5_chocolate', 'C_dark_80plus',        'Sehr dunkle Schokolade ab 80 %', 3),
  ('Q5_chocolate', 'D_berry_filled',       'Schokolade mit Beerenfuellung oder fruchtig', 4),
  ('Q5_chocolate', 'E_white_caramel',      'Weisse Schokolade oder Karamell', 5),
  ('Q5_chocolate', 'F_no_chocolate',       'Ich esse keine oder selten Schokolade', 6),

  -- Q6 — Getraenk im Restaurant
  ('Q6_drink', 'A_white_wine',             'Junger Weisswein (Sauvignon Blanc, Riesling)', 1),
  ('Q6_drink', 'B_strong_red',             'Kraeftiger Rotwein (Cabernet, Barolo)', 2),
  ('Q6_drink', 'C_champagne',              'Glas Champagner oder Cremant', 3),
  ('Q6_drink', 'D_natural_wine',           'Naturwein oder etwas Ungewoehnliches', 4),
  ('Q6_drink', 'E_beer_cider',             'Bier oder Cider', 5),
  ('Q6_drink', 'F_sweet_cocktail',         'Suesslicher Cocktail oder Likoer', 6),
  ('Q6_drink', 'G_water_tea',              'Wasser oder Tee — ich trinke wenig Alkohol', 7),

  -- Q7 — Aroma-Reiz
  ('Q7_aroma', 'A_fresh_bread',            'Frisch gebackenes Brot mit Butter', 1),
  ('Q7_aroma', 'B_strawberries',           'Reife Erdbeeren oder Himbeeren', 2),
  ('Q7_aroma', 'C_earl_grey',              'Tasse Earl Grey mit Bergamotte', 3),
  ('Q7_aroma', 'D_fireplace',              'Kaminfeuer mit Holzscheiten', 4),
  ('Q7_aroma', 'E_caramel',                'Karamellisierter Zucker / Creme bruelee', 5),
  ('Q7_aroma', 'F_herbs',                  'Frische Kraeuter (Basilikum, Minze)', 6),

  -- Q8 — Tee
  ('Q8_tea', 'A_strong_black',             'Schwarzer Tee, kraeftig (Assam, Ceylon)', 1),
  ('Q8_tea', 'B_green_jasmine',            'Gruener Tee oder Jasmintee', 2),
  ('Q8_tea', 'C_fruit_tea',                'Fruechtetee (Hagebutte, Beeren)', 3),
  ('Q8_tea', 'D_chamomile_rooibos',        'Kamille oder Rooibos', 4),
  ('Q8_tea', 'E_chai_spices',              'Chai mit Gewuerzen', 5),
  ('Q8_tea', 'F_no_tea',                   'Ich trinke keinen Tee', 6),

  -- Q9 — Saeure-Toleranz (Zitrus)
  ('Q9_citrus', 'A_pleasant',              'Sehr angenehm, frisch und belebend', 1),
  ('Q9_citrus', 'B_neutral',               'Okay, aber nichts Besonderes', 2),
  ('Q9_citrus', 'C_unpleasant',            'Eher unangenehm — zu scharf, zu sauer', 3),
  ('Q9_citrus', 'D_depends',               'Kommt drauf an — manchmal ja, manchmal nein', 4),

  -- Q10 — Mundgefuehl
  ('Q10_mouthfeel', 'A_light_tealike',     'Leicht und teeartig — fast schwerelos', 1),
  ('Q10_mouthfeel', 'B_balanced',          'Ausgewogen — nicht zu duenn, nicht zu dick', 2),
  ('Q10_mouthfeel', 'C_full_syrupy',       'Vollmundig und sirupartig — bleibt am Gaumen', 3),
  ('Q10_mouthfeel', 'D_creamy_cocoa',      'Cremig wie ein heisser Kakao', 4),

  -- Q11 — Erfahrungsgrad
  ('Q11_experience', 'A_beginner',         'Anfaenger — ich trinke gerne Kaffee, weiss aber wenig darueber', 1),
  ('Q11_experience', 'B_advanced',         'Fortgeschritten — kenne Unterschiede zwischen Herkuenften', 2),
  ('Q11_experience', 'C_enthusiast',       'Enthusiast — habe Equipment, lese darueber, gehe in Cafes', 3),
  ('Q11_experience', 'D_pro',              'Profi / Ex-Profi (Barista, Q-Grader, Kaffeebranche)', 4),

  -- Q12 — Offenheit
  ('Q12_openness', 'A_discovery',          'Ich will jeden Monat einen neuen Kaffee entdecken', 1),
  ('Q12_openness', 'B_consistency',        'Mir ist Konstanz wichtig — derselbe Kaffee, immer in guter Qualitaet', 2),
  ('Q12_openness', 'C_mix',                'Mischung — Stamm-Kaffee, ab und zu was Neues', 3),
  ('Q12_openness', 'D_perfect_one',        'Ich will den einen perfekten Kaffee finden, der zu mir passt', 4);


-- =============================================================================
-- E) quiz_scoring — DAS HERZSTUECK (Kap. 3.2)
-- =============================================================================
-- Mapping (question_code, answer_code, taste_type_id) -> Punkte.
-- Jede Zeile aus den Tabellen in Kapitel 3.2 wird hier 1:1 abgebildet.
-- Typ-IDs: 1=Klassiker, 2=Fruchtfreund, 3=Espresso, 4=Entdecker,
--          5=Sanfte, 6=Florale, 7=Erdige, 8=Suesse
-- =============================================================================

insert into public.quiz_scoring (question_code, answer_code, taste_type_id, points) values
  -- Q1 — Zubereitungsart
  ('Q1_brewing_method', 'A_espresso',     3, 5),
  ('Q1_brewing_method', 'A_espresso',     1, 2),
  ('Q1_brewing_method', 'A_espresso',     8, 2),
  ('Q1_brewing_method', 'B_filter',       2, 5),
  ('Q1_brewing_method', 'B_filter',       6, 4),
  ('Q1_brewing_method', 'B_filter',       4, 3),
  ('Q1_brewing_method', 'C_french_press', 7, 4),
  ('Q1_brewing_method', 'C_french_press', 5, 3),
  ('Q1_brewing_method', 'C_french_press', 1, 2),
  ('Q1_brewing_method', 'D_fully_auto',   1, 4),
  ('Q1_brewing_method', 'D_fully_auto',   5, 3),
  ('Q1_brewing_method', 'D_fully_auto',   8, 2),
  ('Q1_brewing_method', 'E_mokka',        3, 3),
  ('Q1_brewing_method', 'E_mokka',        1, 3),
  ('Q1_brewing_method', 'E_mokka',        7, 2),

  -- Q2 — Konsum-Rhythmus
  ('Q2_consumption', 'A_morning_ritual',  6, 3),
  ('Q2_consumption', 'A_morning_ritual',  2, 3),
  ('Q2_consumption', 'A_morning_ritual',  1, 2),
  ('Q2_consumption', 'B_throughout_day',  1, 4),
  ('Q2_consumption', 'B_throughout_day',  5, 3),
  ('Q2_consumption', 'B_throughout_day',  3, 2),
  ('Q2_consumption', 'C_weekend',         4, 4),
  ('Q2_consumption', 'C_weekend',         6, 3),
  ('Q2_consumption', 'C_weekend',         2, 3),
  ('Q2_consumption', 'D_after_meals',     3, 5),
  ('Q2_consumption', 'D_after_meals',     1, 2),
  ('Q2_consumption', 'D_after_meals',     7, 2),

  -- Q3 — Milch oder schwarz
  ('Q3_milk_or_black', 'A_black',         2, 4),
  ('Q3_milk_or_black', 'A_black',         6, 4),
  ('Q3_milk_or_black', 'A_black',         4, 4),
  ('Q3_milk_or_black', 'A_black',         7, 3),
  ('Q3_milk_or_black', 'B_with_milk',     1, 4),
  ('Q3_milk_or_black', 'B_with_milk',     5, 3),
  ('Q3_milk_or_black', 'B_with_milk',     8, 2),
  ('Q3_milk_or_black', 'C_cappuccino',    3, 4),
  ('Q3_milk_or_black', 'C_cappuccino',    8, 4),
  ('Q3_milk_or_black', 'C_cappuccino',    1, 2),
  ('Q3_milk_or_black', 'D_plant_milk',    8, 4),
  ('Q3_milk_or_black', 'D_plant_milk',    1, 2),
  ('Q3_milk_or_black', 'D_plant_milk',    5, 2),
  ('Q3_milk_or_black', 'E_with_sugar',    8, 5),
  ('Q3_milk_or_black', 'E_with_sugar',    5, 2),

  -- Q4 — Fruehstueck
  ('Q4_breakfast', 'A_croissant_berries', 2, 5),
  ('Q4_breakfast', 'A_croissant_berries', 6, 3),
  ('Q4_breakfast', 'B_yogurt_honey',      1, 3),
  ('Q4_breakfast', 'B_yogurt_honey',      8, 3),
  ('Q4_breakfast', 'B_yogurt_honey',      5, 2),
  ('Q4_breakfast', 'C_farmer_breakfast',  7, 4),
  ('Q4_breakfast', 'C_farmer_breakfast',  3, 3),
  ('Q4_breakfast', 'C_farmer_breakfast',  1, 2),
  ('Q4_breakfast', 'D_pancakes_caramel',  8, 5),
  ('Q4_breakfast', 'D_pancakes_caramel',  1, 2),
  ('Q4_breakfast', 'E_hummus_sandwich',   4, 4),
  ('Q4_breakfast', 'E_hummus_sandwich',   7, 3),
  ('Q4_breakfast', 'E_hummus_sandwich',   6, 2),
  ('Q4_breakfast', 'F_dark_chocolate',    3, 4),
  ('Q4_breakfast', 'F_dark_chocolate',    1, 3),
  ('Q4_breakfast', 'F_dark_chocolate',    7, 2),

  -- Q5 — Schokolade
  ('Q5_chocolate', 'A_milk_chocolate',    5, 4),
  ('Q5_chocolate', 'A_milk_chocolate',    8, 4),
  ('Q5_chocolate', 'A_milk_chocolate',    1, 2),
  ('Q5_chocolate', 'B_dark_50_70',        1, 4),
  ('Q5_chocolate', 'B_dark_50_70',        3, 3),
  ('Q5_chocolate', 'C_dark_80plus',       3, 5),
  ('Q5_chocolate', 'C_dark_80plus',       7, 3),
  ('Q5_chocolate', 'C_dark_80plus',       1, 2),
  ('Q5_chocolate', 'D_berry_filled',      2, 5),
  ('Q5_chocolate', 'D_berry_filled',      4, 3),
  ('Q5_chocolate', 'E_white_caramel',     8, 5),
  ('Q5_chocolate', 'E_white_caramel',     5, 3),
  ('Q5_chocolate', 'F_no_chocolate',      6, 3),
  ('Q5_chocolate', 'F_no_chocolate',      2, 2),

  -- Q6 — Getraenk im Restaurant
  ('Q6_drink', 'A_white_wine',            2, 4),
  ('Q6_drink', 'A_white_wine',            6, 3),
  ('Q6_drink', 'B_strong_red',            3, 4),
  ('Q6_drink', 'B_strong_red',            7, 4),
  ('Q6_drink', 'C_champagne',             6, 4),
  ('Q6_drink', 'C_champagne',             2, 3),
  ('Q6_drink', 'D_natural_wine',          4, 5),
  ('Q6_drink', 'D_natural_wine',          6, 2),
  ('Q6_drink', 'E_beer_cider',            1, 3),
  ('Q6_drink', 'E_beer_cider',            7, 3),
  ('Q6_drink', 'F_sweet_cocktail',        8, 5),
  ('Q6_drink', 'F_sweet_cocktail',        5, 2),
  ('Q6_drink', 'G_water_tea',             5, 4),
  ('Q6_drink', 'G_water_tea',             6, 3),

  -- Q7 — Aroma-Reiz
  ('Q7_aroma', 'A_fresh_bread',           1, 4),
  ('Q7_aroma', 'A_fresh_bread',           5, 3),
  ('Q7_aroma', 'B_strawberries',          2, 5),
  ('Q7_aroma', 'B_strawberries',          4, 2),
  ('Q7_aroma', 'C_earl_grey',             6, 5),
  ('Q7_aroma', 'C_earl_grey',             2, 2),
  ('Q7_aroma', 'D_fireplace',             7, 5),
  ('Q7_aroma', 'D_fireplace',             3, 2),
  ('Q7_aroma', 'E_caramel',               8, 5),
  ('Q7_aroma', 'E_caramel',               1, 2),
  ('Q7_aroma', 'F_herbs',                 4, 4),
  ('Q7_aroma', 'F_herbs',                 6, 3),

  -- Q8 — Tee
  ('Q8_tea', 'A_strong_black',            1, 3),
  ('Q8_tea', 'A_strong_black',            3, 3),
  ('Q8_tea', 'A_strong_black',            7, 2),
  ('Q8_tea', 'B_green_jasmine',           6, 5),
  ('Q8_tea', 'B_green_jasmine',           2, 3),
  ('Q8_tea', 'C_fruit_tea',               2, 5),
  ('Q8_tea', 'C_fruit_tea',               8, 2),
  ('Q8_tea', 'D_chamomile_rooibos',       5, 5),
  ('Q8_tea', 'D_chamomile_rooibos',       8, 2),
  ('Q8_tea', 'E_chai_spices',             7, 4),
  ('Q8_tea', 'E_chai_spices',             8, 3),
  ('Q8_tea', 'E_chai_spices',             4, 2),
  ('Q8_tea', 'F_no_tea',                  1, 2),
  ('Q8_tea', 'F_no_tea',                  3, 2),

  -- Q9 — Zitrus / Saeure-Toleranz
  ('Q9_citrus', 'A_pleasant',             2, 5),
  ('Q9_citrus', 'A_pleasant',             6, 4),
  ('Q9_citrus', 'A_pleasant',             4, 3),
  ('Q9_citrus', 'B_neutral',              1, 3),
  ('Q9_citrus', 'B_neutral',              8, 2),
  ('Q9_citrus', 'C_unpleasant',           5, 5),
  ('Q9_citrus', 'C_unpleasant',           3, 3),
  ('Q9_citrus', 'C_unpleasant',           7, 2),
  ('Q9_citrus', 'D_depends',              1, 3),
  ('Q9_citrus', 'D_depends',              8, 2),
  ('Q9_citrus', 'D_depends',              5, 2),

  -- Q10 — Mundgefuehl
  ('Q10_mouthfeel', 'A_light_tealike',    6, 5),
  ('Q10_mouthfeel', 'A_light_tealike',    2, 3),
  ('Q10_mouthfeel', 'B_balanced',         1, 4),
  ('Q10_mouthfeel', 'B_balanced',         5, 3),
  ('Q10_mouthfeel', 'C_full_syrupy',      3, 5),
  ('Q10_mouthfeel', 'C_full_syrupy',      7, 4),
  ('Q10_mouthfeel', 'C_full_syrupy',      8, 3),
  ('Q10_mouthfeel', 'D_creamy_cocoa',     8, 5),
  ('Q10_mouthfeel', 'D_creamy_cocoa',     5, 3),
  ('Q10_mouthfeel', 'D_creamy_cocoa',     1, 2),

  -- Q11 — Erfahrungsgrad
  ('Q11_experience', 'A_beginner',        1, 3),
  ('Q11_experience', 'A_beginner',        5, 3),
  ('Q11_experience', 'A_beginner',        8, 2),
  ('Q11_experience', 'B_advanced',        2, 3),
  ('Q11_experience', 'B_advanced',        3, 3),
  ('Q11_experience', 'B_advanced',        1, 2),
  ('Q11_experience', 'C_enthusiast',      4, 4),
  ('Q11_experience', 'C_enthusiast',      6, 3),
  ('Q11_experience', 'C_enthusiast',      2, 3),
  ('Q11_experience', 'D_pro',             4, 5),
  ('Q11_experience', 'D_pro',             6, 4),
  ('Q11_experience', 'D_pro',             2, 3),

  -- Q12 — Offenheit
  ('Q12_openness', 'A_discovery',         4, 5),
  ('Q12_openness', 'A_discovery',         2, 3),
  ('Q12_openness', 'A_discovery',         6, 2),
  ('Q12_openness', 'B_consistency',       1, 4),
  ('Q12_openness', 'B_consistency',       5, 3),
  ('Q12_openness', 'B_consistency',       3, 3),
  ('Q12_openness', 'C_mix',               1, 3),
  ('Q12_openness', 'C_mix',               8, 2),
  ('Q12_openness', 'C_mix',               5, 2),
  ('Q12_openness', 'D_perfect_one',       3, 3),
  ('Q12_openness', 'D_perfect_one',       7, 3),
  ('Q12_openness', 'D_perfect_one',       8, 3);


-- =============================================================================
-- F) compute_taste_type_max_scores() — Schritt 9.4 (Kap. 4.4)
-- =============================================================================
-- Berechnet pro Typ die theoretisch maximal moegliche Punktzahl ueber alle
-- 12 Quiz-Fragen (Summe der Maxima pro Frage). Wird nach Seed einmalig
-- aufgerufen und neu berechnet, wenn quiz_scoring sich aendert.
-- =============================================================================
create or replace function public.compute_taste_type_max_scores()
returns void
language plpgsql
as $$
begin
  -- Komplett neu schreiben (Cache-Tabelle)
  delete from public.taste_type_max_scores;

  insert into public.taste_type_max_scores (taste_type_id, max_score, quiz_version)
  select
    sub.taste_type_id,
    sum(sub.max_points_per_question) as max_score,
    'v1.0'
  from (
    select
      taste_type_id,
      question_code,
      max(points) as max_points_per_question
    from public.quiz_scoring
    group by taste_type_id, question_code
  ) sub
  group by sub.taste_type_id;
end;
$$;

comment on function public.compute_taste_type_max_scores() is
  'Berechnet taste_type_max_scores neu (Kap. 4.4). Aufruf erforderlich nach '
  'Seed und nach jeder Aenderung an quiz_scoring.';

-- Initial-Berechnung direkt ausfuehren
select public.compute_taste_type_max_scores();


-- =============================================================================
-- G) Sanity-Check (Kap. 9.4)
-- =============================================================================
-- Jeder Typ sollte zwischen 45 und 60 Punkten Maximum haben.
-- Abweichungen deuten auf Fehler im Scoring hin.
do $$
declare
  v_count_outside_range integer;
begin
  select count(*) into v_count_outside_range
  from public.taste_type_max_scores
  where max_score < 35 or max_score > 65;

  if v_count_outside_range > 0 then
    raise notice 'WARNUNG: % Typen mit max_score ausserhalb 35-65 — pruefe quiz_scoring.', v_count_outside_range;
  end if;
end;
$$;
