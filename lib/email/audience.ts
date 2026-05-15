import { getResendClient } from "./client";

/**
 * Fuegt einen Kontakt zur Resend-Audience hinzu (oder reaktiviert ihn).
 * Unsubscribed = false bedeutet "darf Newsletter erhalten".
 *
 * ENV: RESEND_NEWSLETTER_AUDIENCE_ID — die Audience-ID aus dem Resend-
 * Dashboard. Wenn fehlend: function ist no-op (logged warning), damit
 * Settings-Toggles trotzdem funktionieren ohne Audience.
 */
export async function syncResendNewsletterOptIn(
  email: string,
  optIn: boolean,
  meta: { firstName: string | null; lastName: string | null }
): Promise<{ ok: boolean; reason?: string }> {
  const audienceId = process.env.RESEND_NEWSLETTER_AUDIENCE_ID?.trim();
  if (!audienceId) {
    console.warn(
      "[email/audience] RESEND_NEWSLETTER_AUDIENCE_ID nicht gesetzt — Newsletter-Sync uebersprungen"
    );
    return { ok: false, reason: "no_audience_configured" };
  }

  try {
    const resend = getResendClient();
    if (optIn) {
      // Idempotent — Resend.contacts.create wirft bei doppeltem Insert nur Info,
      // kein hartes Error. Wir koennen einfach create rufen; bei "already exists"
      // updaten wir unsubscribed=false.
      const created = await resend.contacts.create({
        email,
        firstName: meta.firstName ?? undefined,
        lastName: meta.lastName ?? undefined,
        unsubscribed: false,
        audienceId,
      });
      // resend.contacts.create gibt {data, error} zurueck. Wenn error wegen
      // Duplikat, versuchen wir update via remove + add geht nicht — also
      // direkt Update:
      if (created.error) {
        await resend.contacts.update({
          email,
          audienceId,
          unsubscribed: false,
        });
      }
    } else {
      // Opt-out: nicht loeschen, sondern nur unsubscribed=true setzen
      // (Resend best practice fuer Suppression-Lists).
      await resend.contacts.update({
        email,
        audienceId,
        unsubscribed: true,
      });
    }
    return { ok: true };
  } catch (e) {
    console.error("[email/audience] Resend sync failed", e);
    return { ok: false, reason: e instanceof Error ? e.message : String(e) };
  }
}
