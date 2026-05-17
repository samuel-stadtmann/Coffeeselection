import type { SupabaseClient } from "@supabase/supabase-js";

export type RecommendedCoffee = {
  id: string;
  slug: string;
  name: string;
  image_url: string | null;
  tasting_summary: string | null;
  short_description: string | null;
  price_chf: number;
  weight_g: number;
  aroma_families: string[] | null;
  acidity: number | null;
  body: number | null;
  sweetness: number | null;
  bitterness: number | null;
  complexity: number | null;
  origin_name: string | null;
  roaster: { name: string; slug: string; city: string | null; logo_url: string | null } | null;
  /** Manhattan-Distanz (0 = perfekter Match, max ~20 fuer 5 Achsen x 4 Punkte) */
  distance: number;
  /**
   * Final-Match-Score in [0, 1] — wird, wenn Embeddings vorhanden sind, hybrid berechnet:
   *   0.61 * scoring_score + 0.39 * cosine_sim    (Playbook 0.55/0.35 ohne Diversity, normalisiert)
   * Sonst reiner Manhattan-basierter Score.
   */
  matchScore: number;
  /** Cosine-Similarity zum User-/Type-Embedding in [0, 1], null wenn kein Embedding. */
  vectorSim: number | null;
  /** Wie wurde der Score gemischt: 'hybrid' (mit Embeddings) oder 'manhattan' (Fallback). */
  scoreMode: "hybrid" | "manhattan";
};

type TasteTypeProfile = {
  id: number;
  name_de: string;
  acidity: number | null;
  body: number | null;
  sweetness: number | null;
  bitterness: number | null;
  complexity: number | null;
  // taste_types.roast_level ist smallint (1-5), coffees.roast_level ist text
  // ('light'..'dark'). Beide werden via roastNum() auf 1-5 normalisiert.
  roast_level?: number | string | null;
  aroma_families?: string[] | null;
};

// C3: roast_level -> numerische Achse (1-5) fuer Manhattan-Distanz.
const ROAST_LEVEL_NUM: Record<string, number> = {
  light: 1,
  medium_light: 2,
  medium: 3,
  medium_dark: 4,
  dark: 5,
};
function roastNum(level: number | string | null | undefined): number {
  if (level == null) return 3;
  if (typeof level === "number") return Math.max(1, Math.min(5, level));
  return ROAST_LEVEL_NUM[level] ?? 3;
}

// C2: Aroma-Familien-Bonus. Pro Treffer zwischen taste_type.aroma_families
// und coffee.aroma_families +5% auf den Match-Score (cap 1.0). Soll
// "sehr nahe Aromen-Verwandtschaft" zusaetzlich zur Sensorik-Distanz
// belohnen.
const AROMA_BONUS_PER_MATCH = 0.05;
function aromaOverlapBonus(
  targetAromas: string[] | null | undefined,
  coffeeAromas: string[] | null | undefined
): number {
  if (!targetAromas?.length || !coffeeAromas?.length) return 0;
  const set = new Set(targetAromas);
  let matches = 0;
  for (const a of coffeeAromas) {
    if (set.has(a)) matches++;
  }
  return matches * AROMA_BONUS_PER_MATCH;
}

const COFFEE_FIELDS = `
  id, slug, name, image_url, tasting_summary, short_description,
  price_chf, weight_g, aroma_families, roast_level,
  acidity, body, sweetness, bitterness, complexity,
  flavor_embedding,
  origin:origins_catalog(name_de),
  roaster:roasters(name, slug, city, logo_url)
`;

// Playbook 1.1: 0.55 scoring + 0.35 vector + 0.10 diversity. Diversity / MMR ist
// noch nicht implementiert — wir normalisieren die zwei verbleibenden Anteile auf
// Summe 1.0, damit der finale Score weiterhin in [0, 1] bleibt.
const SCORING_WEIGHT = 0.55 / (0.55 + 0.35); // ≈ 0.611
const VECTOR_WEIGHT = 0.35 / (0.55 + 0.35); // ≈ 0.389

