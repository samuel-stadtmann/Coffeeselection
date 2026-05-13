import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendMail } from "@/lib/email/send";
import { ratingReminderEmail } from "@/lib/email/templates/rating-reminder";
import { createRatingToken } from "@/lib/rating-token";

/**
 * PA-Loop3: GET /api/cron/rating-reminders
 *
 * Vercel-Cron-Endpoint (stuendlich, siehe vercel.json). Findet bezahlte
 * Orders mit paid_at zwischen now-14d und now-5d die noch keinen
 * Rating-Reminder bekommen haben, sendet pro Order eine Mail mit
 * 1-Klick-Sterne-Deep-Links pro Coffee.
 *
 * Auth: per CRON_SECRET (Vercel setzt Header 'Authorization: Bearer <secret>'
 * bei Cron-Calls). Schuetzt vor externem Aufruf.
 *
 * Idempotenz:
 *   - WHERE rating_reminder_sent_at IS NULL filtert bereits versandte Orders
 *   - Nach erfolgreichem Send: UPDATE rating_reminder_sent_at = now()
 *   - Falls Mail-Send fehlschlaegt: rating_reminder_sent_at bleibt NULL,
 *     wird im naechsten Cron-Run nochmal versucht
 *
 * Zeitfenster (5-14 Tage):
 *   - Untergrenze 5d: Coffee muss angekommen + ein paar Tage probiert sein
 *     (Versand 2-5 Werktage + paar Tage geniessen)
 *   - Obergrenze 14d: nach 2 Wochen ist die Customer-Erinnerung zu schwach,
 *     macht keinen Sinn mehr zu nerven
 *
 * Aktuell: 1 Mail pro Order (auch wenn mehrere Coffees drin). Im Template
 * wird pro Coffee eine 5-Stern-Reihe gerendert.
 */

const PAID_MIN_AGE_DAYS = 5;
const PAID_MAX_AGE_DAYS = 14;
const MAX_ORDERS_PER_RUN = 50; // damit ein Cron-Run nicht ewig dauert

function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://staging.coffeeselection.ch"
  );
}

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    // Lokales Entwickeln ohne CRON_SECRET: erlauben.
    // In Produktion MUSS die Variable gesetzt sein.
    if (process.env.NODE_ENV !== "production") return true;
    return false;
  }
  const authHeader = req.headers.get("authorization");
  return authHeader === `Bearer ${expected}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const svc = createServiceClient();
  const minPaidAt = new Date(
    Date.now() - PAID_MAX_AGE_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();
  const maxPaidAt = new Date(
    Date.now() - PAID_MIN_AGE_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  // Orders mit faelligem Rating-Reminder finden — wir brauchen die
  // customer.id zusaetzlich zur Mail (fuer Magic-Link-Token-Generierung).
  const { data: orders, error } = await svc
    .from("orders")
    .select(`
      id, order_number, paid_at, customer_id,
      customer:customers(email, first_name, last_name),
      items:order_items(coffee_id, coffee_name_snapshot, roaster_name_snapshot, coffee:coffees(slug, image_url))
    `)
    .eq("status", "paid")
    .is("rating_reminder_sent_at", null)
    .gte("paid_at", minPaidAt)
    .lte("paid_at", maxPaidAt)
    .order("paid_at", { ascending: true })
    .limit(MAX_ORDERS_PER_RUN);

  if (error) {
    console.error("[cron/rating-reminders] orders query failed", error);
    return NextResponse.json(
      { error: "query_failed", details: error.message },
      { status: 500 }
    );
  }

  if (!orders || orders.length === 0) {
    return NextResponse.json({ processed: 0, sent: 0, skipped: 0 });
  }

  const siteUrl = getSiteUrl();
  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const order of orders) {
    const customer = order.customer as unknown as {
      email: string;
      first_name: string | null;
      last_name: string | null;
    } | null;
    const items = order.items as unknown as Array<{
      coffee_id: string;
      coffee_name_snapshot: string;
      roaster_name_snapshot: string;
      coffee: { slug: string; image_url: string | null } | null;
    }>;

    if (!customer?.email || !items || items.length === 0) {
      console.log(
        `[cron/rating-reminders] order ${order.id} skipped — missing email or items`
      );
      skipped++;
      continue;
    }

    // Coffees deduplizieren — bei Quantity>1 nur einmal pro coffee_id.
    // Pro Coffee einen Magic-Link-Token generieren (HMAC-signed mit
    // customer_id + order_id + coffee_id).
    const seen = new Set<string>();
    const coffees: Array<{
      coffeeSlug: string;
      coffeeName: string;
      roasterName: string;
      imageUrl: string | null;
      token: string;
    }> = [];
    for (const it of items) {
      if (seen.has(it.coffee_id) || !it.coffee?.slug) continue;
      seen.add(it.coffee_id);
      const token = createRatingToken({
        customer_id: order.customer_id,
        order_id: order.id,
        coffee_id: it.coffee_id,
      });
      coffees.push({
        coffeeSlug: it.coffee.slug,
        coffeeName: it.coffee_name_snapshot,
        roasterName: it.roaster_name_snapshot,
        imageUrl: it.coffee.image_url ?? null,
        token,
      });
    }

    if (coffees.length === 0) {
      skipped++;
      continue;
    }

    const recipientName =
      [customer.first_name, customer.last_name].filter(Boolean).join(" ") || "";

    const { subject, html } = ratingReminderEmail({
      recipientName,
      orderNumber: order.order_number,
      orderId: order.id,
      coffees,
      siteUrl,
    });

    const mailResult = await sendMail({
      to: customer.email,
      subject,
      html,
      tags: [
        { name: "type", value: "rating_reminder" },
        { name: "order_number", value: order.order_number },
      ],
    });

    if (!mailResult.ok) {
      // Mail-Fail: rating_reminder_sent_at NICHT setzen → naechster Cron-Run
      // versucht es nochmal. Resend hat eigene Retries, mehr Versuche
      // unsererseits sind nicht noetig.
      console.error(
        `[cron/rating-reminders] mail failed for order ${order.id}:`,
        mailResult.error
      );
      errors.push(`${order.order_number}: ${mailResult.error}`);
      continue;
    }

    // Erfolgreich gesendet → flag setzen
    const { error: updErr } = await svc
      .from("orders")
      .update({ rating_reminder_sent_at: new Date().toISOString() })
      .eq("id", order.id);

    if (updErr) {
      // Mail ist raus, aber Flag konnte nicht gesetzt werden. Naechster
      // Cron-Run schickt nochmal — schlechter UX. Log loud.
      console.error(
        `[cron/rating-reminders] mail sent but flag update failed for ${order.id}:`,
        updErr
      );
      errors.push(`${order.order_number}: flag update failed`);
      continue;
    }

    sent++;
  }

  console.log(
    `[cron/rating-reminders] done: ${sent} sent, ${skipped} skipped, ${errors.length} errors of ${orders.length} candidates`
  );

  return NextResponse.json({
    processed: orders.length,
    sent,
    skipped,
    errors,
  });
}
