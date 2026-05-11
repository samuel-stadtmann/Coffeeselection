/**
 * Konstanten und Helfer fuer das Coffee-Erfassungs-Formular.
 *
 * - SCA-Skala 1-5 mit Playbook-Beispielen pro Achse (Tooltip/Hint im UI).
 * - AROMA_FAMILIES: feste Liste die als coffees.aroma_families-Slugs landet
 *   und vom Algorithmus (compute_scoring_score, build-customer-embedding,
 *   etc.) gelesen wird.
 * - validateCoffee(): Konsistenzpruefung mit Inline-Warnungen
 *   (Playbook 8.4 Massnahme 2 — "Light Roast + Bitterkeit 5 -> sicher?").
 */

export type SensoryAxisKey =
  | "acidity"
  | "body"
  | "sweetness"
  | "bitterness"
  | "complexity";

export const SENSORY_AXES: Array<{
  key: SensoryAxisKey;
  label: string;
  hint1: string;
  hint10: string;
}> = [
  {
    key: "acidity",
    label: "Säure",
    hint1: "1-2 = praktisch keine Säure (Sumatra Mandheling)",
    hint10: "9-10 = sehr lebendige Säure (Yirgacheffe washed)",
  },
  {
    key: "body",
    label: "Körper",
    hint1: "1-2 = wässrig / leicht wie Tee",
    hint10: "9-10 = sirupartig dicht / vollmundig",
  },
  {
    key: "sweetness",
    label: "Süße",
    hint1: "1-2 = trocken, keine wahrnehmbare Süße",
    hint10: "9-10 = honig-/karamellartig süß",
  },
  {
    key: "bitterness",
    label: "Bitterkeit",
    hint1: "1-2 = sehr milde Bitterkeit",
    hint10: "9-10 = stark bitter (über-extrahierte Espresso-Note)",
  },
  {
    key: "complexity",
    label: "Komplexität",
    hint1: "1-2 = eine dominante Note (z.B. nur Schokolade)",
    hint10: "9-10 = vielschichtig (mehrere klare Noten in Reihenfolge)",
  },
];

/**
 * Roester arbeiten mit der branchen-üblichen 1-10-Skala (10er-Cupping-Bogen).
 * Die DB + der Algorithmus arbeiten intern mit der SCA-1-5-Skala.
 * Mapping: 1+2 -> 1, 3+4 -> 2, 5+6 -> 3, 7+8 -> 4, 9+10 -> 5.
 *
 * Math.ceil(v / 2) macht genau das, mit Clamp auf [1, 5].
 */
export function tenToFive(v: number): number {
  if (!Number.isFinite(v)) return 3;
  return Math.max(1, Math.min(5, Math.ceil(v / 2)));
}

/**
 * Rückwärtsweg fürs Edit-Form: 1-5 -> mittlerer Wert auf 1-10
 *   1 -> 2, 2 -> 4, 3 -> 6, 4 -> 8, 5 -> 10
 * Verlustbehaftet (wir kennen den Original-1-10-Wert nicht mehr).
 */
export function fiveToTen(v: number | null | undefined): number {
  if (v == null || !Number.isFinite(v)) return 6;
  return Math.max(1, Math.min(10, v * 2));
}

export const ROAST_LEVELS: Array<{ value: number; label: string; hint: string }> = [
  { value: 1, label: "Light", hint: "Hell — z.B. nordischer Filterstil" },
  { value: 2, label: "Medium-Light", hint: "Hell-Medium — Filter / Pour Over" },
  { value: 3, label: "Medium", hint: "Mittel — Universal / Vollautomat" },
  { value: 4, label: "Medium-Dark", hint: "Mittel-Dunkel — Espresso-Profil" },
  { value: 5, label: "Dark", hint: "Dunkel — italienische Tradition" },
];

export type AromaFamily =
  | "chocolate"
  | "nutty"
  | "sugary"
  | "fruity"
  | "citrus"
  | "berry"
  | "floral"
  | "spicy"
  | "earthy"
  | "woody"
  | "smoky"
  | "tea_like"
  | "wine_like";

