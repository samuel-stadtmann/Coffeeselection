import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * C-4 + P1B-5: POST /api/checkout/session
 *
 * Erzeugt eine Stripe Checkout Session fuer eine existierende pending-Order.
 * Frontend ruft erst /api/orders/create → bekommt order_id → ruft dann
 * diese Route → bekommt checkout_url → redirected dorthin. Karten-Eingabe
 * passiert auf Stripe-Hosted-Page (PCI-Compliance, kein eigenes Card-Form).
 *
 * Modi (entschieden anhand der Order):
 *   - Reiner Einmal-Cart (keine subscriptions.first_order_id=order.id) →
 *     mode='payment', line_items mit non-recurring price_data
 *   - Cart mit 1 Abo-Item (Mixed oder rein) →
 *     mode='subscription', line_items mit MIX aus:
 *       - recurring price_data fuer das Abo-Item
 *       - non-recurring price_data fuer Einmal-Items (werden als
 *         one-off line_items auf der initialen Subscription-Invoice
 *         berechnet)
 *
 * Nach Bezahlung:
 *   - Erfolg: Stripe redirected zu /checkout/success?session_id={...}
 *   - Abbruch: Stripe redirected zu /checkout/cart
 *   - Webhook /api/webhooks/stripe (P1B-6) setzt order.status='paid' und
 *     subscription.status='active' (falls vorhanden)
 *
 * Tax-Handling:
 *   Phase 1A: automatic_tax DEAKTIVIERT — Stripe Tax verlangt CH-VAT-
 *   Registrierung (UID-Nummer), die wir noch nicht haben. Bis dahin sind
 *   Preise als Brutto behandelt (inklusive MWST), Stripe berechnet keinen
 *   separaten Steuer-Betrag.
 *
 *   Wieder aktivieren wenn UID da:
 *     1. Stripe Dashboard → Tax → Activate (mit UID-Nummer)
 *     2. In dieser Route: automatic_tax: { enabled: true }
 *     3. tax_code: TAX_CODE_COFFEE_BEANS auf product_data UND shipping
 *     4. tax_behavior: 'exclusive' auf shipping_rate_data
 *
 * Shipping:
 *   shipping_options als Stripe-Shipping-Rate. Wir berechnen den Betrag
 *   server-seitig (nicht Stripe — vermeidet 2 Quellen der Wahrheit).
 *   Bei mode='subscription' wird Stripe den Shipping-Betrag der INITIAL
 *   Invoice hinzufuegen. Renewals haben separate Versand-Logik (Webhook).
 */

const BodySchema = z.object({
  order_id: z.uuid(),
});

// Stripe Tax-Code fuer Kaffeebohnen / Tee — reduzierter CH-MWST-Satz 2.6%.
// Aktuell ungenutzt (automatic_tax deaktiviert) — wieder aktivieren wenn UID da.
// Siehe Header-Kommentar in dieser Datei.
const TAX_CODE_COFFEE_BEANS = "txcd_19030000";
void TAX_CODE_COFFEE_BEANS; // Vermeidet "unused"-Warnung bis Re-Activation.

// Session-Lebensdauer: 30 Minuten. Nach Ablauf muss Kunde neu starten.
const SESSION_EXPIRES_AFTER_SEC = 30 * 60;

