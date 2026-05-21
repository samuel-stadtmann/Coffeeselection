-- ============================================================================
-- P6+P7 — taste_types als Single-Source-Of-Truth
--
-- Erweitert die taste_types-Tabelle um die Marketing-/UI-Felder die bisher
-- nur hardcoded in lib/taste-types.ts existierten:
--   - tagline_de               (kurzer Pitch unter dem Namen)
--   - icon                     (Material-Symbols-Name)
--   - hero_desc_de             (1-2 Saetze fuer Hero-Bereich)
--   - long_desc_de             (vollstaendige Beschreibung)
--   - aromas_de                (Display-Aromas in DE, getrennt von aroma_families)
--   - brewing_methods          (Empfohlene Zubereitungsmethoden)
--   - seo_title_de
--   - seo_description_de
--   - seo_keywords             (Array)
--
-- Werte werden aus lib/taste-types.ts (Stand 2026-05-10) per UPDATE-Mapping
-- by slug seediert. Schema-Constraint: nichts NOT NULL, damit existierende
-- Rows nicht brechen.
--
-- P7 (Skala 0-100 vs 1-5): KEINE Schema-Aenderung. Die DB bleibt bei der
-- 1-5 SCA-Skala fuer acidity/body/sweetness/bitterness/complexity (das ist
-- die Wahrheit fuer den Algorithmus). Der neue lib/db/taste-types.ts
-- multipliziert mit 20 wenn das Frontend 0-100-Bars braucht.
-- ============================================================================

alter table public.taste_types
  add column if not exists tagline_de         text,
  add column if not exists icon               text,
  add column if not exists hero_desc_de       text,
  add column if not exists long_desc_de       text,
  add column if not exists aromas_de          text[],
  add column if not exists brewing_methods    text[],
  add column if not exists seo_title_de       text,
  add column if not exists seo_description_de text,
  add column if not exists seo_keywords       text[];

comment on column public.taste_types.tagline_de         is 'Kurzer Marketing-Pitch (4-6 Worte) unter dem Namen.';
comment on column public.taste_types.icon               is 'Material Symbols Icon-Name fuer die UI (z.B. "coffee").';
comment on column public.taste_types.hero_desc_de       is 'Hero-Beschreibung (1-2 Saetze) fuer Detail-Page Top.';
comment on column public.taste_types.long_desc_de       is 'Vollstaendiger Beschreibungstext (4-6 Saetze).';
comment on column public.taste_types.aromas_de          is 'Display-Aromas in Deutsch (z.B. "Karamell","Schokolade"). Getrennt von aroma_families (Algorithmus-Slugs).';
comment on column public.taste_types.brewing_methods    is 'Empfohlene Zubereitungsmethoden (z.B. "V60","Espresso").';

-- ----------------------------------------------------------------------------
-- Seed: alle 8 Geschmackstypen by slug aktualisieren.
-- Quelle: lib/taste-types.ts Stand 2026-05-10.
-- ----------------------------------------------------------------------------

update public.taste_types set
  tagline_de         = 'Ausgewogen, nussig, schokoladig',
  icon               = 'coffee',
  hero_desc_de       = 'Du schaetzt einen ausbalancierten Kaffee mit nussigen Aromen, milder Suesse und keiner Ueberraschung. Dein perfekter Begleiter fuer jeden Morgen — verlaesslich wie ein guter Freund.',
  long_desc_de       = 'Der Klassiker ist der Inbegriff von Verlaesslichkeit. Du suchst keinen experimentellen Kaffee, sondern einen, der morgen genauso schmeckt wie heute. Mittlere Roestung, mittlere Saeure, vollmundiger Koerper. Brasilianische und kolumbianische Bohnen treffen genau deinen Geschmacksnerv. Suesse Karamell-Noten, dezente Schokolade, leichte Nuss — Specialty Coffee in seiner zeitlosesten Form.',
  aromas_de          = ARRAY['Karamell','Schokolade','Haselnuss','Mandel','Vanille'],
  brewing_methods    = ARRAY['Vollautomat','Filter','French Press','Aeropress'],
  seo_title_de       = 'Klassischer Kaffee — der ausgewogene Specialty Coffee',
  seo_description_de = 'Nussig, schokoladig, ausbalanciert. Entdecke Schweizer Specialty Coffee fuer Klassiker — Brasilien, Kolumbien, Honduras. Direct Trade, roestfrisch.',
  seo_keywords       = ARRAY['klassischer kaffee','ausgewogener kaffee','nussiger kaffee','schokoladiger kaffee','schweizer kaffee abo']
where slug = 'der-klassiker';