// 6 Achsen: Saeure / Koerper / Suesse / Bitterkeit / Komplexitaet + Roast-Level.
// Max-Distanz = 6 * 4 = 24 (Achsen-Range 1-5, max-Diff 4 pro Achse).
const MANHATTAN_MAX_DISTANCE = 24;

function manhattan(
  target: TasteTypeProfile,
  coffee: {
    acidity: number | null;
    body: number | null;
    sweetness: number | null;
    bitterness: number | null;
    complexity: number | null;
    roast_level?: number | string | null;
  }
) {
  return (
    Math.abs((coffee.acidity ?? 3) - (target.acidity ?? 3)) +
    Math.abs((coffee.body ?? 3) - (target.body ?? 3)) +
    Math.abs((coffee.sweetness ?? 3) - (target.sweetness ?? 3)) +
    Math.abs((coffee.bitterness ?? 3) - (target.bitterness ?? 3)) +
    Math.abs((coffee.complexity ?? 3) - (target.complexity ?? 3)) +
    Math.abs(roastNum(coffee.roast_level) - roastNum(target.roast_level))
  );
}

/**
 * pgvector liefert vector-Spalten als String der Form "[0.12,0.34,...]" zurueck,
 * wenn der Supabase-JS-Client sie nicht typisiert kennt. Akzeptiert auch ein
 * bereits geparstes number[] (kommt z.B. wenn der Client einen entsprechenden
 * Type-Hint hat).
 */
function parseVector(v: unknown): number[] | null {
  if (v == null) return null;
  if (Array.isArray(v)) return v as number[];
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) return null;
  try {
    const arr = JSON.parse(trimmed);
    return Array.isArray(arr) ? (arr as number[]) : null;
  } catch {
    return null;
  }
}

/**
 * Cosine-Similarity zwischen zwei Vektoren gleicher Laenge. Beide sollten
 * L2-normalisiert sein (sind sie via build-customer-embedding und OpenAI-Embeds),
 * dann ist das equivalent zum Skalarprodukt. Wir normieren defensiv trotzdem.
 * Rueckgabe in [-1, 1], gemappt auf [0, 1] via (cs+1)/2.
 */
function cosineSimilarity01(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0.5; // neutral
  const cs = dot / (Math.sqrt(na) * Math.sqrt(nb));
  return (cs + 1) / 2;
}

function normalizeRow(
  c: Record<string, unknown>,
  distance: number,
  vectorSim: number | null,
  aromaBonus: number = 0
): RecommendedCoffee {
  const origin = c.origin as { name_de?: string }[] | { name_de?: string } | null | undefined;
  const originName = Array.isArray(origin) ? origin[0]?.name_de ?? null : origin?.name_de ?? null;
  const roaster = c.roaster as Array<{ name: string; slug: string; city: string | null; logo_url: string | null }> | { name: string; slug: string; city: string | null; logo_url: string | null } | null;
  const roasterRow = Array.isArray(roaster) ? roaster[0] ?? null : roaster ?? null;
  // C3: Max-Distanz fuer 6 Achsen (5 Sensorik + Roast-Level) mit Range
  // 1-5 = 4 * 6 = 24. C2: aroma_families-Bonus addiert sich on top,
  // gedeckelt auf 1.0.
  const scoringScoreBase = Math.max(0, 1 - distance / MANHATTAN_MAX_DISTANCE);
  const scoringScore = Math.min(1, scoringScoreBase + aromaBonus);
  const matchScore =
    vectorSim != null
      ? SCORING_WEIGHT * scoringScore + VECTOR_WEIGHT * vectorSim
      : scoringScore;
  return {
    id: c.id as string,
    slug: c.slug as string,
    name: c.name as string,
    image_url: (c.image_url as string | null) ?? null,
    tasting_summary: (c.tasting_summary as string | null) ?? null,
    short_description: (c.short_description as string | null) ?? null,
    price_chf: Number(c.price_chf),
    weight_g: c.weight_g as number,
    aroma_families: (c.aroma_families as string[] | null) ?? null,
    acidity: (c.acidity as number | null) ?? null,
    body: (c.body as number | null) ?? null,
    sweetness: (c.sweetness as number | null) ?? null,
    bitterness: (c.bitterness as number | null) ?? null,
    complexity: (c.complexity as number | null) ?? null,
    origin_name: originName,
    roaster: roasterRow,
    distance,
    matchScore,
    vectorSim,
    scoreMode: vectorSim != null ? "hybrid" : "manhattan",
  };
}

