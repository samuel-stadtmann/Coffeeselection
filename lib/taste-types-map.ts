// Statisches Mapping zwischen `taste_types.id` (smallint, 1-8 in der DB)
// und unseren App-Slugs. ID↔Slug ist semantisch fix — ein Datentransfer
// in die DB lohnt sich hier nicht.
//
// Fuer das Laden der vollen TasteType-Daten siehe lib/db/taste-types.ts
// (asynchron, server-seitig oder via /api/taste-types).

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

export function tasteTypeIdBySlug(slug: string): number | undefined {
  return SLUG_TO_ID[slug];
}

export function tasteTypeSlugById(id: number | null | undefined): string | undefined {
  if (id == null) return undefined;
  return ID_TO_SLUG[id];
}
