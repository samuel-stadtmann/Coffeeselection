import { createClient } from "@/lib/supabase/server";
import { getCoffeesForTasteType } from "@/lib/db/recommendations";
import { getTasteTypeBySlug, type TasteType } from "@/lib/db/taste-types";
import { tasteTypeIdBySlug } from "./taste-types-map";

export type CoffeeDetail = {
  slug: string;
  name: string;
  roaster: string;
  origin: string;
  price: string;
  matchScore: number;
  /** 1-Satz-Pitch aus der DB; faellt auf die Type-Tagline zurueck wenn null. */
  shortDescription: string | null;
  tasteTypes: TasteType[];
};

export type CoffeeCategory = {
  slug: string;
  title: string;
  shortLabel: string;
  tagline: string;
  intro: string;
  filterTypes: string[]; // taste-type slugs to include
  filterBrewing?: string[]; // brewing methods to match
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  educational: { heading: string; text: string }[];
};

export const coffeeCategories: CoffeeCategory[] = [
  {
    slug: "filter-coffee",
    title: "Filter Coffee — Specialty für Pour Over & V60",
    shortLabel: "Filter",
    tagline: "Helle Single Origins für Klarheit und Aromentiefe",
    intro: "Filterkaffee ist die Disziplin der Klarheit. Helle Röstungen, mittel-grober Mahlgrad und eine Brühzeit von 3–4 Minuten lassen jede Aromen-Note zur Geltung kommen. Diese Kaffees sind speziell auf V60, Chemex, Aeropress und Kalita Wave abgestimmt.",
    filterTypes: ["der-fruchtfreund", "der-florale", "der-entdecker"],
    filterBrewing: ["V60", "Filter", "Aeropress", "Chemex"],
    seoTitle: "Filter Coffee — Specialty Bohnen für V60 & Pour Over",
    seoDescription: "Helle Specialty Coffees für Filter, V60 und Pour Over. Äthiopier, Kenianer, Geisha — handverlesen aus der Schweiz.",
    keywords: ["filter coffee", "v60 kaffee", "pour over bohnen", "filterkaffee specialty"],
    educational: [
      { heading: "Welche Bohne für Filter?", text: "Helle Röstungen aus Hochlagen — Äthiopien, Kenia, Ruanda. Die Säure ist Feature, nicht Bug." },
      { heading: "Mahlgrad & Wassertemperatur", text: "Mittel-grob (wie Sand) bei 92–94°C. Zu fein = bitter, zu grob = wässrig." },
      { heading: "Brewing Ratio", text: "1:16 bis 1:17 — also 18g Kaffee auf 290–306g Wasser." },
    ],
  },
  {
    slug: "espresso-beans",
    title: "Espresso Bohnen — Premium für Siebträger & Vollautomat",
    shortLabel: "Espresso",
    tagline: "Volle Crema, intensive Aromen, italienische Tradition",
    intro: "Echte Espresso-Bohnen sind keine zufällige Auswahl — sie sind speziell für 9 bar Druck und 25–30 Sekunden Extraktion entwickelt. Mittel- bis dunkel geröstet, mit Brasilien-Naturals als Basis und sortenreinen Akzenten für Komplexität.",
    filterTypes: ["der-espresso-enthusiast", "der-klassiker"],
    filterBrewing: ["Siebträger", "Vollautomat", "Moka Pot", "Espresso"],
    seoTitle: "Espresso Bohnen — Specialty für Siebträger & Vollautomat",
    seoDescription: "Premium Espresso-Bohnen aus der Schweiz. Italienische Blends, mittel-dunkle Röstungen, hervorragende Crema. Direct Trade.",
    keywords: ["espresso bohnen", "espresso kaffee", "siebträger bohnen", "vollautomat espresso"],
    educational: [
      { heading: "Was macht Espresso-Bohnen aus?", text: "Mittlere bis dunkle Röstung, ölige Oberfläche (außer für Vollautomaten), 1–4 Wochen Reifezeit nach Röstung." },
      { heading: "Blend vs. Single Origin", text: "Klassische Espressi sind oft Blends (Brasilien + Äthiopien) für Balance. Modern: Single Origin Espresso für Charakter." },
      { heading: "Frische ist alles", text: "Espresso-Bohnen verlieren am schnellsten Crema. Innerhalb von 4 Wochen nach Röstung verbrauchen." },
    ],
  },
  {
    slug: "light-roast",
    title: "Light Roast — Helle Röstungen für Aroma-Liebhaber",
    shortLabel: "Helle Röstung",
    tagline: "Origin-Charakter pur, lebendige Säure, fruchtige Komplexität",
    intro: "Helle Röstungen sind die nordische Schule des Kaffees: minimale Röstaromen, maximaler Origin-Charakter. Bei 195–210°C ausgerollt, behalten sie die feinen floralen, fruchtigen und teeartigen Noten der grünen Bohne.",
    filterTypes: ["der-fruchtfreund", "der-florale", "der-entdecker"],
    seoTitle: "Light Roast Kaffee — Helle Röstungen Specialty",
    seoDescription: "Helle Specialty Kaffees aus Hochlagen. Äthiopien, Kenia, Panama Geisha. Lebendige Säure, florale Aromen, transparenter Origin-Charakter.",
    keywords: ["light roast", "helle röstung", "nordische röstung", "specialty light roast"],
    educational: [
      { heading: "Warum hell rösten?", text: "Bei kürzerer Röstzeit bleiben mehr der ursprünglichen Aromen-Vorstufen erhalten. Origin und Aufbereitung sind direkter erkennbar." },
      { heading: "Röst-Temperatur", text: "Endpunkt zwischen 195–210°C, oft direkt nach dem ersten Crack. Bohnen bleiben hellbraun und matt." },
      { heading: "Magenfreundlichkeit", text: "Helle Röstungen haben mehr Säure — bei sensiblem Magen lieber mittel oder dunkel wählen." },
    ],
  },
  {
    slug: "dark-roast",
    title: "Dark Roast — Dunkle Röstungen für Tradition & Tiefe",
    shortLabel: "Dunkle Röstung",
    tagline: "Schokolade, Karamell, Tabak — italienische Espresso-Tradition",
    intro: "Dunkle Röstungen sind die italienische Schule. Bei 220–240°C entwickeln sich tiefe Schokoladen-, Karamell- und Tabak-Aromen. Ölige Oberfläche, voller Körper, magenfreundliche niedrige Säure.",
    filterTypes: ["der-espresso-enthusiast", "der-erdige"],
    seoTitle: "Dark Roast Kaffee — Dunkle Röstungen für Espresso & Charakter",
    seoDescription: "Dunkle Specialty-Röstungen für Espresso, Moka Pot und French Press. Schokoladig, würzig, voller Körper. Magenfreundlich.",
    keywords: ["dark roast", "dunkle röstung", "italienische röstung", "espresso röstung"],
    educational: [
      { heading: "Was passiert bei dunkler Röstung?", text: "Säuren werden abgebaut, Bitterstoffe entstehen, Öle treten an die Oberfläche. Origin-Charakter wird durch Röstaromen überlagert." },
      { heading: "Beste Brühmethoden", text: "Espresso, Moka Pot, French Press. V60 oder Filter sind weniger geeignet — die Röstaromen dominieren." },
      { heading: "Magenfreundlich", text: "Niedrigerer Säuregehalt macht dunkle Röstungen verträglicher für sensible Mägen." },
    ],
  },
  {
    slug: "low-acidity",
    title: "Säurearmer Kaffee — magenfreundlich & mild",
    shortLabel: "Säurearm",
    tagline: "Sumatra, Brasilien Naturals — der weiche Genuss",
    intro: "Manche Mägen reagieren empfindlich auf Säure. Aber Verzicht auf guten Kaffee ist keine Lösung. Indonesische Bohnen, Brasilien-Naturals und gut entwickelte Mittelröstungen liefern echten Geschmack ohne Säure-Stress.",
    filterTypes: ["der-sanfte", "der-erdige"],
    seoTitle: "Säurearmer Kaffee — magenfreundlich, mild, Specialty",
    seoDescription: "Säurearmer Specialty Coffee für sensible Mägen. Sumatra Mandheling, Brasilien Naturals, indonesische Spezialitäten.",
    keywords: ["säurearmer kaffee", "magenfreundlicher kaffee", "kaffee ohne säure", "sumatra kaffee"],
    educational: [
      { heading: "Warum manche Bohnen säurearmer sind", text: "Anbau in tieferen Lagen, längere Reifung, Wet-Hulled-Aufbereitung (Indonesien) und mittlere bis dunkle Röstung reduzieren den Säuregehalt." },
      { heading: "Beste Origins für sensible Mägen", text: "Sumatra (Wet-Hulled), Brasilien Naturals, Sulawesi Toraja, Java Estate. Alle natürlich säurearm." },
      { heading: "Was du vermeiden solltest", text: "Helle Röstungen aus Äthiopien, Kenia und Hochlagen-Kolumbianer. Hier dominiert die Säure." },
    ],
  },
  {
    slug: "fruity-coffee",
    title: "Fruchtiger Kaffee — Beeren, Zitrus, lebendige Aromen",
    shortLabel: "Fruchtig",
    tagline: "Erdbeere, Brombeere, Limette — Frucht in der Tasse",
    intro: "Fruchtige Kaffees sind keine Aromatisierungen. Es sind die natürlichen Aromen, die in helleren, gut aufbereiteten Specialty-Bohnen entstehen. Anaerobic Naturals, hohe Anbaulagen und Heirloom-Varietäten machen den Unterschied.",
    filterTypes: ["der-fruchtfreund", "der-entdecker"],
    seoTitle: "Fruchtiger Kaffee — Beeren-Aromen, Specialty Coffee",
    seoDescription: "Fruchtige Specialty Coffees mit Beeren-, Zitrus- und tropischen Noten. Äthiopien Yirgacheffe, Kenya AA, Anaerobic Naturals.",
    keywords: ["fruchtiger kaffee", "beerige kaffeebohnen", "fruchtige aromen", "specialty fruity coffee"],
    educational: [
      { heading: "Wo entstehen Frucht-Aromen?", text: "Hohe Anbaulagen (1500m+), langsame Reifung, Anaerobic oder Honey Process Aufbereitung. Helle Röstung erhält die Aromen." },
      { heading: "Welche Brühmethoden funktionieren?", text: "V60, Aeropress und Chemex bringen die Aromen am besten zur Geltung. Im Espresso werden sie konzentriert, aber weniger transparent." },
      { heading: "Top Origins", text: "Äthiopien Yirgacheffe, Kenya Nyeri, Costa Rica Anaerobic, Ruanda. Alles Hochlagen mit langsamer Reifung." },
    ],
  },
  {
    slug: "floral-coffee",
    title: "Floraler Kaffee — Jasmin, Bergamotte, Tee-Aromen",
    shortLabel: "Floral",
    tagline: "Jasmin, weißer Pfirsich, schwarzer Tee — die feinste Form",
    intro: "Florale Kaffees sind die elegantesten Profile im Specialty-Universum. Yirgacheffe Washed, Yemen Mokha, Geisha — Sorten, die nach Blüten und Tee schmecken statt nach Frucht oder Schokolade.",
    filterTypes: ["der-florale"],
    seoTitle: "Floraler Kaffee — Jasmin, Bergamotte, Tee-Aromen",
    seoDescription: "Florale Specialty Coffees mit Jasmin-, Bergamotte- und Tee-Noten. Äthiopien Washed, Yemen Mokha, Panama Geisha.",
    keywords: ["floraler kaffee", "jasmin kaffee", "bergamotte kaffee", "tee artiger kaffee"],
    educational: [
      { heading: "Wie entstehen florale Aromen?", text: "Sortenreine Heirloom-Varietäten (Geisha, Sidra), Washed-Aufbereitung, Anbau über 1800m. Helle Röstung essentiell." },
      { heading: "Brühmethoden für florale Aromen", text: "Nur Filter und Pour Over. V60 mit langsamem Pour. Espresso erstickt die feinen Noten." },
      { heading: "Wein-Vergleich", text: "Florale Kaffees sind die Riesling-Spätlesen des Kaffees: feine Säure, klare Aromen, fragile Eleganz." },
    ],
  },
  {
    slug: "chocolatey-coffee",
    title: "Schokoladiger Kaffee — Kakao, Karamell, Nuss",
    shortLabel: "Schokoladig",
    tagline: "Klassische Profile aus Brasilien, Honduras und Kolumbien",
    intro: "Schokoladige Kaffees sind die Komfortzone des Specialty-Coffees. Brasilien Cerrado, Honduras Marcala, Colombia Supremo — verlässliche Bohnen mit warmen Schokoladen-, Karamell- und Nuss-Noten.",
    filterTypes: ["der-klassiker", "der-erdige"],
    seoTitle: "Schokoladiger Kaffee — Kakao, Karamell, Specialty Brasilien",
    seoDescription: "Schokoladige Specialty Coffees aus Brasilien, Honduras, Kolumbien. Klassische Kakao-, Karamell- und Nuss-Noten. Magenfreundlich.",
    keywords: ["schokoladiger kaffee", "kakao kaffee", "klassischer kaffee", "brasilien kaffee"],
    educational: [
      { heading: "Wo entstehen Schoko-Aromen?", text: "Brasilianische Naturals durch lange Sonnentrocknung mit der Kirsche. Mittlere Röstung entwickelt die Maillard-Reaktionen voll." },
      { heading: "Universal-tauglich", text: "Schokoladige Kaffees funktionieren in Espresso, Filter, French Press und Vollautomat. Die freundlichste Kategorie." },
      { heading: "Mit Milch", text: "Schokoladige Profile harmonieren perfekt mit Milch — Cappuccino und Latte Macchiato kommen hier voll zur Geltung." },
    ],
  },
  {
    slug: "sweet-coffee",
    title: "Süßer Kaffee — Honig, Karamell, natürliche Süße",
    shortLabel: "Süß",
    tagline: "Costa Rica Honey, Yellow Bourbon — Süße ohne Zucker",
    intro: "Specialty Coffee kann von Natur aus überraschend süß sein — wenn die Aufbereitung stimmt. Honey-Process aus Costa Rica, Yellow Bourbon Naturals aus Brasilien und Pulped Naturals geben Karamell, Honig und Datteln preis.",
    filterTypes: ["der-suesse"],
    seoTitle: "Süßer Kaffee — Honig, Karamell, Honey Process Specialty",
    seoDescription: "Süße Specialty Coffees mit Honey-Process-Aufbereitung. Costa Rica Honey, Yellow Bourbon, natürliche Süße ohne Zucker.",
    keywords: ["süßer kaffee", "honey process kaffee", "karamell kaffee", "yellow bourbon"],
    educational: [
      { heading: "Was ist Honey Process?", text: "Bei der Aufbereitung wird ein Teil des Fruchtfleisches an der Bohne belassen. Die Zucker des Mucilage diffundieren in die Bohne — natürliche Süße." },
      { heading: "Yellow Bourbon", text: "Eine spezielle Varietät, die statt roter gelbe Kirschen produziert. Die Reifung am Strauch ist länger, mehr Zucker entwickelt sich." },
      { heading: "Magenfreundlich + süß", text: "Die meisten süßen Profile haben mittlere Säure und sind dadurch sehr verträglich — die perfekte Einstiegsdroge in Specialty Coffee." },
    ],
  },
  {
    slug: "new-arrivals",
    title: "Neu im Sortiment — frisch geröstet, frisch gelistet",
    shortLabel: "Neu",
    tagline: "Aktuelle Lots, saisonale Highlights, Rare Releases",
    intro: "Hier findest du, was gerade frisch in unser Sortiment gekommen ist. Saisonale Lots, neue Aufbereitungen unserer Partner-Röstereien, Cup-of-Excellence-Auktionsgewinner und limitierte Releases.",
    filterTypes: ["der-fruchtfreund", "der-florale", "der-entdecker", "der-suesse", "der-klassiker", "der-espresso-enthusiast", "der-sanfte", "der-erdige"],
    seoTitle: "Neu im Sortiment — neue Specialty Coffees | Coffee Selection",
    seoDescription: "Die neuesten Specialty Coffees in unserem Sortiment. Frische Röstungen, saisonale Lots, Rare Releases der Schweizer Top-Röster.",
    keywords: ["neue kaffee", "new arrivals coffee", "frische röstung", "specialty coffee neu"],
    educational: [
      { heading: "Wie oft kommen neue Lots?", text: "Wöchentlich. Unsere Partner-Röstereien melden frische Chargen direkt — manchmal nur 12kg auf einmal." },
      { heading: "Saisonale Verfügbarkeit", text: "Kaffee ist landwirtschaftliches Produkt. Äthiopier kommen Nov–Mai, Brasilianer Mai–Okt. Was heute neu ist, kann nächste Woche ausverkauft sein." },
      { heading: "Rare Releases", text: "Cup-of-Excellence-Sieger, Geisha-Mikrolots, Yemen-Highland — diese Lots sind nicht im Standard-Abo, aber für Mitglieder reservierbar." },
    ],
  },
  {
    slug: "discovery-box",
    title: "Discovery Box — kuratierte Specialty-Reise",
    shortLabel: "Discovery Box",
    tagline: "Jeden Monat 2 neue Kaffees, perfekt zu deinem Geschmackstyp",
    intro: "Die Discovery Box ist nicht eine Bestellung — es ist eine kuratierte Reise. Jeden Monat erhältst du 2 verschiedene Specialty Coffees, perfekt auf deinen Geschmackstyp abgestimmt. 15% Rabatt gegenüber Einzelbestellung.",
    filterTypes: ["der-fruchtfreund", "der-florale", "der-entdecker", "der-suesse"],
    seoTitle: "Discovery Box — Coffee Subscription Schweiz | Coffee Selection",
    seoDescription: "Die Discovery Box: Kuratiertes Specialty-Coffee-Abo. 2 Kaffees pro Lieferung, 15% Rabatt, jederzeit pausierbar. Ab CHF 24.",
    keywords: ["discovery box", "coffee box schweiz", "kaffee abo box", "specialty coffee subscription"],
    educational: [
      { heading: "Was ist drin?", text: "2 verschiedene Specialty Coffees (250g oder 500g je), Karte mit Brüh-Tipps, Aromen-Beschreibung. Ab CHF 24 pro Lieferung." },
      { heading: "Wie wird kuratiert?", text: "Unser Algorithmus matcht dich nach deinem Quiz mit dem passenden Profil. Mit jeder Bewertung lernt er dazu." },
      { heading: "Volle Flexibilität", text: "Pausieren, Intervall ändern, Größe wechseln, kündigen — alles mit einem Klick. Keine Mindestlaufzeit." },
    ],
  },
];