/**
 * Holt das Such-Embedding fuer eine Recommendation:
 *   1. Wenn customerId gesetzt ist und der Customer ein taste_embedding hat
 *      -> den nehmen (personalisierte Empfehlung).
 *   2. Sonst: Centroid des Geschmackstyps aus type_centroids_mv (anonyme
 *      Quiz-Empfehlung).
 *   3. Sonst: null (Fallback auf reines Manhattan-Scoring).
 */
async function loadQueryEmbedding(
  supabase: SupabaseClient,
  tasteTypeId: number,
  customerId?: string
): Promise<number[] | null> {
  if (customerId) {
    const { data: c } = await supabase
      .from("customers")
      .select("taste_embedding")
      .eq("id", customerId)
      .maybeSingle();
    const v = parseVector(c?.taste_embedding);
    if (v) return v;
  }
  const { data: centroid } = await supabase
    .from("type_centroids_mv")
    .select("centroid")
    .eq("taste_type_id", tasteTypeId)
    .maybeSingle();
  return parseVector(centroid?.centroid);
}

/**
 * Volle Playbook-Pipeline (9.8) via Postgres-Function rank_coffees_for_customer.
 * Liefert Hard-Filter (5.2 mit Fallback-Cascade), 7-Dim-Scoring (5.3),
 * Vector-Similarity (5.5), MMR-Diversitaet bei Discovery (5.7), plus
 * explain_coffee_match-JSON pro Treffer.
 *
 * Returns null wenn die RPC fehlschlaegt oder leer ist — Caller faellt auf
 * den JS-Hybrid-Pfad zurueck (z.B. fuer anonyme Quiz-Resultate).
 */
type RankedCoffeeRow = {
  rank: number;
  coffee_id: string;
  coffee_name: string;
  roaster_id: string;
  final_score: number | string;       // numeric kommt als string
  scoring_score: number | string;
  vector_similarity: number | string;
  reasons: unknown;
};

async function rankCoffeesViaRpc(
  supabase: SupabaseClient,
  customerId: string,
  subscriptionType: "fix" | "discovery",
  limit: number
): Promise<RankedCoffeeRow[] | null> {
  const { data, error } = await supabase.rpc("rank_coffees_for_customer", {
    p_customer_id: customerId,
    p_subscription_type: subscriptionType,
    p_limit: limit,
    p_save_snapshot: false,
    p_subscription_id: null,
    p_delivery_slot: null,
    p_algorithm_version: "v1.0",
  });
  if (error) {
    console.error("[reco] rank_coffees_for_customer RPC failed", error);
    return null;
  }
  return (data ?? []) as RankedCoffeeRow[];
}

/**
 * Findet alle Coffees mit Sensorik-Profil und sortiert sie nach Hybrid-Score
 * (Manhattan-Distanz + pgvector-Cosine-Similarity zum User-/Type-Embedding).
 * Faellt auf reines Manhattan-Scoring zurueck wenn weder Customer- noch
 * Type-Centroid-Embedding gefunden werden.
 *
 * Vor dem Scoring werden Hartfilter (Playbook 5.2) angewendet wenn ein
 * customerId vorliegt — Allergene, Cooldowns, Stock, Bio-/Direct-Trade-/
 * Decaf-Anforderungen, Budget. Anonyme Aufrufe (kein customerId) sehen
 * weiterhin alle aktiven Coffees.
 *
 * @param supabase     beliebiger Supabase-Client (server oder browser)
 * @param tasteTypeId  1-8
 * @param opts.limit              max. Anzahl Resultate (default 6)
 * @param opts.excludeIds         Coffee-IDs die nicht im Resultat erscheinen
 * @param opts.customerId         optional: triggert Hartfilter und nutzt
 *                                customer.taste_embedding statt Type-Centroid
 * @param opts.subscriptionType   'fix' | 'discovery' (default 'fix') — bei
 *                                'discovery' kommt Roester-Cooldown dazu
 */
