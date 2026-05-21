import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { syncResendNewsletterOptIn } from "@/lib/email/audience";

const BodySchema = z.object({
  notify_shipping: z.boolean().optional(),
  notify_recommendations: z.boolean().optional(),
  marketing_opt_in: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  const sb = await createClient();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", details: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }

  // Vor dem Update: aktuellen marketing_opt_in lesen, damit wir den
  // Resend-Sync NUR bei tatsaechlicher Aenderung triggern.
  const { data: before } = await sb
    .from("customers")
    .select("marketing_opt_in, first_name, last_name, email")
    .eq("auth_user_id", auth.user.id)
    .single();

  const { error } = await sb
    .from("customers")
    .update(parsed.data)
    .eq("auth_user_id", auth.user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Newsletter-Sync mit Resend bei Wechsel des marketing_opt_in
  if (
    parsed.data.marketing_opt_in != null &&
    before &&
    parsed.data.marketing_opt_in !== before.marketing_opt_in
  ) {
    const result = await syncResendNewsletterOptIn(
      before.email,
      parsed.data.marketing_opt_in,
      { firstName: before.first_name, lastName: before.last_name }
    );
    if (!result.ok && result.reason !== "no_audience_configured") {
      // Nicht fatal: User-Wunsch ist persistiert, Resend-Sync hatte ein
      // Problem — Marketing-Team kann manuell nachsteuern.
      console.warn("[api/notifications] Resend-Sync soft-failed:", result.reason);
    }
  }

  return NextResponse.json({ ok: true });
}
