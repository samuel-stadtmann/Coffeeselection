import Stripe from "stripe";

/**
 * Server-seitiger Stripe-Client. NUR auf dem Server verwenden (API-Routes,
 * Server-Components, Edge-Functions). Niemals an den Browser ausliefern —
 * STRIPE_SECRET_KEY ist privat.
 *
 * Fuer den Browser nutze stattdessen `@stripe/stripe-js` mit dem
 * NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
 *
 * Singleton-Pattern: einmal initialisiert, immer wiederverwendet. Wir
 * loggen kein Secret-Material, weil das Stripe-SDK das schon nicht macht.
 */

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "getStripe: STRIPE_SECRET_KEY fehlt. In Vercel → Env-Variables setzen (alle 3 Scopes). Lokal in .env.local."
    );
  }
  _stripe = new Stripe(key, {
    // Pin auf eine konkrete API-Version, damit Stripe nicht hinter unserem
    // Ruecken die Antwort-Felder aendert. Beim Upgrade hier den String
    // updaten + Changelog lesen.
    apiVersion: "2026-04-22.dahlia",
    appInfo: {
      name: "Coffee Selection",
      version: "0.1.0",
      url: "https://coffeeselection.ch",
    },
    // Automatisches Retry bei Netzwerk-Fehlern (Stripe-Default ist 0 — wir
    // wollen mind. 2 Retries fuer Webhook-Antworten + flaky Verbindungen)
    maxNetworkRetries: 2,
  });
  return _stripe;
}

/**
 * Helper: liest den Webhook-Signing-Secret. Separat von getStripe(), damit
 * API-Routes ohne Webhooks (z.B. /api/checkout/session) nicht abhaengig
 * davon werden.
 */
export function getStripeWebhookSecret(): string {
  const s = process.env.STRIPE_WEBHOOK_SECRET;
  if (!s) {
    throw new Error(
      "getStripeWebhookSecret: STRIPE_WEBHOOK_SECRET fehlt. Aus Stripe Dashboard → Webhooks → Endpoint → Signing Secret kopieren."
    );
  }
  return s;
}

/**
 * Browser-/Build-sichere Variante: liefert den publishable key (kann
 * ueber NEXT_PUBLIC_* ueber Server- und Client-Code geteilt werden).
 *
 * Wirft NICHT bei Missing — gibt null zurueck, damit Build durchgeht
 * (analog zu createStaticClient in lib/supabase/static.ts).
 */
export function getStripePublishableKey(): string | null {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? null;
}
