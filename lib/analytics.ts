"use client";

/**
 * Wrapper fuer GA4-Custom-Events. Macht nichts in Dev/Preview (kein gtag
 * geladen) und faengt fehlende Konfiguration ab — Aufrufe sind also
 * jederzeit safe.
 *
 * Konvention: GA4-empfohlene Event-Namen wo verfuegbar
 * (https://developers.google.com/analytics/devguides/collection/ga4/reference/events),
 * sonst Coffee-Selection-eigene Namen mit snake_case.
 *
 * Verwendung von der Client-Komponente aus:
 *   import { trackEvent } from "@/lib/analytics";
 *   trackEvent("quiz_complete", { taste_type_id: 3 });
 *
 * Bei Bedarf in den Funnel-Schritten:
 *   - quiz_start (Quiz-Frage 1 Page-Load)
 *   - quiz_complete (Match-Result laed)
 *   - view_item (Coffee-Detail-Page)
 *   - add_to_cart (CartItem hinzugefuegt)
 *   - begin_checkout (/checkout/review betreten)
 *   - purchase (Webhook → Success-Page) — siehe lib/checkout.ts
 *   - newsletter_subscribe (Footer-Form Erfolg)
 *   - subscription_start (Abo erfolgreich angelegt)
 */
type Primitive = string | number | boolean | null;

export function trackEvent(
  eventName: string,
  params: Record<string, Primitive | Primitive[]> = {}
): void {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== "function") return;
  try {
    gtag("event", eventName, params);
  } catch {
    // GA-Fehler darf das UI nicht stoeren.
  }
}

/**
 * Generischer "purchase"-Event mit GA4-Schema. Verwende ihn auf
 * /checkout/success, wenn die Order-Daten geladen sind.
 */
export function trackPurchase(opts: {
  orderId: string;
  totalChf: number;
  shippingChf: number;
  taxChf: number;
  items: Array<{
    coffeeSlug: string;
    coffeeName: string;
    weightG: number;
    quantity: number;
    unitPriceChf: number;
  }>;
}): void {
  trackEvent("purchase", {
    transaction_id: opts.orderId,
    value: Number(opts.totalChf.toFixed(2)),
    shipping: Number(opts.shippingChf.toFixed(2)),
    tax: Number(opts.taxChf.toFixed(2)),
    currency: "CHF",
    items: opts.items.map((it) => ({
      item_id: it.coffeeSlug,
      item_name: it.coffeeName,
      item_variant: `${it.weightG}g`,
      quantity: it.quantity,
      price: Number(it.unitPriceChf.toFixed(2)),
    })) as unknown as Primitive[],
  });
}
