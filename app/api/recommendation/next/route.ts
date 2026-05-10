import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCoffeesForTasteType, reasoningForMatch } from "@/lib/db/recommendations";

// Playbook 9.10: GET /api/recommendation/next
//   Input (Query-Parameter):
//     - subscription_id (optional, fuer surface-Tagging)
//     - surface (optional, default 'discovery_abo')
//     - exclude (optional, comma-separated coffee uuids die nicht erscheinen sollen)
//   Aktion:
//     - rank_coffees_for_customer-Aequivalent via getCoffeesForTasteType
//       (uses customer.taste_embedding when present -> hybrid scoring)
//     - Top-1 = Hauptempfehlung, Top-2/3 = Alternativen
//     - Snapshot der ersten 3 Empfehlungen in recommendation_history persistieren
//   Output: { coffee, score, explanation, alternatives }
//
//   customer_id kommt aus der Session (Playbook-Spec hat customer_id als
//   Query-Param; wir uebernehmen ihn aus der Session damit nicht jeder beliebige
//   Customer-IDs raten kann).

const QuerySchema = z.object({
  surface: z
    .enum(["home", "discovery_abo", "email", "quiz_result", "similar_to", "onboarding"])
    .optional()
    .default("discovery_abo"),
  subscription_id: z.uuid().optional(),
  // Hartfilter (Playbook 5.2) verhalten sich unterschiedlich:
  // 'discovery' aktiviert zusaetzlich den Roester-Cooldown.
  subscription_type: z.enum(["fix", "discovery"]).optional().default("fix"),
  exclude: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  let parsed: z.infer<typeof QuerySchema>;
  try {
    parsed = QuerySchema.parse({
      surface: url.searchParams.get("surface") ?? undefined,
      subscription_id: url.searchParams.get("subscription_id") ?? undefined,
      subscription_type: url.searchParams.get("subscription_type") ?? undefined,
      exclude: url.searchParams.get("exclude") ?? undefined,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "invalid_query", details: err instanceof z.ZodError ? err.issues : String(err) },
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
    .select("id, taste_type_id")
    .eq("auth_user_id", auth.user.id)
    .maybeSingle();
  if (cErr || !customer) {
    return NextResponse.json({ error: "customer_not_found" }, { status: 404 });
  }
  if (customer.taste_type_id == null) {
    return NextResponse.json(
      { error: "quiz_required", message: "Bitte zuerst das Geschmacksprofil-Quiz absolvieren." },
      { status: 422 }
    );
  }

  const excludeIds = parsed.exclude
    ? parsed.exclude.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const coffees = await getCoffeesForTasteType(supabase, customer.taste_type_id, {
    limit: 3,
    excludeIds,
    customerId: customer.id,
    subscriptionType: parsed.subscription_type,
  });
  if (coffees.length === 0) {
    return NextResponse.json({ error: "no_coffees_available" }, { status: 404 });
  }

  // Begruendung fuer Top-1 — nutzt taste_type-Profil als Referenz.
  const { data: tt } = await supabase
    .from("taste_types")
    .select("acidity, body, sweetness, bitterness, complexity")
    .eq("id", customer.taste_type_id)
    .maybeSingle();
  const explanation = tt ? reasoningForMatch(tt, coffees[0]) : null;

  // Snapshot in recommendation_history (Schema: customer_id, coffee_id, algorithm,
  // algorithm_version, rank, score, surface, shown_at).
  const algorithm = coffees[0].scoreMode === "hybrid" ? "hybrid" : "rule_based";
  const snapshotRows = coffees.map((c, idx) => ({
    customer_id: customer.id,
    coffee_id: c.id,
    algorithm,
    algorithm_version: "M5b",
    rank: idx + 1,
    score: Number(c.matchScore.toFixed(4)),
    surface: parsed.surface,
  }));
  // Best-effort: ein Fehler beim Persistieren soll die Antwort nicht blockieren.
  void supabase
    .from("recommendation_history")
    .insert(snapshotRows)
    .then(({ error }) => {
      if (error) console.error("[api/recommendation/next] snapshot insert failed", error);
    });

  return NextResponse.json({
    coffee: coffees[0],
    score: coffees[0].matchScore,
    explanation,
    alternatives: coffees.slice(1),
  });
}
