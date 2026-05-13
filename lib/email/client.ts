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
 *   - EMAIL_FROM: Absender-Adresse, MUSS auf einer verifizierten Domain in
 *     Resend liegen. Format: 'Coffee Selection <hello@coffeeselection.ch>'.
 *     Fuer Tests vor Domain-Verification: 'onboarding@resend.dev' (default
 *     Resend-Sandbox).
 *   - EMAIL_REPLY_TO (optional): Reply-To-Adresse fuer Customer-Antworten
 */

let _client: Resend | null = null;

export function getResendClient(): Resend {
  if (_client) return _client;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY ist nicht gesetzt — Mails koennen nicht versendet werden. " +
        "Setze die Variable in der Hosting-Plattform (Vercel etc.)."
    );
  }
  _client = new Resend(apiKey);
  return _client;
}

export function getEmailFrom(): string {
  return process.env.EMAIL_FROM ?? "Coffee Selection <onboarding@resend.dev>";
}

export function getEmailReplyTo(): string | undefined {
  return process.env.EMAIL_REPLY_TO ?? undefined;
}
