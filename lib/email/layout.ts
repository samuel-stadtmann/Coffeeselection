/**
 * Layout-Wrapper fuer alle Coffee-Selection-Mails.
 *
 * Inline-CSS (Email-Clients sind picky, externes CSS oft gestripped).
 * Plain HTML mit Template-Literals — kein React-Email, kein Build-Step.
 *
 * Verwendung:
 *   import { layout } from "@/lib/email/layout";
 *   const html = layout({
 *     preview: "Deine Bestellung ist unterwegs",
 *     content: `<h1>Hallo Anna</h1><p>...</p>`,
 *     ctaLabel: "Bestellung ansehen",
 *     ctaHref: "https://coffeeselection.ch/account/orders/123",
 *   });
 */

export type LayoutProps = {
  /**
   * Preview-Text der im Inbox-Listing als Mailtext-Vorschau angezeigt wird
   * (vor dem Oeffnen). Sollte 50-100 Zeichen sein, ergaenzt den Betreff.
   */
  preview: string;
  /** HTML-Hauptinhalt — Header, Paragraphs, Listen etc. */
  content: string;
  /** Optionaler primaerer Call-to-Action am Ende des Mailtexts. */
  ctaLabel?: string;
  ctaHref?: string;
};

const COLOR_PRIMARY = "#2D1810"; // dunkles Coffee-Braun
const COLOR_TERTIARY = "#C8A064"; // Akzent-Gold
const COLOR_SURFACE = "#F9F5F0"; // Hintergrund (matcht Site)
const COLOR_TEXT = "#3D2A1F"; // Body-Text
const COLOR_MUTED = "#8A7560"; // Sekundaer-Text

export function layout(props: LayoutProps): string {
  const cta =
    props.ctaLabel && props.ctaHref
      ? `
        <tr>
          <td style="padding:24px 0 8px 0;text-align:center;">
            <a href="${escapeHtml(props.ctaHref)}"
               style="display:inline-block;padding:14px 36px;background:${COLOR_TERTIARY};color:${COLOR_PRIMARY};font-family:'Georgia',serif;font-weight:700;font-size:13px;letter-spacing:0.15em;text-transform:uppercase;text-decoration:none;">
              ${escapeHtml(props.ctaLabel)}
            </a>
          </td>
        </tr>`
      : "";

  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Coffee Selection</title>
</head>
<body style="margin:0;padding:0;background:${COLOR_SURFACE};font-family:'Helvetica',Arial,sans-serif;color:${COLOR_TEXT};">
  <!-- Hidden Preview-Text fuer Inbox -->
  <div style="display:none;font-size:1px;color:${COLOR_SURFACE};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${escapeHtml(props.preview)}
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${COLOR_SURFACE};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#ffffff;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 24px 32px;border-bottom:1px solid #efeae3;">
              <div style="font-family:'Georgia',serif;font-weight:700;font-size:14px;letter-spacing:0.4em;color:${COLOR_PRIMARY};text-transform:uppercase;">
                Coffee Selection
              </div>
              <div style="font-size:11px;color:${COLOR_MUTED};margin-top:4px;letter-spacing:0.1em;">
                Spezialitaetenkaffee aus der Schweiz
              </div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px;font-size:15px;line-height:1.6;color:${COLOR_TEXT};">
              ${props.content}
            </td>
          </tr>
          ${cta}

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px 32px 32px;border-top:1px solid #efeae3;font-size:11px;color:${COLOR_MUTED};line-height:1.5;">
              <p style="margin:0 0 8px 0;">
                Coffee Selection · Schweiz · <a href="https://coffeeselection.ch" style="color:${COLOR_MUTED};text-decoration:underline;">coffeeselection.ch</a>
              </p>
              <p style="margin:0;">
                Fragen? Antworte einfach auf diese Mail.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** HTML-Sonderzeichen-Escaping. Verhindert injection in dynamische Inhalte. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Hilfs-Format: CHF-Betrag → 'CHF 19.80' */
export function formatChf(n: number): string {
  return `CHF ${Number(n).toFixed(2)}`;
}

/** Hilfs-Format: ISO-Datum → '13.05.2026' */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}
