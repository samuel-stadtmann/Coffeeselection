import { NextResponse, type NextRequest } from "next/server";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * C-5: POST /api/webhooks/stripe
 *
 * Letzter Baustein in Phase 1A. Hier wird der Kreis geschlossen:
 *   Stripe sendet bei Bezahl-Events einen HTTP-POST an diese Route.
 *   Wir verifizieren die Signatur, finden die Order, setzen status='paid'.
 *
 * Wichtigste Events fuer Phase 1A:
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
          payment_intent: string | null;
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
    payment_intent: string | null;
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
