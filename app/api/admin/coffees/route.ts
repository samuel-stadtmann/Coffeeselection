import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin/auth";
import { refreshAdminReauthCookie } from "@/lib/admin/reauth";
import { createServiceClient } from "@/lib/supabase/service";
import { AROMA_FAMILIES } from "@/lib/coffee/form-helpers";

// Erlaubte aroma_families-Slugs aus dem Standard-Vokabular. Schuetzt vor
// freitext-Eingaben, die spaeter aus dem Matching-Algorithmus rausfallen
// (Aroma-Bonus laeuft ueber Slug-Vergleich, nicht Stringaehnlichkeit).
const AROMA_SLUGS = AROMA_FAMILIES.map((a) => a.slug) as [string, ...string[]];

// POST /api/admin/coffees
//   Body: CoffeeFormState (siehe lib/coffee/form-helpers.ts)
//   Aktion:
//     1. Validate body (Zod).
//     2. Insert in coffees-Tabelle mit status='draft'.
//     3. Insert in coffee_allergens (text-slug) + coffee_certifications (uuid).
//     4. Database Webhook generiert flavor_embedding automatisch.
//   Output: { ok: true, coffee_id }

const UUID_LOOSE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const BodySchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "invalid slug"),
  roaster_id: z.string().regex(UUID_LOOSE),
  short_description: z.string().max(500).optional().default(""),
  description: z.string().max(5000).optional().default(""),
  flavor_description: z.string().max(2000).optional().default(""),
  tasting_summary: z.string().max(500).optional().default(""),
  origin_id: z.string().regex(UUID_LOOSE).nullable().optional(),
  region: z.string().max(200).optional().default(""),
  farm: z.string().max(200).optional().default(""),
  producer: z.string().max(200).optional().default(""),
  variety_id: z.string().regex(UUID_LOOSE).nullable().optional(),
  processing_method_id: z.string().regex(UUID_LOOSE).nullable().optional(),
  altitude_m_min: z.number().int().min(0).max(4000).nullable().optional(),
  altitude_m_max: z.number().int().min(0).max(4000).nullable().optional(),
  harvest_year: z.number().int().min(1900).max(2100).nullable().optional(),
  lot_number: z.string().max(100).optional().default(""),
  roast_level: z.number().int().min(1).max(5),
  roast_profile: z.enum(["espresso", "filter", "omni"]),
  is_decaf: z.boolean(),
  decaf_method: z
    .union([z.enum(["swiss_water", "co2", "sugarcane_ea", "solvent_ea", "other"]), z.literal("")])
    .optional()
    .default(""),
  acidity: z.number().int().min(1).max(5),
  body: z.number().int().min(1).max(5),
  sweetness: z.number().int().min(1).max(5),
  bitterness: z.number().int().min(1).max(5),
  complexity: z.number().int().min(1).max(5),
  aroma_families: z.array(z.enum(AROMA_SLUGS)).max(20),
  price_chf: z.number().positive(),
  wholesale_price_chf: z.number().min(0).nullable().optional(),
  weight_g: z.number().int().positive(),
  stock_kg: z.number().min(0).nullable().optional(),
  stock_status: z.enum(["in_stock", "low_stock", "out_of_stock", "discontinued"]),
  min_order_qty: z.number().int().min(1).default(1),
  is_organic: z.boolean(),
  is_direct_trade: z.boolean(),
  sca_score: z.number().min(0).max(100).nullable().optional(),
  is_fresh_roast_on_demand: z.boolean().default(false),
  allergen_slugs: z.array(z.string().min(1).max(50)).max(20).default([]),
  certification_ids: z.array(z.string().regex(UUID_LOOSE)).max(20).default([]),
  image_url: z.string().max(1000).optional().default(""),
  brewing_methods: z
    .array(
      z.object({
        brewing_method_id: z.string().regex(UUID_LOOSE),
        is_recommended: z.boolean().default(true),
        notes: z.string().max(500).optional().default(""),
      })
    )
    .max(20)
    .default([]),
  flavor_notes: z
    .array(
      z.object({
        flavor_note_id: z.string().regex(UUID_LOOSE),
        intensity: z.number().int().min(1).max(5),
      })
    )
    .max(30)
    .default([]),
});

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await refreshAdminReauthCookie())) {
    return NextResponse.json({ error: "reauth_required" }, { status: 401 });
  }

  let parsed: z.infer<typeof BodySchema>;
  try {
    parsed = BodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: "invalid_body", details: err instanceof z.ZodError ? err.issues : String(err) },
      { status: 400 }
    );
  }

  const sb = createServiceClient();

  // 1) Coffee-Row anlegen (status=draft per Default).
  const {
    allergen_slugs,
    certification_ids,
    brewing_methods,
    flavor_notes,
    decaf_method,
    image_url,
    ...coffeeFields
  } = parsed;
  const insertPayload = {
    ...coffeeFields,
    decaf_method: decaf_method || null,
    image_url: image_url || null,
    status: "draft" as const,
    // price_per_250g aus price_chf + weight_g ableiten
    price_per_250g:
      parsed.price_chf && parsed.weight_g > 0
        ? Math.round((parsed.price_chf * 250 * 100) / parsed.weight_g) / 100
        : null,
  };

  const { data: coffee, error: insErr } = await sb
    .from("coffees")
    .insert(insertPayload)
    .select("id")
    .single();
  if (insErr || !coffee) {
    return NextResponse.json(
      { error: "insert_failed", details: insErr?.message ?? "unknown" },
      { status: 500 }
    );
  }
  const coffeeId = coffee.id as string;

  // 2) Allergen-Verknuepfungen
  if (allergen_slugs.length > 0) {
    const allergenRows = allergen_slugs.map((slug) => ({
      coffee_id: coffeeId,
      allergen: slug,
    }));
    const { error: allErr } = await sb.from("coffee_allergens").insert(allergenRows);
    if (allErr) console.error("[admin/coffees] allergen link failed", allErr);
  }

  // 3) Zertifikate
  if (certification_ids.length > 0) {
    const certRows = certification_ids.map((cid) => ({
      coffee_id: coffeeId,
      certification_id: cid,
    }));
    const { error: certErr } = await sb.from("coffee_certifications").insert(certRows);
    if (certErr) console.error("[admin/coffees] cert link failed", certErr);
  }

  // 4) Bruehmethoden
  if (brewing_methods.length > 0) {
    const rows = brewing_methods.map((b) => ({
      coffee_id: coffeeId,
      brewing_method_id: b.brewing_method_id,
      is_recommended: b.is_recommended,
      notes: b.notes || null,
    }));
    const { error: bmErr } = await sb.from("coffee_brewing_methods").insert(rows);
    if (bmErr) console.error("[admin/coffees] brewing methods link failed", bmErr);
  }

  // 5) Flavor-Notes mit Intensitaet
  if (flavor_notes.length > 0) {
    const rows = flavor_notes.map((f, idx) => ({
      coffee_id: coffeeId,
      flavor_note_id: f.flavor_note_id,
      intensity: f.intensity,
      sort_order: idx,
    }));
    const { error: fnErr } = await sb.from("coffee_flavor_notes").insert(rows);
    if (fnErr) console.error("[admin/coffees] flavor notes link failed", fnErr);
  }

  return NextResponse.json({ ok: true, coffee_id: coffeeId });
}
