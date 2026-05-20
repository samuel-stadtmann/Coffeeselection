import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin/auth";
import { refreshAdminReauthCookie } from "@/lib/admin/reauth";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * PATCH /api/admin/subscriptions/[id]
 *
 * Updated Intervall + Menge/Gewicht. Wirkt nur auf unsere DB
 * (subscriptions + subscription_items) — Stripe-Subscription bleibt
 * unangetastet (Preis-Schema dort waere ein anderer Vorgang).
 *
 * Body: optional Felder
 *   - interval_weeks: 1 | 2 | 4 | 6 | 8
 *   - quantity:       1..20  (subscription_items.quantity)
 *   - weight_g:       250 | 500 | 1000  (subscription_items.weight_g)
 *
 * Wir updaten den ersten subscription_items-Eintrag (Phase 1B: max 1
 * Coffee pro Abo).
 */

const BodySchema = z.object({
  interval_weeks: z
    .number()
    .int()
    .refine((v) => [1, 2, 4, 6, 8].includes(v), {
      message: "interval_weeks muss 1, 2, 4, 6 oder 8 sein",
    })
    .optional(),
  quantity: z.number().int().min(1).max(20).optional(),
  weight_g: z
    .number()
    .int()
    .refine((v) => [250, 500, 1000].includes(v), {
      message: "weight_g muss 250, 500 oder 1000 sein",
    })
    .optional(),
});

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await refreshAdminReauthCookie())) {
    return NextResponse.json({ error: "reauth_required" }, { status: 401 });
  }
  const { id: subUuid } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid_body",
        details: parsed.error.issues.map((i) => i.message).join(", "),
      },
      { status: 400 }
    );
  }

  const svc = createServiceClient();

  // Intervall geht auf subscriptions, qty/weight auf subscription_items.
  if (parsed.data.interval_weeks != null) {
    const { error } = await svc
      .from("subscriptions")
      .update({ interval_weeks: parsed.data.interval_weeks })
      .eq("id", subUuid);
    if (error) {
      return NextResponse.json(
        { error: "update_failed", details: error.message },
        { status: 400 }
      );
    }
  }

  if (parsed.data.quantity != null || parsed.data.weight_g != null) {
    const itemPatch: Record<string, number> = {};
    if (parsed.data.quantity != null) itemPatch.quantity = parsed.data.quantity;
    if (parsed.data.weight_g != null) itemPatch.weight_g = parsed.data.weight_g;
    // Ersten subscription_items-Eintrag updaten (Phase 1B: max 1 Coffee).
    const { data: items } = await svc
      .from("subscription_items")
      .select("id")
      .eq("subscription_id", subUuid)
      .order("sort_order", { ascending: true })
      .limit(1);
    const itemId = items?.[0]?.id;
    if (itemId) {
      const { error } = await svc
        .from("subscription_items")
        .update(itemPatch)
        .eq("id", itemId);
      if (error) {
        return NextResponse.json(
          { error: "item_update_failed", details: error.message },
          { status: 400 }
        );
      }
    }
    // Falls quantity/weight geaendert: auch quantity_g_per_delivery
    // auf subscriptions nachfuehren (Reporting-Snapshot).
    if (parsed.data.quantity != null && parsed.data.weight_g != null) {
      await svc
        .from("subscriptions")
        .update({
          quantity_g_per_delivery:
            parsed.data.quantity * parsed.data.weight_g,
        })
        .eq("id", subUuid);
    }
  }

  return NextResponse.json({ ok: true });
}
