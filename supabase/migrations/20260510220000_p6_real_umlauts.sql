-- ============================================================================
-- P6 Followup #2 — echte Umlaute statt ae/oe/ue/ss
--
-- Die Seed-Migrations haben aus Vorsicht ASCII-sichere Schreibweise gewaehlt
-- (kraeftig, suess, Saeure, ...). Postgres handhabt UTF-8 problemlos —
-- daher ueberschreiben wir mit korrektem Deutsch.
-- ============================================================================

update public.taste_types set
  tagline_de         = 'Ausgewogen, nussig, schokoladig',
  hero_desc_de       = 'Du schätzt einen ausbalancierten Kaffee mit nussigen Aromen, milder Süße und keiner Überraschung. Dein perfekter Begleiter für jeden Morgen — verlässlich wie ein guter Freund.',
  long_desc_de       = 'Der Klassiker ist der Inbegriff von Verlässlichkeit. Du suchst keinen experimentellen Kaffee, sondern einen, der morgen genauso schmeckt wie heute. Mittlere Röstung, mittlere Säure, vollmundiger Körper. Brasilianische und kolumbianische Bohnen treffen genau deinen Geschmacksnerv. Süße Karamell-Noten, dezente Schokolade, leichte Nuss — Specialty Coffee in seiner zeitlosesten Form.',
  seo_title_de       = 'Klassischer Kaffee — der ausgewogene Specialty Coffee',
  seo_description_de = 'Nussig, schokoladig, ausbalanciert. Entdecke Schweizer Specialty Coffee für Klassiker — Brasilien, Kolumbien, Honduras. Direct Trade, röstfrisch.'
where id = 1;

update public.taste_types set
  tagline_de         = 'Beerig, lebendig, hell',
  hero_desc_de       = 'Lebendige Fruchtnoten, helle Säure, klare Aromen — du suchst den Wow-Moment in jedem Schluck. Äthiopien und Kenia sind dein Spielfeld.',
  long_desc_de       = 'Der Fruchtfreund liebt Kaffee, der wie Wein schmeckt. Lebendige Säure, beerige Aromen, florale Nuancen. Du erkennst Geisha-Varietäten am Geruch, du diskutierst über Anaerobic-Fermentation. Helle Röstungen aus Äthiopien, Kenia und Ruanda treffen dein Profil. Erdbeere, Brombeere, Limette, Bergamotte — der ganze Aromen-Garten in der Tasse.',
  seo_title_de       = 'Fruchtiger Kaffee — beerig, lebendig, Specialty',
  seo_description_de = 'Fruchtige Specialty Coffees aus Äthiopien, Kenia, Ruanda. Helle Röstungen mit Beeren, Zitrus, floralen Noten. Schweizer Direct Trade.',
  seo_keywords       = ARRAY['fruchtiger kaffee','fruchtige kaffeebohnen','äthiopischer filterkaffee','specialty coffee fruity','kenya kaffee','helle röstung']
where id = 2;

update public.taste_types set
  tagline_de         = 'Intensiv, kräftig, italienisch',
  hero_desc_de       = 'Du brauchst Druck, Crema und Charakter. Espresso ist für dich kein Getränk, sondern ein Ritual — kurz, intensiv, perfekt.',
  long_desc_de       = 'Der Espresso-Enthusiast lebt für die 25 Sekunden zwischen Mahlen und Tassendurchlauf. Italienische Tradition trifft Schweizer Präzision. Dunklere Röstungen, klassische Espresso-Blends mit Brasilien-Basis und äthiopischer Säure-Spitze. Kakao, Karamell, dunkle Schokolade, ein Hauch Tabak. Dichter Körper, anhaltender Abgang.',
  aromas_de          = ARRAY['Dunkle Schokolade','Kakao','Karamell','Tabak','Brauner Zucker','Trockenfrüchte'],
  brewing_methods    = ARRAY['Siebträger','Vollautomat','Moka Pot'],
  seo_title_de       = 'Espresso-Bohnen — kräftig, italienisch, Premium',
  seo_description_de = 'Espresso-Bohnen für Siebträger und Vollautomat. Italienische Röstungen, dunkle Schokolade & Crema. Schweizer Specialty Coffee.',
  seo_keywords       = ARRAY['espresso bohnen','italienischer espresso','kräftiger espresso','espresso siebträger','dunkle röstung','espresso blend']
where id = 3;

update public.taste_types set
  tagline_de         = 'Experimentell, vielseitig, neugierig',
  hero_desc_de       = 'Du willst nie zweimal denselben Kaffee. Anaerobic, Honey Process, Yeast Fermentation — jede Woche ein neues Abenteuer.',
  long_desc_de       = 'Der Entdecker ist der Pionier unter den Kaffeetrinkern. Du verfolgst die World Brewers Cup, kennst die Namen der Q-Grader, trinkst experimentelle Aufbereitungen aus Costa Rica und Panama. Anaerobic Natural, Carbonic Maceration, Lactic Process — du willst alles probieren. Tropische Früchte, exotische Gewürze, fermentierte Noten. Dein Kaffee ist ein Labor.',
  aromas_de          = ARRAY['Tropische Früchte','Mango','Lychee','Gewürze','Wein-Note','Kardamom'],
  seo_description_de = 'Rare Specialty Coffees aus Panama, Costa Rica, Äthiopien. Anaerobic Naturals, Geisha, experimentelle Aufbereitungen.'
