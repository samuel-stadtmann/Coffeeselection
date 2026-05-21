import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * P1B-7: GET /api/account/subscriptions
 *
 * Listet die Subscriptions des eingeloggten Customers — inklusive
 * subscription_items (welche Coffees), Shipping-Adresse und letzte
 * Renewal-Order. Output ist die Datenbasis fuer /account/subscription.
 *
 * Auth: muss eingeloggt sein (sonst 401). Filterung: nur eigene
 * Subscriptions via customer_id-Match.
 *
 * Status-Werte die zurueckkommen:
 *   - 'pending'   — Initial-Bezahlung noch nicht durch (sehr selten zu sehen)
 *   - 'active'    — laeuft, naechste Lieferung am stripe_current_period_end
 *   - 'past_due'  — Karte abgelehnt, Stripe retryt
 *   - 'paused'    — User hat pausiert (pause_collection in Stripe)
 *   - 'cancelled' — gekuendigt, keine weiteren Lieferungen
 *   - 'completed' — natuerliches Ende (z.B. Geschenk-Abo nach N Lieferungen)
 */

export async function GET() {
  const supa = await createClient();
  const { data: auth } = await supa.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // Customer-Row fuer diesen Auth-User holen
  const svc = createServiceClient();
  const { data: customer, error: cErr } = await svc
    .from("customers")
    .select("id")
    .eq("auth_user_id", auth.user.id)
    .maybeSingle();
  if (cErr) {
    console.error("[api/account/subscriptions] customer lookup failed", cErr);
    return NextResponse.json(
      { error: "customer_lookup_failed", details: cErr.message },
      { status: 500 }
    );
  }
  if (!customer) {
    return NextResponse.json({ subscriptions: [] });
  }

  // Subscriptions + Items + Adressen + neueste Order ziehen.
  const { data: subs, error: sErr } = await svc
    .from("subscriptions")
    .select(`
      id,
      subscription_type,
      interval_weeks,
      status,
      started_at,
      paused_at,
      cancelled_at,
      next_delivery_on,
      last_delivery_on,
      total_deliveries,
      price_chf_per_delivery,
      shipping_chf,
      discount_percent,
      stripe_subscription_id,
      stripe_current_period_end,
      shipping_address:customer_addresses!subscriptions_shipping_address_id_fkey(recipient_name, street, street_additional, postal_code, city, country),
      items:subscription_items(quantity, weight_g, coffee:coffees(id, name, slug, image_url, roaster:roasters(name)))
    `)
    .eq("customer_id", customer.id)
    .neq("status", "pending") // pending-Abos die nie aktiviert wurden ausblenden
    .order("started_at", { ascending: false });

  if (sErr) {
    console.error("[api/account/subscriptions] list failed", sErr);
    return NextResponse.json(
      { error: "list_failed", details: sErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ subscriptions: subs ?? [] });
}
