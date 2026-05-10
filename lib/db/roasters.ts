import { createClient } from "@/lib/supabase/server";
import { createStaticClient } from "@/lib/supabase/static";

export type Roaster = {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  story: string | null;
  logo_url: string | null;
  hero_image_url: string | null;
  website_url: string | null;
  instagram_handle: string | null;
  city: string | null;
  region: string | null;
  country: string;
  status: string;
};

const SELECT_PUBLIC = `
  id, slug, name, short_description, description, story,
  logo_url, hero_image_url, website_url, instagram_handle,
  city, region, country, status
`;

/** Build-Zeit-Variante (generateStaticParams) ohne Cookie-Context. */
export async function getRoasterSlugsForStatic(): Promise<{ slug: string }[]> {
  const supabase = createStaticClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("roasters")
    .select("slug")
    .eq("status", "active")
    .is("deleted_at", null);
  if (error) {
    console.error("getRoasterSlugsForStatic error", error);
    return [];
  }
  return (data ?? []).map((r) => ({ slug: r.slug as string }));
}

export async function getRoasters(): Promise<Roaster[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("roasters")
    .select(SELECT_PUBLIC)
    .eq("status", "active")
    .is("deleted_at", null)
    .order("name", { ascending: true });
  if (error) {
    console.error("getRoasters error", error);
    return [];
  }
  return (data ?? []) as Roaster[];
}

export async function getRoasterBySlug(slug: string): Promise<Roaster | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("roasters")
    .select(SELECT_PUBLIC)
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) {
    console.error("getRoasterBySlug error", error);
    return null;
  }
  return (data ?? null) as Roaster | null;
}

export async function getRoastersByCity(city: string): Promise<Roaster[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("roasters")
    .select(SELECT_PUBLIC)
    .eq("city", city)
    .eq("status", "active")
    .is("deleted_at", null)
    .order("name", { ascending: true });
  if (error) {
    console.error("getRoastersByCity error", error);
    return [];
  }
  return (data ?? []) as Roaster[];
}
