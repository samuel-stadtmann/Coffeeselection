// =============================================================================
// Edge Function: recommendation-next
// =============================================================================
// Schritt 9.10 / Playbook Kap. 5:
// Ruft rank_coffees_for_customer() auf und gibt die naechste(n) Empfehlung(en)
// zurueck — angereichert mit Kaffee-Detaildaten fuer die Anzeige.
//
// POST-Body:
// {
//   "customer_id":       "<uuid>",
//   "subscription_type": "discovery" | "fix",   // default: "discovery"
//   "limit":             3,                      // default: 3
//   "save_snapshot":     false,                  // default: false
//   "subscription_id":   "<uuid>",               // optional, fuer Snapshot
//   "delivery_slot":     "2026-06-01"            // optional, fuer Snapshot
// }
//
// Antwort:
// {
//   "ok": true,
//   "recommendations": [
//     {
//       "rank": 1,
//       "coffee_id": "...",
//       "coffee_name": "Brasilien Cerrado",
//       "roaster_id": "...",
//       "final_score": 87.5,
//       "scoring_score": 95,
//       "vector_similarity": 0.82,
//       "reasons": { ... },
//       "coffee": {              // Kaffee-Detaildaten
//         "slug": "...",
//         "image_url": "...",
//         "price_chf": 19.5,
//         "roast_level": 3,
//         "aroma_families": ["chocolate","nutty","sugary"],
//         ...
//       }
//     }
//   ]
// }
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase    = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const {
      customer_id,
      subscription_type = "discovery",
      limit             = 3,
      save_snapshot     = false,
      subscription_id   = null,
      delivery_slot     = null,
    } = body;

    if (!customer_id) {
      return json({ ok: false, error: "customer_id is required" }, 400);
    }

    // 1) Ranking-Funktion aufrufen
    const { data: ranked, error: rankErr } = await supabase.rpc(
      "rank_coffees_for_customer",
      {
        p_customer_id:       customer_id,
        p_subscription_type: subscription_type,
        p_limit:             limit,
        p_save_snapshot:     save_snapshot,
        p_subscription_id:   subscription_id,
        p_delivery_slot:     delivery_slot,
      },
    );

    if (rankErr) throw rankErr;
    if (!ranked || ranked.length === 0) {
      return json({ ok: true, recommendations: [] });
    }

    // 2) Kaffee-Detaildaten nachladen
    const coffeeIds: string[] = ranked.map((r: { coffee_id: string }) => r.coffee_id);
    const { data: coffees, error: cfErr } = await supabase
      .from("coffees")
      .select(`
        id, slug, name, short_description, image_url,
        price_chf, price_per_250g, weight_g,
        roast_level, roast_level_text, acidity, body, sweetness, bitterness, complexity,
        aroma_families, flavor_description, tasting_summary,
        is_organic, is_direct_trade, is_decaf,
        cupping_score, stock_status,
        origins_catalog ( name_de ),
        processing_methods_catalog ( name_de ),
        roasters ( name, logo_url )
      `)
      .in("id", coffeeIds);

    if (cfErr) throw cfErr;

    const coffeeById = new Map(
      (coffees ?? []).map((c: { id: string }) => [c.id, c]),
    );

    // 3) Zusammenfuehren
    const recommendations = ranked.map((r: {
      rank: number;
      coffee_id: string;
      coffee_name: string;
      roaster_id: string;
      final_score: number;
      scoring_score: number;
      vector_similarity: number;
      reasons: unknown;
    }) => ({
      rank:             r.rank,
      coffee_id:        r.coffee_id,
      coffee_name:      r.coffee_name,
      roaster_id:       r.roaster_id,
      final_score:      r.final_score,
      scoring_score:    r.scoring_score,
      vector_similarity: r.vector_similarity,
      reasons:          r.reasons,
      coffee:           coffeeById.get(r.coffee_id) ?? null,
    }));

    return json({ ok: true, recommendations });

  } catch (e) {
    return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