update public.taste_types set
  tagline_de         = 'Beerig, lebendig, hell',
  icon               = 'nutrition',
  hero_desc_de       = 'Lebendige Fruchtnoten, helle Saeure, klare Aromen — du suchst den Wow-Moment in jedem Schluck. Aethiopien und Kenia sind dein Spielfeld.',
  long_desc_de       = 'Der Fruchtfreund liebt Kaffee, der wie Wein schmeckt. Lebendige Saeure, beerige Aromen, florale Nuancen. Du erkennst Geisha-Varietaeten am Geruch, du diskutierst ueber Anaerobic-Fermentation. Helle Roestungen aus Aethiopien, Kenia und Ruanda treffen dein Profil. Erdbeere, Brombeere, Limette, Bergamotte — der ganze Aromen-Garten in der Tasse.',
  aromas_de          = ARRAY['Erdbeere','Brombeere','Limette','Bergamotte','Aprikose','Pfirsich'],
  brewing_methods    = ARRAY['V60','Chemex','Aeropress','Cold Brew'],
  seo_title_de       = 'Fruchtiger Kaffee — beerig, lebendig, Specialty',
  seo_description_de = 'Fruchtige Specialty Coffees aus Aethiopien, Kenia, Ruanda. Helle Roestungen mit Beeren, Zitrus, floralen Noten. Schweizer Direct Trade.',
  seo_keywords       = ARRAY['fruchtiger kaffee','fruchtige kaffeebohnen','aethiopischer filterkaffee','specialty coffee fruity','kenya kaffee','helle roestung']
where slug = 'der-fruchtfreund';

update public.taste_types set
  tagline_de         = 'Intensiv, kraeftig, italienisch',
  icon               = 'local_fire_department',
  hero_desc_de       = 'Du brauchst Druck, Crema und Charakter. Espresso ist fuer dich kein Getraenk, sondern ein Ritual — kurz, intensiv, perfekt.',
  long_desc_de       = 'Der Espresso-Enthusiast lebt fuer die 25 Sekunden zwischen Mahlen und Tassendurchlauf. Italienische Tradition trifft Schweizer Praezision. Dunklere Roestungen, klassische Espresso-Blends mit Brasilien-Basis und aethiopischer Saeure-Spitze. Kakao, Karamell, dunkle Schokolade, ein Hauch Tabak. Dichter Koerper, anhaltender Abgang.',
  aromas_de          = ARRAY['Dunkle Schokolade','Kakao','Karamell','Tabak','Brauner Zucker','Trockenfruechte'],
  brewing_methods    = ARRAY['Siebtraeger','Vollautomat','Moka Pot'],
  seo_title_de       = 'Espresso-Bohnen — kraeftig, italienisch, Premium',
  seo_description_de = 'Espresso-Bohnen fuer Siebtraeger und Vollautomat. Italienische Roestungen, dunkle Schokolade & Crema. Schweizer Specialty Coffee.',
  seo_keywords       = ARRAY['espresso bohnen','italienischer espresso','kraeftiger espresso','espresso siebtraeger','dunkle roestung','espresso blend']
where slug = 'der-espresso-enthusiast';

update public.taste_types set
  tagline_de         = 'Experimentell, vielseitig, neugierig',
  icon               = 'explore',
  hero_desc_de       = 'Du willst nie zweimal denselben Kaffee. Anaerobic, Honey Process, Yeast Fermentation — jede Woche ein neues Abenteuer.',
  long_desc_de       = 'Der Entdecker ist der Pionier unter den Kaffeetrinkern. Du verfolgst die World Brewers Cup, kennst die Namen der Q-Grader, trinkst experimentelle Aufbereitungen aus Costa Rica und Panama. Anaerobic Natural, Carbonic Maceration, Lactic Process — du willst alles probieren. Tropische Fruechte, exotische Gewuerze, fermentierte Noten. Dein Kaffee ist ein Labor.',
  aromas_de          = ARRAY['Tropische Fruechte','Mango','Lychee','Gewuerze','Wein-Note','Kardamom'],
  brewing_methods    = ARRAY['V60','Chemex','Aeropress','Espresso'],
  seo_title_de       = 'Experimenteller Specialty Coffee — Anaerobic, Geisha, Rare Lots',
  seo_description_de = 'Rare Specialty Coffees aus Panama, Costa Rica, Aethiopien. Anaerobic Naturals, Geisha, experimentelle Aufbereitungen.',
  seo_keywords       = ARRAY['geisha kaffee','anaerobic coffee','rare specialty coffee','experimenteller kaffee','panama geisha','costa rica anaerobic']
where slug = 'der-entdecker';

update public.taste_types set
  tagline_de         = 'Mild, niedrige Saeure, weich',
  icon               = 'spa',
  hero_desc_de       = 'Saeure macht dir Magenprobleme? Du suchst den weichen, milden Kaffee ohne Bitterkeit — den Genuss ohne Reue.',
  long_desc_de       = 'Der Sanfte ist sensibel — und das ist eine Staerke. Du suchst Kaffee, der nicht im Magen brennt, nicht bitter wird, nicht aggressiv schmeckt. Sumatra, Brasilien Natural und gut entwickelte mittlere Roestungen sind dein Zuhause. Niedriger Saeuregehalt, milder Koerper, dezente Suesse. Schokolade, Karamell, ein Hauch Nuss. Magenfreundlich, aber nie langweilig.',
  aromas_de          = ARRAY['Milchschokolade','Karamell','Honig','Mandel','Brauner Zucker'],
  brewing_methods    = ARRAY['Vollautomat','French Press','Filter','Cold Brew'],
  seo_title_de       = 'Saeurearmer Kaffee — magenfreundlich, mild, Specialty',
  seo_description_de = 'Saeurearmer Kaffee mit niedrigem Saeuregehalt. Sumatra, Brasilien — magenfreundlich, mild, entkoffeiniert verfuegbar.',
  seo_keywords       = ARRAY['saeurearmer kaffee','magenfreundlicher kaffee','milder kaffee','kaffee ohne saeure','sumatra kaffee','low acid coffee']
