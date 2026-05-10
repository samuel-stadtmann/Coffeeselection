import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Playbook 9.10: POST /api/rating/submit
//   Input: { coffee_id, order_id?, stars (1-5), tags?, comment? }
//   (customer_id aus der Session.)
//   Aktion: Bewertung in coffee_ratings persistieren. Lernen passiert
//   asynchron via process_pending_ratings (pg_cron alle 15 Min).
//   Output: { success: true, rating_id }

const BodySchema = z.object({
  coffee_id: z.uuid(),
  order_id: z.uuid().optional().nullable(),
  stars: z.number().int().min(1).max(5),
  positive_tags: z.array(z.string().min(1).max(64)).max(20).optional(),
  negative_tags: z.array(z.string().min(1).max(64)).max(20).optional(),
  comment: z.string().max(2000).optional().nullable(),
  would_drink_again: z.enum(["yes", "no", "maybe"]).optional().nullable(),
});

export async function POST(req: NextRequest) {
  let parsed: z.infer<typeof BodySchema>;
  try {
    const json = await req.json();
    parsed = BodySchema.parse(json);
  } catch (err) {
    return NextResponse.json(
      { error: "invalid_body", details: err instanceof z.ZodError ? err.issues : String(err) },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: customer, error: cErr } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", auth.user.id)
    .maybeSingle();
  if (cErr || !customer) {
    return NextResponse.json({ error: "customer_not_found" }, { status: 404 });
  }

  // Insert mit upsert-Verhalten: Unique-Constraint (customer_id, coffee_id)
  // -> Bestehende Bewertung wird ueberschrieben (User korrigiert seine Meinung).
  const { data: rating, error: insErr } = await supabase
    .from("coffee_ratings")
    .upsert(
      {
        customer_id: customer.id,
        coffee_id: parsed.coffee_id,
        order_id: parsed.order_id ?? null,
        rating: parsed.stars,
        // Tag-Spalten haben NOT-NULL — leere Arrays statt null als Default.
        positive_tags: parsed.positive_tags ?? [],
        negative_tags: parsed.negative_tags ?? [],
        comment: parsed.comment ?? null,
        would_drink_again: parsed.would_drink_again ?? null,
        processed_at: null,           // Worker soll's neu verarbeiten
        source: "web",
      },
      { onConflict: "customer_id,coffee_id" }
    )
    .select("id")
    .single();

  if (insErr || !rating) {
    console.error("[api/rating/submit] insert failed", insErr);
    return NextResponse.json(
      { error: "insert_failed", details: insErr?.message ?? "unknown" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, rating_id: rating.id });
}
