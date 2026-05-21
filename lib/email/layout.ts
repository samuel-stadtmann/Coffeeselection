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

const COLOR_PRIMARY = "#4D2C19"; // primary — dunkles Coffee-Braun (Site-Token)
const COLOR_TERTIARY = "#D4A017"; // tertiary — Akzent-Gold (Site-Token)
const COLOR_SURFACE = "#F9F5F0"; // surface — Hintergrund (Site-Token)
const COLOR_TEXT = "#4D2C19"; // on-surface — Body-Text (Site-Token)
const COLOR_MUTED = "#6D5244"; // on-surface-variant — Sekundaer-Text (Site-Token)
const COLOR_BORDER = "#E9DFD4"; // surface-container-highest — Hairlines (Site-Token)
const COLOR_ON_PRIMARY = "#F9F5F0"; // on-primary — Text auf dunklem Button

/**
 * Markenfarben fuer Templates, die eigene Bloecke rendern (Items-Tabellen
 * etc.). Statt Hex-Literale hartzucoden hier referenzieren — dann bleibt das
 * Branding zentral konsistent.
 */
export const EMAIL_COLORS = {
  primary: COLOR_PRIMARY,
  tertiary: COLOR_TERTIARY,
  surface: COLOR_SURFACE,
  text: COLOR_TEXT,
  muted: COLOR_MUTED,
  border: COLOR_BORDER,
  onPrimary: COLOR_ON_PRIMARY,
} as const;

/** Wiederverwendbare Heading-Styles (gleicher Look in allen Mails). */
export const EMAIL_STYLES = {
  h1: `font-family:'Montserrat',Arial,Helvetica,sans-serif;font-weight:700;font-size:22px;text-transform:uppercase;letter-spacing:0.02em;margin:0 0 8px 0;color:${COLOR_PRIMARY};`,
  h2: `font-family:'Montserrat',Arial,Helvetica,sans-serif;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.2em;margin:24px 0 8px 0;color:${COLOR_PRIMARY};`,
} as const;

/** Absolute Basis-URL fuer gehostete Assets (Logo) + Footer-Links. */
function siteBase(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.SITE_URL?.replace(/\/$/, "") ||
    "https://coffeeselection.ch"
  );
}

export function layout(props: LayoutProps): string {
  const base = siteBase();
  const cta =
    props.ctaLabel && props.ctaHref
      ? `
        <tr>
          <td style="padding:24px 0 8px 0;text-align:center;">
            <a href="${escapeHtml(props.ctaHref)}"
               style="display:inline-block;padding:14px 36px;background:${COLOR_PRIMARY};color:${COLOR_ON_PRIMARY};font-family:'Montserrat',Arial,Helvetica,sans-serif;font-weight:700;font-size:13px;letter-spacing:0.15em;text-transform:uppercase;text-decoration:none;border-radius:4px;">
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
  <!-- Brand-Fonts; Clients die das ignorieren fallen auf die Stacks unten zurueck. -->
  <link href="https://fonts.googleapis.com/css2?family=Merriweather&family=Montserrat:wght@700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${COLOR_SURFACE};font-family:'Merriweather',Georgia,'Times New Roman',serif;color:${COLOR_TEXT};">
  <!-- Hidden Preview-Text fuer Inbox -->
  <div style="display:none;font-size:1px;color:${COLOR_SURFACE};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${escapeHtml(props.preview)}
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${COLOR_SURFACE};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;">

          <!-- Gold-Akzentleiste -->
          <tr><td style="height:4px;background:${COLOR_TERTIARY};font-size:0;line-height:0;">&nbsp;</td></tr>

          <!-- Header mit Logo -->
          <tr>
            <td style="padding:28px 32px 20px 32px;border-bottom:1px solid ${COLOR_BORDER};">
              <img src="${base}/logo.png" width="180" alt="Coffee Selection"
                   style="display:block;border:0;outline:none;text-decoration:none;height:auto;max-height:44px;width:auto;max-width:220px;">
              <div style="font-size:11px;color:${COLOR_MUTED};margin-top:8px;letter-spacing:0.1em;">
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
            <td style="padding:24px 32px 32px 32px;border-top:1px solid ${COLOR_BORDER};font-size:11px;color:${COLOR_MUTED};line-height:1.5;">
              <p style="margin:0 0 8px 0;">
                Coffee Selection · Schweiz · <a href="${base}" style="color:${COLOR_MUTED};text-decoration:underline;">coffeeselection.ch</a>
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
