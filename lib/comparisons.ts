export type ComparisonRow = { label: string; a: string; b: string };
export type ComparisonItem = { icon: string; text: string };

export type Comparison = {
  slug: string;
  title: string;
  subtitle: string;
  a: { name: string; tagline: string; icon: string; image: string; matchType?: string };
  b: { name: string; tagline: string; icon: string; image: string; matchType?: string };
  intro: string;
  table: ComparisonRow[];
  aBest: ComparisonItem[];
  bBest: ComparisonItem[];
  whoIsWho: string;
  conclusion: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  related: string[];
};

const IMG_LIGHT =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAY2O-anAQphHP12QvSMRlb2TQ2LotVt3khFGmiqNn5BP1EvEFXoUXNzYJVoaRWaK6jkJSUhmaBWTLg06JEe5cnlD8juKbgCqXypGBd65goXMtQOrtymjajAV2YAdY-b7tzTAokhCaWcGZSYOdtnXVqCkrxEdkq5lZvqJD4HGZArUxSgtgSmhbNEY4_nkRWu8r_tf7ssjnAemr3j6AbKvLEnvattwapfkJejfSVMirl7u3j8i5yS2iDKG2ZpQPcIJRn-METX1b-Qd9b";
const IMG_DARK =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBN8IgtovkYQlygVeCT7-HQJ3MxBIeXLHA7DLDxl1WsR_OhCTGdjP5WesE-1cuQRX2vSR__im3sOEI3Io4OQIaVy0Id7JoExY3qQQYId3uFZ0QVQ97HAEuACLlAIx1qmx6h9H7xFKRyQu1GTx1w87_FIcnKzg7zHh6N1JV8CH_0r5HSJp1bQCci05GFg8a9-XCnRtJRO_Y0T3nVzh4tLab0BxXGH_-yl0BwzYHtUSYMv6Gj_lGWgVZf3eVU60m2PPVUZdFKNue8cwtB";