where id = 4;

update public.taste_types set
  tagline_de         = 'Mild, niedrige Säure, weich',
  hero_desc_de       = 'Säure macht dir Magenprobleme? Du suchst den weichen, milden Kaffee ohne Bitterkeit — den Genuss ohne Reue.',
  long_desc_de       = 'Der Sanfte ist sensibel — und das ist eine Stärke. Du suchst Kaffee, der nicht im Magen brennt, nicht bitter wird, nicht aggressiv schmeckt. Sumatra, Brasilien Natural und gut entwickelte mittlere Röstungen sind dein Zuhause. Niedriger Säuregehalt, milder Körper, dezente Süße. Schokolade, Karamell, ein Hauch Nuss. Magenfreundlich, aber nie langweilig.',
  seo_title_de       = 'Säurearmer Kaffee — magenfreundlich, mild, Specialty',
  seo_description_de = 'Säurearmer Kaffee mit niedrigem Säuregehalt. Sumatra, Brasilien — magenfreundlich, mild, entkoffeiniert verfügbar.',
  seo_keywords       = ARRAY['säurearmer kaffee','magenfreundlicher kaffee','milder kaffee','kaffee ohne säure','sumatra kaffee','low acid coffee']
where id = 5;

update public.taste_types set
  tagline_de         = 'Jasmin, Bergamotte, Tee-artig',
  hero_desc_de       = 'Wenn dein Kaffee nach Jasmin und Bergamotte duftet, ist alles richtig. Tee-artige Klarheit, florale Eleganz — Specialty in seiner feinsten Form.',
  long_desc_de       = 'Der Florale schätzt Subtilität. Wo andere nach Intensität suchen, suchst du nach Klarheit. Helle, sauber gewaschene Äthiopier (besonders Yirgacheffe), Hochland-Lagen, sortenreine Heirloom-Varietäten. Jasmin-Blüten, Bergamotte, schwarzer Tee, weiße Pfirsiche. Die elegantesten Geschmäcker im Kaffee-Universum — fragil und unvergesslich.',
  aromas_de          = ARRAY['Jasmin','Bergamotte','Schwarzer Tee','Weißer Pfirsich','Rosenwasser','Lavendel'],
  seo_description_de = 'Florale Specialty Coffees aus Äthiopien, Jemen. Jasmin, Bergamotte, weißer Tee. Helle Röstungen für Filter & Pour Over.'
where id = 6;

update public.taste_types set
  tagline_de         = 'Würzig, holzig, dunkel',
  hero_desc_de       = 'Du magst es bodenständig: Erdige, würzige Kaffees mit Charakter. Tabak, Zedernholz, Gewürze — dein Kaffee soll erzählen.',
  long_desc_de       = 'Der Erdige liebt Kaffees mit Tiefe. Indonesische Bohnen — Sumatra Wet-Hulled, Sulawesi, Java — geben dir genau das, was du suchst. Würzige Noten, holzige Aromen, erdige Untertöne. Ein Hauch Pfeife, dunkles Karamell, Zedernholz. Weniger Säure, mehr Substanz. Old-School-Specialty mit Charakter, der dich an Holzfeuer und alte Bibliotheken erinnert.',
  aromas_de          = ARRAY['Tabak','Zedernholz','Gewürze','Dunkles Holz','Erde','Pfeffer'],
  seo_title_de       = 'Erdiger Kaffee — würzig, indonesisch, kräftiger Körper',
  seo_description_de = 'Erdige Specialty Coffees aus Sumatra, Sulawesi, Java. Würzige, holzige Aromen mit kräftigem Körper.',
  seo_keywords       = ARRAY['erdiger kaffee','würziger kaffee','sumatra kaffee','indonesischer kaffee','vollmundiger kaffee','holziger kaffee']
where id = 7;

update public.taste_types set
  tagline_de         = 'Karamell, Honig, Schokolade',
  hero_desc_de       = 'Honig-Süße, Karamell-Tiefe, Schokoladen-Wärme. Du suchst Kaffee als süßen Begleiter — ohne Zucker zu brauchen.',
  long_desc_de       = 'Der Süße kennt das Geheimnis: Specialty Coffee ist von Natur aus süß. Honey-Process aus Costa Rica, Naturals aus Brasilien, Yellow Bourbon — alles, was die natürliche Süße der Bohne maximiert. Karamell, Honig, Milchschokolade, brauner Zucker, Trockenfrüchte. Mittelkräftiger Körper, weiche Säure, ein langer süßer Abgang. Dessert in der Tasse.',
  aromas_de          = ARRAY['Karamell','Honig','Milchschokolade','Brauner Zucker','Vanille','Datteln'],
  seo_title_de       = 'Süßer Kaffee — Karamell, Honig, Schokolade',
  seo_description_de = 'Süße Specialty Coffees aus Costa Rica, Brasilien, Guatemala. Honey-Process, Naturals, Yellow Bourbon. Schokoladig-süß ohne Zucker.',
  seo_keywords       = ARRAY['süßer kaffee','karamell kaffee','schokoladiger kaffee','honey process coffee','yellow bourbon','natural processed coffee']
where id = 8;
