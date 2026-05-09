export type TasteType = {
  slug: string;
  name: string;
  tagline: string;
  icon: string;
  heroDesc: string;
  longDesc: string;
  profile: { label: string; value: number }[];
  aromas: string[];
  brewing: string[];
  coffees: { name: string; roaster: string; origin: string; price: string; matchScore: number }[];
  roasters: { name: string; city: string; specialty: string }[];
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
};

export const tasteTypes: TasteType[] = [
  {
    slug: "der-klassiker",
    name: "Der Klassiker",
    tagline: "Ausgewogen, nussig, schokoladig",
    icon: "coffee",
    heroDesc: "Du schätzt einen ausbalancierten Kaffee mit nussigen Aromen, milder Süße und keiner Überraschung. Dein perfekter Begleiter für jeden Morgen — verlässlich wie ein guter Freund.",
    longDesc: "Der Klassiker ist der Inbegriff von Verlässlichkeit. Du suchst keinen experimentellen Kaffee, sondern einen, der morgen genauso schmeckt wie heute. Mittlere Röstung, mittlere Säure, vollmundiger Körper. Brasilianische und kolumbianische Bohnen treffen genau deinen Geschmacksnerv. Süße Karamell-Noten, dezente Schokolade, leichte Nuss — Specialty Coffee in seiner zeitlosesten Form.",
    profile: [
      { label: "Säure", value: 50 },
      { label: "Süße", value: 70 },
      { label: "Körper", value: 75 },
      { label: "Bitterkeit", value: 40 },
      { label: "Komplexität", value: 50 },
    ],
    aromas: ["Karamell", "Schokolade", "Haselnuss", "Mandel", "Vanille"],
    brewing: ["Vollautomat", "Filter", "French Press", "Aeropress"],
    coffees: [
      { name: "Brasil Cerrado", roaster: "Miro Coffee", origin: "Brasilien", price: "CHF 22", matchScore: 95 },
      { name: "Colombia Supremo", roaster: "Vertical Coffee", origin: "Kolumbien", price: "CHF 24", matchScore: 92 },
      { name: "Honduras Marcala", roaster: "Stoll Kaffee", origin: "Honduras", price: "CHF 23", matchScore: 88 },
    ],
    roasters: [
      { name: "Miro Coffee", city: "Zürich", specialty: "Klassische Mittelröstung" },
      { name: "Vertical Coffee", city: "Bern", specialty: "Single Origin Klassiker" },
      { name: "Stoll Kaffee", city: "Luzern", specialty: "Familienrösterei seit 1928" },
    ],
    seoTitle: "Klassischer Kaffee — der ausgewogene Specialty Coffee",
    seoDescription: "Nussig, schokoladig, ausbalanciert. Entdecke Schweizer Specialty Coffee für Klassiker — Brasilien, Kolumbien, Honduras. Direct Trade, röstfrisch.",
    seoKeywords: ["klassischer kaffee", "ausgewogener kaffee", "nussiger kaffee", "schokoladiger kaffee", "schweizer kaffee abo"],
  },
  {
    slug: "der-fruchtfreund",
    name: "Der Fruchtfreund",
    tagline: "Beerig, lebendig, hell",
    icon: "nutrition",
    heroDesc: "Lebendige Fruchtnoten, helle Säure, klare Aromen — du suchst den Wow-Moment in jedem Schluck. Äthiopien und Kenia sind dein Spielfeld.",
    longDesc: "Der Fruchtfreund liebt Kaffee, der wie Wein schmeckt. Lebendige Säure, beerige Aromen, florale Nuancen. Du erkennst Geisha-Varietäten am Geruch, du diskutierst über Anaerobic-Fermentation. Helle Röstungen aus Äthiopien, Kenia und Ruanda treffen dein Profil. Erdbeere, Brombeere, Limette, Bergamotte — der ganze Aromen-Garten in der Tasse.",
    profile: [
      { label: "Säure", value: 90 },
      { label: "Süße", value: 70 },
      { label: "Körper", value: 35 },
      { label: "Bitterkeit", value: 20 },
      { label: "Komplexität", value: 90 },
    ],
    aromas: ["Erdbeere", "Brombeere", "Limette", "Bergamotte", "Aprikose", "Pfirsich"],
    brewing: ["V60", "Chemex", "Aeropress", "Cold Brew"],
    coffees: [
      { name: "Ethiopia Yirgacheffe", roaster: "Miro Coffee", origin: "Äthiopien", price: "CHF 28", matchScore: 96 },
      { name: "Kenya AA Nyeri", roaster: "Vertical Coffee", origin: "Kenia", price: "CHF 32", matchScore: 94 },
      { name: "Rwanda Anaerobic", roaster: "La Cabra", origin: "Ruanda", price: "CHF 36", matchScore: 90 },
    ],
    roasters: [
      { name: "Miro Coffee", city: "Zürich", specialty: "Nordischer Hellröst-Stil" },
      { name: "La Cabra Schweiz", city: "Basel", specialty: "Anaerobic Fermentation" },
      { name: "Sweven Coffee", city: "Genf", specialty: "Single Origin Lights" },
    ],
    seoTitle: "Fruchtiger Kaffee — beerig, lebendig, Specialty",
    seoDescription: "Fruchtige Specialty Coffees aus Äthiopien, Kenia, Ruanda. Helle Röstungen mit Beeren, Zitrus, floralen Noten. Schweizer Direct Trade.",
    seoKeywords: ["fruchtiger kaffee", "fruchtige kaffeebohnen", "äthiopischer filterkaffee", "specialty coffee fruity", "kenya kaffee", "helle röstung"],
  },
  {
    slug: "der-espresso-enthusiast",
    name: "Der Espresso-Enthusiast",
    tagline: "Intensiv, kräftig, italienisch",
    icon: "local_fire_department",
    heroDesc: "Du brauchst Druck, Crema und Charakter. Espresso ist für dich kein Getränk, sondern ein Ritual — kurz, intensiv, perfekt.",
    longDesc: "Der Espresso-Enthusiast lebt für die 25 Sekunden zwischen Mahlen und Tassendurchlauf. Italienische Tradition trifft Schweizer Präzision. Dunklere Röstungen, klassische Espresso-Blends mit Brasilien-Basis und äthiopischer Säure-Spitze. Kakao, Karamell, dunkle Schokolade, ein Hauch Tabak. Dichter Körper, anhaltender Abgang.",
    profile: [
      { label: "Säure", value: 35 },
      { label: "Süße", value: 65 },
      { label: "Körper", value: 90 },
      { label: "Bitterkeit", value: 70 },
      { label: "Komplexität", value: 60 },
    ],
    aromas: ["Dunkle Schokolade", "Kakao", "Karamell", "Tabak", "Brauner Zucker", "Trockenfrüchte"],
    brewing: ["Siebträger", "Vollautomat", "Moka Pot"],
    coffees: [
      { name: "Espresso Tradizionale", roaster: "Stoll Kaffee", origin: "Blend", price: "CHF 24", matchScore: 95 },
      { name: "Brasil Mogiana Dark", roaster: "Miro Coffee", origin: "Brasilien", price: "CHF 22", matchScore: 92 },
      { name: "Italian Roast Blend", roaster: "Atelier Espresso", origin: "Blend", price: "CHF 26", matchScore: 90 },
    ],
    roasters: [
      { name: "Atelier Espresso", city: "Zürich", specialty: "Italienische Espressoröstung" },
      { name: "Stoll Kaffee", city: "Luzern", specialty: "Klassische Espresso-Blends" },
      { name: "Caffè Chicco d'Oro", city: "Tessin", specialty: "Tradizione italiana" },
    ],
    seoTitle: "Espresso-Bohnen — kräftig, italienisch, Premium",
    seoDescription: "Espresso-Bohnen für Siebträger und Vollautomat. Italienische Röstungen, dunkle Schokolade & Crema. Schweizer Specialty Coffee.",
    seoKeywords: ["espresso bohnen", "italienischer espresso", "kräftiger espresso", "espresso siebträger", "dunkle röstung", "espresso blend"],
  },
  {
    slug: "der-entdecker",
    name: "Der Entdecker",
    tagline: "Experimentell, vielseitig, neugierig",
    icon: "explore",
    heroDesc: "Du willst nie zweimal denselben Kaffee. Anaerobic, Honey Process, Yeast Fermentation — jede Woche ein neues Abenteuer.",
    longDesc: "Der Entdecker ist der Pionier unter den Kaffeetrinkern. Du verfolgst die World Brewers Cup, kennst die Namen der Q-Grader, trinkst experimentelle Aufbereitungen aus Costa Rica und Panama. Anaerobic Natural, Carbonic Maceration, Lactic Process — du willst alles probieren. Tropische Früchte, exotische Gewürze, fermentierte Noten. Dein Kaffee ist ein Labor.",
    profile: [
      { label: "Säure", value: 70 },
      { label: "Süße", value: 75 },
      { label: "Körper", value: 60 },
      { label: "Bitterkeit", value: 30 },
      { label: "Komplexität", value: 100 },
    ],
    aromas: ["Tropische Früchte", "Mango", "Lychee", "Gewürze", "Wein-Note", "Kardamom"],
    brewing: ["V60", "Chemex", "Aeropress", "Espresso"],
    coffees: [
      { name: "Costa Rica Anaerobic", roaster: "La Cabra", origin: "Costa Rica", price: "CHF 38", matchScore: 96 },
      { name: "Panama Geisha", roaster: "Sweven Coffee", origin: "Panama", price: "CHF 48", matchScore: 95 },
      { name: "Colombia Lactic", roaster: "Vertical Coffee", origin: "Kolumbien", price: "CHF 34", matchScore: 91 },
    ],
    roasters: [
      { name: "La Cabra Schweiz", city: "Basel", specialty: "Experimentelle Aufbereitungen" },
      { name: "Sweven Coffee", city: "Genf", specialty: "Geisha & Rare Lots" },
      { name: "Drop Coffee CH", city: "Zürich", specialty: "Anaerobic & Fermented" },
    ],
    seoTitle: "Experimenteller Specialty Coffee — Anaerobic, Geisha, Rare Lots",
    seoDescription: "Rare Specialty Coffees aus Panama, Costa Rica, Äthiopien. Anaerobic Naturals, Geisha, experimentelle Aufbereitungen.",
    seoKeywords: ["geisha kaffee", "anaerobic coffee", "rare specialty coffee", "experimenteller kaffee", "panama geisha", "costa rica anaerobic"],
  },
  {
    slug: "der-sanfte",
    name: "Der Sanfte",
    tagline: "Mild, niedrige Säure, weich",
    icon: "spa",
    heroDesc: "Säure macht dir Magenprobleme? Du suchst den weichen, milden Kaffee ohne Bitterkeit — den Genuss ohne Reue.",
    longDesc: "Der Sanfte ist sensibel — und das ist eine Stärke. Du suchst Kaffee, der nicht im Magen brennt, nicht bitter wird, nicht aggressiv schmeckt. Sumatra, Brasilien Natural und gut entwickelte mittlere Röstungen sind dein Zuhause. Niedriger Säuregehalt, milder Körper, dezente Süße. Schokolade, Karamell, ein Hauch Nuss. Magenfreundlich, aber nie langweilig.",
    profile: [
      { label: "Säure", value: 20 },
      { label: "Süße", value: 75 },
      { label: "Körper", value: 65 },
      { label: "Bitterkeit", value: 25 },
      { label: "Komplexität", value: 45 },
    ],
    aromas: ["Milchschokolade", "Karamell", "Honig", "Mandel", "Brauner Zucker"],
    brewing: ["Vollautomat", "French Press", "Filter", "Cold Brew"],
    coffees: [
      { name: "Sumatra Mandheling", roaster: "Stoll Kaffee", origin: "Sumatra", price: "CHF 25", matchScore: 95 },
      { name: "Brasil Natural Decaf", roaster: "Miro Coffee", origin: "Brasilien", price: "CHF 26", matchScore: 92 },
      { name: "Honduras Pacamara", roaster: "Vertical Coffee", origin: "Honduras", price: "CHF 24", matchScore: 89 },
    ],
    roasters: [
      { name: "Stoll Kaffee", city: "Luzern", specialty: "Magenfreundliche Röstungen" },
      { name: "Miro Coffee", city: "Zürich", specialty: "Low-Acid Specialty" },
      { name: "Boncourt", city: "Basel", specialty: "Klassische Schweizer Röstung" },
    ],
    seoTitle: "Säurearmer Kaffee — magenfreundlich, mild, Specialty",
    seoDescription: "Säurearmer Kaffee mit niedrigem Säuregehalt. Sumatra, Brasilien — magenfreundlich, mild, entkoffeiniert verfügbar.",
    seoKeywords: ["säurearmer kaffee", "magenfreundlicher kaffee", "milder kaffee", "kaffee ohne säure", "sumatra kaffee", "low acid coffee"],
  },
  {
    slug: "der-florale",
    name: "Der Florale",
    tagline: "Jasmin, Bergamotte, Tee-artig",
    icon: "local_florist",
    heroDesc: "Wenn dein Kaffee nach Jasmin und Bergamotte duftet, ist alles richtig. Tee-artige Klarheit, florale Eleganz — Specialty in seiner feinsten Form.",
    longDesc: "Der Florale schätzt Subtilität. Wo andere nach Intensität suchen, suchst du nach Klarheit. Helle, sauber gewaschene Äthiopier (besonders Yirgacheffe), Hochland-Lagen, sortenreine Heirloom-Varietäten. Jasmin-Blüten, Bergamotte, schwarzer Tee, weiße Pfirsiche. Die elegantesten Geschmäcker im Kaffee-Universum — fragil und unvergesslich.",
    profile: [
      { label: "Säure", value: 80 },
      { label: "Süße", value: 65 },
      { label: "Körper", value: 30 },
      { label: "Bitterkeit", value: 15 },
      { label: "Komplexität", value: 85 },
    ],
    aromas: ["Jasmin", "Bergamotte", "Schwarzer Tee", "Weißer Pfirsich", "Rosenwasser", "Lavendel"],
    brewing: ["V60", "Chemex", "Kalita Wave"],
    coffees: [
      { name: "Ethiopia Gedeb Washed", roaster: "Miro Coffee", origin: "Äthiopien", price: "CHF 30", matchScore: 97 },
      { name: "Yemen Mokha Hayma", roaster: "Sweven Coffee", origin: "Jemen", price: "CHF 42", matchScore: 93 },
      { name: "Colombia Pink Bourbon", roaster: "La Cabra", origin: "Kolumbien", price: "CHF 36", matchScore: 90 },
    ],
    roasters: [
      { name: "Miro Coffee", city: "Zürich", specialty: "Washed Ethiopians" },
      { name: "Sweven Coffee", city: "Genf", specialty: "Florale Single Origins" },
      { name: "La Cabra Schweiz", city: "Basel", specialty: "Pink Bourbon & Floral Lots" },
    ],
    seoTitle: "Floraler Kaffee — Jasmin, Bergamotte, Tee-artig",
    seoDescription: "Florale Specialty Coffees aus Äthiopien, Jemen. Jasmin, Bergamotte, weißer Tee. Helle Röstungen für Filter & Pour Over.",
    seoKeywords: ["floraler kaffee", "jasmin kaffee", "bergamotte kaffee", "yirgacheffe", "tee-artiger kaffee", "specialty coffee floral"],
  },
  {
    slug: "der-erdige",
    name: "Der Erdige",
    tagline: "Würzig, holzig, dunkel",
    icon: "park",
    heroDesc: "Du magst es bodenständig: Erdige, würzige Kaffees mit Charakter. Tabak, Zedernholz, Gewürze — dein Kaffee soll erzählen.",
    longDesc: "Der Erdige liebt Kaffees mit Tiefe. Indonesische Bohnen — Sumatra Wet-Hulled, Sulawesi, Java — geben dir genau das, was du suchst. Würzige Noten, holzige Aromen, erdige Untertöne. Ein Hauch Pfeife, dunkles Karamell, Zedernholz. Weniger Säure, mehr Substanz. Old-School-Specialty mit Charakter, der dich an Holzfeuer und alte Bibliotheken erinnert.",
    profile: [
      { label: "Säure", value: 25 },
      { label: "Süße", value: 50 },
      { label: "Körper", value: 95 },
      { label: "Bitterkeit", value: 60 },
      { label: "Komplexität", value: 65 },
    ],
    aromas: ["Tabak", "Zedernholz", "Gewürze", "Dunkles Holz", "Erde", "Pfeffer"],
    brewing: ["French Press", "Moka Pot", "Espresso", "Cold Brew"],
    coffees: [
      { name: "Sumatra Wet-Hulled", roaster: "Stoll Kaffee", origin: "Sumatra", price: "CHF 26", matchScore: 95 },
      { name: "Sulawesi Toraja", roaster: "Miro Coffee", origin: "Sulawesi", price: "CHF 28", matchScore: 92 },
      { name: "Java Estate", roaster: "Boncourt", origin: "Java", price: "CHF 24", matchScore: 88 },
    ],
    roasters: [
      { name: "Stoll Kaffee", city: "Luzern", specialty: "Indonesische Bohnen" },
      { name: "Boncourt", city: "Basel", specialty: "Java & Sumatra Specialties" },
      { name: "Miro Coffee", city: "Zürich", specialty: "Earthy Indonesians" },
    ],
    seoTitle: "Erdiger Kaffee — würzig, indonesisch, kräftiger Körper",
    seoDescription: "Erdige Specialty Coffees aus Sumatra, Sulawesi, Java. Würzige, holzige Aromen mit kräftigem Körper.",
    seoKeywords: ["erdiger kaffee", "würziger kaffee", "sumatra kaffee", "indonesischer kaffee", "vollmundiger kaffee", "holziger kaffee"],
  },
  {
    slug: "der-suesse",
    name: "Der Süße",
    tagline: "Karamell, Honig, Schokolade",
    icon: "cake",
    heroDesc: "Honig-Süße, Karamell-Tiefe, Schokoladen-Wärme. Du suchst Kaffee als süßen Begleiter — ohne Zucker zu brauchen.",
    longDesc: "Der Süße kennt das Geheimnis: Specialty Coffee ist von Natur aus süß. Honey-Process aus Costa Rica, Naturals aus Brasilien, Yellow Bourbon — alles, was die natürliche Süße der Bohne maximiert. Karamell, Honig, Milchschokolade, brauner Zucker, Trockenfrüchte. Mittelkräftiger Körper, weiche Säure, ein langer süßer Abgang. Dessert in der Tasse.",
    profile: [
      { label: "Säure", value: 45 },
      { label: "Süße", value: 95 },
      { label: "Körper", value: 70 },
      { label: "Bitterkeit", value: 30 },
      { label: "Komplexität", value: 60 },
    ],
    aromas: ["Karamell", "Honig", "Milchschokolade", "Brauner Zucker", "Vanille", "Datteln"],
    brewing: ["V60", "Aeropress", "Vollautomat", "Espresso"],
    coffees: [
      { name: "Costa Rica Honey", roaster: "Vertical Coffee", origin: "Costa Rica", price: "CHF 28", matchScore: 96 },
      { name: "Brazil Yellow Bourbon Natural", roaster: "Miro Coffee", origin: "Brasilien", price: "CHF 24", matchScore: 93 },
      { name: "Guatemala Huehuetenango", roaster: "Sweven Coffee", origin: "Guatemala", price: "CHF 30", matchScore: 90 },
    ],
    roasters: [
      { name: "Vertical Coffee", city: "Bern", specialty: "Honey Process" },
      { name: "Miro Coffee", city: "Zürich", specialty: "Sweet Naturals" },
      { name: "Sweven Coffee", city: "Genf", specialty: "Sugar Cane Decaf & Sweet Coffees" },
    ],
    seoTitle: "Süßer Kaffee — Karamell, Honig, Schokolade",
    seoDescription: "Süße Specialty Coffees aus Costa Rica, Brasilien, Guatemala. Honey-Process, Naturals, Yellow Bourbon. Schokoladig-süß ohne Zucker.",
    seoKeywords: ["süßer kaffee", "karamell kaffee", "schokoladiger kaffee", "honey process coffee", "yellow bourbon", "natural processed coffee"],
  },
];

export const tasteTypeBySlug = (slug: string) => tasteTypes.find((t) => t.slug === slug);