export const categoryBySlug = (slug: string) => coffeeCategories.find((c) => c.slug === slug);

/**
 * Holt alle Coffees aus der DB die zu mind. einem der `cat.filterTypes`
 * (Taste-Type-Slugs) passen — ranking via getCoffeesForTasteType (anonyme
 * Variante, kein Hard-Filter, kein Customer-Embedding). Union dedupliziert
 * by coffee.id; matchScore behaelt den hoechsten gefundenen Wert.
 */
export async function getCoffeesForCategory(cat: CoffeeCategory): Promise<CoffeeDetail[]> {
  const supabase = await createClient();

  // filterTypes-Mapping: jeden Slug mit ID + DB-TasteType anreichern.
  // Async parallelisieren — 3-4 Slugs pro Kategorie.
  const filterTypes = (
    await Promise.all(
      cat.filterTypes.map(async (slug) => {
        const id = tasteTypeIdBySlug(slug);
        const type = await getTasteTypeBySlug(supabase, slug);
        return id != null && type ? { slug, id, type } : null;
      })
    )
  ).filter((t): t is { slug: string; id: number; type: TasteType } => t != null);

  const seen = new Map<string, CoffeeDetail>();
  for (const ft of filterTypes) {
    const coffees = await getCoffeesForTasteType(supabase, ft.id, { limit: 30 });
    for (const c of coffees) {
      const matchPct = Math.round(c.matchScore * 100);
      const existing = seen.get(c.id);
      if (existing) {
        if (!existing.tasteTypes.some((t) => t.slug === ft.slug)) {
          existing.tasteTypes.push(ft.type);
        }
        if (matchPct > existing.matchScore) existing.matchScore = matchPct;
        continue;
      }
      seen.set(c.id, {
        slug: c.slug,
        name: c.name,
        roaster: c.roaster?.name ?? "",
        origin: c.origin_name ?? "",
        price: `CHF ${c.price_chf.toFixed(2)}`,
        matchScore: matchPct,
        shortDescription: c.short_description ?? c.tasting_summary ?? null,
        tasteTypes: [ft.type],
      });
    }
  }
  return Array.from(seen.values()).sort((a, b) => b.matchScore - a.matchScore);
}

export const categorySlugs = coffeeCategories.map((c) => c.slug);
