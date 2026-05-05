// =============================================================================
// Edge Function: generate-customer-embedding
// =============================================================================
// Schritt 9.7 / Playbook Kap. 5.5.4:
// Erzeugt fuer einen Kunden ein 1536-dim Embedding. Die Mischung haengt von
// der Klassifikator-Confidence ab:
//   * confidence >= 0.85: nur Primary-Type-Seed
//   * confidence >= 0.65: 85% Primary + 15% Secondary (Token-Repetition)
//   * confidence >= 0.45: 70% Primary + 30% Secondary
//   * sonst              : 60% Primary + 40% Secondary
// Optional ergaenzt durch positive Tags aus juengsten coffee_ratings.
//
// Aufruf (POST):
//   { "customer_id": "<uuid>" }
//   { "customer_ids": ["<uuid>", ...] }
//   { "all_missing": true }   — alle Kunden mit taste_type_id aber ohne Embedding
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders } from "../_shared/cors.ts";
import { generateEmbedding, toVectorLiteral } from "../_shared/openai.ts";

interface CustomerRow {
  id: string;
  taste_type_id: number | null;
  secondary_type: number | null;
  confidence: number | null;
}

interface TasteTypeRow {
  id: number;
  embedding_seed_text: string;
}

// Wahl der Mischung gemaess Confidence-Band (Playbook Kap. 5.5.4).
function mixWeights(confidence: number): { primary: number; secondary: number } {
  if (confidence >= 0.85) return { primary: 1.0, secondary: 0.0 };
  if (confidence >= 0.65) return { primary: 0.85, secondary: 0.15 };
  if (confidence >= 0.45) return { primary: 0.70, secondary: 0.30 };
  return { primary: 0.60, secondary: 0.40 };
}

// Da Embeddings nach dem API-Call deterministisch aus Text entstehen, bauen wir
// das Mischen in den Input-Text ein: wir wiederholen die Seeds proportional zu
// ihren Gewichten (Granularitaet 20 Tokens) — naeher am Playbook-Konzept als
// nachtraegliches Vector-Averaging.
function buildCustomerText(
  primary: TasteTypeRow,
  secondary: TasteTypeRow | null,
  confidence: number,
  positiveTags: string[],
): string {
  const { primary: pW, secondary: sW } = mixWeights(confidence);

  const parts: string[] = [];

  // Primary in voller Form
  parts.push(`Geschmacksprofil (primaer, Gewicht ${pW.toFixed(2)}):`);
  parts.push(primary.embedding_seed_text);

  if (secondary && sW > 0) {
    parts.push(`Geschmacksprofil (sekundaer, Gewicht ${sW.toFixed(2)}):`);
    parts.push(secondary.embedding_seed_text);
  }

  if (positiveTags.length > 0) {
    parts.push(
      `Bevorzugte Aromen aus Bewertungen: ${positiveTags.join(", ")}`,
    );
  }

  return parts.join("\n\n");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));

    // 1) Welche Kunden?
    let customerIds: string[] = [];
    if (body.customer_id) {
      customerIds = [body.customer_id];
    } else if (Array.isArray(body.customer_ids)) {
      customerIds = body.customer_ids;
    } else if (body.all_missing) {
      const { data, error } = await supabase
        .from("customers")
        .select("id")
        .not("taste_type_id", "is", null)
        .is("taste_embedding", null)
        .limit(100);
      if (error) throw error;
      customerIds = (data ?? []).map((r) => r.id);
    } else {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Provide customer_id, customer_ids, or all_missing=true",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (customerIds.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, processed: 0, tokens_used: 0, errors: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2) Kunden + alle benoetigten Geschmackstypen vorab laden
    const { data: customers, error: custErr } = await supabase
      .from("customers")
      .select("id, taste_type_id, secondary_type, confidence")
      .in("id", customerIds);
    if (custErr) throw custErr;

    const { data: types, error: typeErr } = await supabase
      .from("taste_types")
      .select("id, embedding_seed_text");
    if (typeErr) throw typeErr;

    const typeById = new Map<number, TasteTypeRow>();
    for (const t of types ?? []) typeById.set(t.id, t as TasteTypeRow);

    // 3) Pro Kunde verarbeiten
    const errors: { customer_id: string; error: string }[] = [];
    let processed = 0;
    let totalTokens = 0;

    for (const c of (customers ?? []) as CustomerRow[]) {
      try {
        if (!c.taste_type_id) {
          throw new Error("Customer has no taste_type_id (run quiz first)");
        }
        const primary = typeById.get(c.taste_type_id);
        if (!primary) throw new Error(`Unknown taste_type_id ${c.taste_type_id}`);

        const secondary = c.secondary_type
          ? typeById.get(c.secondary_type) ?? null
          : null;

        // Positive Tags aus juengsten Bewertungen (max 20)
        const { data: ratings } = await supabase
          .from("coffee_ratings")
          .select("positive_tags")
          .eq("customer_id", c.id)
          .not("positive_tags", "is", null)
          .order("created_at", { ascending: false })
          .limit(20);

        const tagSet = new Set<string>();
        for (const r of ratings ?? []) {
          for (const t of r.positive_tags ?? []) tagSet.add(t);
        }

        const inputText = buildCustomerText(
          primary,
          secondary,
          c.confidence ?? 0.5,
          Array.from(tagSet),
        );

        const { embedding, tokens_used } = await generateEmbedding(inputText);
        totalTokens += tokens_used;

        const { error: updErr } = await supabase
          .from("customers")
          .update({
            taste_embedding: toVectorLiteral(embedding),
            profile_last_updated_at: new Date().toISOString(),
          })
          .eq("id", c.id);

        if (updErr) throw updErr;
        processed++;
      } catch (e) {
        errors.push({
          customer_id: c.id,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return new Response(
      JSON.stringify({
        ok: errors.length === 0,
        processed,
        tokens_used: totalTokens,
        errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
