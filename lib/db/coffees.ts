import { createClient } from "@/lib/supabase/server";
import { createStaticClient } from "@/lib/supabase/static";

export type CoffeeWithDetails = {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  tasting_summary: string | null;
  image_url: string | null;
  gallery_urls: string[] | null;
  roaster_id: string;
  roaster_slug: string;
  roaster_name: string;
  roaster_logo_url: string | null;
  origin_id: string | null;
  origin_slug: string | null;
  origin_name_de: string | null;
  region: string | null;
  farm: string | null;
  producer: string | null;
  variety_slug: string | null;
  variety_name: string | null;
  processing_slug: string | null;
  processing_name_de: string | null;
  altitude_m_min: number | null;
  altitude_m_max: number | null;
  harvest_year: number | null;
  roast_level: string | null;
  roast_profile: string | null;
  roast_date: string | null;
  is_decaf: boolean | null;
  is_blend: boolean | null;
  is_single_origin: boolean | null;
  sca_score: number | null;
  price_chf: number;
  weight_g: number;
  stock_status: string;
  status: string;
  flavor_slugs: string[] | null;
  recommended_brewing_slugs: string[] | null;
  certification_slugs: string[] | null;
  avg_rating_public: number | null;
  rating_count_public: number | null;
};

const SELECT_PUBLIC = `
  id, slug, name, short_description, description, tasting_summary, image_url, gallery_urls,
  roaster_id, roaster_slug, roaster_name, roaster_logo_url,
  origin_id, origin_slug, origin_name_de, region, farm, producer,
  variety_slug, variety_name, processing_slug, processing_name_de,
  altitude_m_min, altitude_m_max, harvest_year,
  roast_level, roast_profile, roast_date,
  is_decaf, is_blend, is_single_origin, sca_score,
  price_chf, weight_g, stock_status, status,
  flavor_slugs, recommended_brewing_slugs, certification_slugs,
  avg_rating_public, rating_count_public
`;

export async function getCoffees(): Promise<CoffeeWithDetails[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coffees_with_details")
    .select(SELECT_PUBLIC)
    .eq("status", "active")
    .order("name", { ascending: true });
  if (error) {
    console.error("getCoffees error", error);
    return [];
  }
  return (data ?? []) as CoffeeWithDetails[];
}

/** Build-Zeit-Variante (generateStaticParams) ohne Cookie-Context. */
export async function getCoffeeSlugsForStatic(): Promise<{ slug: string }[]> {
  const supabase = createStaticClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("coffees_with_details")
    .select("slug")
    .eq("status", "active");
  if (error) {
    console.error("getCoffeeSlugsForStatic error", error);
    return [];
  }
  return (data ?? []).map((c) => ({ slug: c.slug as string }));
}

export async function getCoffeeBySlug(slug: string): Promise<CoffeeWithDetails | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coffees_with_details")
    .select(SELECT_PUBLIC)
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    console.error("getCoffeeBySlug error", error);
    return null;
  }
  return (data ?? null) as CoffeeWithDetails | null;
}

export async function getCoffeesByRoasterSlug(roasterSlug: string): Promise<CoffeeWithDetails[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coffees_with_details")
    .select(SELECT_PUBLIC)
    .eq("roaster_slug", roasterSlug)
    .eq("status", "active")
    .order("name", { ascending: true });
  if (error) {
    console.error("getCoffeesByRoasterSlug error", error);
    return [];
  }
  return (data ?? []) as CoffeeWithDetails[];
}

export async function getCoffeesByCity(city: string): Promise<CoffeeWithDetails[]> {
  const supabase = await createClient();
  // Coffees aller Röster aus dieser Stadt — über roaster_id Join
  const { data: roasterRows } = await supabase
    .from("roasters")
    .select("id")
    .eq("city", city)
    .eq("status", "active");
  const ids = (roasterRows ?? []).map((r) => r.id);
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("coffees_with_details")
    .select(SELECT_PUBLIC)
    .in("roaster_id", ids)
    .eq("status", "active")
    .order("name", { ascending: true });
  if (error) {
    console.error("getCoffeesByCity error", error);
    return [];
  }
  return (data ?? []) as CoffeeWithDetails[];
}