export async function POST(req: NextRequest) {
  // ---- 1) Input-Parsing -----------------------------------------------------
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      {
        error: "invalid_body",
        details: err instanceof z.ZodError ? err.issues : String(err),
      },
      { status: 400 }
    );
  }

  const svc = createServiceClient();

  // ---- 2) Order + Items + Customer laden ------------------------------------
  const { data: order, error: oErr } = await svc
    .from("orders")
    .select(
      `
      id, order_number, status,
      customer_id,
      shipping_chf, subtotal_chf, discount_chf, promo_code,
      shipping_address_snapshot,
      language,
      stripe_checkout_session_id,
      customer:customers(id, email, stripe_customer_id, first_name, last_name)
    `
    )
    .eq("id", body.order_id)
    .maybeSingle();

  if (oErr) {
    console.error("[api/checkout/session] order lookup failed", oErr);
    return NextResponse.json(
      { error: "order_lookup_failed", details: oErr.message },
      { status: 500 }
    );
  }
  if (!order) {
    return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  }
  if (order.status !== "pending") {
    // Order ist bereits bezahlt, storniert, oder im Versand — keine neue Session
    return NextResponse.json(
      {
        error: "order_not_pending",
        status: order.status,
        order_number: order.order_number,
      },
      { status: 409 }
    );
  }

  // Wenn Order schon eine Session hat: idempotent, gib die existierende zurueck
  // (Stripe-Session 30min gueltig — wir koennen sie wiederverwenden falls sie
  // noch lebt; falls expired, neue erzeugen).
  if (order.stripe_checkout_session_id) {
    try {
      const existing = await getStripe().checkout.sessions.retrieve(
        order.stripe_checkout_session_id
      );
      if (existing.status === "open" && existing.url) {
        return NextResponse.json({
          checkout_url: existing.url,
          session_id: existing.id,
          reused: true,
        });
      }
      // sonst: Session expired/complete/etc → fall through und neu erzeugen
    } catch (err) {
      // Session evtl. nicht (mehr) in Stripe — fall through und neu erzeugen
      console.warn(
        "[api/checkout/session] existing session retrieve failed, creating new",
        err
      );
    }
  }

  // Supabase typed FK → in Runtime ein Objekt, in TS aber als Array typisiert
  const customer = order.customer as unknown as {
    id: string;
    email: string;
    stripe_customer_id: string | null;
    first_name: string | null;
    last_name: string | null;
  };
  if (!customer) {
    return NextResponse.json({ error: "customer_not_found" }, { status: 500 });
  }

  // ---- 3) Order-Items + assoziierte Subscription(s) laden -------------------
  const { data: items, error: iErr } = await svc
    .from("order_items")
    .select(
      "coffee_id, coffee_name_snapshot, roaster_name_snapshot, quantity, weight_g, unit_price_chf, is_subscription_item"
    )
    .eq("order_id", order.id);

  if (iErr || !items || items.length === 0) {
    console.error("[api/checkout/session] order_items load failed", iErr);
    return NextResponse.json(
      { error: "order_items_load_failed", details: iErr?.message ?? "empty" },
      { status: 500 }
    );
  }

  // Hat diese Order eine zugehoerige Subscription? Stripe-Limit garantiert
  // 1 Subscription pro Cart (max). NULL → reiner Einmal-Cart.
  const { data: sub, error: subErr } = await svc
    .from("subscriptions")
    .select("id, interval_weeks, status")
    .eq("first_order_id", order.id)
    .maybeSingle();

  if (subErr) {
    console.error("[api/checkout/session] subscription lookup failed", subErr);
    return NextResponse.json(
      { error: "subscription_lookup_failed", details: subErr.message },
      { status: 500 }
    );
  }

  const isSubscriptionMode = sub !== null;
  const stripe = getStripe();

  // ---- 4) Stripe Customer ermitteln/erzeugen --------------------------------
  // Wir wollen den Stripe-Customer dauerhaft haben:
  //   - Spaeter (Phase 1B) braucht's Subscriptions sowieso einen
  //   - Beim erneuten Kauf vom selben Customer wiederverwendbar
  //   - Customer-Address ist Basis fuer Stripe Tax
  const shipAddr = order.shipping_address_snapshot as {
    recipient_name: string;
    company?: string | null;
    street: string;
    street_additional?: string | null;
    postal_code: string;
    city: string;
    region?: string | null;
    country: string;
  };

  let stripeCustomerId = customer.stripe_customer_id;

  if (!stripeCustomerId) {
    const created = await stripe.customers.create({
      email: customer.email,
      name:
        [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
        shipAddr.recipient_name,
      shipping: {
        name: shipAddr.recipient_name,
        address: {
          line1: shipAddr.street,
          line2: shipAddr.street_additional ?? undefined,
          postal_code: shipAddr.postal_code,
          city: shipAddr.city,
          state: shipAddr.region ?? undefined,
          country: shipAddr.country,
        },
      },
      address: {
        line1: shipAddr.street,
        line2: shipAddr.street_additional ?? undefined,
        postal_code: shipAddr.postal_code,
        city: shipAddr.city,
        state: shipAddr.region ?? undefined,
        country: shipAddr.country,
      },
      metadata: {
        cs_customer_id: customer.id,
      },
    });
    stripeCustomerId = created.id;

    // Persistieren — beim naechsten Kauf vom selben Customer wiederverwenden
    await svc
      .from("customers")
      .update({ stripe_customer_id: stripeCustomerId })
      .eq("id", customer.id);
  }

  // ---- 5) Line-Items fuer Stripe-Session bauen ------------------------------
  // Wir nutzen price_data (inline), keine vorab-konfigurierten Stripe-Products.
  // Strategie + Begruendung: siehe docs/STRIPE_PRODUCTS_STRATEGY.md
  //
  // Bei mode=subscription:
  //   - Abo-Item: price_data mit recurring={interval:'week', interval_count:N}
  //   - Einmal-Items: price_data ohne recurring → Stripe behandelt sie als
  //     one-off auf der initial Invoice
  // Bei mode=payment: alle ohne recurring.
  const lineItems = items.map((it) => {
    const isAbo = it.is_subscription_item === true;
    return {
      quantity: it.quantity,
      price_data: {
        currency: "chf",
        unit_amount: Math.round(Number(it.unit_price_chf) * 100), // CHF → Rappen
        product_data: {
          name: it.coffee_name_snapshot,
          description: `${it.weight_g}g · ${it.roaster_name_snapshot}`,
          // tax_code: TAX_CODE_COFFEE_BEANS, // erst aktivieren wenn UID da
          metadata: {
            coffee_id: it.coffee_id,
            weight_g: String(it.weight_g),
            is_subscription_item: isAbo ? "true" : "false",
          },
        },
        ...(isAbo && sub
          ? {
              recurring: {
                interval: "week" as const,
                interval_count: sub.interval_weeks,
              },
            }
          : {}),
      },
    };
  });

  // ---- 6) Shipping ----------------------------------------------------------
  // Wir berechnen den Versand server-seitig. Stripe bekommt eine fix-rate.
  //
  // Wichtige Stripe-Limitation: shipping_options funktioniert nur in
  // mode=payment. In mode=subscription muessen wir Versand als zusaetzliches
  // line_item adden — mit gleichem recurring-Intervall wie das Abo, damit
  // jede Renewal-Invoice automatisch wieder einen Versand-Eintrag bekommt.
  const shippingChf = Number(order.shipping_chf);

  // Subscription-Mode: Versand als zusaetzliches recurring line_item
  // (skip wenn Gratis-Versand, sonst leeres Item mit Wert 0).
  if (isSubscriptionMode && sub && shippingChf > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "chf",
        unit_amount: Math.round(shippingChf * 100),
        product_data: {
          name: "Standardversand Schweiz",
          description: "Pro Lieferung, schweizweit · röstfrisch",
          metadata: {
            coffee_id: "",
            weight_g: "0",
            is_subscription_item: "true",
          },
        },
        recurring: {
          interval: "week" as const,
          interval_count: sub.interval_weeks,
        },
      },
    });
  }

  // Payment-Mode: klassisches shipping_options (wird unten in der
  // Session-Create-Call uebergeben, nur in payment-Mode).
  const shippingOption = {
    shipping_rate_data: {
      type: "fixed_amount" as const,
      fixed_amount: {
        amount: Math.round(shippingChf * 100),
        currency: "chf",
      },
      display_name:
        shippingChf === 0
          ? "Gratisversand Schweiz"
          : "Standardversand Schweiz",
      delivery_estimate: {
        minimum: { unit: "business_day" as const, value: 2 },
        maximum: { unit: "business_day" as const, value: 5 },
      },
      // tax_behavior + tax_code erst wenn UID da (siehe Header)
    },
  };

  // ---- 7) Locale fuer Stripe-Hosted-Page ------------------------------------
  // language im Format 'de-CH','fr-CH','it-CH','en' → Stripe akzeptiert
  // 'de','fr','it','en' als Hauptcodes.
  const stripeLocale = ((): "de" | "fr" | "it" | "en" | "auto" => {
    const lang = (order.language as string).split("-")[0];
    if (lang === "de" || lang === "fr" || lang === "it" || lang === "en") {
      return lang;
    }
    return "auto";
  })();

  // ---- 8) URLs (success/cancel) ---------------------------------------------
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://staging.coffeeselection.ch";

  // ---- 9) Session erzeugen --------------------------------------------------
  // Common-Felder fuer beide Modi:
  const commonMetadata = {
    order_id: order.id,
    order_number: order.order_number,
    cs_customer_id: customer.id,
    ...(sub ? { subscription_id: sub.id } : {}),
  };

  // ---- 8.5) Discount via dynamischem Stripe-Coupon --------------------------
  // Wenn die Order discount_chf > 0 hat (Promo-Code im Checkout angewendet),
  // erzeugen wir einen einmaligen Stripe-Coupon mit amount_off und haengen
  // ihn als discounts an die Session. duration='once' = nur Initial-Invoice
  // (bei Subscriptions Renewals nicht mehr rabattiert).
  const discountChf = Number(order.discount_chf ?? 0);
  let stripeDiscounts:
    | Array<{ coupon: string }>
    | undefined = undefined;
  if (discountChf > 0) {
    const coupon = await stripe.coupons.create({
      amount_off: Math.round(discountChf * 100),
      currency: "chf",
      duration: "once",
      name: order.promo_code
        ? `Promo ${order.promo_code}`
        : `Rabatt ${order.order_number}`,
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
        promo_code: order.promo_code ?? "",
      },
    });
    stripeDiscounts = [{ coupon: coupon.id }];
  }

  let session: Awaited<ReturnType<typeof stripe.checkout.sessions.create>>;
  try {
    if (isSubscriptionMode && sub) {
      // mode=subscription: Stripe erzeugt nach Bezahlung 1 Subscription mit
      // den recurring line_items. Einmal-Items in line_items (ohne recurring)
      // werden zur initialen Invoice hinzugefuegt.
      // payment_intent_data ist hier NICHT erlaubt — Stripe nutzt
      // subscription_data stattdessen.
      // expires_at ist hier auch nicht zulaessig (subscriptions sind
      // langlebig).
      // subscription-mode: KEIN shipping_options — Stripe-Limit.
      // Versand wurde oben als zusaetzliches recurring line_item gepusht.
      session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: stripeCustomerId,
        customer_update: { address: "auto", shipping: "auto", name: "auto" },
        line_items: lineItems,
        payment_method_types: ["card"],
        locale: stripeLocale,
        success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/checkout/cart`,
        metadata: commonMetadata,
        ...(stripeDiscounts ? { discounts: stripeDiscounts } : {}),
        subscription_data: {
          description: `Coffee Selection Abo ${order.order_number}`,
          metadata: {
            subscription_id: sub.id,
            first_order_id: order.id,
            first_order_number: order.order_number,
            cs_customer_id: customer.id,
          },
        },
      });
    } else {
      // mode=payment: bisheriger Flow fuer reine Einmalkauf-Carts.
      session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer: stripeCustomerId,
        customer_update: { address: "auto", shipping: "auto", name: "auto" },
        line_items: lineItems,
        shipping_options: [shippingOption],
        payment_method_types: ["card"],
        locale: stripeLocale,
        expires_at:
          Math.floor(Date.now() / 1000) + SESSION_EXPIRES_AFTER_SEC,
        success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/checkout/cart`,
        metadata: commonMetadata,
        ...(stripeDiscounts ? { discounts: stripeDiscounts } : {}),
        payment_intent_data: {
          description: `Coffee Selection ${order.order_number}`,
          metadata: {
            order_id: order.id,
            order_number: order.order_number,
          },
        },
      });
    }
  } catch (err) {
    // Stripe-Errors haben mehr Detail als nur .message — wir extrahieren
    // param/code/type damit der Frontend-Toast aussagekraeftig wird.
    type StripeishError = {
      message?: string;
      code?: string;
      param?: string;
      type?: string;
    };
    const e = err as StripeishError;
    const parts = [
      e.message,
      e.code ? `code=${e.code}` : null,
      e.param ? `param=${e.param}` : null,
      e.type ? `type=${e.type}` : null,
    ].filter(Boolean);
    const msg = parts.length > 0 ? parts.join(" · ") : String(err);
    console.error(
      "[api/checkout/session] stripe.checkout.sessions.create failed",
      { mode: isSubscriptionMode ? "subscription" : "payment", err }
    );
    return NextResponse.json(
      { error: "stripe_session_create_failed", details: msg },
      { status: 500 }
    );
  }

  // ---- 10) Session-ID an Order kleben ---------------------------------------
  const { error: updErr } = await svc
    .from("orders")
    .update({ stripe_checkout_session_id: session.id })
    .eq("id", order.id);

  if (updErr) {
    // Nicht kritisch — Session ist erzeugt, Customer wuerde trotzdem bezahlen
    // koennen. Aber Webhook-Lookup wuerde nicht funktionieren. Loggen + weiter.
    console.error(
      "[api/checkout/session] failed to persist stripe_checkout_session_id",
      updErr
    );
  }

  // ---- 11) Erfolgs-Response -------------------------------------------------
  return NextResponse.json({
    checkout_url: session.url,
    session_id: session.id,
    expires_at: session.expires_at,
    reused: false,
  });
}
