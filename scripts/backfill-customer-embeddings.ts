/**
 * Backfill taste_embedding for all customers that have a taste_type_id
 * by invoking the Supabase Edge Function `build-customer-embedding`
 * once per customer.
 *
 * Usage (from repo root):
 *   npx tsx scripts/backfill-customer-embeddings.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal(): void {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  let text = readFileSync(path, "utf-8");
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

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/build-customer-embedding`;

async function main() {
  const sb = createClient(SUPABASE_URL!, ANON_KEY!);

  const { data: customers, error } = await sb
    .from("customers")
    .select("id, taste_type_id, num_ratings_given")
    .not("taste_type_id", "is", null)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("❌ Failed to list customers:", error.message);
    process.exit(1);
  }
  if (!customers || customers.length === 0) {
    console.log("ℹ️  No customers with a taste_type found.");
    return;
  }

  console.log(`Backfilling ${customers.length} customer embeddings via ${FUNCTION_URL}\n`);

  let ok = 0;
  let fail = 0;
  for (const c of customers) {
    const label = `${c.id.slice(0, 8)}…  type=${c.taste_type_id}  ratings=${c.num_ratings_given}`;
    process.stdout.write(`  ${label.padEnd(50)} `);
    try {
      const res = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ANON_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ customer_id: c.id }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        mode?: string;
        dimensions?: number;
        error?: string;
      };
      if (res.ok && json.ok) {
        console.log(`✓ ${json.mode}  ${json.dimensions}d`);
        ok++;
      } else {
        console.log(`✗ ${res.status}  ${json.error ?? "unknown"}`);
        fail++;
      }
    } catch (e) {
      console.log(`✗ ${(e as Error).message}`);
      fail++;
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\nDone: ${ok} ok, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
