import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

/**
 * Playbook 9.11 Scenario 2 — Edge-Case "kein passender Coffee".
 *
 * Wir setzen den Test-Customer auf eine Hartfilter-Konfiguration die
 * ALLE Coffees ausschliesst (max_price_per_250g = 2 CHF — niedriger
 * als jeder Coffee, sogar nach 1.20x Cascade-Relax). Erwartung:
 * /api/recommendation/next antwortet mit 404 no_coffees_available.
 *
 * Anschliessend setzen wir die Restriktion zurueck und verifizieren
 * dass die Route wieder Coffees liefert. Der Test stellt sicher dass
 * (a) der Recommender restriktive Profile sauber abfaengt statt zu
 * crashen, und (b) Aenderungen an Customer-Praeferenzen sofort wirken.
 */

const TEST_DATA_PATH = "playwright/.auth/test-data.json";

function loadEnv() {
  const text = readFileSync(".env.local", "utf-8").replace(/^﻿/, "");
  const env: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.trim().match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
  }
  return env;
}

async function setMaxPrice(customerId: string, value: number | null) {
  const env = loadEnv();
  const sb = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { error } = await sb
    .from("customers")
    .update({ max_price_per_250g: value })
    .eq("id", customerId);
  if (error) throw new Error(`setMaxPrice failed: ${error.message}`);
}

test.describe("Recommender Hartfilter-Cascade (Scenario 2)", () => {
  let customerId: string;

  test.beforeAll(() => {
    const data = JSON.parse(readFileSync(TEST_DATA_PATH, "utf-8")) as { customerId: string };
    customerId = data.customerId;
  });

  test("404 no_coffees_available wenn max_price zu niedrig fuer alle Coffees", async ({ request }) => {
    try {
      await setMaxPrice(customerId, 2);

      const res = await request.get("/api/recommendation/next?surface=discovery_abo");
      expect(res.status()).toBe(404);
      const body = (await res.json()) as { error: string };
      expect(body.error).toBe("no_coffees_available");
    } finally {
      // Restriktion zuruecksetzen, sonst leakt sie in andere Tests.
      await setMaxPrice(customerId, null);
    }
  });

  test("nach Reset wieder 200 mit Coffees", async ({ request }) => {
    await setMaxPrice(customerId, null);
    const res = await request.get("/api/recommendation/next?surface=discovery_abo");
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { coffee: { id: string } };
    expect(body.coffee).toBeDefined();
  });
});