export async function getCoffeesForTasteType(
  supabase: SupabaseClient,
  tasteTypeId: number,
  opts: {
    limit?: number;
    excludeIds?: string[];
    customerId?: string;
    subscriptionType?: "fix" | "discovery";
  } = {}
): Promise<RecommendedCoffee[]> {
  const limit = opts.limit ?? 6;
  const excludeIds = new Set(opts.excludeIds ?? []);
  const subscriptionType = opts.subscriptionType ?? "fix";

  // ─────────────────────────────────────────────────────────────────────
  // Pfad A: eingeloggter Customer -> volle Playbook-Pipeline via RPC
  // (Hartfilter mit Cascade, 7-Dim-Scoring, Vector-Sim, MMR-Diversitaet,
  //  explain_coffee_match). Wir holen anschliessend die Coffee-Felder
  //  fuer die UI nach.
  //
  // Wichtig: zwischen RPC-Fehler (-> JS-Fallback ist ok) und
  // RPC-erfolgreich-aber-leer (= Hartfilter haben alles ausgeschlossen,
  // muss als leer durchgereicht werden) sauber unterscheiden. Sonst
  // sehen Customers mit Allergenen / engem Budget / Cooldowns trotzdem
  // ungefilterte Coffees aus dem JS-Pfad — Production-Bug.
  // ─────────────────────────────────────────────────────────────────────
  if (opts.customerId) {
    const ranked = await rankCoffeesViaRpc(
      supabase,
      opts.customerId,
      subscriptionType,
      limit + excludeIds.size + 5 // overfetch, falls excludeIds was wegnimmt
    );
    if (ranked !== null) {
      // RPC erfolgreich (auch wenn []). Hartfilter haben gesprochen — leer ist leer.
      if (ranked.length === 0) return [];

      const filtered = ranked.filter((r) => !excludeIds.has(r.coffee_id));
      if (filtered.length === 0) return [];

      const ids = filtered.map((r) => r.coffee_id);
      const { data: coffees, error: cErr } = await supabase
        .from("coffees")
        .select(COFFEE_FIELDS)
        .in("id", ids);
      if (cErr || !coffees) {
        console.error("[reco] coffees hydrate failed — keeping RPC ranks but no detail", cErr);
        return [];
      }
      const byId = new Map<string, Record<string, unknown>>();
      for (const c of coffees as Record<string, unknown>[]) byId.set(c.id as string, c);
      const out: RecommendedCoffee[] = [];
      for (const r of filtered) {
        const c = byId.get(r.coffee_id);
        if (!c) continue;
        const finalScore = Math.max(0, Math.min(1, Number(r.final_score) / 100));
        const scoringPct = Math.max(0, Math.min(1, Number(r.scoring_score) / 100));
        const distance = (1 - scoringPct) * 20; // approximativer Wert fuer UI-Kompat
        const row = normalizeRow(c, distance, Number(r.vector_similarity));
        row.matchScore = finalScore; // RPC-Wert hat Prioritaet
        row.scoreMode = "hybrid";
        out.push(row);
        if (out.length >= limit) break;
      }
      return out;
    }
    // Nur wenn ranked === null (RPC-Error) faellt der Pfad auf den JS-Hybrid
    // weiter unten zurueck. Der Customer-Filter ist dann leider weg, aber
    // immerhin kommt eine Empfehlung statt einer leeren Seite.
  }

  // ─────────────────────────────────────────────────────────────────────
  // Pfad B: anonyme Quiz-Aufrufer (kein customerId) ODER RPC-Fallback.
  // JS-seitiges Hybrid-Scoring mit Type-Centroid als Embedding-Quelle.
  // ─────────────────────────────────────────────────────────────────────
  const [{ data: target, error: tErr }, queryEmbedding, { data: coffees, error: cErr }] =
    await Promise.all([
      supabase
        .from("taste_types")
        .select("id, name_de, acidity, body, sweetness, bitterness, complexity, roast_level, aroma_families")
        .eq("id", tasteTypeId)
        .maybeSingle(),
      loadQueryEmbedding(supabase, tasteTypeId, opts.customerId),
      supabase
        .from("coffees")
        .select(COFFEE_FIELDS)
        .eq("status", "active")
        .is("deleted_at", null),
    ]);

  if (tErr || !target) {
    console.error("[reco] taste_types fetch failed", tErr);
    return [];
  }
  if (cErr || !coffees) {
    console.error("[reco] coffees fetch failed", cErr);
    return [];
  }

  const ranked = coffees
    .filter((c) => {
      if (excludeIds.has(c.id as string)) return false;
      return (
        c.acidity != null &&
        c.body != null &&
        c.sweetness != null &&
        c.bitterness != null &&
        c.complexity != null
      );
    })
    .map((c) => {
      const dist = manhattan(target as TasteTypeProfile, c as never);
      let vectorSim: number | null = null;
      if (queryEmbedding) {
        const coffeeEmb = parseVector((c as Record<string, unknown>).flavor_embedding);
        if (coffeeEmb) vectorSim = cosineSimilarity01(queryEmbedding, coffeeEmb);
      }
      const bonus = aromaOverlapBonus(
        (target as TasteTypeProfile).aroma_families,
        (c as Record<string, unknown>).aroma_families as string[] | null
      );
      return normalizeRow(c, dist, vectorSim, bonus);
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);

  return ranked;
}

/**
 * Findet die N nächstgelegenen Geschmackstypen zu einem gegebenen Typ —
 * gemessen an der Profil-Distanz auf 1–5 Skala.
 * Nützlich für "Alternativen"-Pages: wir zeigen Coffees aus Nachbar-Typen.
 */
export async function getNeighborTasteTypes(
  supabase: SupabaseClient,
  tasteTypeId: number,
  n: number = 3
): Promise<TasteTypeProfile[]> {
  const { data: all, error } = await supabase
    .from("taste_types")
    .select("id, name_de, acidity, body, sweetness, bitterness, complexity, roast_level");
  if (error || !all) return [];
  const me = all.find((t) => t.id === tasteTypeId);
  if (!me) return [];
  return (all as TasteTypeProfile[])
    .filter((t) => t.id !== tasteTypeId)
    .map((t) => ({
      ...t,
      _dist: manhattan(me as TasteTypeProfile, t),
    }))
    .sort((a, b) => (a as never as { _dist: number })._dist - (b as never as { _dist: number })._dist)
    .slice(0, n)
    .map(({ ...t }) => t);
}

/**
 * Erzeugt eine kurze Begründung warum ein Coffee zum User passt — basiert
 * auf der grössten Profil-Differenz zwischen User-Typ und Coffee.
 */
export function reasoningForMatch(
  target: { acidity: number | null; body: number | null; sweetness: number | null; bitterness: number | null; complexity: number | null },
  coffee: RecommendedCoffee
): { headline: string; detail: string } {
  const axes = [
    { label: "Säure", a: coffee.acidity ?? 3, b: target.acidity ?? 3 },
    { label: "Körper", a: coffee.body ?? 3, b: target.body ?? 3 },
    { label: "Süße", a: coffee.sweetness ?? 3, b: target.sweetness ?? 3 },
    { label: "Bitterkeit", a: coffee.bitterness ?? 3, b: target.bitterness ?? 3 },
    { label: "Komplexität", a: coffee.complexity ?? 3, b: target.complexity ?? 3 },
  ];
  // Grösster Unterschied zwischen Coffee und Typ
  const sorted = [...axes].sort((x, y) => Math.abs(y.a - y.b) - Math.abs(x.a - x.b));
  const top = sorted[0];
  if (Math.abs(top.a - top.b) === 0) {
    return { headline: "Volltreffer", detail: "Profil deckt sich exakt mit deinem Geschmackstyp." };
  }
  const direction = top.a > top.b ? "Mehr" : "Weniger";
  return {
    headline: `${direction} ${top.label}`,
    detail: `Dieser Kaffee hat ${top.label.toLowerCase()} ${top.a} / 5 — dein Typ tendiert zu ${top.b} / 5.`,
  };
}
