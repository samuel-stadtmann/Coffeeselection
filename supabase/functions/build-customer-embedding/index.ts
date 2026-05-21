// Supabase Edge Function: build-customer-embedding
//
// Berechnet das taste_embedding fuer einen Kunden gemaess Playbook 5.5.3:
//
//   e1 = taste_types.embedding_seed_text                 Gewicht 0.5 (0.6 cold-start)
//   e2 = taste_types.aroma_families als Text             Gewicht 0.3 (0.4 cold-start)
//   e3 = flavor_descriptions der Top-Bewertungen         Gewicht 0.2 (nur warm)
//
// Cold-Start (num_ratings_given == 0): nur e1 + e2, gewichtet 0.6 / 0.4.
// Warm-Start: e1 + e2 + e3, gewichtet 0.5 / 0.3 / 0.2.
//
// Resultat wird L2-normalisiert und in customers.taste_embedding geschrieben.
//
// Trigger:
//   - Manuell:   POST { "customer_id": "<uuid>" }
//   - API:       Aufruf nach Quiz-Submit / nach Rating-Verarbeitung
//
// Secrets:
//   - OPENAI_API_KEY_COFFEESELECTION
//   - SUPABASE_URL                  (auto)
//   - SUPABASE_SERVICE_ROLE_KEY     (auto)

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY_COFFEESELECTION")!;

const TOP_RATED_LIMIT = 4;
const TOP_RATED_MIN_STARS = 4;

type Customer = {
  id: string;
  taste_type_id: number | null;
  num_ratings_given: number;
};
type TasteType = {
  id: number;
  name_de: string;
  embedding_seed_text: string | null;
  aroma_families: string[] | null;
};
type RatedCoffee = {
  flavor_description: string | null;
  tasting_summary: string | null;
  description: string | null;
  name: string;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function openaiEmbed(text: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "text-embedding-3-small", input: text }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI ${res.status}: ${body}`);
  }
  const json: any = await res.json();
  const e = json.data?.[0]?.embedding;
  if (!e) throw new Error("OpenAI returned no embedding");
  return e as number[];
}

function vectorAdd(...vs: Array<{ vec: number[]; w: number }>): number[] {
  const len = vs[0].vec.length;
  const out = new Array<number>(len).fill(0);
  for (const { vec, w } of vs) {
    for (let i = 0; i < len; i++) out[i] += vec[i] * w;
  }
  return out;
}

function vectorNormalize(v: number[]): number[] {
  let norm = 0;
  for (const x of v) norm += x * x;
  norm = Math.sqrt(norm);
  if (norm === 0) return v;
  return v.map((x) => x / norm);
}

serve(async (req) => {
  if (req.method !== "POST") return jsonResponse({ error: "method not allowed" }, 405);

  let customerId: string | undefined;
  try {
    const body = await req.json();
    customerId = body.customer_id ?? body.record?.id;
  } catch {
    return jsonResponse({ error: "invalid json" }, 400);
  }
  if (!customerId) return jsonResponse({ error: "customer_id missing" }, 400);

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Customer + Taste Type laden
  const { data: customer, error: cErr } = await supabase
    .from("customers")
    .select("id, taste_type_id, num_ratings_given")
    .eq("id", customerId)
    .maybeSingle();
  if (cErr) return jsonResponse({ error: "customer fetch failed", details: cErr.message }, 500);
  if (!customer) return jsonResponse({ error: "customer not found", customer_id: customerId }, 404);

  const c = customer as Customer;
  if (c.taste_type_id == null) {
    return jsonResponse(
      { error: "customer has no taste_type_id — quiz must be completed first", customer_id: customerId },
      422
    );
  }

  const { data: tt, error: ttErr } = await supabase
    .from("taste_types")
    .select("id, name_de, embedding_seed_text, aroma_families")
    .eq("id", c.taste_type_id)
    .maybeSingle();
  if (ttErr) return jsonResponse({ error: "taste_type fetch failed", details: ttErr.message }, 500);
  if (!tt) return jsonResponse({ error: "taste_type not found", taste_type_id: c.taste_type_id }, 404);

  const taste = tt as TasteType;

  // 2. Texte bauen — e1 / e2
  const text1 = taste.embedding_seed_text?.trim();
  if (!text1) {
    return jsonResponse(
      { error: "taste_type has empty embedding_seed_text", taste_type_id: taste.id },
      422
    );
  }
  const aromas = taste.aroma_families ?? [];
  const text2 = aromas.length > 0 ? `Bevorzugte Aroma-Familien: ${aromas.join(", ")}` : null;

  // 3. Top-Rated-Kaffees laden (warm only)
  let text3: string | null = null;
  let ratedCount = 0;
  if (c.num_ratings_given > 0) {
    const { data: rated } = await supabase
      .from("coffee_ratings")
      .select(
        "stars, coffees:coffee_id(name, flavor_description, tasting_summary, description)"
      )
      .eq("customer_id", c.id)
      .gte("stars", TOP_RATED_MIN_STARS)
      .order("stars", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(TOP_RATED_LIMIT);

    const desc = (rated ?? [])
      .map((r: any) => {
        const co = r.coffees as RatedCoffee | null;
        if (!co) return null;
        return co.flavor_description ?? co.tasting_summary ?? co.description ?? co.name;
      })
      .filter((s): s is string => Boolean(s));

    if (desc.length > 0) {
      text3 = `Lieblingskaffees: ${desc.join(". ")}`;
      ratedCount = desc.length;
    }
  }

  // 4. OpenAI-Calls (parallel)
  const [e1, e2, e3] = await Promise.all([
    openaiEmbed(text1),
    text2 ? openaiEmbed(text2) : Promise.resolve(null),
    text3 ? openaiEmbed(text3) : Promise.resolve(null),
  ]);

  // 5. Gewichtetes Mischen
  const components: Array<{ vec: number[]; w: number }> = [];
  if (e3) {
    // Warm-Start: 0.5 / 0.3 / 0.2
    components.push({ vec: e1, w: 0.5 });
    if (e2) components.push({ vec: e2, w: 0.3 });
    components.push({ vec: e3, w: 0.2 });
  } else if (e2) {
    // Cold-Start mit Aromas: 0.6 / 0.4
    components.push({ vec: e1, w: 0.6 });
    components.push({ vec: e2, w: 0.4 });
  } else {
    // Minimaler Fallback: nur Type-Beschreibung
    components.push({ vec: e1, w: 1.0 });
  }

  const mixed = vectorAdd(...components);
  const finalEmb = vectorNormalize(mixed);

  // 6. Speichern
  const { error: updErr } = await supabase
    .from("customers")
    .update({
      taste_embedding: finalEmb,
      profile_last_updated_at: new Date().toISOString(),
    })
    .eq("id", c.id);
  if (updErr) {
    // profile_last_updated_at koennte fehlen — Retry ohne
    if (updErr.message.includes("profile_last_updated_at")) {
      const { error: e2 } = await supabase
        .from("customers")
        .update({ taste_embedding: finalEmb })
        .eq("id", c.id);
      if (e2) return jsonResponse({ error: "update failed", details: e2.message }, 500);
    } else {
      return jsonResponse({ error: "update failed", details: updErr.message }, 500);
    }
  }

  return jsonResponse({
    ok: true,
    customer_id: c.id,
    taste_type: taste.name_de,
    mode: e3 ? "warm" : "cold",
    components: components.map((x) => x.w),
    rated_count: ratedCount,
    dimensions: finalEmb.length,
  });
});
