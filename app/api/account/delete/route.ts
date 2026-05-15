import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { syncResendNewsletterOptIn } from "@/lib/email/audience";

/**
 * DSGVO Soft-Delete:
 *   - Personenbezogene Felder am Customer werden anonymisiert
 *     (first_name/last_name -> NULL, email -> deleted-<id>@coffeeselection.invalid,
 *     phone -> NULL, marketing_opt_in -> false, deleted_at -> now())
 *   - Customer-Adressen werden geloescht (Snapshot bleibt auf der Order)
 *   - Order-Historie BLEIBT — wichtig fuer CH-Buchhaltung (10 Jahre)
 *   - Auth-User wird via auth.admin.deleteUser entfernt → User kann sich
 *     nicht mehr einloggen. Wegen ON DELETE CASCADE auf customers.auth_user_id
 *     setzen wir den FK vorher auf NULL, damit der Customer-Datensatz
 *     stehen bleibt.
 *   - Resend wird benachrichtigt: Newsletter-Opt-Out
 */
export async function POST() {
  const sb = await createClient();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  const svc = createServiceClient();

  const { data: customer } = await svc
    .from("customers")
    .select("id, email, first_name, last_name")
    .eq("auth_user_id", auth.user.id)
    .single();

  if (!customer) {
    return NextResponse.json({ error: "no_customer" }, { status: 404 });
  }

  const oldEmail = customer.email;
  const oldFirst = customer.first_name;
  const oldLast = customer.last_name;

  // 1) Resend opt-out (best effort)
  await syncResendNewsletterOptIn(oldEmail, false, {
    firstName: oldFirst,
    lastName: oldLast,
  });

  // 2) Anonymisiere customers-Datensatz, FK auf auth_user_id loesen
  const anonymizedEmail = `deleted-${customer.id}@coffeeselection.invalid`;
  const { error: updErr } = await svc
    .from("customers")
    .update({
      auth_user_id: null,
      email: anonymizedEmail,
      first_name: null,
      last_name: null,
      phone: null,
      marketing_opt_in: false,
      notify_shipping: false,
      notify_recommendations: false,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", customer.id);
  if (updErr) {
    return NextResponse.json(
      { error: "anonymize_failed", details: updErr.message },
      { status: 500 }
    );
  }

  // 3) Customer-Adressen loeschen (Snapshot ist auf der Order persistiert)
  await svc.from("customer_addresses").delete().eq("customer_id", customer.id);

  // 4) Auth-User loeschen
  const { error: delAuthErr } = await svc.auth.admin.deleteUser(auth.user.id);
  if (delAuthErr) {
    // Customer ist schon anonymisiert — Auth-User-Loeschung soft-failen
    console.error("[api/account/delete] auth.admin.deleteUser failed", delAuthErr);
  }

  return NextResponse.json({ ok: true });
}
