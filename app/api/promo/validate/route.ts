import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { validatePromoCode } from "@/lib/db/rewards";

const BodySchema = z.object({
  code: z.string().min(1).max(64),
});

export async function POST(req: NextRequest) {
  const sb = await createClient();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ valid: false, reason: "auth_required" }, { status: 401 });
  }
  const { data: customer } = await sb
    .from("customers")
    .select("id")
    .eq("auth_user_id", auth.user.id)
    .single();
  if (!customer) {
    return NextResponse.json({ valid: false, reason: "no_customer" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ valid: false, reason: "invalid_body" }, { status: 400 });
  }

  const svc = createServiceClient();
  const result = await validatePromoCode(svc, parsed.data.code, customer.id);
  return NextResponse.json(result);
}
