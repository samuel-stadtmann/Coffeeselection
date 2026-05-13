import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getStripe } from "@/lib/stripe";

/**
 * P1B-7: POST /api/account/portal
 *
 * Erzeugt eine Stripe-Billing-Portal-Session und gibt die URL zurueck.
 * Customer wird dann von der UI dahin redirected — Stripe-Hosted-Page mit:
 *   - Karte aendern
 *   - Rechnungen einsehen
 *   - (je nach Stripe-Portal-Settings: pause/cancel — wir deaktivieren das
 *     dort und nutzen unsere eigenen Buttons fuer bessere UX/Mail-Trigger)
 *
 * Setup-Hinweis: Im Stripe Dashboard unter Settings → Billing → Customer
 * Portal muss das Portal AKTIVIERT sein. Was aktiviert sein soll:
 *   - Update payment methods: JA
 *   - View invoice history: JA
 *   - Cancel subscriptions: NEIN (wir haben eigene Buttons → Webhook-Mail)
 *   - Update subscriptions: NEIN (Plan-Aenderung kommt spaeter via eigener UI)
 *
 * Return_url: wir routen zurueck auf /account/subscription.
 */

export async function POST(req: NextRequest) {
  void req; // body wird nicht gelesen — Endpoint ist parameterlos
  const supa = await createClient();
  const { data: auth } = await supa.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const svc = createServiceClient();
  const { data: customer, error: cErr } = await svc
    .from("customers")
    .select("id, stripe_customer_id")
    .eq("auth_user_id", auth.user.id)
    .maybeSingle();
  if (cErr || !customer) {
    return NextResponse.json(
      { error: "customer_not_found", details: cErr?.message ?? "unknown" },
      { status: 404 }
    );
  }
  if (!customer.stripe_customer_id) {
    // Customer hat noch nie bezahlt → kein Stripe-Customer-Objekt
    return NextResponse.json(
      {
        error: "no_stripe_customer",
        details:
          "Du hast noch keine Bestellung getaetigt. Karten-Verwaltung steht erst nach der ersten Bezahlung zur Verfuegung.",
      },
      { status: 409 }
    );
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://staging.coffeeselection.ch";

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: customer.stripe_customer_id,
      return_url: `${siteUrl}/account/subscription`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[api/account/portal] stripe portal session failed", err);
    return NextResponse.json(
      {
        error: "stripe_portal_failed",
        details:
          "Stripe-Portal konnte nicht erzeugt werden. Pruefe Stripe Dashboard → Settings → Billing → Customer Portal — muss aktiviert sein. " +
          msg,
      },
      { status: 500 }
    );
  }
}
