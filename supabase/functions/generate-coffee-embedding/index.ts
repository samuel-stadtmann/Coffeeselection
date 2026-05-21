// Supabase Edge Function: generate-coffee-embedding
//
// Erzeugt das pgvector-Embedding fuer einen Coffee via OpenAI text-embedding-3-small
// und schreibt es nach coffees.flavor_embedding.
//
// Trigger:
//   - Manuell:        POST mit { "coffee_id": "<uuid>" }
//   - DB Webhook:     POST mit Supabase-Payload { type, table, record, old_record }
//                     (Hook in Database -> Webhooks anlegen, Event INSERT/UPDATE auf coffees)
//
// Secrets (Supabase Edge Functions -> Manage Secrets):
//   - OPENAI_API_KEY_COFFEESELECTION   (vom User gesetzt)
//   - SUPABASE_URL                     (von Supabase auto-injiziert)
//   - SUPABASE_SERVICE_ROLE_KEY        (von Supabase auto-injiziert)
//
// Deployment via Supabase Dashboard:
//   Edge Functions -> Create new function -> Name: generate-coffee-embedding
//   Diesen Inhalt hier reinkopieren und Deploy klicken.

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY_COFFEESELECTION")!;

type CoffeeRow = {
  id: string;
  name: string;
  short_description: string | null;
  description: string | null;
  tasting_summary: string | null;
  flavor_description: string | null;
  region: string | null;
  farm: string | null;
  producer: string | null;
  // roast_level liegt aktuell als smallint (1-5) in der DB. Die Migration
  // wollte text mit Enum (light/medium/...), das wurde aber im Dashboard
  // umgebaut. Wir mappen unten beim Embedding-Text-Bauen, damit der
  // OpenAI-Input semantisch lesbar wird.
  roast_level: number | string | null;
  is_decaf: boolean;
  acidity: number | null;
  body: number | null;
  sweetness: number | null;
  bitterness: number | null;
  complexity: number | null;
  aroma_families: string[] | null;
};

const ROAST_LEVEL_LABELS: Record<string, string> = {
  "1": "light",
  "2": "medium_light",
  "3": "medium",
  "4": "medium_dark",
  "5": "dark",
  light: "light",
  medium_light: "medium_light",
  medium: "medium",
  medium_dark: "medium_dark",
  dark: "dark",
};

function roastLabel(v: unknown): string {
  if (v == null) return "medium";
  const key = String(v).trim().toLowerCase();
  return ROAST_LEVEL_LABELS[key] ?? "medium";
}

function buildEmbeddingText(c: CoffeeRow): string {
  const parts: string[] = [];
  parts.push(`Kaffee: ${c.name}`);

  // Geschmacks-Beschreibung — nimm den ausführlichsten verfügbaren Text
  const desc = c.flavor_description ?? c.tasting_summary ?? c.description ?? c.short_description;
  if (desc) parts.push(desc);

  // Herkunft
  const origin = [c.farm, c.producer, c.region].filter(Boolean).join(", ");
  if (origin) parts.push(`Herkunft: ${origin}`);

  parts.push(`Röstgrad: ${roastLabel(c.roast_level)}`);
  if (c.is_decaf) parts.push("Entkoffeiniert");

  if (c.aroma_families && c.aroma_families.length > 0) {
    parts.push(`Aroma-Familien: ${c.aroma_families.join(", ")}`);
  }

  // SCA-Sensorik (1–5)
  const sensory: string[] = [];
  if (c.acidity != null) sensory.push(`Säure ${c.acidity}/5`);
  if (c.body != null) sensory.push(`Körper ${c.body}/5`);
  if (c.sweetness != null) sensory.push(`Süße ${c.sweetness}/5`);
  if (c.bitterness != null) sensory.push(`Bitterkeit ${c.bitterness}/5`);
  if (c.complexity != null) sensory.push(`Komplexität ${c.complexity}/5`);
  if (sensory.length) parts.push(`Charakteristik: ${sensory.join(", ")}`);

  return parts.join(". ");
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method !== "POST") return jsonResponse({ error: "method not allowed" }, 405);

  let coffeeId: string | undefined;
  try {
    const body = await req.json();
    coffeeId = body.coffee_id ?? body.record?.id;
  } catch {
    return jsonResponse({ error: "invalid json" }, 400);
  }

  if (!coffeeId) return jsonResponse({ error: "coffee_id missing" }, 400);

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: coffee, error: fetchErr } = await supabase
    .from("coffees")
    .select(
      "id, name, short_description, description, tasting_summary, flavor_description, region, farm, producer, roast_level, is_decaf, acidity, body, sweetness, bitterness, complexity, aroma_families"
    )
    .eq("id", coffeeId)
    .maybeSingle();

  if (fetchErr) return jsonResponse({ error: "fetch failed", details: fetchErr.message }, 500);
  if (!coffee) return jsonResponse({ error: "coffee not found", coffee_id: coffeeId }, 404);

  const text = buildEmbeddingText(coffee as CoffeeRow);

  const openaiRes = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });

  if (!openaiRes.ok) {
    const detail = await openaiRes.text();
    return jsonResponse({ error: "openai failed", status: openaiRes.status, detail }, 502);
  }

  const json: any = await openaiRes.json();
  const embedding: number[] = json.data?.[0]?.embedding;
  if (!embedding) return jsonResponse({ error: "openai returned no embedding", json }, 502);

  const { error: updateErr } = await supabase
    .from("coffees")
    .update({ flavor_embedding: embedding })
    .eq("id", coffeeId);

  if (updateErr) return jsonResponse({ error: "update failed", details: updateErr.message }, 500);

  return jsonResponse({
    ok: true,
    coffee_id: coffeeId,
    text_length: text.length,
    dimensions: embedding.length,
    text_preview: text.slice(0, 200),
  });
});
