// =============================================================================
// Edge Function: rating-submit
// =============================================================================
// Schritt 9.10 / Playbook Kap. 6:
// Speichert eine Kaffee-Bewertung und triggert sofort den Lern-Worker
// (process_pending_ratings), damit das Kundenprofil aktuell bleibt.
//
// POST-Body:
// {
//   "customer_id":     "<uuid>",
//   "coffee_id":       "<uuid>",
//   "rating":          4,               // 1-5 Sterne
//   "would_drink_again": "yes" | "no" | "maybe",
//   "positive_tags":   ["schokolade", "karamell"],   // optional
//   "negative_tags":   ["zu bitter"],                // optional
//   "notes":           "War gut zum Fruehstueck"     // optional
// }
//
// Antwort:
// {
//   "ok": true,
//   "rating_id": "<uuid>",
//   "worker_result": { "processed": 1, "skipped": 0 }
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
      coffee_id,
      rating,
      would_drink_again = null,
      positive_tags     = [],
      negative_tags     = [],
      notes             = null,
    } = body;

    // Validierung
    if (!customer_id) return json({ ok: false, error: "customer_id is required" }, 400);
    if (!coffee_id)   return json({ ok: false, error: "coffee_id is required" },   400);
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return json({ ok: false, error: "rating must be 1-5" }, 400);
    }
    if (would_drink_again && !["yes", "no", "maybe"].includes(would_drink_again)) {
      return json({ ok: false, error: "would_drink_again must be yes/no/maybe" }, 400);
    }

    // 1) Bewertung speichern (processed_at bleibt NULL -> Lern-Worker verarbeitet sie)
    const { data: ratingRow, error: ratingErr } = await supabase
      .from("coffee_ratings")
      .insert({
        customer_id,
        coffee_id,
        rating,
        would_drink_again: would_drink_again ?? null,
        positive_tags:     positive_tags,
        negative_tags:     negative_tags,
        notes:             notes ?? null,
      })
      .select("id")
      .single();

    if (ratingErr) throw ratingErr;

    // 2) Lern-Worker sofort ausfuehren (nicht auf Cron warten)
    const { data: workerResult, error: workerErr } = await supabase
      .rpc("process_pending_ratings", { p_batch_size: 10 });

    if (workerErr) {
      // Worker-Fehler nicht weiterwerfen — Bewertung ist bereits gespeichert,
      // Cron holt sie spaeter nach.
      console.error("Learning worker error:", workerErr.message);
    }

    // 3) Wenn Lern-Worker Profil veraendert hat: Embedding asynchron aktualisieren
    const processed = Array.isArray(workerResult)
      ? workerResult[0]?.processed ?? 0
      : (workerResult as { processed?: number })?.processed ?? 0;

    if (processed > 0) {
      const embUrl = `${supabaseUrl}/functions/v1/generate-customer-embedding`;
      fetch(embUrl, {
        method:  "POST",
        headers: {
          "Authorization": `Bearer ${serviceKey}`,
          "Content-Type":  "application/json",
        },
        body: JSON.stringify({ customer_id }),
      }).catch(() => {});
    }

    return json({
      ok:            true,
      rating_id:     ratingRow.id,
      worker_result: workerResult ?? null,
    });

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
