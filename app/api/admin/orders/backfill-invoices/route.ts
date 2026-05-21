import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin/auth";
import { refreshAdminReauthCookie } from "@/lib/admin/reauth";
import { createServiceClient } from "@/lib/supabase/service";
import { getStripe } from "@/lib/stripe";

/**
 * Einmal-Backfill: laeuft alle Orders durch, die status='paid' aber
 * stripe_invoice_url=NULL haben (Orders aus der Zeit BEVOR PR C deployed
 * wurde), und holt die fehlende URL via Stripe-API:
 *
 *   - One-time-Order (subscription_id null):
 *       stripe_payment_intent_id -> PaymentIntent -> latest_charge.receipt_url
 *   - Subscription-Order (subscription_id gesetzt):
 *       subscriptions.stripe_subscription_id -> list invoices for that
 *       subscription, picke die invoice deren created-Timestamp am
 *       naehesten an order.placed_at liegt.
 *
 * Idempotent: ueberspringt Orders die bereits eine URL haben oder fuer
 * die Stripe nichts liefert. Logged Erfolge + Fehler.
 *
 * Aufruf: POST /api/admin/orders/backfill-invoices
 * Body: optional { limit: number } (default 50)
 */
export async function POST(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await refreshAdminReauthCookie())) {
    return NextResponse.json({ error: "reauth_required" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const limit = Math.min(Math.max(Number(body?.limit) || 50, 1), 500);

  const svc = createServiceClient();
  const stripe = getStripe();

  const { data: orders } = await svc
    .from("orders")
    .select(
      "id, order_number, placed_at, status, subscription_id, stripe_payment_intent_id, subscription:subscriptions(stripe_subscription_id)"
    )
    .eq("status", "paid")
    .is("stripe_invoice_url", null)
    .order("placed_at", { ascending: false })
    .limit(limit);

  type Row = {
    id: string;
    order_number: string;
    placed_at: string;
    subscription_id: string | null;
    stripe_payment_intent_id: string | null;
    subscription:
      | { stripe_subscription_id: string | null }
      | { stripe_subscription_id: string | null }[]
      | null;
  };

  const results: { order: string; status: string; url?: string; error?: string }[] = [];
  for (const o of ((orders ?? []) as unknown as Row[])) {
    try {
      let url: string | null = null;
      if (!o.subscription_id) {
        // One-time
        if (!o.stripe_payment_intent_id) {
          results.push({ order: o.order_number, status: "skip_no_pi" });
          continue;
        }
        const pi = await stripe.paymentIntents.retrieve(o.stripe_payment_intent_id, {
          expand: ["latest_charge"],
        });
        const charge = pi.latest_charge as
          | { receipt_url?: string | null }
          | string
          | null;
        if (charge && typeof charge === "object" && charge.receipt_url) {
          url = charge.receipt_url;
        }
      } else {
        // Subscription: hole stripe_subscription_id und liste Invoices
        const sub = Array.isArray(o.subscription) ? o.subscription[0] : o.subscription;
        const stripeSubId = sub?.stripe_subscription_id;
        if (!stripeSubId) {
          results.push({ order: o.order_number, status: "skip_no_sub" });
          continue;
        }
        const invoices = await stripe.invoices.list({
          subscription: stripeSubId,
          limit: 50,
        });
        // Naechstgelegene Invoice zum order.placed_at
        const orderTime = new Date(o.placed_at).getTime();
        let best: { url: string | null; diff: number } = { url: null, diff: Infinity };
        for (const inv of invoices.data) {
          const t = inv.created * 1000;
          const diff = Math.abs(t - orderTime);
          if (diff < best.diff && inv.hosted_invoice_url) {
            best = { url: inv.hosted_invoice_url, diff };
          }
        }
        url = best.url;
      }

      if (!url) {
        results.push({ order: o.order_number, status: "no_url_found" });
        continue;
      }

      const { error: updErr } = await svc
        .from("orders")
        .update({ stripe_invoice_url: url })
        .eq("id", o.id);
      if (updErr) {
        results.push({ order: o.order_number, status: "update_failed", error: updErr.message });
        continue;
      }
      results.push({ order: o.order_number, status: "ok", url });
    } catch (e) {
      results.push({
        order: o.order_number,
        status: "stripe_error",
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const summary = {
    processed: results.length,
    ok: results.filter((r) => r.status === "ok").length,
    skipped: results.filter((r) => r.status.startsWith("skip") || r.status === "no_url_found")
      .length,
    failed: results.filter((r) => r.status === "stripe_error" || r.status === "update_failed")
      .length,
  };

  return NextResponse.json({ summary, results });
}
