import { getResendClient, getEmailFrom, getEmailReplyTo } from "./client";

/**
 * Generischer Mail-Versand-Helper.
 *
 * Verwendung:
 *   import { sendMail } from "@/lib/email/send";
 *   await sendMail({
 *     to: "anna@example.com",
 *     subject: "Deine Bestellung CS-2026-000123",
 *     html: layout({...}),
 *   });
 *
 * Verhalten:
 *   - Wirft NICHT bei Send-Fail (mails sind never critical-path). Loggt
 *     den Fehler und gibt `{ok:false}` zurueck.
 *   - Webhook-Handler etc. koennen den Returnwert ignorieren — Mail-Fail
 *     darf den DB-Sync nicht blockieren.
 *   - RESEND_API_KEY-Fehlt: ebenfalls non-throwing, nur Log.
 */

type SendArgs = {
  to: string | string[];
  subject: string;
  html: string;
  /** Plain-Text-Fallback. Optional — Resend generiert sonst aus HTML. */
  text?: string;
  /** Pro Mail ueberschreibbarer Reply-To, sonst aus ENV. */
  replyTo?: string;
  /** Tags fuer Resend-Analytics. */
  tags?: Array<{ name: string; value: string }>;
};

export async function sendMail(args: SendArgs): Promise<{
  ok: boolean;
  id?: string;
  error?: string;
}> {
  try {
    const client = getResendClient();
    const res = await client.emails.send({
      from: getEmailFrom(),
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
      replyTo: args.replyTo ?? getEmailReplyTo(),
      tags: args.tags,
    });
    if (res.error) {
      console.error("[email/send] resend returned error:", res.error);
      return { ok: false, error: res.error.message };
    }
    console.log(
      `[email/send] ✓ '${args.subject}' → ${Array.isArray(args.to) ? args.to.join(",") : args.to} (id=${res.data?.id ?? "?"})`
    );
    return { ok: true, id: res.data?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[email/send] send failed:", msg);
    return { ok: false, error: msg };
  }
}
