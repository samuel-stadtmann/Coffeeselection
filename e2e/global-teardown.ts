import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Globaler Teardown: Test-User + Customer-Row + Auth-User loeschen,
 * damit die DB nach jedem Run sauber ist.
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

export default async function globalTeardown() {
  loadEnvLocal();

  const path = "playwright/.auth/test-data.json";
  if (!existsSync(path)) return;
  const { authUserId, customerId } = JSON.parse(readFileSync(path, "utf-8")) as {
    authUserId: string;
    customerId: string;
  };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !serviceKey) return;

  const sb = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Reihenfolge: child rows -> customer -> auth user (CASCADEs erledigen den Rest).
  await sb.from("coffee_ratings").delete().eq("customer_id", customerId);
  await sb.from("customer_allergens").delete().eq("customer_id", customerId);
  await sb.from("customers").delete().eq("id", customerId);
  await sb.auth.admin.deleteUser(authUserId).catch(() => {});

  try {
    unlinkSync(path);
  } catch {
    /* ignore */
  }

  console.log("[playwright global-teardown] cleanup done");
}
