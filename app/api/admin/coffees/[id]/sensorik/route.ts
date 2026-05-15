import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin/auth";
import { refreshAdminReauthCookie } from "@/lib/admin/reauth";
import { createServiceClient } from "@/lib/supabase/service";

// Eingabewerte 1-10 (Cupping-Standard) -> Speicherung als 1-5 SCA.
// Gleiche Konversion wie in components/coffee-form/CoffeeForm.tsx.
const Axis = z.number().int().min(1).max(10);
const BodySchema = z.object({
  acidity: Axis,
  body: Axis,
  sweetness: Axis,
  bitterness: Axis,
  complexity: Axis,
});

function tenToFive(v: number): number {
  // 1-2 -> 1, 3-4 -> 2, 5-6 -> 3, 7-8 -> 4, 9-10 -> 5
  return Math.max(1, Math.min(5, Math.ceil(v / 2)));
}

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
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", details: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }

  const svc = createServiceClient();
  const { error } = await svc
    .from("coffees")
    .update({
      acidity: tenToFive(parsed.data.acidity),
      body: tenToFive(parsed.data.body),
      sweetness: tenToFive(parsed.data.sweetness),
      bitterness: tenToFive(parsed.data.bitterness),
      complexity: tenToFive(parsed.data.complexity),
    })
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
