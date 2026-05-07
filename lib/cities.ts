export type City = {
  slug: string;
  city: string;
  citySlug: string;
  region: string;
  population: string;
  postcodes: string;
  hero: string;
  intro: string;
  coffeeScene: string;
  localRoasters: string[]; // roaster slugs
  deliveryInfo: { icon: string; label: string; value: string }[];
  whyAbo: { icon: string; title: string; text: string }[];
  faqs: { q: string; a: string }[];
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  neighborhoods: string[];
};

export const cities: City[] = [
  {
    slug: "coffee-subscription-zurich",
    city: "Zürich",
    citySlug: "zurich",
    region: "Deutschschweiz",
    population: "434'000",
    postcodes: "8001–8093",
    hero: "Coffee Subscription Zürich — Specialty Coffee aus den Top-Schweizer-Röstereien direkt zu dir nach Hause",
    intro: "Zürich ist die heimliche Specialty-Coffee-Hauptstadt der Schweiz. Mit über 50 spezialisierten Cafés zwischen Niederdorf und Zürich-West hat sich eine lebendige Szene entwickelt. Aber wer braucht den Weg zum Café, wenn der beste Specialty Coffee direkt in den Briefkasten kommt? Coffee Selection liefert in alle Zürcher Quartiere — von der Limmatquai bis nach Schwamendingen.",
    coffeeScene: "Zürich-West ist das Mekka der Schweizer Specialty-Coffee-Szene. Miro Coffee Roasters, Atelier Espresso, Drop Coffee CH und Mame Coffee haben die Stadt zur Specialty-Hauptstadt gemacht. Die Zürcher Trinker sind anspruchsvoll: helle Single Origins aus Äthiopien, V60-Pour-Over am Morgen, Geisha am Wochenende. Coffee Selection bringt diese Café-Qualität direkt zu dir.",
    localRoasters: ["miro-coffee", "atelier-espresso", "drop-coffee-ch"],
    deliveryInfo: [
      { icon: "local_shipping", label: "Lieferzeit", value: "1–2 Werktage" },
      { icon: "savings", label: "Versandkosten", value: "Ab CHF 100 gratis" },
      { icon: "schedule", label: "Bestellschluss", value: "Mo–Fr bis 14:00" },
      { icon: "verified", label: "Versand", value: "Schweizer Post Priority" },
    ],
    whyAbo: [
      { icon: "auto_awesome", title: "Von Zürcher Röstern", text: "Direkt aus Zürich-West gerösteter Specialty Coffee — keine Mittelsmänner, keine Mischungen unklarer Herkunft." },
      { icon: "schedule", title: "Pünktlich geliefert", text: "Schweizer Post Priority bringt deinen Kaffee in 1–2 Werktagen — passend zum Bürostart oder Wochenende." },
      { icon: "favorite", title: "Auf Zürcher Geschmack abgestimmt", text: "Unser Algorithmus lernt aus tausenden Profilen — auch deinen Lieblings-Espresso aus dem Café um die Ecke." },
    ],
    faqs: [
      { q: "Liefert Coffee Selection in ganz Zürich?", a: "Ja, in alle 12 Stadtkreise und Aussengemeinden. Standardlieferung ist 1–2 Werktage Schweizer Post Priority." },
      { q: "Welche Zürcher Röster sind dabei?", a: "Miro Coffee Roasters (Zürich-West), Atelier Espresso (Limmatquai) und Drop Coffee CH (Niederdorf) — drei der besten Specialty-Adressen der Stadt." },
      { q: "Kann ich mein Abo pausieren wenn ich in den Ferien bin?", a: "Ja, jederzeit mit einem Klick. Pausieren, Intervall ändern oder kündigen — alles ohne Bindung." },
    ],
    seoTitle: "Coffee Subscription Zürich — Specialty Coffee Abo nach Hause | Coffee Selection",
    seoDescription: "Specialty Coffee Subscription in Zürich. Direct Trade von Miro Coffee, Atelier Espresso, Drop Coffee. Lieferung in 1-2 Werktagen, ab CHF 100 gratis.",
    keywords: ["coffee subscription zürich", "kaffee abo zürich", "specialty coffee zürich", "kaffee lieferung zürich", "kaffeerösterei zürich"],
    neighborhoods: ["Altstadt", "Niederdorf", "Zürich-West", "Wiedikon", "Wollishofen", "Oerlikon", "Schwamendingen", "Höngg", "Kreis 4", "Kreis 5", "Enge", "Witikon"],
  },
  {
    slug: "coffee-subscription-bern",
    city: "Bern",
    citySlug: "bern",
    region: "Deutschschweiz",
    population: "144'000",
    postcodes: "3000–3027",
    hero: "Coffee Subscription Bern — Specialty Coffee in die Bundesstadt",
    intro: "Bern ist Schweizer Hauptstadt — und Schauplatz einer wachsenden Specialty-Coffee-Bewegung. Vertical Coffee in der Länggasse hat Massstäbe gesetzt mit ihren Honey-Process-Single-Origins. Coffee Selection bringt Vertical und 7 weitere Top-Röster direkt zu dir nach Hause, in alle Berner Quartiere.",
    coffeeScene: "Bern hat eine subtile, aber hochwertige Specialty-Szene entwickelt. Vertical Coffee, Adrianos Bar & Café und Café Felber bilden das Trio der Hauptstadt. Die Berner trinken bewusst, langsam, im Café — ideal also für Filter und Pour Over. Coffee Selection liefert die passenden hellen Single Origins direkt unter die Lauben.",
    localRoasters: ["vertical-coffee"],
    deliveryInfo: [
      { icon: "local_shipping", label: "Lieferzeit", value: "1–2 Werktage" },
      { icon: "savings", label: "Versandkosten", value: "Ab CHF 100 gratis" },
      { icon: "schedule", label: "Bestellschluss", value: "Mo–Fr bis 14:00" },
      { icon: "verified", label: "Versand", value: "Schweizer Post Priority" },
    ],
    whyAbo: [
      { icon: "auto_awesome", title: "Von Berner Röstern", text: "Vertical Coffee aus der Länggasse, Honey-Process-Spezialist und Bio-Pionier — direkt aus deiner Stadt." },
      { icon: "schedule", title: "Pünktlich in der Hauptstadt", text: "Lieferung in 1–2 Werktagen direkt unter die Lauben — keine Lieferchaos, kein Suchen nach Coffeeshops." },
      { icon: "favorite", title: "Auf Berner Geschmack abgestimmt", text: "Bern liebt Filter und Pour Over — wir matchen dich mit den passenden hellen Single Origins." },
    ],
    faqs: [
      { q: "Liefert Coffee Selection in ganz Bern?", a: "Ja, in alle Berner Stadtteile und in die Agglomeration (Köniz, Muri, Ittigen). Schweizer Post Priority, 1–2 Werktage." },
      { q: "Welche Berner Röster sind dabei?", a: "Vertical Coffee aus der Länggasse — die Specialty-Adresse Berns mit Bio-Honey-Process-Single-Origins." },
      { q: "Kann ich auch im Bundeshaus bestellen?", a: "Wir liefern an jede Berner Adresse — Postfach, Privatadresse oder Büro. Alle Schweizer Stadtquartiere abgedeckt." },
    ],
    seoTitle: "Coffee Subscription Bern — Specialty Coffee Abo Hauptstadt | Coffee Selection",
    seoDescription: "Specialty Coffee Subscription in Bern. Vertical Coffee Bio-Single-Origins, Honey Process. Lieferung in 1-2 Werktagen, ab CHF 100 gratis.",
    keywords: ["coffee subscription bern", "kaffee abo bern", "specialty coffee bern", "vertical coffee bern", "kaffeerösterei bern"],
    neighborhoods: ["Altstadt", "Länggasse", "Mattenhof", "Breitenrain", "Bümpliz", "Bethlehem", "Lorraine", "Wabern", "Kirchenfeld"],
  },
  {
    slug: "coffee-subscription-basel",
    city: "Basel",
    citySlug: "basel",
    region: "Nordwestschweiz",
    population: "178'000",
    postcodes: "4000–4059",
    hero: "Coffee Subscription Basel — Specialty Coffee am Rheinknie",
    intro: "Basel ist die experimentellste Specialty-Coffee-Stadt der Schweiz. La Cabra Schweiz hat den dänischen Anaerobic-Stil ans Rheinknie gebracht — und Boncourt verkörpert seit 1955 klassische Schweizer Röstkunst. Diese Spannung zwischen Tradition und Avantgarde ist typisch Basel. Coffee Selection liefert beide Welten direkt zu dir.",
    coffeeScene: "Basel polarisiert: La Cabra Schweiz im Kleinbasel arbeitet mit fermentierten Anaerobic-Aufbereitungen aus Costa Rica und Ruanda. Boncourt im Hafenviertel pflegt seit 70 Jahren die klassische Trommelröstung. Café 80b und Sumatra Coffee Roasters ergänzen die Szene. Basler Coffee-Geeks lieben das Experimentelle — ideal für unsere Discovery Box.",
    localRoasters: ["la-cabra-schweiz", "boncourt"],
    deliveryInfo: [
      { icon: "local_shipping", label: "Lieferzeit", value: "1–2 Werktage" },
      { icon: "savings", label: "Versandkosten", value: "Ab CHF 100 gratis" },
      { icon: "schedule", label: "Bestellschluss", value: "Mo–Fr bis 14:00" },
      { icon: "verified", label: "Versand", value: "Schweizer Post Priority" },
    ],
    whyAbo: [
      { icon: "explore", title: "Experimentelle Bohnen", text: "La Cabra bringt Anaerobic Naturals und Pink Bourbon — Aufbereitungen, die du sonst nirgends findest." },
      { icon: "schedule", title: "Pünktlich am Rheinknie", text: "Lieferung in 1–2 Werktagen ans Kleinbasel, Grossbasel oder Riehen — Schweizer Post Priority." },
      { icon: "verified", title: "Tradition + Avantgarde", text: "Klassische Boncourt-Röstung neben experimenteller La-Cabra-Aufbereitung — das ist Basler Vielfalt." },
    ],
    faqs: [
      { q: "Liefert Coffee Selection in ganz Basel?", a: "Ja, in beide Halbkantone (Basel-Stadt und Basel-Landschaft). Auch nach Riehen, Allschwil und Münchenstein. 1–2 Werktage." },
      { q: "Welche Basler Röster sind dabei?", a: "La Cabra Schweiz (Anaerobic-Spezialist) und Boncourt (Tradition seit 1955) — beide aus Basel-Stadt." },
      { q: "Kann ich Anaerobic-Coffee abonnieren?", a: "Ja. Im Quiz wähle den Geschmackstyp Entdecker — wir matchen dich automatisch mit La Cabras experimentellen Aufbereitungen." },
    ],
    seoTitle: "Coffee Subscription Basel — Specialty Coffee Abo am Rheinknie | Coffee Selection",
    seoDescription: "Specialty Coffee Subscription in Basel. La Cabra Schweiz Anaerobic, Boncourt Tradition. Lieferung in 1-2 Werktagen, ab CHF 100 gratis.",
    keywords: ["coffee subscription basel", "kaffee abo basel", "specialty coffee basel", "la cabra basel", "kaffeerösterei basel"],
    neighborhoods: ["Grossbasel", "Kleinbasel", "Gundeldingen", "St. Alban", "Bachletten", "Neubad", "Iselin", "Riehen", "Bettingen"],
  },
  {
    slug: "coffee-subscription-lucerne",
    city: "Luzern",
    citySlug: "lucerne",
    region: "Zentralschweiz",
    population: "82'000",
    postcodes: "6000–6020",
    hero: "Coffee Subscription Luzern — Specialty Coffee am Vierwaldstättersee",
    intro: "Luzern ist die heimliche Coffee-Stadt der Zentralschweiz. Stoll Kaffee am Schwanenplatz röstet seit 1928 — vier Generationen einer Familienrösterei mit klassischer Schweizer Trommelröstung. Coffee Selection bringt diese Tradition zusammen mit modernen Specialty-Röstern direkt an den Vierwaldstättersee.",
    coffeeScene: "Luzern verkörpert Schweizer Kaffee-Tradition. Stoll Kaffee seit 1928, Café Felber, rast kaffee aus Ebikon — die Region steht für magenfreundliche, schonend trommelgeröstete Mittelröstungen. Touristen am Schwanenplatz, Locals in der Neustadt — alle vereint durch eine Liebe zur Klassik. Coffee Selection liefert Stolls Klassiker und ergänzt mit modernen Specialty-Profilen.",
    localRoasters: ["stoll-kaffee"],
    deliveryInfo: [
      { icon: "local_shipping", label: "Lieferzeit", value: "1–2 Werktage" },
      { icon: "savings", label: "Versandkosten", value: "Ab CHF 100 gratis" },
      { icon: "schedule", label: "Bestellschluss", value: "Mo–Fr bis 14:00" },
      { icon: "verified", label: "Versand", value: "Schweizer Post Priority" },
    ],
    whyAbo: [
      { icon: "verified", title: "Tradition aus Luzern", text: "Stoll Kaffee aus dem Schwanenplatz — vier Generationen Familienrösterei, magenfreundliche Klassiker." },
      { icon: "schedule", title: "Pünktlich am See", text: "Lieferung in 1–2 Werktagen — ans Seeufer, in die Neustadt, nach Hochdorf oder Sursee." },
      { icon: "favorite", title: "Magenfreundliche Profile", text: "Luzerner schätzen schonend geröstete Mittelröstungen — wir matchen dich genau damit." },
    ],
    faqs: [
      { q: "Liefert Coffee Selection in der ganzen Zentralschweiz?", a: "Ja, von Luzern Stadt bis Sursee, Hochdorf, Zug und Schwyz. 1–2 Werktage Schweizer Post Priority." },
      { q: "Welche Luzerner Röster sind dabei?", a: "Stoll Kaffee — die Familienrösterei seit 1928 mit magenfreundlichen Klassikern und indonesischen Spezialitäten." },
      { q: "Welcher Kaffee passt zum Luzerner Geschmack?", a: "Klassische, magenfreundliche Mittelröstungen aus Brasilien und Honduras — der Geschmackstyp 'Klassiker' oder 'Sanfte' im Quiz." },
    ],
    seoTitle: "Coffee Subscription Luzern — Specialty Coffee Abo Zentralschweiz | Coffee Selection",
    seoDescription: "Specialty Coffee Subscription in Luzern. Stoll Kaffee seit 1928, magenfreundliche Klassiker. Lieferung in 1-2 Werktagen, ab CHF 100 gratis.",
    keywords: ["coffee subscription luzern", "kaffee abo luzern", "specialty coffee luzern", "stoll kaffee luzern", "kaffee zentralschweiz"],
    neighborhoods: ["Altstadt", "Neustadt", "Tribschen", "Hirschmatt", "Maihof", "Würzenbach", "Reussbühl", "Littau"],
  },
  {
    slug: "coffee-subscription-zug",
    city: "Zug",
    citySlug: "zug",
    region: "Zentralschweiz",
    population: "31'000",
    postcodes: "6300–6318",
    hero: "Coffee Subscription Zug — Specialty Coffee in den Steueroase",
    intro: "Zug — klein, finanzstark, anspruchsvoll. Die Stadt mit dem höchsten BIP pro Kopf der Schweiz hat eine Klientel, die das Beste sucht — und Coffee Selection liefert. Wir bringen Specialty Coffee von Schweizer Top-Röstern direkt nach Zug, Cham, Baar und Steinhausen.",
    coffeeScene: "Zug hat eine kleine, aber qualitätsbewusste Coffee-Szene. Café Speck, Bossard und einzelne Independents — die Stadt ist zu klein für eine eigene Szene wie Zürich, aber die Bewohner suchen das Beste. Pendler nach Zürich nehmen Standards mit, und der Anspruch ist hoch. Coffee Selection liefert genau diese Spitzenqualität direkt an die Adresse.",
    localRoasters: ["miro-coffee", "stoll-kaffee", "vertical-coffee"],
    deliveryInfo: [
      { icon: "local_shipping", label: "Lieferzeit", value: "1 Werktag" },
      { icon: "savings", label: "Versandkosten", value: "Ab CHF 100 gratis" },
      { icon: "schedule", label: "Bestellschluss", value: "Mo–Fr bis 14:00" },
      { icon: "verified", label: "Versand", value: "Schweizer Post Priority" },
    ],
    whyAbo: [
      { icon: "diamond", title: "Premium-Auswahl", text: "Zugs Bewohner suchen Spitzenqualität — wir liefern Cup-of-Excellence-Lots und seltene Geisha-Varietäten." },
      { icon: "schedule", title: "1 Werktag Lieferung", text: "Zug ist verkehrstechnisch ideal — Bestellung am Morgen, Kaffee am nächsten Tag." },
      { icon: "auto_awesome", title: "Diskrete Lieferung", text: "Diskreter Versand ans Wohnhaus, Apartment oder Büro — keine Werbung, nur röstfrischer Coffee." },
    ],
    faqs: [
      { q: "Liefert Coffee Selection in ganz Zug?", a: "Ja, in den ganzen Kanton Zug — Stadt Zug, Baar, Cham, Steinhausen, Risch-Rotkreuz, Hünenberg. 1 Werktag." },
      { q: "Gibt es einen Premium-Service?", a: "Discovery Box ist unser kuratierter Service — 2 verschiedene Specialty Coffees pro Lieferung, perfekt zu deinem Profil. Premium ohne Premium-Aufpreis." },
      { q: "Kann ich Cup-of-Excellence-Lots bestellen?", a: "Ja. Im Quiz wähle 'Entdecker' — wir matchen dich mit Sweven Coffee aus Genf, dem Schweizer Cup-of-Excellence-Spezialisten." },
    ],
    seoTitle: "Coffee Subscription Zug — Premium Specialty Coffee Abo | Coffee Selection",
    seoDescription: "Specialty Coffee Subscription in Zug. Premium Schweizer Direct-Trade-Bohnen, Cup-of-Excellence-Lots. Lieferung in 1 Werktag.",
    keywords: ["coffee subscription zug", "kaffee abo zug", "specialty coffee zug", "kaffee lieferung zug", "premium kaffee zug"],
    neighborhoods: ["Altstadt", "Neustadt", "Lorzen", "Industrie", "Baar", "Cham", "Steinhausen", "Hünenberg", "Risch-Rotkreuz"],
  },
  {
    slug: "coffee-subscription-geneva",
    city: "Genf",
    citySlug: "geneva",
    region: "Romandie",
    population: "203'000",
    postcodes: "1200–1213",
    hero: "Coffee Subscription Genève — Specialty Coffee de Suisse romande",
    intro: "Genève — la capitale du goût en Suisse romande. Sweven Coffee am Quai du Mont-Blanc hat den höchsten Cupping-Standard der Schweiz etabliert. Geisha, Yemen Mokha, Cup-of-Excellence-Auktionsgewinner. Coffee Selection liefert diese Highend-Qualität direkt zu dir — nach Carouge, Cologny, Vernier und in alle Genfer Quartiere.",
    coffeeScene: "Genf ist die Wein-Stadt der Schweiz — und Sweven Coffee bringt diese Wein-Sensibilität in den Kaffee. Hochlagen-Mikrolots, sortenreine Geisha-Varietäten, jemenitischer Mokha aus 2200m Höhe. Boréal Coffee Shop, Mokoko Coffee und Birdie Coffee ergänzen die Szene. Genfer Genießer trinken Filter und Pour Over am Wochenende, Espresso unter der Woche.",
    localRoasters: ["sweven-coffee"],
    deliveryInfo: [
      { icon: "local_shipping", label: "Lieferzeit", value: "1–2 Werktage" },
      { icon: "savings", label: "Versandkosten", value: "Ab CHF 100 gratis" },
      { icon: "schedule", label: "Bestellschluss", value: "Mo–Fr bis 14:00" },
      { icon: "verified", label: "Versand", value: "Schweizer Post Priority" },
    ],
    whyAbo: [
      { icon: "diamond", title: "Highend-Spezialisten", text: "Sweven Coffee aus Genf — Geisha, Yemen Mokha, Cup-of-Excellence-Auktionsgewinner. Wein-Niveau im Kaffee." },
      { icon: "schedule", title: "Pünktlich am Léman", text: "Lieferung in 1–2 Werktagen — Carouge, Cologny, Eaux-Vives oder Plainpalais." },
      { icon: "wine_bar", title: "Wein-Sensibilität", text: "Genfer Geschmack erkennt Komplexität — wir matchen dich mit den anspruchsvollsten Single-Origin-Lots der Schweiz." },
    ],
    faqs: [
      { q: "Coffee Selection liefert dans toute la Romandie?", a: "Ja, in die gesamte französischsprachige Schweiz — Genf, Lausanne, Vevey, Sion. 1–2 Werktage." },
      { q: "Welcher Genfer Röster ist dabei?", a: "Sweven Coffee am Quai du Mont-Blanc — Geisha-Spezialist und Cup-of-Excellence-Partner. Highend-Auswahl." },
      { q: "Kann ich Geisha-Coffee abonnieren?", a: "Ja. Im Quiz wähle 'Florale' oder 'Entdecker' — wir matchen dich mit Sweven Coffees Geisha- und Yemen-Mokha-Lots." },
    ],
    seoTitle: "Coffee Subscription Genève — Specialty Coffee Romandie | Coffee Selection",
    seoDescription: "Specialty Coffee Subscription in Genf. Sweven Coffee Geisha, Yemen Mokha, Cup-of-Excellence-Lots. Lieferung in 1-2 Werktagen.",
    keywords: ["coffee subscription geneva", "café abonnement genève", "specialty coffee genève", "sweven coffee", "kaffee genf"],
    neighborhoods: ["Eaux-Vives", "Plainpalais", "Pâquis", "Carouge", "Champel", "Servette", "Cologny", "Vernier", "Meyrin", "Lancy"],
  },
  {
    slug: "coffee-subscription-switzerland",
    city: "Schweiz",
    citySlug: "switzerland",
    region: "Schweiz gesamt",
    population: "8.9 Millionen",
    postcodes: "1000–9999",
    hero: "Coffee Subscription Schweiz — Specialty Coffee landesweit geliefert",
    intro: "Coffee Selection ist die einzige Specialty-Coffee-Subscription, die die ganze Schweiz aus einer Hand bedient. 8 Top-Röstereien, 24 kuratierte Coffees, ein Algorithmus für 8 Geschmackstypen. Egal ob du in Zürich-West, in Zug, in Lugano oder in Schaffhausen bist — wir liefern röstfrisch in 1–2 Werktagen.",
    coffeeScene: "Die Schweiz ist Specialty-Coffee-Land. Mit über 16 herausragenden Mikro-Röstereien zwischen Genf und St. Gallen hat sich eine der dichtesten Specialty-Szenen Europas entwickelt. Zürich für hellen Filter, Bern für Bio-Single-Origins, Basel für Anaerobic-Experimente, Genf für Highend-Geisha — jede Region hat ihren Charakter. Coffee Selection vereint sie alle.",
    localRoasters: ["miro-coffee", "vertical-coffee", "stoll-kaffee", "la-cabra-schweiz", "sweven-coffee", "atelier-espresso", "boncourt", "drop-coffee-ch"],
    deliveryInfo: [
      { icon: "local_shipping", label: "Lieferzeit", value: "1–2 Werktage" },
      { icon: "savings", label: "Versandkosten", value: "Ab CHF 100 gratis" },
      { icon: "language", label: "Sprachen", value: "DE · FR · IT · EN" },
      { icon: "verified", label: "Versand", value: "Schweizer Post Priority" },
    ],
    whyAbo: [
      { icon: "auto_awesome", title: "8 Top-Röster aus der Schweiz", text: "Wir vereinen die besten Specialty-Röstereien aller Sprachregionen — Deutschschweiz, Romandie, Tessin." },
      { icon: "schedule", title: "Schweizweite Lieferung", text: "Schweizer Post Priority bringt deinen Kaffee in 1–2 Werktagen — von Basel bis Bellinzona, von Genf bis St. Gallen." },
      { icon: "psychology", title: "Algorithmus statt Sortiment", text: "Wir denken nicht in Bohnen, sondern in Geschmackstypen. 12 Quiz-Fragen reichen, um dich präzise zu klassifizieren." },
    ],
    faqs: [
      { q: "Liefert Coffee Selection in die ganze Schweiz?", a: "Ja, in alle 26 Kantone, alle Postleitzahlen 1000–9999. Auch nach Liechtenstein. 1–2 Werktage Schweizer Post Priority." },
      { q: "Liefert ihr auch ins Tessin?", a: "Ja. Lugano, Locarno, Bellinzona, Mendrisio — alle Adressen werden bedient. Auch unsere Tessiner Kunden bekommen die Discovery Box pünktlich." },
      { q: "Wie viele Schweizer Röster sind dabei?", a: "8 Top-Röstereien aus allen Landesteilen: Miro, Vertical, Stoll, La Cabra, Sweven, Atelier Espresso, Boncourt und Drop Coffee — von Genf bis Zürich." },
      { q: "Welche Sprachen unterstützt Coffee Selection?", a: "Deutsch, Französisch, Italienisch und Englisch. Quiz, Account und Support in allen vier Schweizer Sprachen." },
    ],
    seoTitle: "Coffee Subscription Schweiz — Specialty Coffee landesweit | Coffee Selection",
    seoDescription: "Die Specialty Coffee Subscription für die ganze Schweiz. 8 Top-Röster, 24 Coffees, Algorithmus-Match. Lieferung in 1-2 Werktagen, ab CHF 100 gratis.",
    keywords: ["coffee subscription schweiz", "kaffee abo schweiz", "specialty coffee schweiz", "schweizer kaffee abo", "kaffee abonnement"],
    neighborhoods: ["Zürich", "Bern", "Basel", "Genf", "Luzern", "Zug", "Lausanne", "Winterthur", "St. Gallen", "Lugano", "Biel", "Thun"],
  },
];

export const cityBySlug = (slug: string) => cities.find((c) => c.slug === slug);
