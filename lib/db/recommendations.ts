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
};

const COFFEE_FIELDS = `
  id, slug, name, image_url, tasting_summary, short_description,
  price_chf, weight_g, aroma_families,
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

function manhattan(target: TasteTypeProfile, coffee: { acidity: number | null; body: number | null; sweetness: number | null; bitterness: number | null; complexity: number | null }) {
  return (
    Math.abs((coffee.acidity ?? 3) - (target.acidity ?? 3)) +
    Math.abs((coffee.body ?? 3) - (target.body ?? 3)) +
    Math.abs((coffee.sweetness ?? 3) - (target.sweetness ?? 3)) +
    Math.abs((coffee.bitterness ?? 3) - (target.bitterness ?? 3)) +
    Math.abs((coffee.complexity ?? 3) - (target.complexity ?? 3))
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
  vectorSim: number | null
): RecommendedCoffee {
  const origin = c.origin as { name_de?: string }[] | { name_de?: string } | null | undefined;
  const originName = Array.isArray(origin) ? origin[0]?.name_de ?? null : origin?.name_de ?? null;
  const roaster = c.roaster as Array<{ name: string; slug: string; city: string | null; logo_url: string | null }> | { name: string; slug: string; city: string | null; logo_url: string | null } | null;
  const roasterRow = Array.isArray(roaster) ? roaster[0] ?? null : roaster ?? null;
  // Max-Distanz fuer 5 Achsen mit Range 1-5: 4 * 5 = 20. Score = 1 - dist/20.
  const scoringScore = Math.max(0, 1 - distance / 20);
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
 * Findet alle Coffees mit Sensorik-Profil und sortiert sie nach Hybrid-Score
 * (Manhattan-Distanz + pgvector-Cosine-Similarity zum User-/Type-Embedding).
 * Faellt auf reines Manhattan-Scoring zurueck wenn weder Customer- noch
 * Type-Centroid-Embedding gefunden werden.
 *
 * @param supabase     beliebiger Supabase-Client (server oder browser)
 * @param tasteTypeId  1-8
 * @param opts.limit       max. Anzahl Resultate (default 6)
 * @param opts.excludeIds  Coffee-IDs die nicht im Resultat erscheinen sollen
 * @param opts.customerId  optional: wenn gesetzt, wird das taste_embedding
 *                         dieses Kunden als Anfragevektor verwendet (statt
 *                         des Type-Centroids).
 */
export async function getCoffeesForTasteType(
  supabase: SupabaseClient,
  tasteTypeId: number,
  opts: { limit?: number; excludeIds?: string[]; customerId?: string } = {}
): Promise<RecommendedCoffee[]> {
  const limit = opts.limit ?? 6;
  const excludeIds = new Set(opts.excludeIds ?? []);

  const [{ data: target, error: tErr }, queryEmbedding, { data: coffees, error: cErr }] =
    await Promise.all([
      supabase
        .from("taste_types")
        .select("id, name_de, acidity, body, sweetness, bitterness, complexity")
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
    .filter(
      (c) =>
        !excludeIds.has(c.id as string) &&
        c.acidity != null &&
        c.body != null &&
        c.sweetness != null &&
        c.bitterness != null &&
        c.complexity != null
    )
    .map((c) => {
      const dist = manhattan(target as TasteTypeProfile, c as never);
      let vectorSim: number | null = null;
      if (queryEmbedding) {
        const coffeeEmb = parseVector((c as Record<string, unknown>).flavor_embedding);
        if (coffeeEmb) vectorSim = cosineSimilarity01(queryEmbedding, coffeeEmb);
      }
      return normalizeRow(c, dist, vectorSim);
    })
    .sort((a, b) => b.matchScore - a.matchScore) // hoeher = besser
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
    .select("id, name_de, acidity, body, sweetness, bitterness, complexity");
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
