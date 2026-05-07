export type Roaster = {
  slug: string;
  name: string;
  city: string;
  founded: string;
  tagline: string;
  shortDesc: string;
  story: string;
  specialty: string;
  values: string[];
  image: string;
  portrait: string;
  founderName: string;
  founderRole: string;
  coffees: string[];
  region: string;
  certifications: string[];
  social: { instagram?: string; web?: string };
  stats: { yearsActive: number; coffeesRoasted: string; clientsServed: string };
};

import { ROASTERY_POOL, IMG_BARISTA_HANDS, imageForSlug } from "./images";

const IMG_ROASTERY = ROASTERY_POOL[0];
const IMG_PORTRAIT = IMG_BARISTA_HANDS;

export const roasters: Roaster[] = [
  {
    slug: "miro-coffee",
    name: "Miro Coffee Roasters",
    city: "Zürich",
    region: "Deutschschweiz",
    founded: "2016",
    tagline: "Pioniere des nordischen Röststils",
    shortDesc: "Direct Trade aus Zürich. Spezialisiert auf helle, äthiopische Single Origins mit lebendiger Säure und floralen Noten.",
    story: "Miro Coffee wurde 2016 in Zürich-West von Miro Berger gegründet, einem ehemaligen Q-Grader und mehrfachen SCA-Sieger. Sein Anliegen: den nordischen Röststil — hell, klar, präzise — in die Schweiz zu bringen. Jede Bohne wird in kleinen 12kg-Chargen geröstet, mit dem Ziel, das Terroir der Herkunftsregion möglichst transparent zu machen. Direct Trade ist nicht Marketing, sondern Praxis: Miro reist jährlich nach Yirgacheffe und arbeitet mit drei spezifischen Familien-Farmen.",
    specialty: "Helle Röstungen · Äthiopien · Direct Trade",
    values: ["Direct Trade", "Bio-zertifiziert", "Helle Röstung", "Single Origin", "Q-Grader"],
    image: ROASTERY_POOL[0],
    portrait: IMG_PORTRAIT,
    founderName: "Miro Berger",
    founderRole: "Gründer & Röstmeister",
    coffees: ["ethiopia-yirgacheffe", "ethiopia-gedeb-washed", "brasil-cerrado", "sumatra-mandheling", "brasil-mogiana-dark", "sulawesi-toraja", "brasil-natural-decaf"],
    certifications: ["SCA", "Bio Suisse", "Direct Trade"],
    social: { instagram: "@mirocoffee", web: "mirocoffee.ch" },
    stats: { yearsActive: 9, coffeesRoasted: "180+", clientsServed: "12k+" },
  },
  {
    slug: "vertical-coffee",
    name: "Vertical Coffee",
    city: "Bern",
    region: "Deutschschweiz",
    founded: "2018",
    tagline: "Präzision aus den Alpen",
    shortDesc: "Single-Origin-Spezialist aus Bern. Honey Process aus Costa Rica, Hochlagen aus Kenia — alles Bio-zertifiziert.",
    story: "Vertical Coffee entstand 2018 aus der Leidenschaft von Sara Vögeli, einer ehemaligen Bergführerin. Der Name ist Programm: Hochlagen-Kaffees, vertikal-präzise Röstungen, und ein konsequenter Fokus auf Single Origins. Die Rösterei am Stadtrand von Bern arbeitet ausschließlich mit Bio-zertifizierten Bauern aus Costa Rica, Kenia und Kolumbien. Honey Process und Washed Lots sind die Spezialität — keine Naturals, keine Blends.",
    specialty: "Single Origin · Honey Process · Bio",
    values: ["Bio Suisse", "Direct Trade", "Single Origin", "Honey Process", "Hochland"],
    image: ROASTERY_POOL[1],
    portrait: IMG_PORTRAIT,
    founderName: "Sara Vögeli",
    founderRole: "Gründerin & Cuppingmeisterin",
    coffees: ["colombia-supremo", "kenya-aa-nyeri", "costa-rica-honey", "honduras-pacamara", "colombia-lactic"],
    certifications: ["Bio Suisse", "Fairtrade", "SCA"],
    social: { instagram: "@verticalcoffeebern", web: "verticalcoffee.ch" },
    stats: { yearsActive: 7, coffeesRoasted: "95+", clientsServed: "8k+" },
  },
  {
    slug: "stoll-kaffee",
    name: "Stoll Kaffee",
    city: "Luzern",
    region: "Zentralschweiz",
    founded: "1928",
    tagline: "Familienrösterei seit vier Generationen",
    shortDesc: "Klassische Schweizer Röstkunst seit 1928. Magenfreundliche Mittelröstungen, italienische Espresso-Blends, indonesische Spezialitäten.",
    story: "1928 von Jakob Stoll am Schwanenplatz in Luzern gegründet, ist Stoll Kaffee heute in vierter Generation. Was als kleine Spezialitätenrösterei begann, ist heute eine der ältesten kontinuierlich betriebenen Kaffeeröstereien der Schweiz. Das Geheimnis: lange, schonende Trommelröstungen bei niedrigeren Temperaturen — magenfreundlich und komplex zugleich. Klassische Espresso-Blends mit Brasilien-Basis sind das Fundament, dazu indonesische Wet-Hulled-Spezialitäten als Gewürz.",
    specialty: "Klassische Röstung · Espresso-Blends · Sumatra",
    values: ["Tradition", "Magenfreundlich", "Schweizer Familienbetrieb", "Trommelröstung"],
    image: ROASTERY_POOL[2],
    portrait: IMG_PORTRAIT,
    founderName: "Familie Stoll",
    founderRole: "4. Generation seit 1928",
    coffees: ["honduras-marcala", "espresso-tradizionale", "sumatra-wet-hulled", "sumatra-mandheling"],
    certifications: ["Schweiz Tourismus", "SCA", "UTZ"],
    social: { web: "stollkaffee.ch" },
    stats: { yearsActive: 97, coffeesRoasted: "20+ Klassiker", clientsServed: "30k+" },
  },
  {
    slug: "la-cabra-schweiz",
    name: "La Cabra Schweiz",
    city: "Basel",
    region: "Nordwestschweiz",
    founded: "2021",
    tagline: "Experimentelle Aufbereitungen",
    shortDesc: "Schweizer Ableger der dänischen Kult-Rösterei. Anaerobic Naturals, Carbonic Maceration, Pink Bourbon — alles was experimentell ist.",
    story: "La Cabra Schweiz ist 2021 in Basel als Schweizer Pendant zur dänischen Kult-Rösterei La Cabra entstanden. Der Fokus liegt auf experimentellen Aufbereitungen: Anaerobic Naturals, Lactic Process, Carbonic Maceration. Sortenreine Heirloom-Varietäten und Pink Bourbon stehen im Mittelpunkt. Helle, transparente Röstungen, die jede Note der Aufbereitung herausarbeiten. Das Team in Basel arbeitet eng mit Produzenten in Kolumbien, Kenia und Ruanda zusammen.",
    specialty: "Anaerobic · Pink Bourbon · Experimental",
    values: ["Experimental", "Single Origin", "Direct Trade", "SCA Certified"],
    image: ROASTERY_POOL[3],
    portrait: IMG_PORTRAIT,
    founderName: "Lukas Brunner",
    founderRole: "Head Roaster Schweiz",
    coffees: ["rwanda-anaerobic", "costa-rica-anaerobic", "colombia-lactic", "colombia-pink-bourbon"],
    certifications: ["SCA", "Direct Trade", "WBC Partner"],
    social: { instagram: "@lacabraswiss", web: "lacabra.ch" },
    stats: { yearsActive: 4, coffeesRoasted: "60+", clientsServed: "5k+" },
  },
  {
    slug: "sweven-coffee",
    name: "Sweven Coffee",
    city: "Genf",
    region: "Romandie",
    founded: "2019",
    tagline: "Geisha & Rare Lots",
    shortDesc: "Romandie-Spezialist für seltene Lots. Panama Geisha, Yemen Mokha, jemenitische und äthiopische Mikrolots — Highend Specialty.",
    story: "Sweven Coffee in Genf wurde 2019 von Élise Moreau gegründet, einer ehemaligen Sommelière. Der Anspruch: Wein-Niveau im Kaffee. Die Rösterei spezialisiert sich auf Geisha-Varietäten, jemenitische Mokha und seltene Mikrolots aus Hochlagen — Kaffees, die normalerweise an Auktionen versteigert werden. Florale Noten, Bergamotte, weißer Pfirsich, schwarzer Tee. Sweven serviert auch im hauseigenen Tasting Room am Quai du Mont-Blanc.",
    specialty: "Geisha · Yemen Mokha · Rare Lots",
    values: ["Rare Lots", "Auction Coffees", "Highest Cupping Score", "Single Estate"],
    image: ROASTERY_POOL[0],
    portrait: IMG_PORTRAIT,
    founderName: "Élise Moreau",
    founderRole: "Gründerin & Sommelière",
    coffees: ["panama-geisha", "yemen-mokha-hayma", "guatemala-huehuetenango"],
    certifications: ["SCA", "Cup of Excellence Partner", "Direct Trade"],
    social: { instagram: "@swevencoffee", web: "sweven.coffee" },
    stats: { yearsActive: 6, coffeesRoasted: "40+ Rare Lots", clientsServed: "3k+" },
  },
  {
    slug: "atelier-espresso",
    name: "Atelier Espresso",
    city: "Zürich",
    region: "Deutschschweiz",
    founded: "2014",
    tagline: "Italienische Espresso-Tradition",
    shortDesc: "Klassische italienische Espresso-Röstung in Zürich. Dunkel, samtig, kakao-getragen. Für Siebträger und Vollautomaten.",
    story: "Atelier Espresso wurde 2014 von Marco Ricci gegründet, einem Mailänder Maestro Tostatore in dritter Generation. Im Atelier am Limmatquai werden Espresso-Blends im klassischen italienischen Stil geröstet: dunkel, ölig, mit ausgeprägten Schokoladen- und Karamellnoten. Der Hauptblend Tradizionale basiert auf Brasilien-Naturals mit äthiopischer Säure-Spitze. Atelier Espresso beliefert die meisten gehobenen Hotels in Zürich und Umgebung.",
    specialty: "Italienischer Espresso · Dunkle Röstung",
    values: ["Italienische Tradition", "Espresso", "Hotellerie-Partner", "Maestro-Geröstet"],
    image: ROASTERY_POOL[1],
    portrait: IMG_PORTRAIT,
    founderName: "Marco Ricci",
    founderRole: "Maestro Tostatore",
    coffees: ["italian-roast-blend"],
    certifications: ["IIAC", "SCA", "Italian Espresso National Institute"],
    social: { instagram: "@atelierespresso", web: "atelier-espresso.ch" },
    stats: { yearsActive: 11, coffeesRoasted: "5 Signature Blends", clientsServed: "20k+" },
  },
  {
    slug: "boncourt",
    name: "Boncourt",
    city: "Basel",
    region: "Nordwestschweiz",
    founded: "1955",
    tagline: "Klassische Schweizer Röstung",
    shortDesc: "Traditionsrösterei aus Basel. Magenfreundliche Mittelröstungen, indonesische Spezialitäten, Java Estate.",
    story: "Seit 1955 röstet Boncourt im Basler Hafenviertel. Was als Familienbetrieb mit drei Mitarbeitern begann, ist heute eine 30-köpfige Manufaktur mit Fokus auf magenfreundliche Mittelröstungen. Spezialität sind indonesische Bohnen — Java Estate, Sumatra Mandheling, Sulawesi Toraja. Die langen Trommelröstungen bei moderaten Temperaturen schonen den Magen und maximieren erdige, würzige Aromen.",
    specialty: "Indonesische Bohnen · Magenfreundlich",
    values: ["Tradition", "Schweizer Familienbetrieb", "Magenfreundlich"],
    image: ROASTERY_POOL[2],
    portrait: IMG_PORTRAIT,
    founderName: "Familie Boncourt",
    founderRole: "3. Generation seit 1955",
    coffees: ["java-estate"],
    certifications: ["UTZ", "Schweizer Familienbetrieb"],
    social: { web: "boncourt.ch" },
    stats: { yearsActive: 70, coffeesRoasted: "12 Klassiker", clientsServed: "15k+" },
  },
  {
    slug: "drop-coffee-ch",
    name: "Drop Coffee CH",
    city: "Zürich",
    region: "Deutschschweiz",
    founded: "2020",
    tagline: "Anaerobic & Fermented Specialists",
    shortDesc: "Junge Zürcher Rösterei mit Fokus auf fermentierte Aufbereitungen. Anaerobic Naturals, Yeast Fermentation, Lactic Process.",
    story: "Drop Coffee CH startete 2020 als Pop-up im Zürcher Niederdorf — heute eine vollwertige Mikro-Rösterei mit eigenem Tasting Lab. Der Fokus: alles was fermentiert, anaerob und experimentell ist. Das junge Team aus drei Q-Gradern arbeitet eng mit dem World Brewers Cup Champion 2023 zusammen und importiert Kleinstmengen seltener Lots aus Costa Rica und Panama.",
    specialty: "Anaerobic · Yeast · Lactic Fermentation",
    values: ["Experimental", "WBC Partner", "Mikro-Rösterei", "Q-Grader"],
    image: ROASTERY_POOL[3],
    portrait: IMG_PORTRAIT,
    founderName: "Drop Team",
    founderRole: "3 Q-Grader",
    coffees: [],
    certifications: ["SCA", "Q-Grader", "WBC Partner"],
    social: { instagram: "@drop.coffee.ch", web: "dropcoffee.ch" },
    stats: { yearsActive: 5, coffeesRoasted: "30+", clientsServed: "2k+" },
  },
];

export const roasterBySlug = (slug: string) => roasters.find((r) => r.slug === slug);
export const allCities = Array.from(new Set(roasters.map((r) => r.city))).sort();
export const allRegions = Array.from(new Set(roasters.map((r) => r.region))).sort();
