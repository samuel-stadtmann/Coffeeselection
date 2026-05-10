import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * UI-Type fuer Geschmackstypen aus der DB. Die Felder spiegeln 1:1
 * `public.taste_types` (inkl. der M5d-Migration ergaenzten Marketing-/UI-
 * Spalten). Profile-Werte werden hier von der DB-Skala 1-5 auf 0-100
 * fuers Frontend hochgerechnet (P7).
 */
export type TasteType = {
  id: number;
  slug: string;
  name: string;            // name_de
  tagline: string;         // tagline_de
  icon: string;
  heroDesc: string;        // hero_desc_de
  longDesc: string;        // long_desc_de
  /** 5 Sensorik-Achsen, Werte 0-100 (DB 1-5 * 20). */
  profile: { label: string; value: number }[];
  aromas: string[];        // aromas_de
  /** Aroma-Slugs aus aroma_families fuer Algorithmus-Pfad (nicht UI-Display). */
  aromaSlugs: string[];
  brewing: string[];       // brewing_methods
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
};

const SELECT_ALL = `
  id, slug, name_de, tagline_de, icon,
  hero_desc_de, long_desc_de,
  acidity, body, sweetness, bitterness, complexity,
  aromas_de, aroma_families, brewing_methods,
  seo_title_de, seo_description_de, seo_keywords,
  active
`;

type TasteTypeRow = {
  id: number;
  slug: string;
  name_de: string;
  tagline_de: string | null;
  icon: string | null;
  hero_desc_de: string | null;
  long_desc_de: string | null;
  acidity: number | null;
  body: number | null;
  sweetness: number | null;
  bitterness: number | null;
  complexity: number | null;
  aromas_de: string[] | null;
  aroma_families: string[] | null;
  brewing_methods: string[] | null;
  seo_title_de: string | null;
  seo_description_de: string | null;
  seo_keywords: string[] | null;
  active: boolean | null;
};

function mapRow(r: TasteTypeRow): TasteType {
  // 1-5 SCA-Skala -> 0-100 fuer UI-Bars (P7).
  // null wird als 60 (Mitte) angezeigt damit's nie leer bleibt.
  const sca = (v: number | null) => (v == null ? 60 : Math.max(0, Math.min(100, v * 20)));
  return {
    id: r.id,
    slug: r.slug,
    name: r.name_de,
    tagline: r.tagline_de ?? "",
    icon: r.icon ?? "coffee",
    heroDesc: r.hero_desc_de ?? "",
    longDesc: r.long_desc_de ?? "",
    profile: [
      { label: "Säure", value: sca(r.acidity) },
      { label: "Süße", value: sca(r.sweetness) },
      { label: "Körper", value: sca(r.body) },
      { label: "Bitterkeit", value: sca(r.bitterness) },
      { label: "Komplexität", value: sca(r.complexity) },
    ],
    aromas: r.aromas_de ?? [],
    aromaSlugs: r.aroma_families ?? [],
    brewing: r.brewing_methods ?? [],
    seoTitle: r.seo_title_de ?? r.name_de,
    seoDescription: r.seo_description_de ?? "",
    seoKeywords: r.seo_keywords ?? [],
  };
}

export async function getTasteTypes(supabase: SupabaseClient | null): Promise<TasteType[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("taste_types")
    .select(SELECT_ALL)
    .eq("active", true)
    .order("id", { ascending: true });
  if (error || !data) {
    console.error("[taste-types] fetch failed", error);
    return [];
  }
  return (data as TasteTypeRow[]).map(mapRow);
}

export async function getTasteTypeBySlug(
  supabase: SupabaseClient | null,
  slug: string
): Promise<TasteType | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("taste_types")
    .select(SELECT_ALL)
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    console.error("[taste-types] by-slug fetch failed", error);
    return null;
  }
  return data ? mapRow(data as TasteTypeRow) : null;
}

export async function getTasteTypeById(
  supabase: SupabaseClient | null,
  id: number
): Promise<TasteType | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("taste_types")
    .select(SELECT_ALL)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[taste-types] by-id fetch failed", error);
    return null;
  }
  return data ? mapRow(data as TasteTypeRow) : null;
}
