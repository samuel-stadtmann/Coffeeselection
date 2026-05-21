import { layout, escapeHtml, type LayoutProps } from "../layout";

/**
 * Subscription-Paused: nach Pausieren-Aktion im Self-Service.
 *
 * Trigger: Webhook customer.subscription.updated mit Status-Transition
 * active/past_due → paused (Side-Effect von stripe.subscriptions.update
 * mit pause_collection in /api/account/subscriptions/[id]/action).
 *
 * Inhalt:
 *   - Bestaetigung: 'pausiert, keine Abbuchungen'
 *   - Hinweis: jederzeit fortsetzen
 *   - CTA: zurueck zum Account
 */

export type SubscriptionPausedProps = {
  recipientName: string;
  coffeeName: string;
  siteUrl: string;
};

export function subscriptionPausedEmail(
  props: SubscriptionPausedProps
): { subject: string; html: string } {
  const subject = "Dein Coffee-Abo ist pausiert";

  const layoutProps: LayoutProps = {
    preview: "Pause aktiv. Keine weiteren Abbuchungen bis du fortsetzt.",
    content: `
      <h1 style="font-family:'Georgia',serif;font-weight:700;font-size:22px;text-transform:uppercase;letter-spacing:0.02em;margin:0 0 8px 0;color:#4D2C19;">
        Pause an ${escapeHtml(props.recipientName)},
      </h1>
      <p style="margin:0 0 16px 0;">
        dein Abo fuer <strong>${escapeHtml(props.coffeeName)}</strong> ist pausiert.
        Es werden keine weiteren Lieferungen versandt und keine Abbuchungen
        gemacht, bis du wieder startest.
      </p>
      <p style="margin:0 0 24px 0;">
        Du kannst die Pause jederzeit im Account beenden — dein Abo macht
        dann genau dort weiter wo es aufgehoert hat.
      </p>
    `,
    ctaLabel: "Abo verwalten",
    ctaHref: `${props.siteUrl}/account/subscription`,
  };

  return { subject, html: layout(layoutProps) };
}
