import {
  layout,
  escapeHtml,
  type LayoutProps,
} from "../layout";

/**
 * Rating-Reminder: 5-7 Tage nach Bezahlung.
 *
 * Trigger: Vercel-Cron stuendlich → /api/cron/rating-reminders
 *   Findet orders mit paid_at zwischen now-14d und now-5d, ohne
 *   rating_reminder_sent_at, sendet diese Mail mit 1-Klick-Sterne
 *   pro bestelltem Coffee.
 *
 * UX:
 *   Email enthaelt 5 klickbare Sterne pro Coffee. Jeder Stern ist ein
 *   Link auf /account/rate/{coffee_slug}?stars=N&order={uuid}.
 *   Frontend pre-filled die Stars und triggert auto-submit nach Login.
 *
 * Lern-Loop:
 *   Jede Bewertung → coffee_ratings-Insert → process_pending_ratings()
 *   updated customer_aroma_preferences + drift_customer_embedding.
 *   Damit lernt der Recommender schon nach 1-2 Bewertungen weiter.
 */

export type RatingReminderProps = {
  recipientName: string;
  orderNumber: string;
  orderId: string;
  coffees: Array<{
    coffeeSlug: string;
    coffeeName: string;
    roasterName: string;
    imageUrl: string | null;
  }>;
  siteUrl: string;
};

const COLOR_TERTIARY = "#C8A064";
const COLOR_PRIMARY = "#2D1810";
const COLOR_MUTED = "#8A7560";

function starRow(
  coffeeSlug: string,
  orderId: string,
  siteUrl: string
): string {
  return Array.from({ length: 5 }, (_, i) => {
    const stars = i + 1;
    const url = `${siteUrl}/account/rate/${encodeURIComponent(coffeeSlug)}?stars=${stars}&order=${encodeURIComponent(orderId)}`;
    return `<a href="${url}" style="display:inline-block;font-size:32px;color:${COLOR_TERTIARY};text-decoration:none;padding:4px 8px;line-height:1;">★</a>`;
  }).join("");
}

export function ratingReminderEmail(props: RatingReminderProps): {
  subject: string;
  html: string;
} {
  const subject =
    props.coffees.length === 1
      ? `Wie war dein ${props.coffees[0].coffeeName}?`
      : "Wie waren deine letzten Coffees?";

  const coffeeBlocks = props.coffees
    .map(
      (c) => `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0;background:#F9F5F0;">
        <tr>
          <td style="padding:20px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                ${
                  c.imageUrl
                    ? `<td width="80" style="padding-right:16px;vertical-align:top;">
                  <img src="${escapeHtml(c.imageUrl)}" alt="${escapeHtml(c.coffeeName)}" width="80" height="80" style="display:block;width:80px;height:80px;object-fit:cover;">
                </td>`
                    : ""
                }
                <td style="vertical-align:top;">
                  <div style="font-family:'Georgia',serif;font-weight:700;font-size:16px;color:${COLOR_PRIMARY};">
                    ${escapeHtml(c.coffeeName)}
                  </div>
                  <div style="font-size:12px;color:${COLOR_MUTED};margin-top:2px;">
                    ${escapeHtml(c.roasterName)}
                  </div>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding-top:12px;text-align:center;">
                  ${starRow(c.coffeeSlug, props.orderId, props.siteUrl)}
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding-top:4px;text-align:center;">
                  <span style="font-family:'Helvetica',Arial,sans-serif;font-size:10px;color:${COLOR_MUTED};letter-spacing:0.15em;text-transform:uppercase;">
                    Klick = sofort bewerten
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`
    )
    .join("");

  const intro =
    props.coffees.length === 1
      ? `du hast deinen Coffee jetzt seit ein paar Tagen — Zeit fuer dein Urteil. Klick auf einen Stern um direkt zu bewerten.`
      : `du hast deine Coffees jetzt seit ein paar Tagen — Zeit fuer dein Urteil. Klick auf einen Stern pro Coffee um direkt zu bewerten.`;

  const layoutProps: LayoutProps = {
    preview: `Bewerte deine Bestellung ${props.orderNumber} — 1 Klick reicht. Jede Bewertung macht deine naechsten Empfehlungen besser.`,
    content: `
      <h1 style="font-family:'Georgia',serif;font-weight:700;font-size:22px;text-transform:uppercase;letter-spacing:0.02em;margin:0 0 8px 0;color:${COLOR_PRIMARY};">
        Hallo ${escapeHtml(props.recipientName)},
      </h1>
      <p style="margin:0 0 16px 0;">
        ${intro}
      </p>
      ${coffeeBlocks}
      <p style="margin:24px 0 0 0;font-size:13px;color:${COLOR_MUTED};line-height:1.6;">
        Deine Bewertung fliesst direkt in den Empfehlungs-Algorithmus.
        Schon nach 2-3 Bewertungen lernt das Profil dich besser kennen und
        die Match-Vorschlaege werden treffsicherer.
      </p>
    `,
    ctaLabel: "Detaillierte Bewertung schreiben",
    ctaHref: `${props.siteUrl}/account/rate/${encodeURIComponent(
      props.coffees[0].coffeeSlug
    )}?order=${encodeURIComponent(props.orderId)}`,
  };

  return { subject, html: layout(layoutProps) };
}
