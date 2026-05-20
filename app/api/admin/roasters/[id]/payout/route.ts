import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin/auth";
import { refreshAdminReauthCookie } from "@/lib/admin/reauth";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * PUT /api/admin/roasters/[id]/payout
 *
 * Upsert der Röster-Auszahlungs-Stammdaten (roasters_payout, 1:1 zu
 * roaster). Bankverbindung + Vertrag. Vertraulich — RLS lässt nur
 * service_role zu, dieser Endpoint ist admin-geschützt.
 */

const BodySchema = z.object({
  bank_account_holder: z.string().max(200).nullable().optional(),
  iban: z.string().max(40).nullable().optional(),
  bic: z.string().max(20).nullable().optional(),
  bank_name: z.string().max(120).nullable().optional(),
  payout_method: z
    .enum(["bank_transfer", "twint", "manual", "none"])
    .default("bank_transfer"),
  payout_currency: z.string().length(3).default("CHF"),
  payout_threshold_chf: z.number().min(0).default(0),
  commission_pct: z.number().min(0).max(100).nullable().optional(),
  contract_start_on: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  contract_end_on: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  contract_notes: z.string().max(2000).nullable().optional(),
});

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await refreshAdminReauthCookie())) {
    return NextResponse.json({ error: "reauth_required" }, { status: 401 });
  }
  const { id: roasterId } = await ctx.params;

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

  // Roaster muss existieren.
  const { data: roaster } = await svc
    .from("roasters")
    .select("id")
    .eq("id", roasterId)
    .maybeSingle();
  if (!roaster) {
    return NextResponse.json({ error: "roaster_not_found" }, { status: 404 });
  }

  // Upsert auf roasters_payout (PK = roaster_id).
  const { error } = await svc
    .from("roasters_payout")
    .upsert(
      { roaster_id: roasterId, ...parsed.data },
      { onConflict: "roaster_id" }
    );
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
