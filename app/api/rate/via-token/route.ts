import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyRatingToken } from "@/lib/rating-token";

/**
 * PA-Loop3.1: GET /api/rate/via-token?t=TOKEN&s=N
 *
 * Magic-Link-Endpoint fuer 1-Klick-Bewertungen aus der Bewertungs-Email.
 *
 * Flow:
 *   1. Customer klickt Stern in Mail
 *   2. Browser oeffnet diese URL mit Token (Auth via Signatur) + Stars
 *   3. Wir verifizieren Token, lesen customer_id/order_id/coffee_id raus
 *   4. INSERT/UPSERT in coffee_ratings (service-client, kein Auth-Login noetig)
 *   5. Redirect zu /account/rate/thanks?stars=N&coffee={slug}
 *
 * Sicherheits-Garantien:
 *   - Token ist HMAC-signed mit CRON_SECRET (nur Server kennt es)
 *   - Token enthaelt customer_id + order_id + coffee_id explizit
 *   - Token expires nach 14 Tagen
 *   - Stars sind URL-Param (nicht im Token signiert) — User kann zwischen
 *     1-5 wechseln, aber NICHT die customer/order/coffee aendern
 *
 * Idempotenz:
 *   Wenn Customer mehrfach klickt (z.B. erst 4-Stern, dann 5-Stern):
 *   wir UPDATEN das existierende coffee_ratings-Row statt ein neues
 *   einzufuegen. Letzter Klick gewinnt.
 */

const QuerySchema = z.object({
  t: z.string().min(20), // Token
  s: z.coerce.number().int().min(1).max(5), // Stars
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    t: url.searchParams.get("t"),
    s: url.searchParams.get("s"),
  });
  if (!parsed.success) {
    return errorRedirect("invalid_params");
  }
  const { t: token, s: stars } = parsed.data;

  // Token verifizieren
  const content = verifyRatingToken(token);
  if (!content) {
    return errorRedirect("invalid_or_expired");
  }

  const svc = createServiceClient();

  // Coffee-Slug fuer Redirect ermitteln
  const { data: coffee, error: coffeeErr } = await svc
    .from("coffees")
    .select("id, slug, name")
    .eq("id", content.coffee_id)
    .maybeSingle();
  if (coffeeErr || !coffee) {
    console.error(
      "[rate/via-token] coffee lookup failed",
      coffeeErr,
      content.coffee_id
    );
    return errorRedirect("coffee_not_found");
  }

  // Pruefen ob es schon eine Bewertung von diesem Customer fuer diesen
  // Coffee gibt (egal welche Order). Wenn ja: UPDATE statt INSERT.
  // Damit ist Mehrfach-Klick idempotent.
  const { data: existing } = await svc
    .from("coffee_ratings")
    .select("id, rating")
    .eq("customer_id", content.customer_id)
    .eq("coffee_id", content.coffee_id)
    .maybeSingle();

  if (existing) {
    if (existing.rating === stars) {
      // Selber Stern wie vorher → kein DB-Write noetig.
      return successRedirect(coffee.slug, stars);
    }
    const { error: updErr } = await svc
      .from("coffee_ratings")
      .update({
        rating: stars,
        order_id: content.order_id,
        source: "email",
        // processed_at zuruecksetzen damit Lern-Worker es nochmal verarbeitet
        processed_at: null,
      })
      .eq("id", existing.id);
    if (updErr) {
      console.error("[rate/via-token] update failed", updErr);
      return errorRedirect("db_error");
    }
    return successRedirect(coffee.slug, stars);
  }

  // Neuer Eintrag
  const { error: insErr } = await svc.from("coffee_ratings").insert({
    customer_id: content.customer_id,
    coffee_id: content.coffee_id,
    order_id: content.order_id,
    rating: stars,
    source: "email",
    is_public: false,
  });

  if (insErr) {
    console.error("[rate/via-token] insert failed", insErr);
    return errorRedirect("db_error");
  }

  return successRedirect(coffee.slug, stars);
}

function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://staging.coffeeselection.ch"
  );
}

function successRedirect(coffeeSlug: string, stars: number): NextResponse {
  const url = `${getSiteUrl()}/account/rate/thanks?coffee=${encodeURIComponent(coffeeSlug)}&stars=${stars}`;
  return NextResponse.redirect(url, 303); // 303 = "See Other", GET nach POST/Token
}

function errorRedirect(reason: string): NextResponse {
  const url = `${getSiteUrl()}/account/rate/thanks?error=${encodeURIComponent(reason)}`;
  return NextResponse.redirect(url, 303);
}
