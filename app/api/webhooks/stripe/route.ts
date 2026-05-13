import { NextResponse, type NextRequest } from "next/server";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * C-5 + P1B-6: POST /api/webhooks/stripe
 *
 * Letzter Baustein in Phase 1A. Hier wird der Kreis geschlossen:
 *   Stripe sendet bei Bezahl-Events einen HTTP-POST an diese Route.
 *   Wir verifizieren die Signatur, finden die Order, setzen status='paid'.
 *
 * Wichtigste Events fuer Phase 1A (Einmalkauf):
 *   - checkout.session.completed
 *       Standard-Happy-Path bei Karten-Zahlung. session.payment_status='paid'
 *       wenn Geld da, 'unpaid' bei async-Methoden (TWINT etc — Phase 2).
 *   - checkout.session.async_payment_succeeded
 *       Verzoegerte Bestaetigung (nicht Karte). Setzt status='paid'.
 *   - checkout.session.expired
 *       Session ist abgelaufen ohne Bezahlung. Order bleibt 'pending' —
 *       Kunde kann Order erneut versuchen. Wir loggen nur.
 *   - charge.refunded
 *       Komplette Rueckerstattung. Setzt status='refunded'.
 *
 * Zusaetzliche Events fuer Phase 1B (Abos):
 *   - checkout.session.completed (mode=subscription)
 *       Stripe hat Subscription erzeugt. Wir setzen subscription.status='active',
 *       speichern stripe_subscription_id + stripe_price_id +
 *       stripe_current_period_end. (Order-Update wie bisher.)
 *   - invoice.payment_succeeded
 *       Bei billing_reason='subscription_cycle' (Renewal): wir legen eine
 *       neue Order an, kopieren subscription_items als order_items.
 *       Bei billing_reason='subscription_create' (Initial): skippen wir
 *       — das hat checkout.session.completed schon gemacht.
 *   - customer.subscription.updated
 *       Status-Sync (Stripe-Status → unser Status), current_period_end-Update.
 *   - customer.subscription.deleted
 *       Customer hat im Stripe-Portal gekuendigt. Wir setzen 'cancelled'.
 *   - invoice.payment_failed
 *       Karte abgelehnt. Stripe macht Retries autonom; wir loggen + setzen
 *       subscription.status='past_due' fuer Anzeige im Self-Service.
 *
 * Andere Events: 200 OK + log + skip (sonst retryt Stripe ewig).
 *
 * Idempotenz:
 *   payments.stripe_event_id hat UNIQUE-Partial-Index. Beim Insert mit
 *   ON CONFLICT DO NOTHING wird ein bereits verarbeitetes Event geskippt.
 *
 * Body-Handling:
 *   Stripe-Signatur-Verifikation braucht den RAW-Body (Bytes) — kein
 *   JSON.parse vorher. Wir lesen await req.text().
 *
 * Runtime:
 *   Stripe-SDK braucht Node-Crypto → explizit Node-Runtime statt Edge.
 */

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // ---- 1) Raw-Body + Signature header --------------------------------------
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    console.error("[webhooks/stripe] missing stripe-signature header");
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  // ---- 2) Signatur verifizieren --------------------------------------------
  let event: ReturnType<ReturnType<typeof getStripe>["webhooks"]["constructEvent"]>;
  try {
    event = getStripe().webhooks.constructEvent(
      rawBody,
      signature,
      getStripeWebhookSecret()
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[webhooks/stripe] signature verification failed:", msg);
    // 400 — Stripe wird NICHT retryen bei 4xx (das wollen wir hier auch nicht)
    return NextResponse.json(
      { error: "invalid_signature", details: msg },
      { status: 400 }
    );
  }

  // ---- 3) Event-Type-Dispatch ----------------------------------------------
  const svc = createServiceClient();

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as {
          id: string;
          mode: "payment" | "subscription" | "setup";
          payment_intent: string | null;
          subscription: string | null;
          payment_status: string;
          amount_total: number | null;
          currency: string | null;
          customer: string | null;
          total_details: {
            amount_tax: number | null;
          } | null;
          metadata: Record<string, string> | null;
        };

        // Bei Karte: payment_status='paid' direkt. Bei async-PMs nur beim
        // _succeeded-Event. Wir behandeln beide gleich (status='paid'),
        // unterscheiden in den Logs.
        if (
          event.type === "checkout.session.completed" &&
          session.payment_status !== "paid"
        ) {
          // Async-Methode (TWINT, SOFORT, etc.) — Order bleibt 'pending'
          // bis async_payment_succeeded oder async_payment_failed kommt.
          console.log(
            `[webhooks/stripe] session ${session.id} completed with payment_status=${session.payment_status} — awaiting async confirmation`
          );
          return NextResponse.json({ received: true, action: "awaiting_async" });
        }

        await handlePaymentSucceeded(svc, event.id, session);
        return NextResponse.json({ received: true, action: "marked_paid" });
      }

      case "checkout.session.expired": {
        const session = event.data.object as { id: string };
        console.log(
          `[webhooks/stripe] session ${session.id} expired — order stays pending`
        );
        return NextResponse.json({ received: true, action: "session_expired" });
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object as {
          id: string;
          metadata: Record<string, string> | null;
        };
        await handlePaymentFailed(svc, event.id, session.id);
        return NextResponse.json({ received: true, action: "marked_failed" });
      }

      case "charge.refunded": {
        const charge = event.data.object as {
          id: string;
          payment_intent: string | null;
          amount_refunded: number;
          amount: number;
        };
        await handleRefund(svc, event.id, charge);
        return NextResponse.json({ received: true, action: "marked_refunded" });
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as unknown as InvoiceEventPayload;
        await handleInvoicePaid(svc, event.id, invoice);
        return NextResponse.json({
          received: true,
          action: "invoice_processed",
        });
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as unknown as InvoiceEventPayload;
        await handleInvoiceFailed(svc, event.id, invoice);
        return NextResponse.json({
          received: true,
          action: "invoice_marked_failed",
        });
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as unknown as SubscriptionEventPayload;
        await handleSubscriptionUpdated(svc, event.id, sub);
        return NextResponse.json({
          received: true,
          action: "subscription_synced",
        });
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as unknown as SubscriptionEventPayload;
        await handleSubscriptionDeleted(svc, event.id, sub);
        return NextResponse.json({
          received: true,
          action: "subscription_cancelled",
        });
      }

      default: {
        // Andere Event-Types ignorieren wir bewusst — aber 200 OK damit
        // Stripe nicht retryt.
        console.log(`[webhooks/stripe] unhandled event type: ${event.type}`);
        return NextResponse.json({ received: true, action: "ignored" });
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[webhooks/stripe] handler error for ${event.type}:`, msg);
    // 500 → Stripe retryt mit Backoff (1h, 6h, 24h…). Das wollen wir wenn
    // ein transienter DB-Fehler war.
    return NextResponse.json(
      { error: "handler_failed", event_type: event.type, details: msg },
      { status: 500 }
    );
  }
}

// ===========================================================================
// Handler: Zahlung erfolgreich
// ===========================================================================
async function handlePaymentSucceeded(
  svc: ReturnType<typeof createServiceClient>,
  eventId: string,
  session: {
    id: string;
    mode: "payment" | "subscription" | "setup";
    payment_intent: string | null;
    subscription: string | null;
    amount_total: number | null;
    currency: string | null;
    customer: string | null;
    total_details: { amount_tax: number | null } | null;
    metadata: Record<string, string> | null;
  }
) {
  // Idempotenz-Check via payments-Insert mit ON CONFLICT DO NOTHING.
  // Wir versuchen den Insert zuerst — wenn dieser Event schon mal kam,
  // gibt unique-constraint stripe_event_id einen Konflikt → wir
  // brechen ab ohne erneuten Order-Update.
  //
  // Wir brauchen ein paar Felder (customer_id, order_id) vor dem Insert.

  const orderId = session.metadata?.order_id;
  if (!orderId) {
    throw new Error(
      `session ${session.id} hat keine order_id im metadata — kann Order nicht finden`
    );
  }

  // Order + Customer laden
  const { data: order, error: oErr } = await svc
    .from("orders")
    .select("id, status, customer_id, total_chf")
    .eq("id", orderId)
    .maybeSingle();

  if (oErr) throw new Error(`order lookup failed: ${oErr.message}`);
  if (!order) throw new Error(`order ${orderId} not found`);

  // Idempotenz: existiert bereits ein payments-Record mit dieser stripe_event_id?
  // Wenn ja, war's ein Retry — skip.
  const { data: existingPayment } = await svc
    .from("payments")
    .select("id")
    .eq("stripe_event_id", eventId)
    .maybeSingle();

  if (existingPayment) {
    console.log(
      `[webhooks/stripe] event ${eventId} already processed — skipping`
    );
    return;
  }

  const amountTotalChf = session.amount_total
    ? Number((session.amount_total / 100).toFixed(2))
    : Number(order.total_chf);
  const amountTaxChf = session.total_details?.amount_tax
    ? Number((session.total_details.amount_tax / 100).toFixed(2))
    : 0;

  // Order auf 'paid' setzen — nur wenn noch 'pending' ist (verhindert
  // unbeabsichtigtes Zurueckdrehen).
  if (order.status === "pending") {
    const { error: updErr } = await svc
      .from("orders")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        stripe_payment_intent_id: session.payment_intent,
        // Stripe Tax (wenn aktiv) liefert tax-betrag → schreiben.
        // Bei deaktivierter automatic_tax bleibt amountTaxChf = 0.
        tax_chf: amountTaxChf,
        // total_chf neu setzen mit dem WIRKLICH gezahlten Betrag von Stripe
        // (sollte mit unserem Provisional uebereinstimmen, aber sicher ist sicher).
        total_chf: amountTotalChf,
      })
      .eq("id", order.id);

    if (updErr) {
      throw new Error(`order update failed: ${updErr.message}`);
    }
  } else {
    console.log(
      `[webhooks/stripe] order ${order.id} status='${order.status}' — kein Update`
    );
  }

  // Payments-Record anlegen — UNIQUE-Constraint auf stripe_event_id ist
  // unser zweiter Idempotenz-Schutz (falls zwei Webhooks gleichzeitig
  // ankommen). Plus UNIQUE(provider, provider_payment_id) als dritter.
  const { error: pErr } = await svc.from("payments").insert({
    customer_id: order.customer_id,
    order_id: order.id,
    stripe_event_id: eventId,
    provider: "stripe",
    provider_payment_id: session.payment_intent,
    provider_customer_id: session.customer,
    // Phase 1A: nur Karte erlaubt (siehe payment_method_types in C-4).
    // Wenn wir spaeter Apple/Google Pay differenzieren wollen, kommt das
    // aus payment_intent.payment_method_types.
    payment_method: "card",
    amount_chf: amountTotalChf,
    currency: "CHF",
    status: "succeeded",
    succeeded_at: new Date().toISOString(),
    provider_payload: {
      session_id: session.id,
      amount_total: session.amount_total,
      currency: session.currency,
      amount_tax: session.total_details?.amount_tax ?? null,
    },
  });

  if (pErr) {
    // 23505 = unique_violation. Kann von zwei Constraints kommen:
    //   - stripe_event_id (gleicher Event 2x)
    //   - (provider, provider_payment_id) (gleicher PI 2x — z.B. retry nach
    //     async_payment_succeeded plus checkout.session.completed)
    // Beides ist eine erfolgreich abgewehrte Doppel-Verarbeitung → OK.
    if (pErr.code === "23505") {
      console.log(
        `[webhooks/stripe] event ${eventId} blocked by unique-constraint — race ok`
      );
      return;
    }
    throw new Error(`payments insert failed: ${pErr.message}`);
  }

  console.log(
    `[webhooks/stripe] ✓ event ${eventId} → order ${order.id} marked paid (CHF ${amountTotalChf})`
  );

  // ---- Subscription-Activation (nur bei mode=subscription) ----------------
  // Wenn die Session ein Abo erzeugt hat, holen wir die Stripe-Subscription
  // ab und aktivieren unseren DB-Record.
  if (session.mode === "subscription" && session.subscription) {
    const subscriptionUuid = session.metadata?.subscription_id;
    if (!subscriptionUuid) {
      console.error(
        `[webhooks/stripe] session ${session.id} mode=subscription but no metadata.subscription_id — skipping subscription activation`
      );
      return;
    }
    await activateSubscription(svc, subscriptionUuid, session.subscription);
  }
}

// ===========================================================================
// Helper: Stripe-Subscription abrufen, unsere DB-Subscription aktivieren
// ===========================================================================
async function activateSubscription(
  svc: ReturnType<typeof createServiceClient>,
  ourSubscriptionUuid: string,
  stripeSubscriptionId: string
) {
  // Stripe-Subscription holen — daraus brauchen wir current_period_end und
  // die Price-ID (vom ersten recurring Item, das das Abo definiert).
  const stripe = getStripe();
  const sub = (await stripe.subscriptions.retrieve(
    stripeSubscriptionId
  )) as unknown as {
    id: string;
    current_period_end: number | null;
    items: {
      data: Array<{
        price: { id: string; recurring: unknown };
        current_period_end?: number | null;
      }>;
    };
  };

  // Erstes recurring price → das ist der Abo-Coffee. Versand-line_item ist
  // auch recurring, kommt aber als zweites. Wir nehmen das erste mit
  // Coffee-Bezug (price_data.product_data.metadata.is_subscription_item=true).
  // Vereinfachung fuer jetzt: ersten Item nehmen (Versand wuerde sonst
  // ausgeschlossen, aber im Pricing-Snapshot der Subscription wollen wir
  // den Coffee-Price, nicht den Versand-Price).
  const stripePriceId = sub.items?.data?.[0]?.price?.id ?? null;

  // current_period_end: ab Stripe-API-Version 2024-09-30 ist das Feld auf
  // der Top-Level Subscription deprecated und liegt auf den Items. Wir
  // probieren beide Stellen, top-level zuerst (alte SDKs), dann Item-Level.
  const periodEndUnix =
    sub.current_period_end ??
    sub.items?.data?.[0]?.current_period_end ??
    null;
  const periodEnd = periodEndUnix
    ? new Date(periodEndUnix * 1000).toISOString()
    : null;

  const { data: ourSub, error: fetchErr } = await svc
    .from("subscriptions")
    .select("id, status")
    .eq("id", ourSubscriptionUuid)
    .maybeSingle();

  if (fetchErr) {
    throw new Error(`subscription lookup failed: ${fetchErr.message}`);
  }
  if (!ourSub) {
    console.error(
      `[webhooks/stripe] subscription ${ourSubscriptionUuid} not found — cannot activate`
    );
    return;
  }

  // Nur aktivieren wenn noch 'pending' — verhindert Zurueckdrehen von
  // bereits paused/cancelled Subscriptions wenn altes Event nachkommt.
  if (ourSub.status !== "pending") {
    console.log(
      `[webhooks/stripe] subscription ${ourSubscriptionUuid} status='${ourSub.status}' — kein activate`
    );
    return;
  }

  const { error: updErr } = await svc
    .from("subscriptions")
    .update({
      status: "active",
      stripe_subscription_id: stripeSubscriptionId,
      stripe_price_id: stripePriceId,
      stripe_current_period_end: periodEnd,
    })
    .eq("id", ourSubscriptionUuid);

  if (updErr) {
    throw new Error(`subscription activate failed: ${updErr.message}`);
  }

  console.log(
    `[webhooks/stripe] ✓ subscription ${ourSubscriptionUuid} → active (stripe:${stripeSubscriptionId})`
  );
}

// ===========================================================================
// Handler: Async-Zahlung fehlgeschlagen (TWINT abgelehnt etc.)
// ===========================================================================
async function handlePaymentFailed(
  svc: ReturnType<typeof createServiceClient>,
  eventId: string,
  sessionId: string
) {
  const { data: order } = await svc
    .from("orders")
    .select("id, status")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();

  if (!order) {
    console.log(
      `[webhooks/stripe] async_payment_failed but no order for session ${sessionId}`
    );
    return;
  }

  if (order.status === "pending") {
    await svc
      .from("orders")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", order.id);
  }

  console.log(
    `[webhooks/stripe] event ${eventId} → order ${order.id} marked cancelled (async payment failed)`
  );
}

// ===========================================================================
// Handler: Refund
// ===========================================================================
async function handleRefund(
  svc: ReturnType<typeof createServiceClient>,
  eventId: string,
  charge: {
    payment_intent: string | null;
    amount_refunded: number;
    amount: number;
  }
) {
  if (!charge.payment_intent) {
    console.log(
      `[webhooks/stripe] charge.refunded but no payment_intent — skipping`
    );
    return;
  }

  // Lookup Order via stripe_payment_intent_id (denormalisiert in C-1)
  const { data: order } = await svc
    .from("orders")
    .select("id, status")
    .eq("stripe_payment_intent_id", charge.payment_intent)
    .maybeSingle();

  if (!order) {
    console.log(
      `[webhooks/stripe] refund event for unknown pi ${charge.payment_intent}`
    );
    return;
  }

  // Voll-Refund vs Teil-Refund
  const isFullRefund = charge.amount_refunded >= charge.amount;
  if (isFullRefund && order.status !== "refunded") {
    await svc
      .from("orders")
      .update({ status: "refunded" })
      .eq("id", order.id);
    console.log(
      `[webhooks/stripe] event ${eventId} → order ${order.id} marked refunded (full)`
    );
  } else {
    // Teil-Refund: Status bleibt 'paid', wir loggen nur. Spaeter koennten
    // wir einen partial-refund-Status einbauen.
    console.log(
      `[webhooks/stripe] event ${eventId} → order ${order.id} partial refund (${charge.amount_refunded}/${charge.amount}) — kein Status-Change`
    );
  }
}

// ===========================================================================
// Type-Helper fuer Stripe-Event-Payloads (nur die Felder die wir nutzen)
// ===========================================================================
type InvoiceEventPayload = {
  id: string;
  subscription: string | null;
  billing_reason:
    | "subscription_create"
    | "subscription_cycle"
    | "subscription_update"
    | "subscription_threshold"
    | "manual"
    | "upcoming"
    | string
    | null;
  amount_paid: number | null;
  amount_due: number | null;
  currency: string | null;
  customer: string | null;
  payment_intent: string | null;
  hosted_invoice_url: string | null;
  created: number; // unix sec
  lines: {
    data: Array<{
      amount: number;
      quantity: number | null;
      description: string | null;
      price: {
        id: string;
        unit_amount: number | null;
        recurring: { interval: string; interval_count: number } | null;
        product: string | null;
      } | null;
    }>;
  };
};

type SubscriptionEventPayload = {
  id: string; // stripe sub id (sub_xxx)
  status: string; // 'active' | 'past_due' | 'canceled' | ...
  current_period_end: number | null; // unix sec — deprecated ab API 2024-09-30
  items?: {
    data: Array<{ current_period_end?: number | null }>;
  };
  cancel_at_period_end: boolean;
  canceled_at: number | null;
};

// ===========================================================================
// Handler: invoice.payment_succeeded — Renewal-Orders anlegen
// ===========================================================================
async function handleInvoicePaid(
  svc: ReturnType<typeof createServiceClient>,
  eventId: string,
  invoice: InvoiceEventPayload
) {
  // Bei Initial-Subscription kommt das Event ein zweites Mal nach
  // checkout.session.completed. Wir wollen NICHT eine zweite Order anlegen.
  if (invoice.billing_reason === "subscription_create") {
    console.log(
      `[webhooks/stripe] invoice ${invoice.id} billing_reason=subscription_create — skip (initial handled by checkout.session.completed)`
    );
    return;
  }
  // Nur Renewal-Charges machen Action — andere billing_reasons (manual,
  // upcoming, threshold) ignorieren wir vorerst.
  if (invoice.billing_reason !== "subscription_cycle") {
    console.log(
      `[webhooks/stripe] invoice ${invoice.id} billing_reason=${invoice.billing_reason} — ignored`
    );
    return;
  }
  if (!invoice.subscription) {
    console.log(
      `[webhooks/stripe] invoice ${invoice.id} ohne subscription — skip`
    );
    return;
  }

  // Idempotenz-Check: gibt es schon einen payments-Record fuer diesen Event?
  const { data: existingPayment } = await svc
    .from("payments")
    .select("id")
    .eq("stripe_event_id", eventId)
    .maybeSingle();
  if (existingPayment) {
    console.log(
      `[webhooks/stripe] event ${eventId} already processed — skipping`
    );
    return;
  }

  // Unsere Subscription via stripe_subscription_id finden
  const { data: ourSub, error: subErr } = await svc
    .from("subscriptions")
    .select("id, customer_id, shipping_address_id, billing_address_id, price_chf_per_delivery, shipping_chf, interval_weeks, status, discount_percent")
    .eq("stripe_subscription_id", invoice.subscription)
    .maybeSingle();

  if (subErr) {
    throw new Error(`subscription lookup failed: ${subErr.message}`);
  }
  if (!ourSub) {
    console.error(
      `[webhooks/stripe] no subscription for stripe_subscription_id=${invoice.subscription} — abort renewal`
    );
    return;
  }

  // Subscription-Items laden (welche Coffees in welchen Mengen)
  const { data: subItems, error: siErr } = await svc
    .from("subscription_items")
    .select("coffee_id, quantity, weight_g, coffee:coffees(name, roast_level, roaster:roasters(name))")
    .eq("subscription_id", ourSub.id);

  if (siErr || !subItems || subItems.length === 0) {
    throw new Error(
      `subscription_items load failed: ${siErr?.message ?? "empty"}`
    );
  }

  // Shipping-Adresse aus subscription (vom Initial-Snapshot)
  const { data: shipAddr } = await svc
    .from("customer_addresses")
    .select("recipient_name, company, street, street_additional, postal_code, city, region, country, delivery_instructions")
    .eq("id", ourSub.shipping_address_id)
    .maybeSingle();
  const { data: billAddr } = await svc
    .from("customer_addresses")
    .select("recipient_name, company, street, street_additional, postal_code, city, region, country, delivery_instructions")
    .eq("id", ourSub.billing_address_id)
    .maybeSingle();

  const totalChf = invoice.amount_paid
    ? Number((invoice.amount_paid / 100).toFixed(2))
    : Number(ourSub.price_chf_per_delivery) + Number(ourSub.shipping_chf);
  const subtotalChf = Number(ourSub.price_chf_per_delivery);
  const shippingChf = Number(ourSub.shipping_chf);

  // Renewal-Order anlegen mit subscription_id gesetzt (dieser FK
  // unterscheidet Renewal-Orders von Initial-Orders)
  const { data: order, error: oErr } = await svc
    .from("orders")
    .insert({
      customer_id: ourSub.customer_id,
      subscription_id: ourSub.id,
      status: "paid", // Stripe hat Geld erfolgreich eingezogen
      paid_at: new Date(invoice.created * 1000).toISOString(),
      shipping_address_id: ourSub.shipping_address_id,
      billing_address_id: ourSub.billing_address_id,
      shipping_address_snapshot: shipAddr,
      billing_address_snapshot: billAddr,
      subtotal_chf: subtotalChf,
      shipping_chf: shippingChf,
      discount_chf: 0,
      tax_chf: 0,
      total_chf: totalChf,
      language: "de-CH", // Renewal: kein Customer-Sprachen-Update, default
      stripe_payment_intent_id: invoice.payment_intent,
    })
    .select("id, order_number")
    .single();

  if (oErr || !order) {
    throw new Error(`renewal order insert failed: ${oErr?.message ?? "unknown"}`);
  }

  // order_items aus subscription_items kopieren. Discounted-Preis vom
  // Subscription-Snapshot — falls Items.quantity > 1 verteilen wir
  // price_chf_per_delivery anteilig nach Gewicht.
  const totalWeightG = subItems.reduce(
    (s, si) => s + si.weight_g * si.quantity,
    0
  );
  const orderItemsToInsert = subItems.map((si) => {
    const itemWeightG = si.weight_g * si.quantity;
    const itemSubtotal =
      totalWeightG > 0
        ? Number(
            (
              Number(ourSub.price_chf_per_delivery) *
              (itemWeightG / totalWeightG)
            ).toFixed(2)
          )
        : Number(ourSub.price_chf_per_delivery);
    const unitPrice = Number((itemSubtotal / si.quantity).toFixed(2));
    const coffeeRel = si.coffee as unknown as {
      name: string;
      roast_level: string | null;
      roaster: { name: string } | null;
    } | null;
    return {
      order_id: order.id,
      coffee_id: si.coffee_id,
      coffee_name_snapshot: coffeeRel?.name ?? "Coffee",
      roaster_name_snapshot: coffeeRel?.roaster?.name ?? "",
      roast_level_snapshot: coffeeRel?.roast_level ?? null,
      quantity: si.quantity,
      weight_g: si.weight_g,
      unit_price_chf: unitPrice,
      line_total_chf: Number((unitPrice * si.quantity).toFixed(2)),
      grind_preference: null,
      is_subscription_item: true,
    };
  });

  const { error: itemsErr } = await svc
    .from("order_items")
    .insert(orderItemsToInsert);

  if (itemsErr) {
    // Cleanup: Order ohne items waere schmutzig
    await svc.from("orders").delete().eq("id", order.id);
    throw new Error(
      `renewal order_items insert failed: ${itemsErr.message}`
    );
  }

  // payments-Record fuer Idempotenz + Audit
  const { error: pErr } = await svc.from("payments").insert({
    customer_id: ourSub.customer_id,
    order_id: order.id,
    stripe_event_id: eventId,
    provider: "stripe",
    provider_payment_id: invoice.payment_intent,
    provider_customer_id: invoice.customer,
    payment_method: "card",
    amount_chf: totalChf,
    currency: "CHF",
    status: "succeeded",
    succeeded_at: new Date(invoice.created * 1000).toISOString(),
    provider_payload: {
      invoice_id: invoice.id,
      subscription_id: invoice.subscription,
      billing_reason: invoice.billing_reason,
      amount_paid: invoice.amount_paid,
      hosted_invoice_url: invoice.hosted_invoice_url,
    },
  });

  if (pErr && pErr.code !== "23505") {
    throw new Error(`renewal payments insert failed: ${pErr.message}`);
  }

  console.log(
    `[webhooks/stripe] ✓ renewal order ${order.order_number} angelegt fuer subscription ${ourSub.id} (CHF ${totalChf})`
  );
}

// ===========================================================================
// Handler: invoice.payment_failed — Karte abgelehnt bei Renewal
// ===========================================================================
async function handleInvoiceFailed(
  svc: ReturnType<typeof createServiceClient>,
  eventId: string,
  invoice: InvoiceEventPayload
) {
  if (!invoice.subscription) {
    console.log(
      `[webhooks/stripe] invoice ${invoice.id} failed but no subscription — ignored`
    );
    return;
  }

  // Stripe macht Retries autonom (default: 3x ueber 3 Wochen). Wir setzen
  // unseren Status auf 'past_due' fuer Sichtbarkeit im Self-Service (P1B-7).
  // Wenn Stripe finally aufgibt, kommt customer.subscription.deleted und
  // wir setzen 'cancelled'.
  const { error } = await svc
    .from("subscriptions")
    .update({ status: "past_due" })
    .eq("stripe_subscription_id", invoice.subscription)
    .eq("status", "active"); // nur von active auf past_due, nicht von cancelled etc.

  if (error) {
    throw new Error(`subscription past_due update failed: ${error.message}`);
  }

  console.log(
    `[webhooks/stripe] event ${eventId} → subscription (stripe:${invoice.subscription}) marked past_due`
  );
}

// ===========================================================================
// Handler: customer.subscription.updated — Lifecycle-Sync
// ===========================================================================
async function handleSubscriptionUpdated(
  svc: ReturnType<typeof createServiceClient>,
  eventId: string,
  sub: SubscriptionEventPayload
) {
  // Stripe-Status → unser Status mappen.
  // Stripe: active, past_due, unpaid, canceled, incomplete, incomplete_expired,
  //         trialing, paused
  // Wir:    pending, active, paused, cancelled, completed, past_due
  let ourStatus: string | null = null;
  switch (sub.status) {
    case "active":
      ourStatus = "active";
      break;
    case "past_due":
    case "unpaid":
      ourStatus = "past_due";
      break;
    case "canceled":
      ourStatus = "cancelled";
      break;
    case "paused":
      ourStatus = "paused";
      break;
    default:
      // incomplete/trialing/etc — nicht relevant fuer uns, kein DB-Update
      ourStatus = null;
  }

  // current_period_end: top-level zuerst (alte API), dann Item-Level
  // (ab Stripe-API 2024-09-30 dort).
  const periodEndUnix =
    sub.current_period_end ??
    sub.items?.data?.[0]?.current_period_end ??
    null;
  const periodEnd = periodEndUnix
    ? new Date(periodEndUnix * 1000).toISOString()
    : null;

  const updates: Record<string, unknown> = {};
  if (ourStatus) updates.status = ourStatus;
  if (periodEnd) updates.stripe_current_period_end = periodEnd;
  if (sub.canceled_at) {
    updates.cancelled_at = new Date(sub.canceled_at * 1000).toISOString();
  }

  if (Object.keys(updates).length === 0) {
    console.log(
      `[webhooks/stripe] event ${eventId} subscription updated, no relevant fields`
    );
    return;
  }

  const { error } = await svc
    .from("subscriptions")
    .update(updates)
    .eq("stripe_subscription_id", sub.id);

  if (error) {
    throw new Error(`subscription update failed: ${error.message}`);
  }

  console.log(
    `[webhooks/stripe] event ${eventId} → subscription (stripe:${sub.id}) synced (${Object.keys(updates).join(",")})`
  );
}

// ===========================================================================
// Handler: customer.subscription.deleted — Final-Kuendigung
// ===========================================================================
async function handleSubscriptionDeleted(
  svc: ReturnType<typeof createServiceClient>,
  eventId: string,
  sub: SubscriptionEventPayload
) {
  const { error } = await svc
    .from("subscriptions")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", sub.id)
    .neq("status", "cancelled"); // idempotent

  if (error) {
    throw new Error(`subscription delete-sync failed: ${error.message}`);
  }

  console.log(
    `[webhooks/stripe] event ${eventId} → subscription (stripe:${sub.id}) cancelled`
  );
}
