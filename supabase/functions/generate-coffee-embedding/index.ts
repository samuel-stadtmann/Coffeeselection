// =============================================================================
// Edge Function: generate-coffee-embedding
// =============================================================================
// Schritt 9.7 / Playbook Kap. 5.5.3:
// Erzeugt fuer einen oder mehrere Kaffees ein 1536-dim Embedding aus
// strukturierten Geschmacks-Daten + Freitext und speichert es in
// public.coffees.flavor_embedding.
//
// Aufruf-Modi (POST):
//   { "coffee_id": "<uuid>" }                  — ein einzelner Kaffee
//   { "coffee_ids": ["<uuid>", ...] }          — mehrere
//   { "all_missing": true }                    — alle Kaffees ohne Embedding
//
// Antwort:
//   { "ok": true, "processed": N, "tokens_used": M, "errors": [...] }
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders } from "../_shared/cors.ts";
import { generateEmbedding, toVectorLiteral } from "../_shared/openai.ts";

interface CoffeeRow {
  id: string;
  name: string;
  region: string | null;
  roast_level: number | null;
  acidity: number | null;
  body: number | null;
  sweetness: number | null;
  bitterness: number | null;
  complexity: number | null;
  aroma_families: string[] | null;
  flavor_description: string | null;
  tasting_summary: string | null;
  origins_catalog: { name_de: string | null } | null;
  processing_methods_catalog: { name_de: string | null } | null;
}

// Baut den Embedding-Input-Text fuer einen Kaffee gemaess Playbook Kap. 5.5.3.
function buildCoffeeText(c: CoffeeRow): string {
  const parts: string[] = [];

  parts.push(`Kaffee: ${c.name}`);

  const origin = c.origins_catalog?.name_de;
  if (origin || c.region) {
    parts.push(
      `Herkunft: ${[origin, c.region].filter(Boolean).join(", ")}`,
    );
  }

  const proc = c.processing_methods_catalog?.name_de;
  if (proc) parts.push(`Verarbeitung: ${proc}`);

  if (c.roast_level) parts.push(`Roestgrad: ${c.roast_level}/5`);
  if (c.acidity) parts.push(`Saeure: ${c.acidity}/5`);
  if (c.body) parts.push(`Koerper: ${c.body}/5`);
  if (c.sweetness) parts.push(`Suesse: ${c.sweetness}/5`);
  if (c.bitterness) parts.push(`Bitterkeit: ${c.bitterness}/5`);
  if (c.complexity) parts.push(`Komplexitaet: ${c.complexity}/5`);

  if (c.aroma_families && c.aroma_families.length > 0) {
    parts.push(`Aroma-Familien: ${c.aroma_families.join(", ")}`);
  }

  if (c.tasting_summary) parts.push(`Tasting: ${c.tasting_summary}`);
  if (c.flavor_description) parts.push(c.flavor_description);

  return parts.join(" | ");
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

    // 1) Welche Kaffees verarbeiten?
    let coffeeIds: string[] = [];
    if (body.coffee_id) {
      coffeeIds = [body.coffee_id];
    } else if (Array.isArray(body.coffee_ids)) {
      coffeeIds = body.coffee_ids;
    } else if (body.all_missing) {
      const { data, error } = await supabase
        .from("coffees")
        .select("id")
        .is("flavor_embedding", null)
        .eq("status", "active")
        .is("deleted_at", null)
        .limit(100);
      if (error) throw error;
      coffeeIds = (data ?? []).map((r) => r.id);
    } else {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Provide coffee_id, coffee_ids, or all_missing=true",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (coffeeIds.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, processed: 0, tokens_used: 0, errors: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2) Daten laden (mit Joins zu Origin + Processing fuer Klartextnamen)
    const { data: coffees, error: fetchErr } = await supabase
      .from("coffees")
      .select(`
        id, name, region, roast_level, acidity, body, sweetness, bitterness,
        complexity, aroma_families, flavor_description, tasting_summary,
        origins_catalog ( name_de ),
        processing_methods_catalog ( name_de )
      `)
      .in("id", coffeeIds);

    if (fetchErr) throw fetchErr;
    if (!coffees || coffees.length === 0) {
      throw new Error("No coffees found for given IDs");
    }

    // 3) Pro Kaffee Embedding generieren und speichern
    const errors: { coffee_id: string; error: string }[] = [];
    let processed = 0;
    let totalTokens = 0;

    for (const c of coffees as unknown as CoffeeRow[]) {
      try {
        const inputText = buildCoffeeText(c);
        const { embedding, tokens_used } = await generateEmbedding(inputText);
        totalTokens += tokens_used;

        const { error: updErr } = await supabase
          .from("coffees")
          .update({ flavor_embedding: toVectorLiteral(embedding) })
          .eq("id", c.id);

        if (updErr) throw updErr;
        processed++;
      } catch (e) {
        errors.push({
          coffee_id: c.id,
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
