import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin/auth";
import { refreshAdminReauthCookie } from "@/lib/admin/reauth";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * POST /api/admin/customers/[id]/credit
 *
 * Manuelle Gutschrift fuer einen Customer (Admin-Aktion). Wird als
 * positive customer_credits-Zeile gebucht, Customer kann den Saldo
 * beim naechsten Checkout anwenden.
 *
 * Wenn campaign_code mitgegeben wird, wird er versucht in
 * marketing_campaigns aufzuloesen → Eintrag mit campaign_id gespeichert
 * (fuer's Reporting). Sonst nur freitext-reason.
 */

const BodySchema = z.object({
  amount_chf: z.number().positive(),
  reason: z.string().min(1).max(200),
  campaign_code: z.string().max(64).nullable().optional(),
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
  const { id: customerId } = await ctx.params;

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

  // Customer existiert + nicht geloescht
  const { data: customer } = await svc
    .from("customers")
    .select("id, deleted_at")
    .eq("id", customerId)
    .maybeSingle();
  if (!customer) {
    return NextResponse.json({ error: "customer_not_found" }, { status: 404 });
  }
  if (customer.deleted_at) {
    return NextResponse.json(
      { error: "customer_deleted" },
      { status: 400 }
    );
  }

  // Campaign-Code optional aufloesen
  let campaignId: string | null = null;
  if (parsed.data.campaign_code) {
    const { data: camp } = await svc
      .from("marketing_campaigns")
      .select("id")
      .eq("code", parsed.data.campaign_code.toUpperCase())
      .maybeSingle();
    campaignId = camp?.id ?? null;
  }

  const { error } = await svc.from("customer_credits").insert({
    customer_id: customerId,
    amount_chf: parsed.data.amount_chf,
    reason: "admin_grant",
    description: parsed.data.reason,
    campaign_id: campaignId,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
