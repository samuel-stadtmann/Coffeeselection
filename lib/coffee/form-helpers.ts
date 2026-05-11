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
  roast_level_touched: boolean; // Pflicht: muss aktiv vom Roester gesetzt
                                // werden — Default 3 (medium) ist neutral
                                // und verfaelscht sonst das Embedding.
  roast_profile: "espresso" | "filter" | "omni";
  roast_profile_touched: boolean; // Pflicht. Default 'omni' bekommt den
                                  // brewing_match_bonus immer (egal welche
                                  // Bruehmethode der Kunde gewaehlt hat).
                                  // Wenn ein Roester nichts setzt, gewinnen
                                  // alle seine Coffees den Quiz-Frage-1-Effekt
                                  // unverdient — verfaelscht das Matching.
  is_decaf: boolean;
  decaf_method: "swiss_water" | "co2" | "sugarcane_ea" | "solvent_ea" | "other" | "";
  // Sensorik im Form 1-10 (Roester-Cupping-Bogen). Wird beim Submit
  // via tenToFive() auf 1-5 normalisiert bevor's in die DB geht.
  acidity: number;
  body: number;
  sweetness: number;
  bitterness: number;
  complexity: number;
  // Pro Achse: hat der User aktiv getoucht? Defaults schon vorhanden, aber
  // wenn der Roester nichts angefasst hat, ist das ein Fehler — das
  // Manhattan-Distance-Scoring im Algorithmus braucht echte Werte, nicht
  // den "Median fuer alle Achsen"-Default.
  sensory_touched: {
    acidity: boolean;
    body: boolean;
    sweetness: boolean;
    bitterness: boolean;
    complexity: boolean;
  };
  // Aroma-Familien (Algorithmus)
  aroma_families: AromaFamily[];
  // Kommerz
  price_chf: number | null;          // VERKAUFSpreis an den Endkunden
  wholesale_price_chf: number | null; // EINKAUFspreis vom Roester (vertraulich)
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
  // Medien
  image_url: string;
  // Brewing Methods (Join-Tabelle): pro Methode optional is_recommended + Notes
  brewing_methods: Array<{
    brewing_method_id: string;
    is_recommended: boolean;
    notes: string;
  }>;
  // Flavor-Notes (detaillierte Aromen aus flavor_notes_catalog) mit Intensitaet 1-5
  flavor_notes: Array<{
    flavor_note_id: string;
    intensity: number; // 1-5
  }>;
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
    roast_level_touched: false,
    roast_profile: "omni",
    roast_profile_touched: false,
    is_decaf: false,
    decaf_method: "",
    acidity: 6,
    body: 6,
    sweetness: 6,
    bitterness: 6,
    complexity: 6,
    sensory_touched: {
      acidity: false,
      body: false,
      sweetness: false,
      bitterness: false,
      complexity: false,
    },
    aroma_families: [],
    price_chf: null,
    wholesale_price_chf: null,
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
    image_url: "",
    brewing_methods: [],
    flavor_notes: [],
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
  // flavor_description: das geht direkt ins OpenAI-Embedding. Unter 100
  // Zeichen ist die semantische Dichte zu niedrig — Embedding-Qualitaet
  // faellt deutlich. Mind. 100 Zeichen ist ungefaehr 2-3 saubere Saetze.
  const flavorLen = c.flavor_description.trim().length;
  if (flavorLen === 0) {
    issues.push({
      field: "flavor_description",
      severity: "error",
      message: "Geschmacks-Beschreibung ist Pflicht — das Embedding braucht Text. Mindestens 100 Zeichen, 2–3 Sätze.",
    });
  } else if (flavorLen < 100) {
    issues.push({
      field: "flavor_description",
      severity: "error",
      message: `Geschmacks-Beschreibung zu kurz (${flavorLen} Zeichen). Mindestens 100 Zeichen — sonst ist das Embedding semantisch arm und der Algorithmus matcht schlecht.`,
    });
  }
  // Aroma-Familien: vom Algorithmus im Soft-Scoring + im Embedding-Text
  // verwendet. Leer = ~15% Matching-Verlust fuer Aroma-affine Kunden.
  if (c.aroma_families.length === 0) {
    issues.push({
      field: "aroma_families",
      severity: "error",
      message: "Mindestens eine Aroma-Familie wählen — der Algorithmus matcht primär darüber. Ohne Aroma-Familie liefert das Quiz keine guten Empfehlungen für diesen Coffee.",
    });
  }
  // Sensorik-Achsen: alle 5 muessen aktiv eingestellt sein. Defaults (6/10
  // = 3/5) sind "neutral" und sabotieren das Manhattan-Distance-Scoring.
  const SENSORY_FIELDS: Array<keyof CoffeeFormState["sensory_touched"]> = [
    "acidity",
    "body",
    "sweetness",
    "bitterness",
    "complexity",
  ];
  const untouched = SENSORY_FIELDS.filter((k) => !c.sensory_touched[k]);
  if (untouched.length > 0) {
    issues.push({
      field: "sensory",
      severity: "error",
      message: `Sensorik-Achse${untouched.length === 1 ? "" : "n"} nicht eingestellt: ${untouched.join(", ")}. Bitte jede Achse aktiv setzen — Defaults verfälschen das Matching.`,
    });
  }
  // Röstgrad muss aktiv eingestellt sein. Default = 3 (medium) ist
  // neutral und sabotiert den Embedding-Text — der Algorithmus matcht
  // u.a. die Quiz-Brühmethode (Frage 1) gegen Röstgrad-Implikationen.
  if (!c.roast_level_touched) {
    issues.push({
      field: "roast_level",
      severity: "error",
      message:
        "Röstgrad ist nicht aktiv gesetzt. Bitte hell/medium/dunkel wählen — der Algorithmus matcht über den Röstgrad gegen die Brühmethoden-Präferenz aus dem Quiz.",
    });
  }
  // Röst-Profil (espresso/filter/omni) muss aktiv eingestellt sein.
  // Default 'omni' bekommt automatisch den brewing_match_bonus — wenn
  // ein Roester nichts setzt, gewinnen alle seine Coffees den
  // Quiz-Frage-1-Effekt unverdient.
  if (!c.roast_profile_touched) {
    issues.push({
      field: "roast_profile",
      severity: "error",
      message:
        "Röst-Profil ist nicht aktiv gesetzt. Bitte Espresso / Filter / Omni wählen — der Algorithmus bevorzugt Coffees, deren Profil zur Brühmethode des Kunden passt (Quiz Frage 1).",
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

/**
 * Spiegelt den DB-Trigger public.compute_coffee_quality_score()
 * 1:1 in JS, damit das Form eine LIVE-Vorschau zeigen kann was die DB
 * nach dem Speichern als data_quality_score errechnen wird.
 *
 * 4 Gruppen × 5 Eintraege × 5 Punkte = 100.
 *   Basis (40)   — Sensorik 5 Achsen + Roest + Aromen + Flavor-Description >=50 Zeichen
 *   Herkunft (20) — Origin, Region, Processing, Variety
 *   Konsistenz (20) — 4 Plausibilitaets-Checks (es gibt Punkte wenn KONSISTENT oder felder leer)
 *   Optionale Boni (20) — Hoehe, Erntejahr, SCA>=80, Embedding (= nach Save vorhanden)
 *
 * Hinweis: Die Sensorik-Achsen sind im Form als 1-10 gespeichert,
 * werden aber via tenToFive() vor dem Speichern auf 1-5 normalisiert.
 * Der DB-Trigger prueft IS NOT NULL — er bekommt also nach Save 1-5-Werte.
 * Da wir das Preview-State 1-10 haben, behandeln wir alles als "gesetzt"
 * sobald ein Wert da ist (ist immer der Fall im Form).
 *
 * flavor_embedding wird erst NACH Save durch den Edge-Function-Webhook
 * generiert — daher kann der Score in der Preview maximal 95/100 sein.
 * Nach dem Save aktualisiert die DB den Score auf 100 sobald das
 * Embedding da ist.
 */
export type QualityScoreBreakdown = {
  total: number;
  max: number;
  groups: Array<{
    label: string;
    earned: number;
    max: number;
    items: Array<{ label: string; earned: number; max: number; reason?: string }>;
  }>;
};

export function computeQualityScorePreview(c: CoffeeFormState): QualityScoreBreakdown {
  return computeQualityScoreCore({
    acidity: c.acidity != null,
    body: c.body != null,
    sweetness: c.sweetness != null,
    bitterness: c.bitterness != null,
    complexity: c.complexity != null,
    roast_level_set: c.roast_level != null,
    aroma_families: c.aroma_families,
    flavor_description: c.flavor_description ?? "",
    origin_id: c.origin_id,
    region: c.region,
    processing_method_id: c.processing_method_id,
    variety_id: c.variety_id,
    altitude_m_min: c.altitude_m_min,
    harvest_year: c.harvest_year,
    sca_score: c.sca_score,
    is_decaf: c.is_decaf,
    // Form: 1-10 → für Konsistenz-Checks auf 1-5 mappen
    roast_level_1_5: c.roast_level,
    bitterness_1_5: tenToFive(c.bitterness),
    acidity_1_5: tenToFive(c.acidity),
    has_embedding: false,
    embedding_pending_label: "Wird nach dem Speichern automatisch erzeugt (+5 nach erstem Save)",
  });
}

/**
 * Berechnet denselben Breakdown aus einer DB-Coffee-Row (Sensorik 1-5).
 * Wird in /admin/coffees genutzt, um pro Zeile aufzuklappen welche Felder
 * den Score drücken.
 */
export type CoffeeRowForScore = {
  acidity: number | null;
  body: number | null;
  sweetness: number | null;
  bitterness: number | null;
  complexity: number | null;
  roast_level: number | null;
  aroma_families: string[] | null;
  flavor_description: string | null;
  origin_id: string | null;
  region: string | null;
  processing_method_id: string | null;
  variety_id: string | null;
  altitude_m_min: number | null;
  harvest_year: number | null;
  sca_score: number | null;
  is_decaf: boolean | null;
  flavor_embedding: unknown | null;
};

export function computeQualityScoreFromCoffeeRow(c: CoffeeRowForScore): QualityScoreBreakdown {
  return computeQualityScoreCore({
    acidity: c.acidity != null,
    body: c.body != null,
    sweetness: c.sweetness != null,
    bitterness: c.bitterness != null,
    complexity: c.complexity != null,
    roast_level_set: c.roast_level != null,
    aroma_families: (c.aroma_families ?? []) as AromaFamily[],
    flavor_description: c.flavor_description ?? "",
    origin_id: c.origin_id,
    region: c.region ?? "",
    processing_method_id: c.processing_method_id,
    variety_id: c.variety_id,
    altitude_m_min: c.altitude_m_min,
    harvest_year: c.harvest_year,
    sca_score: c.sca_score,
    is_decaf: !!c.is_decaf,
    roast_level_1_5: c.roast_level ?? 3,
    bitterness_1_5: c.bitterness ?? 3,
    acidity_1_5: c.acidity ?? 3,
    has_embedding: c.flavor_embedding != null,
    embedding_pending_label: "Embedding fehlt — Webhook prüfen",
  });
}

type ScoreCoreInput = {
  acidity: boolean;
  body: boolean;
  sweetness: boolean;
  bitterness: boolean;
  complexity: boolean;
  roast_level_set: boolean;
  aroma_families: AromaFamily[] | string[];
  flavor_description: string;
  origin_id: string | null;
  region: string;
  processing_method_id: string | null;
  variety_id: string | null;
  altitude_m_min: number | null;
  harvest_year: number | null;
  sca_score: number | null;
  is_decaf: boolean;
  roast_level_1_5: number;
  bitterness_1_5: number;
  acidity_1_5: number;
  has_embedding: boolean;
  embedding_pending_label: string;
};

function computeQualityScoreCore(c: ScoreCoreInput): QualityScoreBreakdown {
  // Basis (40)
  const basis = [
    { label: "Säure erfasst", earned: c.acidity ? 5 : 0, max: 5 },
    { label: "Körper erfasst", earned: c.body ? 5 : 0, max: 5 },
    { label: "Süße erfasst", earned: c.sweetness ? 5 : 0, max: 5 },
    { label: "Bitterkeit erfasst", earned: c.bitterness ? 5 : 0, max: 5 },
    { label: "Röstgrad erfasst", earned: c.roast_level_set ? 5 : 0, max: 5 },
    { label: "Komplexität erfasst", earned: c.complexity ? 5 : 0, max: 5 },
    {
      label: "Aroma-Familien (mind. 1)",
      earned: c.aroma_families.length >= 1 ? 5 : 0,
      max: 5,
      reason: c.aroma_families.length === 0 ? "Noch keine ausgewählt" : undefined,
    },
    {
      label: "Flavor-Description ≥ 100 Zeichen",
      earned: c.flavor_description.length >= 100 ? 5 : 0,
      max: 5,
      reason:
        c.flavor_description.length < 100
          ? `Aktuell ${c.flavor_description.length} Zeichen — Embedding-Qualität fällt unter 100 ab`
          : undefined,
    },
  ];

  // Herkunft (20)
  const origin = [
    { label: "Origin gewählt", earned: c.origin_id ? 5 : 0, max: 5 },
    { label: "Region eingetragen", earned: c.region.trim() ? 5 : 0, max: 5 },
    { label: "Processing gewählt", earned: c.processing_method_id ? 5 : 0, max: 5 },
    { label: "Varietät gewählt", earned: c.variety_id ? 5 : 0, max: 5 },
  ];

  // Konsistenz (20)
  const rl = c.roast_level_1_5;
  const bit5 = c.bitterness_1_5;
  const acid5 = c.acidity_1_5;
  const aromaSet = new Set(c.aroma_families);
  const consistency = [
    {
      label: "Röstung × Bitterkeit",
      earned: !(rl <= 2 && bit5 >= 4) ? 5 : 0,
      max: 5,
      reason: rl <= 2 && bit5 >= 4 ? "Light/Medium-Light + Bitterkeit hoch unplausibel" : undefined,
    },
    {
      label: "Röstung × Säure",
      earned: !(rl >= 4 && acid5 === 5) ? 5 : 0,
      max: 5,
      reason: rl >= 4 && acid5 === 5 ? "Dunkle Röstung mit max. Säure unplausibel" : undefined,
    },
    {
      label: "Röstung × erdige Aromen",
      earned: !(rl === 1 && aromaSet.has("earthy")) ? 5 : 0,
      max: 5,
      reason: rl === 1 && aromaSet.has("earthy") ? "Light + erdige Aromen unplausibel" : undefined,
    },
    {
      label: "Decaf × Bitterkeit",
      earned: !(c.is_decaf && bit5 === 5) ? 5 : 0,
      max: 5,
      reason: c.is_decaf && bit5 === 5 ? "Decaf + max. Bitterkeit unplausibel" : undefined,
    },
  ];

  // Boni (20)
  const boni = [
    { label: "Höhe Min erfasst", earned: c.altitude_m_min != null ? 5 : 0, max: 5 },
    { label: "Ernte-Jahr erfasst", earned: c.harvest_year != null ? 5 : 0, max: 5 },
    {
      label: "SCA-Score ≥ 80",
      earned: c.sca_score != null && c.sca_score >= 80 ? 5 : 0,
      max: 5,
      reason: c.sca_score != null && c.sca_score < 80 ? `${c.sca_score} < 80` : undefined,
    },
    {
      label: "Embedding generiert",
      earned: c.has_embedding ? 5 : 0,
      max: 5,
      reason: c.has_embedding ? undefined : c.embedding_pending_label,
    },
  ];

  const groups = [
    { label: "Pflicht-Basis", items: basis },
    { label: "Herkunft / Verarbeitung", items: origin },
    { label: "Konsistenz-Plausibilität", items: consistency },
    { label: "Optionale Boni", items: boni },
  ].map((g) => ({
    label: g.label,
    items: g.items,
    earned: g.items.reduce((sum, i) => sum + i.earned, 0),
    max: g.items.reduce((sum, i) => sum + i.max, 0),
  }));

  return {
    total: groups.reduce((sum, g) => sum + g.earned, 0),
    max: groups.reduce((sum, g) => sum + g.max, 0),
    groups,
  };
}

/**
 * Top-N fehlende Items aus einem Breakdown extrahieren — für kompakte
 * Inline-Anzeige in der Coffee-Liste.
 */
export function topMissingItems(b: QualityScoreBreakdown, n = 3): Array<{ label: string; reason?: string }> {
  const missing: Array<{ label: string; reason?: string }> = [];
  for (const g of b.groups) {
    for (const i of g.items) {
      if (i.earned < i.max) missing.push({ label: i.label, reason: i.reason });
    }
  }
  return missing.slice(0, n);
}