where slug = 'der-sanfte';

update public.taste_types set
  tagline_de         = 'Jasmin, Bergamotte, Tee-artig',
  icon               = 'local_florist',
  hero_desc_de       = 'Wenn dein Kaffee nach Jasmin und Bergamotte duftet, ist alles richtig. Tee-artige Klarheit, florale Eleganz — Specialty in seiner feinsten Form.',
  long_desc_de       = 'Der Florale schaetzt Subtilitaet. Wo andere nach Intensitaet suchen, suchst du nach Klarheit. Helle, sauber gewaschene Aethiopier (besonders Yirgacheffe), Hochland-Lagen, sortenreine Heirloom-Varietaeten. Jasmin-Blueten, Bergamotte, schwarzer Tee, weisse Pfirsiche. Die elegantesten Geschmaecker im Kaffee-Universum — fragil und unvergesslich.',
  aromas_de          = ARRAY['Jasmin','Bergamotte','Schwarzer Tee','Weisser Pfirsich','Rosenwasser','Lavendel'],
  brewing_methods    = ARRAY['V60','Chemex','Kalita Wave'],
  seo_title_de       = 'Floraler Kaffee — Jasmin, Bergamotte, Tee-artig',
  seo_description_de = 'Florale Specialty Coffees aus Aethiopien, Jemen. Jasmin, Bergamotte, weisser Tee. Helle Roestungen fuer Filter & Pour Over.',
  seo_keywords       = ARRAY['floraler kaffee','jasmin kaffee','bergamotte kaffee','yirgacheffe','tee-artiger kaffee','specialty coffee floral']
where slug = 'der-florale';

update public.taste_types set
  tagline_de         = 'Wuerzig, holzig, dunkel',
  icon               = 'park',
  hero_desc_de       = 'Du magst es bodenstaendig: Erdige, wuerzige Kaffees mit Charakter. Tabak, Zedernholz, Gewuerze — dein Kaffee soll erzaehlen.',
  long_desc_de       = 'Der Erdige liebt Kaffees mit Tiefe. Indonesische Bohnen — Sumatra Wet-Hulled, Sulawesi, Java — geben dir genau das, was du suchst. Wuerzige Noten, holzige Aromen, erdige Untertoene. Ein Hauch Pfeife, dunkles Karamell, Zedernholz. Weniger Saeure, mehr Substanz. Old-School-Specialty mit Charakter, der dich an Holzfeuer und alte Bibliotheken erinnert.',
  aromas_de          = ARRAY['Tabak','Zedernholz','Gewuerze','Dunkles Holz','Erde','Pfeffer'],
  brewing_methods    = ARRAY['French Press','Moka Pot','Espresso','Cold Brew'],
  seo_title_de       = 'Erdiger Kaffee — wuerzig, indonesisch, kraeftiger Koerper',
  seo_description_de = 'Erdige Specialty Coffees aus Sumatra, Sulawesi, Java. Wuerzige, holzige Aromen mit kraeftigem Koerper.',
  seo_keywords       = ARRAY['erdiger kaffee','wuerziger kaffee','sumatra kaffee','indonesischer kaffee','vollmundiger kaffee','holziger kaffee']
where slug = 'der-erdige';

update public.taste_types set
  tagline_de         = 'Karamell, Honig, Schokolade',
  icon               = 'cake',
  hero_desc_de       = 'Honig-Suesse, Karamell-Tiefe, Schokoladen-Waerme. Du suchst Kaffee als suessen Begleiter — ohne Zucker zu brauchen.',
  long_desc_de       = 'Der Suesse kennt das Geheimnis: Specialty Coffee ist von Natur aus suess. Honey-Process aus Costa Rica, Naturals aus Brasilien, Yellow Bourbon — alles, was die natuerliche Suesse der Bohne maximiert. Karamell, Honig, Milchschokolade, brauner Zucker, Trockenfruechte. Mittelkraeftiger Koerper, weiche Saeure, ein langer suesser Abgang. Dessert in der Tasse.',
  aromas_de          = ARRAY['Karamell','Honig','Milchschokolade','Brauner Zucker','Vanille','Datteln'],
  brewing_methods    = ARRAY['V60','Aeropress','Vollautomat','Espresso'],
  seo_title_de       = 'Suesser Kaffee — Karamell, Honig, Schokolade',
  seo_description_de = 'Suesse Specialty Coffees aus Costa Rica, Brasilien, Guatemala. Honey-Process, Naturals, Yellow Bourbon. Schokoladig-suess ohne Zucker.',
  seo_keywords       = ARRAY['suesser kaffee','karamell kaffee','schokoladiger kaffee','honey process coffee','yellow bourbon','natural processed coffee']
where slug = 'der-suesse';
