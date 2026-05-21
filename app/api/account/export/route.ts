import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * DSGVO Art. 20 Datenexport: gibt alle personenbezogenen Daten des
 * eingeloggten Kunden als JSON-Download zurueck.
 *
 * Inhalte: customers + addresses + orders + order_items + ratings +
 * quiz_responses + quiz_answers + customer_credits + favoriten +
 * referrals (sowohl als Werber als auch als Geworbener).
 *
 * Konsumenten-Hinweis: Stripe-Daten sind hier NICHT enthalten — Stripe
 * ist ein separater Verarbeiter (Privacy Policy verweist darauf).
 */
export async function GET() {
  const sb = await createClient();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }
  const { data: customer } = await sb
    .from("customers")
    .select("*")
    .eq("auth_user_id", auth.user.id)
    .single();
  if (!customer) {
    return NextResponse.json({ error: "no_customer" }, { status: 404 });
  }
  const customerId = customer.id;

  const [
    { data: addresses },
    { data: orders },
    { data: orderItems },
    { data: ratings },
    { data: quizResponses },
    { data: quizAnswers },
    { data: credits },
    { data: favCoffees },
    { data: favRoasters },
    { data: referralsAsReferrer },
    { data: referralsAsReferee },
  ] = await Promise.all([
    sb.from("customer_addresses").select("*").eq("customer_id", customerId),
    sb.from("orders").select("*").eq("customer_id", customerId),
    sb
      .from("order_items")
      .select("*, order:orders!inner(customer_id)")
      .eq("order.customer_id", customerId),
    sb.from("coffee_ratings").select("*").eq("customer_id", customerId),
    sb.from("quiz_responses").select("*").eq("customer_id", customerId),
    sb
      .from("quiz_answers")
      .select("*, response:quiz_responses!inner(customer_id)")
      .eq("response.customer_id", customerId),
    sb.from("customer_credits").select("*").eq("customer_id", customerId),
    sb.from("customer_favorite_coffees").select("*").eq("customer_id", customerId),
    sb.from("customer_favorite_roasters").select("*").eq("customer_id", customerId),
    sb.from("referrals").select("*").eq("referrer_customer_id", customerId),
    sb.from("referrals").select("*").eq("referee_customer_id", customerId),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    customer,
    addresses: addresses ?? [],
    orders: orders ?? [],
    order_items: orderItems ?? [],
    coffee_ratings: ratings ?? [],
    quiz_responses: quizResponses ?? [],
    quiz_answers: quizAnswers ?? [],
    customer_credits: credits ?? [],
    favorite_coffees: favCoffees ?? [],
    favorite_roasters: favRoasters ?? [],
    referrals_as_referrer: referralsAsReferrer ?? [],
    referrals_as_referee: referralsAsReferee ?? [],
    note:
      "Dieser Export enthaelt NICHT: Stripe-Zahlungsdaten (separater Verarbeiter). "
      + "Diese koennen direkt bei Stripe per Self-Service angefordert werden.",
  };

  const filename = `coffee-selection-export-${customerId}-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