export const AROMA_FAMILIES: Array<{ slug: AromaFamily; label: string }> = [
  { slug: "chocolate", label: "Schokolade" },
  { slug: "nutty", label: "Nuss" },
  { slug: "sugary", label: "Süß / Karamell" },
  { slug: "fruity", label: "Frucht (allgemein)" },
  { slug: "citrus", label: "Zitrus" },
  { slug: "berry", label: "Beere" },
  { slug: "floral", label: "Floral" },
  { slug: "spicy", label: "Würzig" },
  { slug: "earthy", label: "Erdig" },
  { slug: "woody", label: "Holzig" },
  { slug: "smoky", label: "Rauchig" },
  { slug: "tea_like", label: "Tee-artig" },
  { slug: "wine_like", label: "Weinig" },
];

export type CoffeeFormState = {
  // Stammdaten
  name: string;
  slug: string;
  roaster_id: string;
  short_description: string;
  description: string;
  // Geschmacks-Texte (algorithmus-relevant)
  flavor_description: string;
  tasting_summary: string;
  // Herkunft
  origin_id: string | null;
  region: string;
  farm: string;
  producer: string;
  variety_id: string | null;
  processing_method_id: string | null;
  altitude_m_min: number | null;
  altitude_m_max: number | null;
  harvest_year: number | null;
  // Roest
  roast_level: number;          // 1-5
  roast_profile: "espresso" | "filter" | "omni";
  is_decaf: boolean;
  decaf_method: "swiss_water" | "co2" | "sugarcane_ea" | "solvent_ea" | "other" | "";
  // Sensorik im Form 1-10 (Roester-Cupping-Bogen). Wird beim Submit
  // via tenToFive() auf 1-5 normalisiert bevor's in die DB geht.
  acidity: number;
  body: number;
  sweetness: number;
  bitterness: number;
  complexity: number;
  // Aroma-Familien (Algorithmus)
  aroma_families: AromaFamily[];
  // Kommerz
  price_chf: number | null;
  weight_g: number;
  stock_kg: number | null;
  stock_status: "in_stock" | "low_stock" | "out_of_stock" | "discontinued";
  min_order_qty: number;
  is_organic: boolean;
  is_direct_trade: boolean;
  sca_score: number | null;
  // Allergene + Zertifikate
  allergen_slugs: string[];
  certification_ids: string[];
  // Lifecycle
  status: "draft" | "active" | "paused" | "discontinued";
  is_fresh_roast_on_demand: boolean;
  lot_number: string;
};

export function emptyCoffeeForm(): CoffeeFormState {
  return {
    name: "",
    slug: "",
    roaster_id: "",
    short_description: "",
    description: "",
    flavor_description: "",
    tasting_summary: "",
    origin_id: null,
    region: "",
    farm: "",
    producer: "",
    variety_id: null,
    processing_method_id: null,
    altitude_m_min: null,
    altitude_m_max: null,
    harvest_year: null,
    roast_level: 3,
    roast_profile: "omni",
    is_decaf: false,
    decaf_method: "",
    acidity: 6,
    body: 6,
    sweetness: 6,
    bitterness: 6,
    complexity: 6,
    aroma_families: [],
    price_chf: null,
    weight_g: 250,
    stock_kg: null,
    stock_status: "in_stock",
    min_order_qty: 1,
    is_organic: false,
    is_direct_trade: false,
    sca_score: null,
    allergen_slugs: [],
    certification_ids: [],
    status: "draft",
    is_fresh_roast_on_demand: false,
    lot_number: "",
  };
}

/**
 * Konsistenz-Validierung mit Inline-Warnungen (8.4 Massnahme 2).
 * Returns: Array von (field, severity, message). Severity 'warn' = Form
 * laesst Submit zu aber mit Bestaetigung; 'error' blockiert Submit.
 */
