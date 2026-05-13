import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * C-4: POST /api/checkout/session
 *
 * Erzeugt eine Stripe Checkout Session fuer eine existierende pending-Order.
 * Frontend ruft erst /api/orders/create (C-3) → bekommt order_id → ruft dann
 * diese Route → bekommt checkout_url → redirected dorthin. Karten-Eingabe
 * passiert auf Stripe-Hosted-Page (PCI-Compliance, kein eigenes Card-Form).
 *
 * Nach Bezahlung:
 *   - Erfolg: Stripe redirected zu /checkout/success?session_id={...}
 *   - Abbruch: Stripe redirected zu /checkout/cart
 *   - Webhook /api/webhooks/stripe (C-5) setzt order.status='paid'
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
      shipping_chf, subtotal_chf,
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

  // ---- 3) Order-Items laden -------------------------------------------------
  const { data: items, error: iErr } = await svc
    .from("order_items")
    .select(
      "coffee_id, coffee_name_snapshot, roaster_name_snapshot, quantity, weight_g, unit_price_chf"
    )
    .eq("order_id", order.id);

  if (iErr || !items || items.length === 0) {
    console.error("[api/checkout/session] order_items load failed", iErr);
    return NextResponse.json(
      { error: "order_items_load_failed", details: iErr?.message ?? "empty" },
      { status: 500 }
    );
  }

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
  const lineItems = items.map(
    (it) => ({
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
          },
        },
      },
    })
  );

  // ---- 6) Shipping-Option ---------------------------------------------------
  // Wir berechnen den Versand server-seitig. Stripe bekommt eine fix-rate.
  const shippingChf = Number(order.shipping_chf);
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
  let session: Awaited<ReturnType<typeof stripe.checkout.sessions.create>>;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: stripeCustomerId,
      // Wir haben Stripe-Customer mit address erstellt → Stripe Tax kann
      // berechnen. Adresse muessen wir nicht erneut sammeln.
      customer_update: { address: "auto", shipping: "auto", name: "auto" },
      line_items: lineItems,
      shipping_options: [shippingOption],
      // automatic_tax: { enabled: true },  // erst wenn UID + Stripe-Tax-Reg da
      payment_method_types: ["card"],
      // Phase 1A: nur Card. Spaeter werden hier weitere PMs auftauchen
      // (Apple/Google Pay sind automatisch in 'card' enthalten).
      locale: stripeLocale,
      expires_at:
        Math.floor(Date.now() / 1000) + SESSION_EXPIRES_AFTER_SEC,
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout/cart`,
      // Metadata wird vom Webhook (C-5) gelesen um Order zu finden
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
        cs_customer_id: customer.id,
      },
      payment_intent_data: {
        // Beschreibung auf Karten-Rechnung (statement descriptor liegt im
        // Stripe-Dashboard fix, hier nur Order-Referenz)
        description: `Coffee Selection ${order.order_number}`,
        metadata: {
          order_id: order.id,
          order_number: order.order_number,
        },
      },
      // Lokale Rechnung an Customer geht spaeter via unseren Mail-Versand,
      // nicht via Stripe-Receipt. Falls doch gewuenscht: `receipt_email`.
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[api/checkout/session] stripe.checkout.sessions.create failed", err);
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
