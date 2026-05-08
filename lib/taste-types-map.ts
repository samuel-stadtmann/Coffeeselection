import { tasteTypes, tasteTypeBySlug, type TasteType } from "./taste-types";

// Mapping zwischen `taste_types.id` (smallint, 1–8 in der DB) und
// unseren App-Slugs in `lib/taste-types.ts`.
const ID_TO_SLUG: Record<number, string> = {
  1: "der-klassiker",
  2: "der-fruchtfreund",
  3: "der-espresso-enthusiast",
  4: "der-entdecker",
  5: "der-sanfte",
  6: "der-florale",
  7: "der-erdige",
  8: "der-suesse",
};

const SLUG_TO_ID: Record<string, number> = Object.fromEntries(
  Object.entries(ID_TO_SLUG).map(([id, slug]) => [slug, Number(id)])
);

export function tasteTypeById(id: number | null | undefined): TasteType | undefined {
  if (id == null) return undefined;
  const slug = ID_TO_SLUG[id];
  return slug ? tasteTypeBySlug(slug) : undefined;
}

export function tasteTypeIdBySlug(slug: string): number | undefined {
  return SLUG_TO_ID[slug];
}

export { tasteTypes };
