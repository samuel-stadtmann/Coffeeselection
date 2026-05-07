/**
 * Curated image URLs from Unsplash (free commercial use, attribution-friendly).
 *
 * All photos are royalty-free under the Unsplash License:
 * https://unsplash.com/license
 *
 * If any URL 404s, replace with another from https://unsplash.com/s/photos/[topic]
 * by clicking the photo and using the format:
 *   https://images.unsplash.com/photo-{ID}?auto=format&fit=crop&w=1200&q=80
 */

const u = (id: string, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

// === COFFEE BEANS / DETAIL PAGES ===
export const IMG_BEANS_MACRO = u("1495474472287-4d71bcdd2085"); // Mike Kenneally — beans macro
export const IMG_BEANS_BOWL = u("1559525323-cbb5269e4497"); // beans in bowl
export const IMG_BEANS_BAG = u("1559056199-641a0ac8b55e"); // burlap sack
export const IMG_BEANS_DARK = u("1559525839-d9acfd428ea9"); // dark roasted beans
export const IMG_BEANS_LIGHT = u("1611854779393-1b2da9d400fe"); // light roast
export const IMG_BEANS_GREEN = u("1518483502699-e7caf6f29edd"); // green coffee beans
export const IMG_BEANS_BLEND = u("1497636577773-f1231844b336"); // beans variety

// === BREWING METHODS ===
export const IMG_POUR_OVER = u("1542181961-9590d0c79dab"); // pour over V60
export const IMG_ESPRESSO_PULL = u("1485808191679-5f86510681a2"); // espresso shot
export const IMG_ESPRESSO_MACHINE = u("1572286258217-215cf8e9d99d"); // espresso machine
export const IMG_FRENCH_PRESS = u("1495474472287-4d71bcdd2085"); // fallback coffee
export const IMG_BARISTA_HANDS = u("1518057111178-44a106bad636"); // barista hands
export const IMG_LATTE_ART = u("1572442388796-11668a67e53d"); // latte art

// === ROASTERY / WORKSHOP ===
export const IMG_ROASTERY = u("1559925393-8be0ec4767c8"); // roaster machine
export const IMG_ROASTERY_DARK = u("1495474472287-4d71bcdd2085"); // dark workshop
export const IMG_CUPPING = u("1497935586351-b67a49e012bf"); // overhead cupping

// === LIFESTYLE / CAFE ===
export const IMG_CAFE = u("1442550528053-c431ecb55509"); // cafe interior
export const IMG_COFFEE_CUP = u("1497935586351-b67a49e012bf"); // overhead cup
export const IMG_COFFEE_MORNING = u("1559941586-c75e5a8ff36b"); // coffee morning
export const IMG_COFFEE_TABLE = u("1521017432531-fbd92d768814"); // coffee on table

// === SUBSCRIPTION / PACKAGE ===
export const IMG_PACKAGE = u("1568667256549-094345857637"); // coffee package
export const IMG_GIFT_BOX = u("1559056199-641a0ac8b55e"); // gift box

// === FLAVOR / AROMA ===
export const IMG_BERRIES = u("1488477181946-6428a0291777"); // berries
export const IMG_CHOCOLATE = u("1511381939415-e44015466834"); // chocolate
export const IMG_CITRUS = u("1546173159-315724a31696"); // citrus
export const IMG_FLOWERS = u("1490750967868-88aa4486c946"); // jasmine
export const IMG_HONEY = u("1587049352846-4a222e784ce0"); // honey
export const IMG_SPICES = u("1599639957043-f3aa5c986398"); // spices

// === SWISS CITIES (best-guess Unsplash IDs) ===
// Note: City photo IDs are educated guesses. If any 404, replace with verified IDs.
export const IMG_ZURICH = u("1568677968671-3c8dc7da8eb4"); // Zürich Limmat
export const IMG_BERN = u("1582813147625-cdf4ef82d6ac"); // Bern Altstadt arcades
export const IMG_BASEL = u("1573056019305-d7d22cb19a52"); // Basel Rhine
export const IMG_GENEVA = u("1614695311438-cabbcbe50fc9"); // Geneva jet d'eau
export const IMG_LUCERNE = u("1565967511849-76a60a516170"); // Lucerne Chapel Bridge
export const IMG_ZUG = u("1605522793022-0bce4cc6dadc"); // Zug lake
export const IMG_SWITZERLAND = u("1530122037265-a5f1f91d3b99"); // Swiss alps

// === FALLBACK (always works as Unsplash random) ===
export const IMG_FALLBACK = u("1495474472287-4d71bcdd2085");

/** Cycle helper — returns image based on slug hash for variety. */
export function imageForSlug(slug: string, pool: string[]): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) | 0;
  return pool[Math.abs(hash) % pool.length];
}

export const COFFEE_POOL = [IMG_BEANS_MACRO, IMG_BEANS_BOWL, IMG_BEANS_DARK, IMG_BEANS_LIGHT, IMG_BEANS_BLEND, IMG_BEANS_GREEN];
export const ROASTERY_POOL = [IMG_ROASTERY, IMG_BARISTA_HANDS, IMG_CUPPING, IMG_CAFE];
export const ARTICLE_POOL = [IMG_POUR_OVER, IMG_ESPRESSO_PULL, IMG_BEANS_MACRO, IMG_LATTE_ART, IMG_BARISTA_HANDS, IMG_CUPPING, IMG_BEANS_BAG, IMG_COFFEE_CUP, IMG_FLOWERS, IMG_BERRIES, IMG_CHOCOLATE];
