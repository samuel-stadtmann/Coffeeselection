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

// Soft-Delete + DSGVO-Anonymisierung. IDENTISCH zum User-Self-Delete in
// /api/account/delete — sonst entsteht ein inkonsistenter Zustand:
// anonymisierte customers-Zeile, aber auth.users + auth_user_id-Link
// bleiben → User kann sich mit altem Login anmelden (kaputtes Profil)
// und seine Email ist fuer Neu-Registrierung blockiert.
//
// Reihenfolge: customers.auth_user_id ist ON DELETE SET NULL (Migration
// 20260515180000), d.h. ein Auth-User-Delete wuerde den FK ohnehin nullen
// statt die Zeile zu loeschen. Wir nullen ihn trotzdem explizit (deutlicher
// + unabhaengig von FK-Verhalten), anonymisieren, loeschen Adressen, dann
// den auth.users-Eintrag → Email frei + alter Login tot.
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

  // Customer + auth_user_id + Felder fuer Resend-Opt-Out laden.
  const { data: customer } = await svc
    .from("customers")
    .select("id, auth_user_id, email, first_name, last_name")
    .eq("id", id)
    .maybeSingle();
  if (!customer) {
    return NextResponse.json({ error: "customer_not_found" }, { status: 404 });
  }

  // 1) Resend-Opt-Out (best effort).
  try {
    const { syncResendNewsletterOptIn } = await import("@/lib/email/audience");
    await syncResendNewsletterOptIn(customer.email, false, {
      firstName: customer.first_name ?? null,
      lastName: customer.last_name ?? null,
    });
  } catch (e) {
    console.error("[api/admin/customers DELETE] Resend opt-out failed", e);
  }

  // 2) Anonymisieren + auth_user_id loesen (Cascade-Schutz).
  const now = new Date().toISOString();
  const anonEmail = `deleted-${id}@coffeeselection.invalid`;
  const { error } = await svc
    .from("customers")
    .update({
      auth_user_id: null,
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

  // 3) Adressen loeschen (Snapshot bleibt auf der Order erhalten).
  await svc.from("customer_addresses").delete().eq("customer_id", id);

  // 4) Auth-User loeschen → Email frei fuer Neu-Registrierung + alter
  //    Login funktioniert nicht mehr. Soft-failen wenn kein auth_user_id
  //    (z.B. Gast-Customer ohne Login).
  if (customer.auth_user_id) {
    const { error: delAuthErr } = await svc.auth.admin.deleteUser(
      customer.auth_user_id
    );
    if (delAuthErr) {
      console.error(
        "[api/admin/customers DELETE] auth.admin.deleteUser failed",
        delAuthErr
      );
      // Nicht fatal — customers-Zeile ist schon anonymisiert + entkoppelt.
    }
  }

  return NextResponse.json({ ok: true });
}
