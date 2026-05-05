-- =============================================================================
-- Migration 025 — Demo-Kaffees: Dimensionen an echte taste_types anpassen
-- =============================================================================
-- Die Demo-Kaffees wurden mit geschaetzten Werten erstellt. Die tatsaechlichen
-- taste_types-Profile in der DB weichen ab. Hier werden alle 8 Kaffees so
-- angepasst, dass ihre Dimensionen exakt dem jeweiligen Typ-Profil entsprechen
-- -> E2E-Test sollte 8/8 PASS liefern.
--
-- Quelle: SELECT id, acidity, body, sweetness, bitterness, roast_level,
--                complexity FROM public.taste_types ORDER BY id;
--
--  id | acidity | body | sweetness | bitterness | roast_level | complexity
--   1 |    2    |   3  |     3     |      3     |      3      |     2   (classic)
--   2 |    4    |   2  |     4     |      1     |      2      |     4   (fruity)
--   3 |    1    |   5  |     3     |      4     |      4      |     2   (espresso)
--   4 |    4    |   3  |     4     |      2     |      2      |     5   (explorer)
--   5 |    1    |   3  |     4     |      2     |      3      |     2   (gentle)
--   6 |    4    |   1  |     3     |      1     |      1      |     4   (floral)
--   7 |    2    |   5  |     2     |      3     |      4      |     4   (earthy)
--   8 |    2    |   4  |     5     |      2     |      3      |     2   (sweet)
-- =============================================================================

update public.coffees set
  acidity=2, body=3, sweetness=3, bitterness=3, roast_level=3, roast_level_text='medium', complexity=2
where id = 'c0000001-0000-0000-0000-000000000000';  -- Klassiker (Typ 1)

update public.coffees set
  acidity=4, body=2, sweetness=4, bitterness=1, roast_level=2, roast_level_text='medium_light', complexity=4
where id = 'c0000002-0000-0000-0000-000000000000';  -- Fruchtfreund (Typ 2)

update public.coffees set
  acidity=1, body=5, sweetness=3, bitterness=4, roast_level=4, roast_level_text='medium_dark', complexity=2
where id = 'c0000003-0000-0000-0000-000000000000';  -- Espresso-Enthusiast (Typ 3)

update public.coffees set
  acidity=4, body=3, sweetness=4, bitterness=2, roast_level=2, roast_level_text='medium_light', complexity=5
where id = 'c0000004-0000-0000-0000-000000000000';  -- Entdecker (Typ 4)

update public.coffees set
  acidity=1, body=3, sweetness=4, bitterness=2, roast_level=3, roast_level_text='medium', complexity=2
where id = 'c0000005-0000-0000-0000-000000000000';  -- Sanfte (Typ 5)

update public.coffees set
  acidity=4, body=1, sweetness=3, bitterness=1, roast_level=1, roast_level_text='light', complexity=4
where id = 'c0000006-0000-0000-0000-000000000000';  -- Florale (Typ 6)

update public.coffees set
  acidity=2, body=5, sweetness=2, bitterness=3, roast_level=4, roast_level_text='medium_dark', complexity=4
where id = 'c0000007-0000-0000-0000-000000000000';  -- Erdige (Typ 7)

update public.coffees set
  acidity=2, body=4, sweetness=5, bitterness=2, roast_level=3, roast_level_text='medium', complexity=2
where id = 'c0000008-0000-0000-0000-000000000000';  -- Suesse (Typ 8)
