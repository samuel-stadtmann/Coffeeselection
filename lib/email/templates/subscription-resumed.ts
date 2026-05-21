import {
  layout,
  escapeHtml,
  formatDate,
  type LayoutProps,
} from "../layout";

/**
 * Subscription-Resumed: nach Fortsetzen-Aktion im Self-Service.
 *
 * Trigger: Webhook customer.subscription.updated mit Status-Transition
 * paused → active.
 *
 * Inhalt:
 *   - Begruessung
 *   - Naechste Abbuchung am ...
 *   - CTA: Abo ansehen
 */

export type SubscriptionResumedProps = {
  recipientName: string;
  coffeeName: string;
  nextChargeDate: string | null;
  siteUrl: string;
};

export function subscriptionResumedEmail(
  props: SubscriptionResumedProps
): { subject: string; html: string } {
  const subject = "Willkommen zurueck — dein Coffee-Abo laeuft wieder";
  const nextChargeText = props.nextChargeDate
    ? `Naechste Lieferung wird ausgeloest: <strong>${formatDate(props.nextChargeDate)}</strong>`
    : "Die naechste Lieferung wird in Kuerze ausgeloest";

  const layoutProps: LayoutProps = {
    preview: "Dein Abo ist wieder aktiv. Naechste Lieferung kommt automatisch.",
    content: `
      <h1 style="font-family:'Georgia',serif;font-weight:700;font-size:22px;text-transform:uppercase;letter-spacing:0.02em;margin:0 0 8px 0;color:#4D2C19;">
        Willkommen zurueck ${escapeHtml(props.recipientName)},
      </h1>
      <p style="margin:0 0 16px 0;">
        dein Abo fuer <strong>${escapeHtml(props.coffeeName)}</strong> ist
        wieder aktiv. Die naechsten Lieferungen kommen automatisch im
        gewohnten Intervall.
      </p>
      <p style="margin:0 0 24px 0;font-size:13px;color:#6D5244;">
        ${nextChargeText}
      </p>
    `,
    ctaLabel: "Abo ansehen",
    ctaHref: `${props.siteUrl}/account/subscription`,
  };

  return { subject, html: layout(layoutProps) };
}
