/**
 * Backfill flavor_embedding for all active coffees by invoking the
 * Supabase Edge Function `generate-coffee-embedding` once per coffee.
 *
 * Usage (from repo root):
 *   npx tsx scripts/backfill-coffee-embeddings.ts
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from
 * .env.local (loaded automatically by Next.js' env loader if present, or
 * fall back to process.env). The anon key is sufficient to invoke the
 * function — no service role needed.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal(): void {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  let text = readFileSync(path, "utf-8");
  // UTF-8 BOM (Notepad-Klassiker) entfernen
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    const [, k, vRaw] = m;
    if (process.env[k]) continue;
    const v = vRaw.trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
    process.env[k] = v;
  }
}

loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY missing in .env.local");
  process.exit(1);
}

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/generate-coffee-embedding`;

async function main() {
  const sb = createClient(SUPABASE_URL!, ANON_KEY!);

  const { data: coffees, error } = await sb
    .from("coffees")
    .select("id, name")
    .is("deleted_at", null)
    .eq("status", "active")
    .order("name");

  if (error) {
    console.error("❌ Failed to list coffees:", error.message);
    process.exit(1);
  }
  if (!coffees || coffees.length === 0) {
    console.log("ℹ️  No active coffees found.");
    return;
  }

  console.log(`Backfilling ${coffees.length} coffees via ${FUNCTION_URL}\n`);

  let ok = 0;
  let fail = 0;
  for (const c of coffees) {
    process.stdout.write(`  ${c.name.padEnd(40)} `);
    try {
      const res = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ANON_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ coffee_id: c.id }),
      });
      const json = (await res.json()) as { ok?: boolean; dimensions?: number; error?: string };
      if (res.ok && json.ok) {
        console.log(`✓ ${json.dimensions}d`);
        ok++;
      } else {
        console.log(`✗ ${res.status} ${json.error ?? "unknown"}`);
        fail++;
      }
    } catch (e) {
      console.log(`✗ ${(e as Error).message}`);
      fail++;
    }
    // Mini-Throttle, OpenAI rate limits sind grosszuegig, aber sicher ist sicher
    await new Promise((r) => setTimeout(r, 150));
  }

  console.log(`\nDone: ${ok} ok, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
