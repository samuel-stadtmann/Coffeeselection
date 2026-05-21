import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin/auth";
import { refreshAdminReauthCookie } from "@/lib/admin/reauth";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * PUT /api/admin/customers/[id]/address
 *
 * Upsert der Standard-Lieferadresse (is_default=true, type=shipping).
 * Wenn body.id gesetzt: update. Sonst: insert + alte Defaults
 * auf is_default=false setzen.
 */

const BodySchema = z.object({
  id: z.uuid().nullable().optional(),
  recipient_name: z.string().min(1).max(120),
  company: z.string().max(120).nullable().optional(),
  street: z.string().min(1).max(200),
  street_additional: z.string().max(200).nullable().optional(),
  postal_code: z.string().min(2).max(20),
  city: z.string().min(1).max(120),
  region: z.string().max(80).nullable().optional(),
  country: z
    .string()
    .length(2)
    .regex(/^[A-Z]{2}$/),
  delivery_instructions: z.string().max(500).nullable().optional(),
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
  const { id, ...payload } = parsed.data;
  const addrPayload = {
    customer_id: customerId,
    type: "shipping" as const,
    is_default: true,
    ...payload,
  };

  // Andere shipping-Defaults dieses Customers auf false (UNIQUE partial).
  await svc
    .from("customer_addresses")
    .update({ is_default: false })
    .eq("customer_id", customerId)
    .in("type", ["shipping", "both"])
    .eq("is_default", true);

  if (id) {
    const { error } = await svc
      .from("customer_addresses")
      .update(addrPayload)
      .eq("id", id)
      .eq("customer_id", customerId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true, id });
  }

  const { data, error } = await svc
    .from("customer_addresses")
    .insert(addrPayload)
    .select("id")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, id: data?.id });
}
