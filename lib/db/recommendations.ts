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
  /** Manhattan-Distanz (0 = perfekter Match, max ~20 für 5 Achsen × 4 Punkte) */
  distance: number;
  /** Match-Score normalisiert auf [0, 1] — 1.0 = perfekt */
  matchScore: number;
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
  origin:origins_catalog(name_de),
  roaster:roasters(name, slug, city, logo_url)
`;

function manhattan(target: TasteTypeProfile, coffee: { acidity: number | null; body: number | null; sweetness: number | null; bitterness: number | null; complexity: number | null }) {
  return (
    Math.abs((coffee.acidity ?? 3) - (target.acidity ?? 3)) +
    Math.abs((coffee.body ?? 3) - (target.body ?? 3)) +
    Math.abs((coffee.sweetness ?? 3) - (target.sweetness ?? 3)) +
    Math.abs((coffee.bitterness ?? 3) - (target.bitterness ?? 3)) +
    Math.abs((coffee.complexity ?? 3) - (target.complexity ?? 3))
  );
}

function normalizeRow(c: Record<string, unknown>, distance: number): RecommendedCoffee {
  const origin = c.origin as { name_de?: string }[] | { name_de?: string } | null | undefined;
  const originName = Array.isArray(origin) ? origin[0]?.name_de ?? null : origin?.name_de ?? null;
  const roaster = c.roaster as Array<{ name: string; slug: string; city: string | null; logo_url: string | null }> | { name: string; slug: string; city: string | null; logo_url: string | null } | null;
  const roasterRow = Array.isArray(roaster) ? roaster[0] ?? null : roaster ?? null;
  // Max-Distanz für 5 Achsen mit Range 1–5: 4 × 5 = 20. Score = 1 - dist/20.
  const matchScore = Math.max(0, 1 - distance / 20);
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
  };
}

/**
 * Findet alle Coffees mit Sensorik-Profil und sortiert sie nach
 * Manhattan-Distanz zum Profil des Geschmackstyps.
 * Coffees ohne komplettes Profil werden ausgeschlossen.
 *
 * @param supabase  beliebiger Supabase-Client (server oder browser)
 * @param tasteTypeId 1–8
 * @param opts.limit max. Anzahl Resultate (default 6)
 * @param opts.excludeIds Coffee-IDs die nicht im Resultat erscheinen sollen
 */
export async function getCoffeesForTasteType(
  supabase: SupabaseClient,
  tasteTypeId: number,
  opts: { limit?: number; excludeIds?: string[] } = {}
): Promise<RecommendedCoffee[]> {
  const limit = opts.limit ?? 6;
  const excludeIds = new Set(opts.excludeIds ?? []);

  const { data: target, error: tErr } = await supabase
    .from("taste_types")
    .select("id, name_de, acidity, body, sweetness, bitterness, complexity")
    .eq("id", tasteTypeId)
    .maybeSingle();
  if (tErr || !target) {
    console.error("[reco] taste_types fetch failed", tErr);
    return [];
  }

  const { data, error } = await supabase
    .from("coffees")
    .select(COFFEE_FIELDS)
    .eq("status", "active")
    .is("deleted_at", null);
  if (error || !data) {
    console.error("[reco] coffees fetch failed", error);
    return [];
  }

  const ranked = data
    .filter(
      (c) =>
        !excludeIds.has(c.id as string) &&
        c.acidity != null &&
        c.body != null &&
        c.sweetness != null &&
        c.bitterness != null &&
        c.complexity != null
    )
    .map((c) => normalizeRow(c, manhattan(target as TasteTypeProfile, c as never)))
    .sort((a, b) => a.distance - b.distance)
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
