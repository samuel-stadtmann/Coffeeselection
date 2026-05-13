import { Resend } from "resend";

/**
 * Lazy-Initializer fuer Resend-Client.
 *
 * Wir initialisieren NICHT beim Module-Load, weil:
 *   - Beim Build (Next.js) ist RESEND_API_KEY nicht da → wuerde crashen
 *   - Wir wollen klare Error-Messages wenn die Var fehlt zur Laufzeit
 *
 * ENV-Variablen:
 *   - RESEND_API_KEY: API-Key aus Resend-Dashboard (re_xxx)
 *   - EMAIL_FROM (Alias: RESEND_FROM_EMAIL): Absender-Adresse, MUSS auf
 *     einer verifizierten Domain in Resend liegen. Format:
 *     'Coffee Selection <hello@coffeeselection.ch>'. Fuer Tests vor
 *     Domain-Verification: 'onboarding@resend.dev' (default Resend-Sandbox).
 *   - EMAIL_REPLY_TO (optional): Reply-To-Adresse fuer Customer-Antworten
 */

let _client: Resend | null = null;

export function getResendClient(): Resend {
  if (_client) return _client;
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    // Diagnose-Hilfe: welche RESEND-bezogenen Vars sind tatsaechlich sichtbar?
    // Nur die Namen ausgeben — NIE die Werte (potenzielles Leak in Logs).
    const visibleResendVars = Object.keys(process.env)
      .filter((k) => k.toUpperCase().includes("RESEND") || k.toUpperCase().includes("EMAIL"))
      .sort();
    throw new Error(
      `RESEND_API_KEY ist nicht gesetzt — Mails koennen nicht versendet werden. ` +
        `Sichtbare resend/email-Vars: [${visibleResendVars.join(", ") || "keine"}]. ` +
        `Setze RESEND_API_KEY in der Hosting-Plattform (Vercel etc.) ` +
        `und mach einen Redeploy OHNE Build-Cache.`
    );
  }
  _client = new Resend(apiKey);
  return _client;
}

export function getEmailFrom(): string {
  // Wir akzeptieren beide Namens-Konventionen:
  //   EMAIL_FROM (urspruenglich in dieser Codebase)
  //   RESEND_FROM_EMAIL (Resend-Doku-Konvention)
  const fromVar =
    process.env.EMAIL_FROM?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim();
  return fromVar || "Coffee Selection <onboarding@resend.dev>";
}

export function getEmailReplyTo(): string | undefined {
  return process.env.EMAIL_REPLY_TO?.trim() || undefined;
}
