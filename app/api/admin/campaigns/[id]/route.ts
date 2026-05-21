import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin/auth";
import { refreshAdminReauthCookie } from "@/lib/admin/reauth";
import { createServiceClient } from "@/lib/supabase/service";

const PatchSchema = z.object({
  active: z.boolean().optional(),
  credit_chf: z.number().positive().optional(),
  max_uses_per_customer: z.number().int().min(1).optional(),
  max_total_uses: z.number().int().min(1).nullable().optional(),
  valid_until: z.string().nullable().optional(),
  channel: z.string().max(40).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
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
  const { id } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", details: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }
  const svc = createServiceClient();
  const { error } = await svc
    .from("marketing_campaigns")
    .update(parsed.data)
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await refreshAdminReauthCookie())) {
    return NextResponse.json({ error: "reauth_required" }, { status: 401 });
  }
  const { id } = await ctx.params;

  const svc = createServiceClient();
  // Bestehende Buchungen referenzieren campaign_id — wir setzen die nicht
  // implicit auf null, sondern blockieren das Loeschen wenn Buchungen
  // existieren. Stattdessen Admin = "Deaktivieren" (active=false).
  const { count } = await svc
    .from("customer_credits")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", id);
  if (count && count > 0) {
    return NextResponse.json(
      {
        error: "has_redemptions",
        details:
          `Diese Kampagne wurde bereits ${count} mal eingelöst. Bitte deaktiviere sie statt zu löschen.`,
      },
      { status: 400 }
    );
  }
  const { error } = await svc
    .from("marketing_campaigns")
    .delete()
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
