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
      // Resend-SDK wirft KEINE Exception bei API-Fehlern — gibt {data, error}
      // zurueck. Wir muessen .error explizit pruefen, sonst schlucken wir
      // alles und melden Erfolg obwohl Resend abgelehnt hat.
      const created = await resend.contacts.create({
        email,
        firstName: meta.firstName ?? undefined,
        lastName: meta.lastName ?? undefined,
        unsubscribed: false,
        audienceId,
      });
      if (created.error) {
        // Vermutlich "already_exists" → Re-Aktivierung via Update.
        // Anderer Fehler (Auth, falsche Audience-ID etc.) muss aber
        // hochpropagieren — nicht silent ignorieren.
        console.warn(
          "[email/audience] contacts.create returned error, trying update:",
          JSON.stringify(created.error)
        );
        const updated = await resend.contacts.update({
          email,
          audienceId,
          unsubscribed: false,
        });
        if (updated.error) {
          console.error(
            "[email/audience] contacts.update also failed:",
            JSON.stringify(updated.error)
          );
          return {
            ok: false,
            reason: `resend_update_failed: ${updated.error.message ?? "unknown"} (create-error: ${created.error.message ?? "unknown"})`,
          };
        }
      }
    } else {
      const updated = await resend.contacts.update({
        email,
        audienceId,
        unsubscribed: true,
      });
      if (updated.error) {
        console.error(
          "[email/audience] contacts.update (opt-out) failed:",
          JSON.stringify(updated.error)
        );
        return {
          ok: false,
          reason: `resend_optout_failed: ${updated.error.message ?? "unknown"}`,
        };
      }
    }
    return { ok: true };
  } catch (e) {
    console.error("[email/audience] Resend sync failed", e);
    return { ok: false, reason: e instanceof Error ? e.message : String(e) };
  }
}