export type ValidationIssue = {
  field: string;
  severity: "warn" | "error";
  message: string;
};

export function validateCoffee(c: CoffeeFormState): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Pflichtfelder
  if (!c.name.trim()) issues.push({ field: "name", severity: "error", message: "Name ist Pflicht." });
  if (!c.slug.trim()) issues.push({ field: "slug", severity: "error", message: "Slug ist Pflicht." });
  if (!c.roaster_id) issues.push({ field: "roaster_id", severity: "error", message: "Röster auswählen." });
  if (!c.flavor_description.trim() && !c.tasting_summary.trim() && !c.short_description.trim()) {
    issues.push({
      field: "flavor_description",
      severity: "error",
      message: "Mindestens eine Geschmacks-Beschreibung (flavor_description / tasting_summary / short_description) — das Embedding braucht Text.",
    });
  }
  if (c.aroma_families.length === 0) {
    issues.push({
      field: "aroma_families",
      severity: "warn",
      message: "Keine Aroma-Familien ausgewählt — der Algorithmus matcht dann nur ueber die 5 Sensorik-Achsen, ungefaehrer Match.",
    });
  }
  if (c.price_chf == null || c.price_chf <= 0) {
    issues.push({ field: "price_chf", severity: "error", message: "Preis ist Pflicht (CHF, > 0)." });
  }
  if (!c.weight_g || c.weight_g <= 0) {
    issues.push({ field: "weight_g", severity: "error", message: "Gewicht in Gramm ist Pflicht." });
  }

  // Konsistenz-Warnungen — alle Sensorik-Werte hier sind 1-10.
  // Light Roast + Bitterkeit hoch
  if (c.roast_level <= 2 && c.bitterness >= 8) {
    issues.push({
      field: "bitterness",
      severity: "warn",
      message: `Light/Medium-Light Röstung (${c.roast_level}/5) und Bitterkeit ${c.bitterness}/10 — ist das wirklich so? Helle Röstungen haben üblicherweise wenig Bitterkeit.`,
    });
  }
  // Dark Roast + sehr hohe Säure
  if (c.roast_level >= 4 && c.acidity >= 9) {
    issues.push({
      field: "acidity",
      severity: "warn",
      message: `Dunkle Röstung (${c.roast_level}/5) und Säure ${c.acidity}/10 — ungewöhnlich, dunkle Röstungen reduzieren Säure.`,
    });
  }
  // Sehr volle Süße + sehr hohe Bitterkeit
  if (c.sweetness >= 9 && c.bitterness >= 9) {
    issues.push({
      field: "sweetness",
      severity: "warn",
      message: `Süße ${c.sweetness}/10 UND Bitterkeit ${c.bitterness}/10 schließen sich sensorisch oft aus — bitte nochmal prüfen.`,
    });
  }
  // Decaf-Konsistenz
  if (c.is_decaf && !c.decaf_method) {
    issues.push({
      field: "decaf_method",
      severity: "warn",
      message: "Decaf ausgewählt aber keine Methode angegeben.",
    });
  }
  if (!c.is_decaf && c.decaf_method) {
    issues.push({
      field: "decaf_method",
      severity: "warn",
      message: "Decaf-Methode angegeben aber is_decaf nicht angehakt.",
    });
  }
  // Höhen-Range
  if (
    c.altitude_m_min != null &&
    c.altitude_m_max != null &&
    c.altitude_m_min > c.altitude_m_max
  ) {
    issues.push({
      field: "altitude_m_max",
      severity: "error",
      message: "Höhen-Min ist grösser als Höhen-Max.",
    });
  }
  // Slug-Format
  if (c.slug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(c.slug)) {
    issues.push({
      field: "slug",
      severity: "warn",
      message: "Slug sollte aus kleingeschriebenen Buchstaben, Zahlen und Bindestrichen bestehen (kein Leerzeichen, keine Umlaute, kein Underscore).",
    });
  }

  return issues;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
