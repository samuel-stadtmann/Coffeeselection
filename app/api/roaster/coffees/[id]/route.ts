import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getRoasterUser } from "@/lib/roaster/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { AROMA_FAMILIES } from "@/lib/coffee/form-helpers";

const AROMA_SLUGS = AROMA_FAMILIES.map((a) => a.slug) as [string, ...string[]];

// PATCH /api/roaster/coffees/[id]
//   Body: CoffeeFormState
//   Permission:
//     - User muss eingeloggter Roaster-User sein.
//     - Coffee muss zu einer seiner Rösterei-Memberships gehören.
//   Aktion:
//     - Update der Coffee-Row + Allergene + Zertifikate (Replace-Strategie).
//     - Status darf NICHT auf 'active' gesetzt werden (nur Admin).

const UUID_LOOSE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const BodySchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
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
  // Form schickt aktuellen Status mit — wir clampen unten so dass Roaster
  // den nicht auf 'active' setzen kann (siehe safeStatus-Logik).
  status: z.enum(["draft", "active", "paused", "discontinued"]).default("draft"),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: coffeeId } = await params;
  if (!UUID_LOOSE.test(coffeeId)) {
    return NextResponse.json({ error: "invalid_coffee_id" }, { status: 400 });
  }

  const u = await getRoasterUser();
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

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

  // Permission: Coffee laden, prüfen ob er zu einer User-Membership gehört.
  const { data: existing } = await sb
    .from("coffees")
    .select("id, roaster_id, status")
    .eq("id", coffeeId)
    .single();
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const allowedRoasters = u.memberships.map((m) => m.roaster_id);
  if (!allowedRoasters.includes(existing.roaster_id)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Roaster darf den roaster_id NICHT auf eine fremde Rösterei umbiegen.
  if (parsed.roaster_id !== existing.roaster_id) {
    if (!allowedRoasters.includes(parsed.roaster_id)) {
      return NextResponse.json(
        { error: "forbidden", details: "Ziel-Rösterei ist nicht in deinen Memberships" },
        { status: 403 }
      );
    }
  }

  const {
    allergen_slugs,
    certification_ids,
    brewing_methods,
    flavor_notes,
    decaf_method,
    image_url,
    ...coffeeFields
  } = parsed;

  // Status: Roaster darf nicht auf 'active' setzen. Wenn das Form 'active'
  // schickt (z.B. weil der Coffee live ist und der Roaster ihn nur bearbeitet),
  // behalten wir den Status bei. Übergang draft→active bleibt Admin-only.
  const safeStatus =
    coffeeFields.status === "active"
      ? existing.status === "active"
        ? "active"
        : "draft"
      : coffeeFields.status;

  const updatePayload = {
    ...coffeeFields,
    status: safeStatus,
    decaf_method: decaf_method || null,
    image_url: image_url || null,
    price_per_250g:
      parsed.price_chf && parsed.weight_g > 0
        ? Math.round((parsed.price_chf * 250 * 100) / parsed.weight_g) / 100
        : null,
    updated_at: new Date().toISOString(),
  };

  const { error: updErr } = await sb
    .from("coffees")
    .update(updatePayload)
    .eq("id", coffeeId);
  if (updErr) {
    return NextResponse.json(
      { error: "update_failed", details: updErr.message },
      { status: 500 }
    );
  }

  // Allergene + Zertifikate: Replace-Strategie (delete + insert).
  await sb.from("coffee_allergens").delete().eq("coffee_id", coffeeId);
  if (allergen_slugs.length > 0) {
    await sb
      .from("coffee_allergens")
      .insert(allergen_slugs.map((slug) => ({ coffee_id: coffeeId, allergen: slug })));
  }

  await sb.from("coffee_certifications").delete().eq("coffee_id", coffeeId);
  if (certification_ids.length > 0) {
    await sb
      .from("coffee_certifications")
      .insert(
        certification_ids.map((cid) => ({ coffee_id: coffeeId, certification_id: cid }))
      );
  }

  // Bruehmethoden — Replace
  await sb.from("coffee_brewing_methods").delete().eq("coffee_id", coffeeId);
  if (brewing_methods.length > 0) {
    await sb.from("coffee_brewing_methods").insert(
      brewing_methods.map((b) => ({
        coffee_id: coffeeId,
        brewing_method_id: b.brewing_method_id,
        is_recommended: b.is_recommended,
        notes: b.notes || null,
      }))
    );
  }

  // Flavor-Notes mit Intensitaet — Replace
  await sb.from("coffee_flavor_notes").delete().eq("coffee_id", coffeeId);
  if (flavor_notes.length > 0) {
    await sb.from("coffee_flavor_notes").insert(
      flavor_notes.map((f, idx) => ({
        coffee_id: coffeeId,
        flavor_note_id: f.flavor_note_id,
        intensity: f.intensity,
        sort_order: idx,
      }))
    );
  }

  return NextResponse.json({ ok: true, coffee_id: coffeeId });
}
