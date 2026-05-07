import { tasteTypes, TasteType } from "./taste-types";

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export type CoffeeDetail = {
  slug: string;
  name: string;
  roaster: string;
  origin: string;
  price: string;
  matchScore: number;
  tasteTypes: TasteType[];
};

export function getAllCoffees(): CoffeeDetail[] {
  const map = new Map<string, CoffeeDetail>();
  for (const type of tasteTypes) {
    for (const c of type.coffees) {
      const slug = slugify(c.name);
      const existing = map.get(slug);
      if (existing) {
        existing.tasteTypes.push(type);
      } else {
        map.set(slug, { ...c, slug, tasteTypes: [type] });
      }
    }
  }
  return Array.from(map.values());
}

export const getCoffeeBySlug = (slug: string): CoffeeDetail | undefined =>
  getAllCoffees().find((c) => c.slug === slug);
