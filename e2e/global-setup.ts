import { chromium, type FullConfig } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Globaler Setup-Lauf vor allen E2E-Tests.
 *
 *   1. Lokales .env.local laden (gleicher BOM-safe Loader wie test_e2e).
 *   2. Test-User via service_role anlegen.
 *   3. Customer-Row vom Auth-Trigger holen, Test-Profil setzen
 *      (taste_type 1 = Klassiker, num_ratings_given 0).
 *   4. Im Browser einloggen (Supabase Magic-Link bypass via
 *      signInWithPassword), storageState nach playwright/.auth/user.json
 *      schreiben — alle Tests starten dann eingeloggt.
 *   5. Test-User-ID + Test-Customer-ID in playwright/.auth/test-data.json
 *      ablegen, damit Tests + Teardown drauf zugreifen koennen.
 */

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

const TEST_EMAIL = `playwright-${Date.now()}@coffeeselection.test`;
const TEST_PASSWORD = `pw-${Math.random().toString(36).slice(2, 14)}A1!`;

export default async function globalSetup(_config: FullConfig) {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !serviceKey || !anonKey) {
    throw new Error(
      "[playwright global-setup] need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
    );
  }

  const sb = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Test-User anlegen
  const { data: created, error: createErr } = await sb.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (createErr || !created.user) {
    throw new Error(`createUser failed: ${createErr?.message ?? "unknown"}`);
  }
  const authUserId = created.user.id;

  // 2. Customer-Row updaten — Trigger hat sie bereits angelegt.
  const { data: customer, error: custErr } = await sb
    .from("customers")
    .update({
      first_name: "Playwright",
      last_name: "Test",
      taste_type_id: 1,
      confidence: 0.85,
      num_ratings_given: 0,
    })
    .eq("auth_user_id", authUserId)
    .select("id")
    .single();
  if (custErr || !customer) {
    await sb.auth.admin.deleteUser(authUserId);
    throw new Error(`customer prep failed: ${custErr?.message ?? "unknown"}`);
  }
  const customerId = customer.id as string;

  // 3. Customer-Embedding via Edge-Function-Aufruf (Cold-Start),
  //    damit Recommendations sinnvoll laufen.
  const embRes = await fetch(`${url}/functions/v1/build-customer-embedding`, {
    method: "POST",
    headers: { Authorization: `Bearer ${anonKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ customer_id: customerId }),
  });
  if (!embRes.ok) {
    console.warn(
      `[playwright global-setup] build-customer-embedding ${embRes.status} — Tests laufen evtl. ohne Embedding`
    );
  }

  // 4. Browser-Session aufbauen + storageState persistieren.
  mkdirSync("playwright/.auth", { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // /login wird von uns selbst gerendert. Statt durch's UI zu klicken,
  // stoßen wir die Auth direkt im Browser via supabase-js an — das setzt
  // die Cookies, die der server-side createClient liest.
  await page.goto("/login");
  await page.evaluate(
    async ({ url, anonKey, email, password }) => {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.105.3");
      const sb = createClient(url, anonKey);
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw new Error(`signIn failed: ${error.message}`);
      // setSession in supabase-js setzt automatisch die Storage-Cookies.
      await sb.auth.setSession({
        access_token: data.session!.access_token,
        refresh_token: data.session!.refresh_token,
      });
    },
    { url, anonKey, email: TEST_EMAIL, password: TEST_PASSWORD }
  );

  // Damit @supabase/ssr-Cookies wirklich vom Server gelesen werden,
  // einmal eine Server-Component-Page besuchen — das triggert den
  // Cookie-Sync von localStorage in HTTP-Cookies durch unsere Middleware.
  await page.goto("/account/dashboard");
  // Kurz warten, damit Session-Cookies gesetzt sind.
  await page.waitForLoadState("networkidle");

  await context.storageState({ path: "playwright/.auth/user.json" });
  await browser.close();

  // 5. Test-Daten ablegen fuer Tests + Teardown
  writeFileSync(
    "playwright/.auth/test-data.json",
    JSON.stringify(
      {
        authUserId,
        customerId,
        email: TEST_EMAIL,
      },
      null,
      2
    )
  );

  console.log(`[playwright global-setup] test user ready: ${TEST_EMAIL} / customer ${customerId}`);
}
