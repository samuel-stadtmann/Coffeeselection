/**
 * End-to-End Pipeline Test (Playbook 9.11, Scenario 1, leaner cut).
 *
 * Was getestet wird (= alles aus M5b + M5c):
 *   1. Test-Customer + Auth-User anlegen (mit service_role).
 *   2. Customer auf Geschmackstyp Fruchtfreund (id=2) setzen.
 *   3. Edge-Function build-customer-embedding aufrufen — verifizieren dass
 *      customers.taste_embedding gefuellt ist (1536 Dim, Cold-Start).
 *   4. Hybrid-Recommendation pullen via getCoffeesForTasteType — verifizieren
 *      dass Top-3 hybrid-gescort sind und die Saeure-Achse zum Fruchtfreund-
 *      Profil passt.
 *   5. Bewertung mit 5 Sternen einfuegen — coffee_ratings.processed_at = NULL.
 *   6. Embedding-Snapshot vor process_pending_ratings.
 *   7. process_pending_ratings() RPC ausfuehren.
 *   8. Snapshot vergleichen — Embedding muss gedriftet sein.
 *   9. Cleanup: Bewertung, Customer, Auth-User loeschen.
 *
 * Was NICHT getestet wird (Future Work in PRE_GO_LIVE):
 *   - HTTP-Round-Trip durch /api/quiz/submit, /api/recommendation/next,
 *     /api/rating/submit. Diese brauchen Cookie-basierte Auth, was ohne
 *     Headless-Browser (Playwright) zu fummelig ist. Manueller Smoke-Test
 *     hat sie verifiziert.
 *   - Scenario 2 (Hard-Filter Edge-Case) — braucht Ranking-Function aus 9.8
 *     (= P1 im PRE_GO_LIVE).
 *
 * Run: npx tsx scripts/test_e2e.ts
 * Exit: 0 wenn alle Asserts gruen, 1 sonst.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// ── ENV ────────────────────────────────────────────────────────────────────
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
    process.env[k] = vRaw.trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
  }
}
loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) {
  console.error("❌ Missing env: SUPABASE_URL / SERVICE_ROLE_KEY / ANON_KEY in .env.local");
  process.exit(1);
}

// ── HELPERS ────────────────────────────────────────────────────────────────
let failures = 0;
function check(label: string, ok: boolean, info?: unknown): void {
  if (ok) {
    console.log(`  ✓ ${label}`);
  } else {
    console.log(`  ✗ ${label}`, info ?? "");
    failures++;
  }
}

function parseVector(v: unknown): number[] | null {
  if (v == null) return null;
  if (Array.isArray(v)) return v as number[];
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) return null;
  try {
    const a = JSON.parse(trimmed);
    return Array.isArray(a) ? (a as number[]) : null;
  } catch {
    return null;
  }
}

const TASTE_TYPE_ID = 2; // Fruchtfreund
const TEST_EMAIL = `e2e-${Date.now()}@coffeeselection.test`;

async function main() {
  const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`\nE2E pipeline test — taste_type ${TASTE_TYPE_ID} (Fruchtfreund)\n`);

  // 1. Auth-User + Customer anlegen
  console.log("Step 1 — create auth user + customer");
  const { data: authData, error: authErr } = await sb.auth.admin.createUser({
    email: TEST_EMAIL,
    password: `pw-${Math.random().toString(36).slice(2, 12)}`,
    email_confirm: true,
  });
  if (authErr || !authData.user) {
    console.error("Cannot create auth user:", authErr);
    return 1;
  }
  const authUserId = authData.user.id;

  // Ein DB-Trigger legt die customers-Row automatisch beim Auth-User an.
  // Wir laden die existierende Row und updaten sie auf das Test-Profil.
  const { data: customer, error: custErr } = await sb
    .from("customers")
    .update({
      first_name: "E2E",
      last_name: "Test",
      taste_type_id: TASTE_TYPE_ID,
      confidence: 0.85,
      num_ratings_given: 0,
    })
    .eq("auth_user_id", authUserId)
    .select("id")
    .single();
  if (custErr || !customer) {
    console.error("Cannot prepare customer:", custErr);
    await sb.auth.admin.deleteUser(authUserId).catch(() => {});
    return 1;
  }
  const customerId = customer.id as string;
  check("customer + auth user created", true, customerId);

  try {
    // 2. build-customer-embedding triggern
    console.log("\nStep 2 — invoke build-customer-embedding edge function");
    const embRes = await fetch(`${SUPABASE_URL}/functions/v1/build-customer-embedding`, {
      method: "POST",
      headers: { Authorization: `Bearer ${ANON_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: customerId }),
    });
    const embJson = (await embRes.json()) as {
      ok?: boolean;
      mode?: string;
      dimensions?: number;
      error?: string;
    };
    check("edge function returned ok", Boolean(embJson.ok), embJson);
    check("mode = cold (no ratings yet)", embJson.mode === "cold");
    check("1536 dimensions", embJson.dimensions === 1536);

    const { data: c1 } = await sb
      .from("customers")
      .select("taste_embedding")
      .eq("id", customerId)
      .maybeSingle();
    const emb1 = parseVector(c1?.taste_embedding);
    check("customer.taste_embedding set", emb1 !== null && emb1.length === 1536);

    // 3. Recommendation pullen
    console.log("\nStep 3 — pull recommendation via getCoffeesForTasteType");
    const { getCoffeesForTasteType } = await import("../lib/db/recommendations");
    const recos = await getCoffeesForTasteType(sb, TASTE_TYPE_ID, {
      limit: 3,
      customerId,
    });
    check("at least 1 recommendation returned", recos.length > 0);
    check("top-1 uses hybrid scoring", recos[0]?.scoreMode === "hybrid");
    check(
      "top-1 has matchScore > 0.5",
      typeof recos[0]?.matchScore === "number" && recos[0].matchScore > 0.5
    );
    check(
      "top-1 has acidity >= 3 (Fruchtfreund-Heuristik)",
      typeof recos[0]?.acidity === "number" && (recos[0].acidity ?? 0) >= 3
    );
    const topCoffee = recos[0];

    // 4. 5-Sterne-Bewertung einfuegen
    console.log("\nStep 4 — insert 5-star rating");
    const { data: rating, error: rErr } = await sb
      .from("coffee_ratings")
      .insert({
        customer_id: customerId,
        coffee_id: topCoffee.id,
        rating: 5,
        positive_tags: ["fruchtig"],
        negative_tags: [],
        would_drink_again: "yes",
        source: "web",
        processed_at: null,
      })
      .select("id")
      .single();
    check("rating inserted", !rErr && Boolean(rating?.id), rErr);

    // 5. process_pending_ratings ausfuehren (= simulierter Worker-Tick)
    console.log("\nStep 5 — run process_pending_ratings");
    const { data: workerResult, error: workerErr } = await sb.rpc("process_pending_ratings", {
      p_batch_size: 10,
    });
    check("worker RPC ran", !workerErr, workerErr);
    check(
      "worker processed >= 1 rating",
      Array.isArray(workerResult) && (workerResult[0]?.processed ?? 0) >= 1,
      workerResult
    );

    // 6. Embedding-Drift verifizieren
    console.log("\nStep 6 — verify embedding drift");
    const { data: c2 } = await sb
      .from("customers")
      .select("taste_embedding, profile_last_updated_at")
      .eq("id", customerId)
      .maybeSingle();
    const emb2 = parseVector(c2?.taste_embedding);
    check("post-drift embedding still 1536d", emb2?.length === 1536);

    if (emb1 && emb2) {
      // Differenz-Norm: ||emb2 - emb1||. Bei Drift > 0, bei No-Op = 0.
      let diffNormSq = 0;
      for (let i = 0; i < emb1.length; i++) diffNormSq += (emb2[i] - emb1[i]) ** 2;
      const diffNorm = Math.sqrt(diffNormSq);
      check(
        `embedding moved (||Δ|| = ${diffNorm.toFixed(4)})`,
        diffNorm > 0.001,
        { diffNorm }
      );
    }
  } finally {
    // Cleanup — auch bei Fehlern: aufraeumen
    console.log("\nCleanup");
    await sb.from("coffee_ratings").delete().eq("customer_id", customerId);
    await sb.from("customers").delete().eq("id", customerId);
    await sb.auth.admin.deleteUser(authUserId).catch(() => {});
    console.log("  ✓ test fixtures removed");
  }

  console.log(failures === 0 ? "\nALL TESTS OK" : `\n${failures} CHECKS FAILED`);
  return failures === 0 ? 0 : 1;
}

main()
  .then((code) => process.exit(code))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
