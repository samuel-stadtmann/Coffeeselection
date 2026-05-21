import { layout, escapeHtml, type LayoutProps } from "../layout";

/**
 * Subscription-Cancelled: nach Kuendigung durch Customer (oder Stripe-final).
 *
 * Trigger: Webhook customer.subscription.deleted.
 *
 * Inhalt:
 *   - "Schade dich gehen zu sehen"
 *   - Bestaetigung dass Abo gekuendigt ist
 *   - Hinweis: keine weiteren Abbuchungen
 *   - CTA: jederzeit wieder starten (zurueck zum Shop)
 *   - Optional: 1-Klick-Feedback-Frage (spaeter)
 */

export type SubscriptionCancelledProps = {
  recipientName: string;
  coffeeName: string;
  siteUrl: string;
};

export function subscriptionCancelledEmail(
  props: SubscriptionCancelledProps
): { subject: string; html: string } {
  const subject = "Dein Coffee-Abo ist gekuendigt";

  const layoutProps: LayoutProps = {
    preview: "Dein Abo wurde gekuendigt. Keine weiteren Abbuchungen.",
    content: `
      <h1 style="font-family:'Montserrat',Arial,Helvetica,sans-serif;font-weight:700;font-size:22px;text-transform:uppercase;letter-spacing:0.02em;margin:0 0 8px 0;color:#4D2C19;">
        Schade ${escapeHtml(props.recipientName)},
      </h1>
      <p style="margin:0 0 16px 0;">
        dein Abo fuer <strong>${escapeHtml(props.coffeeName)}</strong> ist gekuendigt.
        Es werden keine weiteren Lieferungen versandt und keine weiteren
        Betraege eingezogen.
      </p>
      <p style="margin:0 0 24px 0;">
        Wenn du irgendwann zurueckmoechtest — der Shop ist offen, und das
        Lieblingsabo ist nur einen Klick entfernt.
      </p>
      <p style="margin:24px 0 0 0;font-size:13px;color:#6D5244;line-height:1.6;font-style:italic;">
        Falls du gefeedback geben moechtest, warum es nicht gepasst hat — antworte
        einfach auf diese Mail. Wir lesen jede Nachricht.
      </p>
    `,
    ctaLabel: "Zurueck zum Shop",
    ctaHref: `${props.siteUrl}/coffee`,
  };

  return { subject, html: layout(layoutProps) };
}
