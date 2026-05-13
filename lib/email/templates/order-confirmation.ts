import {
  layout,
  escapeHtml,
  formatChf,
  type LayoutProps,
} from "../layout";

/**
 * Order-Confirmation: nach erfolgreichem Einmalkauf-Checkout.
 *
 * Trigger: Webhook checkout.session.completed mit mode=payment + status=paid
 * (siehe /api/webhooks/stripe).
 *
 * Inhalt:
 *   - Begruessung mit Order-Nr
 *   - Items-Liste (Coffee + Roester + Gewicht + Menge + Preis)
 *   - Total (Subtotal + Versand + ggf. MWST)
 *   - Lieferadresse
 *   - Hinweis: roestfrisch in 2-5 Werktagen
 *   - CTA: Bestellung im Account ansehen
 */

export type OrderConfirmationProps = {
  recipientName: string;
  orderNumber: string;
  items: Array<{
    coffeeName: string;
    roasterName: string;
    weightG: number;
    quantity: number;
    lineTotalChf: number;
  }>;
  subtotalChf: number;
  shippingChf: number;
  taxChf?: number;
  totalChf: number;
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

export function orderConfirmationEmail(props: OrderConfirmationProps): {
  subject: string;
  html: string;
} {
  const subject = `Bestellung ${props.orderNumber} bestaetigt`;

  const itemsRows = props.items
    .map(
      (it) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #efeae3;">
            <div style="font-weight:700;">${escapeHtml(it.coffeeName)}</div>
            <div style="font-size:13px;color:#8A7560;margin-top:2px;">
              ${escapeHtml(it.roasterName)} · ${it.weightG}g · ${it.quantity}×
            </div>
          </td>
          <td align="right" style="padding:12px 0;border-bottom:1px solid #efeae3;white-space:nowrap;vertical-align:top;">
            ${formatChf(it.lineTotalChf)}
          </td>
        </tr>`
    )
    .join("");

  const taxRow =
    props.taxChf && props.taxChf > 0
      ? `<tr><td>MWST</td><td align="right">${formatChf(props.taxChf)}</td></tr>`
      : "";

  const addr = props.shippingAddress;
  const layoutProps: LayoutProps = {
    preview: `Danke fuer deine Bestellung ${props.orderNumber}. Roestfrisch in 2-5 Werktagen.`,
    content: `
      <h1 style="font-family:'Georgia',serif;font-weight:700;font-size:22px;text-transform:uppercase;letter-spacing:0.02em;margin:0 0 8px 0;color:#2D1810;">
        Hallo ${escapeHtml(props.recipientName)},
      </h1>
      <p style="margin:0 0 24px 0;">
        deine Bestellung <strong>${escapeHtml(props.orderNumber)}</strong> ist eingegangen und wird in den naechsten 2–5 Werktagen roestfrisch an dich versandt.
      </p>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;">
        ${itemsRows}
      </table>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0 24px 0;font-size:14px;">
        <tr><td>Zwischensumme</td><td align="right">${formatChf(props.subtotalChf)}</td></tr>
        <tr><td>Versand</td><td align="right">${props.shippingChf === 0 ? "Gratis" : formatChf(props.shippingChf)}</td></tr>
        ${taxRow}
        <tr style="font-weight:700;font-size:16px;"><td style="padding-top:12px;border-top:1px solid #efeae3;">Total</td><td align="right" style="padding-top:12px;border-top:1px solid #efeae3;">${formatChf(props.totalChf)}</td></tr>
      </table>

      <h2 style="font-family:'Georgia',serif;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.2em;margin:24px 0 8px 0;color:#2D1810;">
        Lieferung an
      </h2>
      <p style="margin:0;color:#3D2A1F;font-size:14px;line-height:1.5;">
        ${escapeHtml(addr.recipientName)}<br>
        ${escapeHtml(addr.street)}${addr.streetAdditional ? "<br>" + escapeHtml(addr.streetAdditional) : ""}<br>
        ${escapeHtml(addr.postalCode)} ${escapeHtml(addr.city)}<br>
        ${escapeHtml(addr.country)}
      </p>
    `,
    ctaLabel: "Bestellung ansehen",
    ctaHref: `${props.siteUrl}/account/dashboard`,
  };

  return { subject, html: layout(layoutProps) };
}
