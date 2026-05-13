import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getStripe } from "@/lib/stripe";

/**
 * P1B-7: POST /api/account/subscriptions/[id]/action
 *
 * Eine Route fuer alle 3 Abo-Lifecycle-Aktionen — Action im Body.
 * Erspart 3 separate Endpoints. URL-Param ist die UUID unserer
 * Subscriptions-Tabelle (NICHT die Stripe-Subscription-ID).
 *
 * Body: { action: 'pause' | 'resume' | 'cancel' }
 *
 * Sicherheits-Verhalten:
 *   - Auth-Check (eingeloggt)
 *   - Ownership-Check: Subscription muss zum Customer dieses Auth-Users gehoeren
 *   - Stripe-Side: Aenderung via stripe.subscriptions.update()
 *   - DB-Side: Status wird vom Webhook customer.subscription.updated synct.
 *     Wir setzen den Status optimistisch hier schon, falls Webhook
 *     verzoegert kommt. Das fuehrt nicht zu Inkonsistenz weil das Webhook-
 *     Update den gleichen Wert noch einmal setzt.
 *
 * Cancel-Verhalten: SOFORT (nicht period-end). Customer kriegt 0 weitere
 * Lieferungen. Das matched die UX 'Endgueltig kuendigen'. Wer das aendern
 * will: in Stripe portal 'cancel at period end' nutzen.
 */

const BodySchema = z.object({
  action: z.enum(["pause", "resume", "cancel"]),
});

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  // Body
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

  const { id: subUuid } = await ctx.params;

  // Auth
  const supa = await createClient();
  const { data: auth } = await supa.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // Ownership-Check via JOIN customers→subscriptions
  const svc = createServiceClient();
  const { data: customer } = await svc
    .from("customers")
    .select("id")
    .eq("auth_user_id", auth.user.id)
    .maybeSingle();
  if (!customer) {
    return NextResponse.json({ error: "customer_not_found" }, { status: 404 });
  }

  const { data: sub, error: sErr } = await svc
    .from("subscriptions")
    .select("id, customer_id, status, stripe_subscription_id")
    .eq("id", subUuid)
    .maybeSingle();
  if (sErr || !sub) {
    return NextResponse.json(
      { error: "subscription_not_found", details: sErr?.message ?? "unknown" },
      { status: 404 }
    );
  }
  if (sub.customer_id !== customer.id) {
    // Anderer Customer — nicht authorisiert
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!sub.stripe_subscription_id) {
    return NextResponse.json(
      {
        error: "stripe_not_linked",
        details:
          "Abo hat noch keine Stripe-Subscription-ID. Bitte versuche es in ein paar Minuten erneut.",
      },
      { status: 409 }
    );
  }

  const stripe = getStripe();
  try {
    switch (body.action) {
      case "pause": {
        if (sub.status !== "active" && sub.status !== "past_due") {
          return NextResponse.json(
            { error: "wrong_state", current: sub.status },
            { status: 409 }
          );
        }
        await stripe.subscriptions.update(sub.stripe_subscription_id, {
          pause_collection: { behavior: "void" },
        });
        await svc
          .from("subscriptions")
          .update({ status: "paused", paused_at: new Date().toISOString() })
          .eq("id", sub.id);
        return NextResponse.json({ ok: true, status: "paused" });
      }

      case "resume": {
        if (sub.status !== "paused") {
          return NextResponse.json(
            { error: "wrong_state", current: sub.status },
            { status: 409 }
          );
        }
        await stripe.subscriptions.update(sub.stripe_subscription_id, {
          pause_collection: "",
        });
        await svc
          .from("subscriptions")
          .update({ status: "active", paused_at: null })
          .eq("id", sub.id);
        return NextResponse.json({ ok: true, status: "active" });
      }

      case "cancel": {
        if (sub.status === "cancelled") {
          return NextResponse.json(
            { error: "wrong_state", current: sub.status },
            { status: 409 }
          );
        }
        await stripe.subscriptions.cancel(sub.stripe_subscription_id);
        // Webhook customer.subscription.deleted setzt status='cancelled'
        // und triggert die Cancel-Mail. Wir setzen den DB-Status hier
        // schon optimistisch fuer die sofortige UI-Antwort.
        await svc
          .from("subscriptions")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
          })
          .eq("id", sub.id);
        return NextResponse.json({ ok: true, status: "cancelled" });
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(
      `[api/account/subscriptions/${subUuid}/action] stripe ${body.action} failed`,
      err
    );
    return NextResponse.json(
      { error: "stripe_action_failed", details: msg },
      { status: 500 }
    );
  }
}
