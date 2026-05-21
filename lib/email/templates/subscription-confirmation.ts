import {
  layout,
  escapeHtml,
  formatChf,
  formatDate,
  type LayoutProps,
} from "../layout";
import { INTERVAL_LABELS, type SubscriptionIntervalWeeks } from "@/lib/subscription-constants";

/**
 * Subscription-Confirmation (Initial): nach erfolgreichem Abo-Checkout.
 *
 * Trigger: Webhook checkout.session.completed mit mode=subscription + status=paid.
 *
 * Inhalt:
 *   - Welcome-Message
 *   - Was wurde abonniert (Coffee + Roester + Menge + Intervall)
 *   - Preis pro Lieferung + Versand
 *   - Erste Lieferung kommt roestfrisch
 *   - Naechste Abbuchung am ...
 *   - Hinweis: pausieren/kuendigen jederzeit
 *   - CTA: Abo verwalten
 */

export type SubscriptionConfirmationProps = {
  recipientName: string;
  orderNumber: string; // Initial-Order
  coffeeName: string;
  roasterName: string;
  weightG: number;
  quantity: number;
  intervalWeeks: SubscriptionIntervalWeeks;
  discountPercent: number;
  pricePerDeliveryChf: number;
  shippingPerDeliveryChf: number;
  totalPerDeliveryChf: number;
  /** ISO-Datum der naechsten Abbuchung (von Stripe current_period_end). */
  nextChargeDate: string | null;
  shippingAddress: {
    recipientName: string;
    street: string;
    streetAdditional?: string | null;
    postalCode: string;
    city: string;
    country: string;
  };
  siteUrl: string;
};

export function subscriptionConfirmationEmail(
  props: SubscriptionConfirmationProps
): { subject: string; html: string } {
  const subject = `Dein Coffee-Abo ist aktiv (${props.orderNumber})`;
  const intervalLabel = INTERVAL_LABELS[props.intervalWeeks].long;
  const nextChargeText = props.nextChargeDate
    ? `Naechste Abbuchung: <strong>${formatDate(props.nextChargeDate)}</strong>`
    : `Naechste Abbuchung in ${props.intervalWeeks} Woche${props.intervalWeeks === 1 ? "" : "n"}`;

  const addr = props.shippingAddress;

  const layoutProps: LayoutProps = {
    preview: `Dein ${props.coffeeName}-Abo ist aktiv. Erste Lieferung roestfrisch in den naechsten Tagen.`,
    content: `
      <h1 style="font-family:'Georgia',serif;font-weight:700;font-size:22px;text-transform:uppercase;letter-spacing:0.02em;margin:0 0 8px 0;color:#2D1810;">
        Willkommen ${escapeHtml(props.recipientName)},
      </h1>
      <p style="margin:0 0 24px 0;">
        dein Abo ist aktiv. Die erste Lieferung wird bei der naechsten Roestung
        roestfrisch an dich versandt — kommt in den naechsten 2–5 Werktagen an.
      </p>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;background:#F9F5F0;">
        <tr>
          <td style="padding:20px;">
            <div style="font-family:'Georgia',serif;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.3em;color:#C8A064;margin-bottom:8px;">
              Dein Abo
            </div>
            <div style="font-family:'Georgia',serif;font-weight:700;font-size:18px;color:#2D1810;">
              ${escapeHtml(props.coffeeName)}
            </div>
            <div style="font-size:13px;color:#8A7560;margin-top:4px;">
              ${escapeHtml(props.roasterName)} · ${props.weightG}g · ${props.quantity}× pro Lieferung
            </div>
            <div style="font-size:13px;color:#8A7560;margin-top:4px;">
              ${escapeHtml(intervalLabel)}
            </div>
          </td>
        </tr>
      </table>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0 24px 0;font-size:14px;">
        <tr>
          <td>Coffee pro Lieferung${props.discountPercent > 0 ? ` (inkl. ${props.discountPercent}% Abo-Rabatt)` : ""}</td>
          <td align="right">${formatChf(props.pricePerDeliveryChf)}</td>
        </tr>
        <tr>
          <td>Versand pro Lieferung</td>
          <td align="right">${props.shippingPerDeliveryChf === 0 ? "Gratis" : formatChf(props.shippingPerDeliveryChf)}</td>
        </tr>
        <tr style="font-weight:700;font-size:16px;">
          <td style="padding-top:12px;border-top:1px solid #efeae3;">Total pro Lieferung</td>
          <td align="right" style="padding-top:12px;border-top:1px solid #efeae3;">${formatChf(props.totalPerDeliveryChf)}</td>
        </tr>
      </table>

      <p style="margin:0 0 8px 0;font-size:13px;color:#8A7560;">
        ${nextChargeText}
      </p>

      <h2 style="font-family:'Georgia',serif;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.2em;margin:24px 0 8px 0;color:#2D1810;">
        Lieferung an
      </h2>
      <p style="margin:0 0 24px 0;color:#3D2A1F;font-size:14px;line-height:1.5;">
        ${escapeHtml(addr.recipientName)}<br>
        ${escapeHtml(addr.street)}${addr.streetAdditional ? "<br>" + escapeHtml(addr.streetAdditional) : ""}<br>
        ${escapeHtml(addr.postalCode)} ${escapeHtml(addr.city)}<br>
        ${escapeHtml(addr.country)}
      </p>

      <p style="margin:0 0 8px 0;font-size:13px;color:#8A7560;line-height:1.6;">
        Pausieren, Intervall aendern oder kuendigen — jederzeit ohne Mindestlaufzeit.
        Du verwaltest dein Abo in deinem Konto.
      </p>
    `,
    ctaLabel: "Abo verwalten",
    ctaHref: `${props.siteUrl}/account/subscription`,
  };

  return { subject, html: layout(layoutProps) };
}
