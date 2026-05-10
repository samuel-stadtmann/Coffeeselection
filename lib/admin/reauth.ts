import { cookies } from "next/headers";
import { createHmac, randomBytes } from "node:crypto";

/**
 * Re-Authentication-Cookie fuer den Admin-Bereich.
 *
 * Die normale Supabase-Session beweist nur "ist Customer XY angemeldet".
 * Fuer den Admin-Bereich verlangen wir zusaetzlich einen frischen
 * Passwort-Beweis (innerhalb der letzten 30 Min). Das verhindert dass
 * ein offen gelassener Laptop ohne Re-Login durch's Admin-Dashboard
 * gefahren werden kann.
 *
 * Cookie-Format: "<unixMillis>.<hmac>", HMAC ueber die Millis mit dem
 * Server-Secret ADMIN_REAUTH_SECRET. Damit kann ein User das Cookie
 * nicht selber faelschen. HTTP-only + SameSite=lax + Path=/admin.
 */

const COOKIE_NAME = "admin-reauth";
const TTL_MS = 30 * 60 * 1000; // 30 Min frische Re-Auth-Wertigkeit

function getSecret(): string {
  const s = process.env.ADMIN_REAUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "ADMIN_REAUTH_SECRET fehlt oder zu kurz (min 16 Zeichen). Set in .env.local + Vercel."
    );
  }
  return s;
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

export async function isAdminReauthValid(): Promise<boolean> {
  let store;
  try {
    store = await cookies();
  } catch {
    return false;
  }
  const c = store.get(COOKIE_NAME);
  if (!c?.value) return false;
  const idx = c.value.lastIndexOf(".");
  if (idx <= 0) return false;
  const tsStr = c.value.slice(0, idx);
  const sig = c.value.slice(idx + 1);
  try {
    if (sign(tsStr) !== sig) return false;
  } catch {
    return false;
  }
  const ts = Number(tsStr);
  if (!Number.isFinite(ts)) return false;
  return Date.now() - ts < TTL_MS;
}

export async function setAdminReauthCookie(): Promise<void> {
  const ts = String(Date.now());
  const sig = sign(ts);
  const store = await cookies();
  store.set(COOKIE_NAME, `${ts}.${sig}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: Math.floor(TTL_MS / 1000),
  });
}

export async function clearAdminReauthCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/**
 * Hilfsfunktion fuer Setup: schlaegt einen sicheren Wert vor.
 * (Wird nicht zur Laufzeit aufgerufen — nur via Node-REPL als One-Liner.)
 */
export function suggestSecret(): string {
  return randomBytes(32).toString("hex");
}
