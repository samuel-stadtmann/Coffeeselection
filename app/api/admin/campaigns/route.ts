import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin/auth";
import { refreshAdminReauthCookie } from "@/lib/admin/reauth";
import { createServiceClient } from "@/lib/supabase/service";

const BodySchema = z.object({
  code: z.string().min(2).max(32).regex(/^[A-Z0-9_-]+$/, "Code: nur A-Z, 0-9, _, -"),
  name: z.string().min(1).max(120),
  description: z.string().max(500).nullable().optional(),
  credit_chf: z.number().positive(),
  max_uses_per_customer: z.number().int().min(1).default(1),
  max_total_uses: z.number().int().min(1).nullable().optional(),
  valid_until: z.string().nullable().optional(), // ISO date
  channel: z.string().max(40).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", details: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }
  const c = parsed.data;
  const svc = createServiceClient();
  const { data, error } = await svc
    .from("marketing_campaigns")
    .insert({
      code: c.code,
      name: c.name,
      description: c.description ?? null,
      credit_chf: c.credit_chf,
      max_uses_per_customer: c.max_uses_per_customer,
      max_total_uses: c.max_total_uses ?? null,
      valid_until: c.valid_until ?? null,
      channel: c.channel ?? null,
      notes: c.notes ?? null,
      created_by: admin.id,
    })
    .select("id")
    .single();
  if (error) {
    return NextResponse.json(
      { error: error.code === "23505" ? "code_already_exists" : error.message },
      { status: 400 }
    );
  }
  await refreshAdminReauthCookie();
  return NextResponse.json({ ok: true, id: data?.id });
}
