import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin/auth";
import { refreshAdminReauthCookie } from "@/lib/admin/reauth";
import { createServiceClient } from "@/lib/supabase/service";

const PatchSchema = z.object({
  first_name: z.string().max(80).nullable().optional(),
  last_name: z.string().max(80).nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
  language: z.enum(["de-CH", "fr-CH", "it-CH", "en"]).optional(),
  marketing_opt_in: z.boolean().optional(),
  notify_shipping: z.boolean().optional(),
  notify_recommendations: z.boolean().optional(),
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
    .from("customers")
    .update(parsed.data)
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Wenn marketing_opt_in geaendert → Resend-Audience syncen.
  if (parsed.data.marketing_opt_in !== undefined) {
    try {
      const { data: cust } = await svc
        .from("customers")
        .select("email, first_name, last_name")
        .eq("id", id)
        .maybeSingle();
      if (cust?.email) {
        const { syncResendNewsletterOptIn } = await import(
          "@/lib/email/audience"
        );
        await syncResendNewsletterOptIn(cust.email, parsed.data.marketing_opt_in, {
          firstName: cust.first_name ?? null,
          lastName: cust.last_name ?? null,
        });
      }
    } catch (e) {
      console.error("[api/admin/customers PATCH] Resend-Sync failed", e);
      // nicht fatal — DB-Update ist durch
    }
  }

  return NextResponse.json({ ok: true });
}

// Soft-Delete + DSGVO-Anonymisierung (gleiche Logik wie das
// User-Self-Delete in /api/account/delete).
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

  // Anonymisieren — Email/Name werden mit Platzhalter ueberschrieben,
  // deleted_at gesetzt. Bestellungen bleiben fuer Buchhaltung erhalten,
  // sind aber nur ueber id verknuepft (kein Klartext-Name mehr).
  const now = new Date().toISOString();
  const anonEmail = `deleted-${id.slice(0, 8)}@coffeeselection.local`;
  const { error } = await svc
    .from("customers")
    .update({
      deleted_at: now,
      email: anonEmail,
      first_name: null,
      last_name: null,
      phone: null,
      marketing_opt_in: false,
      notify_shipping: false,
      notify_recommendations: false,
    })
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
