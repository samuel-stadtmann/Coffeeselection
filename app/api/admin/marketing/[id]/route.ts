import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin/auth";
import { refreshAdminReauthCookie } from "@/lib/admin/reauth";
import { createServiceClient } from "@/lib/supabase/service";

const PatchSchema = z.object({
  category: z
    .enum([
      "social_media",
      "paid_ads",
      "influencer",
      "pr_editorial",
      "event_sponsoring",
      "print",
      "seo_content",
      "email_marketing",
      "other",
    ])
    .optional(),
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  budget_chf: z.number().min(0).optional(),
  spent_chf: z.number().min(0).optional(),
  starts_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  ends_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
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
  const { id } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
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
  const { error } = await svc
    .from("marketing_spend")
    .update(parsed.data)
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

// Soft-Delete: setzt deleted_at. Liste filtert auf is null.
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
  const { error } = await svc
    .from("marketing_spend")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
