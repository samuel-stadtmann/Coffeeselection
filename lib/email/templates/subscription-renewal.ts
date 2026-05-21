import {
  layout,
  escapeHtml,
  formatChf,
  formatDate,
  type LayoutProps,
} from "../layout";

/**
 * Subscription-Renewal: bei jeder neuen Abo-Lieferung.
 *
 * Trigger: Webhook invoice.payment_succeeded mit billing_reason='subscription_cycle'
 * (also Renewals, NICHT die initiale Lieferung — die kriegt die
 * subscription-confirmation-Mail).
 *
 * Inhalt:
 *   - "Deine naechste Lieferung wird geroestet"
 *   - Was kommt (Coffee + Menge)
 *   - Betrag der eingezogen wurde
 *   - Hinweis: in 2-5 Werktagen
 *   - CTA: Bestellung ansehen oder Abo verwalten
 */

export type SubscriptionRenewalProps = {
  recipientName: string;
  orderNumber: string; // Renewal-Order
  coffeeName: string;
  roasterName: string;
  weightG: number;
  quantity: number;
  totalChf: number;
  /** ISO-Datum der naechsten Abbuchung (nach diesem Renewal). */
  nextChargeDate: string | null;
  siteUrl: string;
};

export function subscriptionRenewalEmail(
  props: SubscriptionRenewalProps
): { subject: string; html: string } {
  const subject = `Deine naechste Lieferung kommt (${props.orderNumber})`;
  const nextChargeText = props.nextChargeDate
    ? `Naechste Abbuchung: <strong>${formatDate(props.nextChargeDate)}</strong>`
    : "";

  const layoutProps: LayoutProps = {
    preview: `Dein ${props.coffeeName} wird gerade geroestet. Kommt in 2-5 Werktagen an.`,
    content: `
      <h1 style="font-family:'Georgia',serif;font-weight:700;font-size:22px;text-transform:uppercase;letter-spacing:0.02em;margin:0 0 8px 0;color:#4D2C19;">
        Hallo ${escapeHtml(props.recipientName)},
      </h1>
      <p style="margin:0 0 24px 0;">
        deine naechste Abo-Lieferung ist bestaetigt und wird bei der naechsten
        Roestung versandt — kommt roestfrisch in den naechsten 2–5 Werktagen an.
      </p>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;background:#F9F5F0;">
        <tr>
          <td style="padding:20px;">
            <div style="font-family:'Georgia',serif;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.3em;color:#D4A017;margin-bottom:8px;">
              Lieferung ${escapeHtml(props.orderNumber)}
            </div>
            <div style="font-family:'Georgia',serif;font-weight:700;font-size:18px;color:#4D2C19;">
              ${escapeHtml(props.coffeeName)}
            </div>
            <div style="font-size:13px;color:#6D5244;margin-top:4px;">
              ${escapeHtml(props.roasterName)} · ${props.weightG}g · ${props.quantity}×
            </div>
            <div style="font-size:14px;color:#4D2C19;margin-top:12px;font-weight:700;">
              ${formatChf(props.totalChf)} eingezogen
            </div>
          </td>
        </tr>
      </table>

      ${
        nextChargeText
          ? `<p style="margin:0 0 8px 0;font-size:13px;color:#6D5244;">${nextChargeText}</p>`
          : ""
      }

      <p style="margin:24px 0 0 0;font-size:13px;color:#6D5244;line-height:1.6;">
        Pause einlegen oder Intervall aendern? Alles ohne Mindestlaufzeit in
        deinem Konto.
      </p>
    `,
    ctaLabel: "Abo verwalten",
    ctaHref: `${props.siteUrl}/account/subscription`,
  };

  return { subject, html: layout(layoutProps) };
}
