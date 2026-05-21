import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin/auth";
import { refreshAdminReauthCookie } from "@/lib/admin/reauth";
import { createServiceClient } from "@/lib/supabase/service";
import { getStripe } from "@/lib/stripe";

/**
 * POST /api/admin/subscriptions/[id]/action
 *
 * Admin-Variante des Account-Endpoints — gleiche Stripe-Logik, aber
 * ohne Ownership-Check. Wird vom Admin-Customer-Detail-Page aus
 * gerufen.
 *
 * Body: { action: 'pause' | 'resume' | 'cancel' }
 */

const BodySchema = z.object({
  action: z.enum(["pause", "resume", "cancel"]),
});

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await refreshAdminReauthCookie())) {
    return NextResponse.json({ error: "reauth_required" }, { status: 401 });
  }
  const { id: subUuid } = await ctx.params;

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
  const { data: sub, error: sErr } = await svc
    .from("subscriptions")
    .select("id, status, stripe_subscription_id")
    .eq("id", subUuid)
    .maybeSingle();
  if (sErr || !sub) {
    return NextResponse.json(
      { error: "subscription_not_found", details: sErr?.message ?? "unknown" },
      { status: 404 }
    );
  }
  if (!sub.stripe_subscription_id) {
    return NextResponse.json(
      { error: "stripe_not_linked" },
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
      `[api/admin/subscriptions/${subUuid}/action] stripe ${body.action} failed`,
      err
    );
    return NextResponse.json(
      { error: "stripe_action_failed", details: msg },
      { status: 500 }
    );
  }
}