export const comparisons: Comparison[] = [
  {
    slug: "fruity-vs-chocolatey-coffee",
    title: "Fruchtiger vs. schokoladiger Kaffee",
    subtitle: "Lebendige Beeren oder warme Kakaonoten — was passt zu dir?",
    a: { name: "Fruchtig", tagline: "Beerig · Hell · Lebendig", icon: "nutrition", image: IMG_LIGHT, matchType: "der-fruchtfreund" },
    b: { name: "Schokoladig", tagline: "Kakao · Karamell · Warm", icon: "cake", image: IMG_DARK, matchType: "der-suesse" },
    intro: "Der wohl wichtigste Geschmacks-Wegscheid im Specialty Coffee. Auf der einen Seite die hellen, lebendigen Aromen aus Äthiopien und Kenia. Auf der anderen die warmen, schokoladigen Profile aus Brasilien, Kolumbien und Honduras. Beide sind hervorragend — aber sie sprechen unterschiedliche Geschmackstypen an.",
    table: [
      { label: "Aromen-Familie", a: "Beeren, Zitrus, Floral", b: "Schokolade, Karamell, Nuss" },
      { label: "Säure", a: "Hoch (lebendig)", b: "Mild bis mittel" },
      { label: "Körper", a: "Leicht, klar", b: "Mittel bis voll" },
      { label: "Süße", a: "Hoch (Frucht-Süße)", b: "Hoch (Karamell-Süße)" },
      { label: "Bitterkeit", a: "Niedrig", b: "Mittel" },
      { label: "Röstgrad", a: "Hell", b: "Mittel" },
      { label: "Typische Origin", a: "Äthiopien, Kenia, Ruanda", b: "Brasilien, Honduras, Kolumbien" },
      { label: "Beste Brühmethode", a: "V60, Filter, Aeropress", b: "French Press, Espresso, Vollautomat" },
      { label: "Magen-Sensitivität", a: "Höhere Säure (sensibel)", b: "Magenfreundlich" },
    ],
    aBest: [
      { icon: "explore", text: "Du liebst neue Geschmackserfahrungen" },
      { icon: "wine_bar", text: "Du trinkst gerne Wein und kennst Aromen" },
      { icon: "water_drop", text: "Du brühst Filter, V60 oder Aeropress" },
      { icon: "spa", text: "Du genießt morgens in Ruhe" },
    ],
    bBest: [
      { icon: "schedule", text: "Du suchst einen verlässlichen Alltagsbegleiter" },
      { icon: "coffee_maker", text: "Du nutzt Vollautomat oder Espresso-Maschine" },
      { icon: "favorite", text: "Du magst Milch im Kaffee" },
      { icon: "health_and_safety", text: "Du hast einen empfindlichen Magen" },
    ],
    whoIsWho: "Wer fruchtige Kaffees liebt, ist meist Entdecker mit Wein-Affinität. Wer schokoladige bevorzugt, schätzt Verlässlichkeit und Morgen-Routine.",
    conclusion: "Es gibt keinen Gewinner — beide Profile sind erstklassig. Die Frage ist: was passt zu dir? Mach das Quiz und finde deinen Geschmackstyp aus 8 Archetypen.",
    seoTitle: "Fruchtiger vs. schokoladiger Kaffee — Vergleich & Empfehlung",
    seoDescription: "Fruchtig oder schokoladig? Detaillierter Vergleich beider Kaffee-Profile mit Origin-Empfehlungen, Brühmethoden und Geschmackstyp-Match.",
    keywords: ["fruchtiger kaffee", "schokoladiger kaffee", "kaffee profile", "vergleich kaffee", "specialty coffee fruchtig"],
    related: ["filter-vs-espresso", "light-vs-dark-roast", "arabica-vs-robusta"],
  },
  {
    slug: "filter-vs-espresso",
    title: "Filter vs. Espresso",
    subtitle: "Klarheit oder Konzentration — zwei Welten der Kaffeezubereitung",
    a: { name: "Filter", tagline: "Klar · Aromatisch · Sanft", icon: "water_drop", image: IMG_LIGHT },
    b: { name: "Espresso", tagline: "Konzentriert · Cremig · Intensiv", icon: "coffee_maker", image: IMG_DARK },
    intro: "Filter und Espresso sind zwei komplett verschiedene Auffassungen davon, was Kaffee sein soll. Filter ist Klarheit und Transparenz. Espresso ist Konzentration und Charakter. Beide haben ihre Berechtigung — die Wahl hängt von deinem Lebensstil ab.",
    table: [
      { label: "Druck", a: "0 bar (Schwerkraft)", b: "9 bar" },
      { label: "Brühzeit", a: "3–4 Minuten", b: "25–30 Sekunden" },
      { label: "Mahlgrad", a: "Mittel-grob (Sand)", b: "Sehr fein (Puderzucker)" },
      { label: "Wassermenge", a: "200–300 ml", b: "30 ml (Doppio: 60 ml)" },
      { label: "Brewing Ratio", a: "1:16 bis 1:17", b: "1:2 bis 1:3" },
      { label: "Geschmackswahrnehmung", a: "Hell, klar, aromatisch", b: "Konzentriert, kräftig, samtig" },
      { label: "Crema", a: "Keine", b: "Goldene Hasenschwanz-Crema" },
      { label: "Beste Bohnen", a: "Helle Single Origins", b: "Mittel-dunkle Blends" },
      { label: "Equipment-Investment", a: "CHF 30–150 (V60, Filter)", b: "CHF 800–8&apos;000 (Siebträger)" },
      { label: "Skill-Level", a: "Einsteigerfreundlich", b: "Anspruchsvoll" },
    ],
    aBest: [
      { icon: "schedule", text: "Du hast morgens 5 Minuten Zeit" },
      { icon: "explore", text: "Du willst feine Aromen schmecken" },
      { icon: "savings", text: "Equipment-Budget unter CHF 200" },
      { icon: "spa", text: "Du genießt Ritual und Achtsamkeit" },
    ],
    bBest: [
      { icon: "bolt", text: "Du brauchst es schnell und konzentriert" },
      { icon: "coffee", text: "Du liebst Cappuccino und Latte Macchiato" },
      { icon: "diamond", text: "Du investierst in Premium-Equipment" },
      { icon: "engineering", text: "Du bist technik-begeistert" },
    ],
    whoIsWho: "Filter-Trinker sind oft Genießer und Entdecker. Espresso-Fans sind Performer und Italien-Liebhaber. Beide sind richtig — nur unterschiedlich.",
    conclusion: "Wenn du beides willst: viele Specialty Coffee Bohnen funktionieren in beiden Methoden — nur das Ergebnis ist anders. Mach das Quiz, wir matchen dich mit der richtigen Bohne für deine Brühmethode.",
    seoTitle: "Filter vs. Espresso — Unterschied, Vergleich & Empfehlung",
    seoDescription: "Filterkaffee oder Espresso? Detaillierter Vergleich: Druck, Brühzeit, Aromen, Equipment-Kosten. Mit Empfehlung welche Methode zu dir passt.",
    keywords: ["filter vs espresso", "espresso vs filterkaffee", "filterkaffee espresso unterschied", "welche brühmethode"],
    related: ["light-vs-dark-roast", "fruity-vs-chocolatey-coffee", "arabica-vs-robusta"],
  },
  {
    slug: "light-vs-dark-roast",
    title: "Helle vs. dunkle Röstung",
    subtitle: "Säure und Komplexität oder Schokolade und Körper — der Röstgrad-Vergleich",
    a: { name: "Helle Röstung", tagline: "Frucht · Floral · Lebendig", icon: "light_mode", image: IMG_LIGHT },
    b: { name: "Dunkle Röstung", tagline: "Kakao · Tabak · Voll", icon: "local_fire_department", image: IMG_DARK },
    intro: "Der Röstgrad ist die wichtigste geschmackliche Stellschraube nach der Bohnen-Auswahl. Hell zeigt das Origin-Terroir, dunkel zeigt die Röstkunst. Beide sind valide Stile mit treuen Anhängern.",
    table: [
      { label: "Röst-Temperatur", a: "195–210°C", b: "220–240°C" },
      { label: "Bohnen-Farbe", a: "Hellbraun, matt", b: "Dunkelbraun bis schwarz, ölig" },
      { label: "Säure", a: "Hoch", b: "Niedrig" },
      { label: "Bitterkeit", a: "Niedrig", b: "Mittel bis hoch" },
      { label: "Körper", a: "Leicht bis mittel", b: "Voll" },
      { label: "Aromen", a: "Frucht, Blüten, Tee", b: "Kakao, Karamell, Tabak, Holz" },
      { label: "Origin-Charakter", a: "Sehr ausgeprägt", b: "Vom Röstprozess überlagert" },
      { label: "Koffein-Gehalt", a: "Etwas mehr (gleicher Volumen)", b: "Etwas weniger (gleicher Volumen)" },
      { label: "Magenverträglichkeit", a: "Sensibler bei empfindlichem Magen", b: "Magenfreundlicher" },
      { label: "Beste Brühmethode", a: "V60, Filter, Aeropress", b: "Espresso, Moka Pot, French Press" },
    ],
    aBest: [
      { icon: "explore", text: "Du suchst Aromen-Vielfalt und Komplexität" },
      { icon: "water_drop", text: "Du brühst Filter, V60 oder Pour-Over" },
      { icon: "wine_bar", text: "Du verstehst Wein-Komplexität" },
      { icon: "auto_awesome", text: "Du willst das Origin-Terroir schmecken" },
    ],
    bBest: [
      { icon: "favorite", text: "Du magst Milch-Getränke (Cappuccino, Latte)" },
      { icon: "coffee_maker", text: "Du brühst mit Vollautomat oder Espresso" },
      { icon: "schedule", text: "Du willst morgens schnellen Genuss" },
      { icon: "health_and_safety", text: "Du hast einen empfindlichen Magen" },
    ],
    whoIsWho: "Helle-Röst-Fans sind oft Liebhaber von Single Origins und Pour-Over. Dunkle-Röst-Fans schätzen italienische Kaffeekultur und vollmundige Espressi.",
    conclusion: "Die Wahrheit: die meisten Schweizer Kaffeetrinker sollten zwischen mittel-hell und mittel-dunkel wählen. Extreme Röstungen sind für Spezialisten. Quiz machen → wir empfehlen den richtigen Röstgrad für deine Brühmethode.",
    seoTitle: "Helle vs. dunkle Röstung — Unterschied & welche ist besser?",
    seoDescription: "Helle oder dunkle Röstung? Vergleichstabelle mit Säure, Koffein, Aromen und Brühmethoden-Empfehlungen. Schweizer Specialty-Sicht.",
    keywords: ["helle dunkle röstung", "light vs dark roast", "röstgrad kaffee", "welche röstung", "kaffee röststufen"],
    related: ["filter-vs-espresso", "fruity-vs-chocolatey-coffee", "arabica-vs-robusta"],
  },
  {
    slug: "arabica-vs-robusta",
    title: "Arabica vs. Robusta",
    subtitle: "Zwei Bohnen-Arten, zwei Welten — was ist wirklich der Unterschied?",
    a: { name: "Arabica", tagline: "Edel · Komplex · Specialty", icon: "spa", image: IMG_LIGHT },
    b: { name: "Robusta", tagline: "Kräftig · Bitter · Crema", icon: "fitness_center", image: IMG_DARK },
    intro: "60% des weltweit produzierten Kaffees ist Arabica, 40% Robusta. Im Specialty Coffee dominiert Arabica fast komplett — aus gutem Grund. Aber Robusta hat seine Daseinsberechtigung in italienischen Espresso-Blends. Hier sind die Fakten.",
    table: [
      { label: "Botanische Art", a: "Coffea arabica", b: "Coffea canephora" },
      { label: "Anbauhöhe", a: "600–2&apos;200m (oft 1&apos;000m+)", b: "0–800m" },
      { label: "Klima", a: "Mild, kühl, schattig", b: "Heiß, feucht, sonnig" },
      { label: "Koffein-Gehalt", a: "1.0–1.5%", b: "2.2–2.7% (doppelt so viel)" },
      { label: "Säure", a: "Mittel bis hoch", b: "Niedrig" },
      { label: "Aromen-Komplexität", a: "Sehr hoch (800+ Aromen)", b: "Niedrig (eintöniger)" },
      { label: "Bitterkeit", a: "Mild", b: "Hoch" },
      { label: "Körper", a: "Leicht bis mittel", b: "Voll, dickflüssig" },
      { label: "Crema (im Espresso)", a: "Hell, fein", b: "Dicht, persistent" },
      { label: "Preis pro kg", a: "Höher (CHF 8–25 grün)", b: "Niedrig (CHF 2–5 grün)" },
      { label: "Specialty-Anteil", a: "Fast 100%", b: "Selten, meist Industrie" },
    ],
    aBest: [
      { icon: "auto_awesome", text: "Du willst Specialty-Qualität" },
      { icon: "explore", text: "Du suchst Aromen-Komplexität" },
      { icon: "favorite", text: "Du genießt Kaffee bewusst" },
      { icon: "stars", text: "Du verstehst, warum Qualität ihren Preis hat" },
    ],
    bBest: [
      { icon: "bolt", text: "Du brauchst maximale Crema im Espresso" },
      { icon: "fitness_center", text: "Du suchst maximalen Koffein-Kick" },
      { icon: "savings", text: "Du suchst günstige Industrie-Bohnen" },
      { icon: "engineering", text: "Du betreibst eine Kaffee-Bar mit hohem Volumen" },
    ],
    whoIsWho: "Arabica ist die klare Wahl für Specialty Coffee — alle 24 Kaffees in unserem Sortiment sind 100% Arabica. Robusta findet sich nur in kommerziellen Espresso-Blends, oft als Streckmittel.",
    conclusion: "Die meisten Schweizer trinken bereits Arabica, ohne es zu wissen. Wenn dein Kaffee gut schmeckt, ist es wahrscheinlich Arabica. Wenn er bitter und flach schmeckt, ist viel Robusta drin. Coffee Selection arbeitet ausschließlich mit Arabica-Specialty-Bohnen.",
    seoTitle: "Arabica vs. Robusta — Unterschied, Qualität, Preis erklärt",
    seoDescription: "Arabica oder Robusta? Komplettvergleich mit Koffein, Säure, Komplexität, Preis. Warum Specialty Coffee fast immer Arabica ist.",
    keywords: ["arabica vs robusta", "kaffee bohnen arten", "arabica robusta unterschied", "kaffee qualität"],
    related: ["fruity-vs-chocolatey-coffee", "light-vs-dark-roast", "filter-vs-espresso"],
  },
];

export const comparisonBySlug = (slug: string) => comparisons.find((c) => c.slug === slug);
