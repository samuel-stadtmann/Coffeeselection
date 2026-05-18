import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { syncResendNewsletterOptIn } from "@/lib/email/audience";

/**
 * POST /api/newsletter/subscribe
 *
 * Anonyme Newsletter-Anmeldung aus dem Footer (oder beliebigen anderen
 * Marketing-Forms). Nimmt E-Mail entgegen, validiert, ruft Resend an.
 *
 * Wichtig: kein customers-Insert hier. Wer schon Customer ist, hat das
 * marketing_opt_in-Flag in der DB; das wird beim Bestell-Flow oder im
 * Settings-Toggle (siehe /api/account/notifications) gesetzt — und auch
 * dort schon nach Resend gesynced. Diese Route ist nur fuer Lead-Email,
 * also Leute die noch nicht im System sind.
 */

const BodySchema = z.object({
  email: z.email().max(254),
  first_name: z.string().max(80).optional().nullable(),
  last_name: z.string().max(80).optional().nullable(),
});

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      {
        error: "invalid_body",
        details:
          err instanceof z.ZodError ? err.issues : String(err),
      },
      { status: 400 }
    );
  }

  const email = body.email.toLowerCase().trim();

  const result = await syncResendNewsletterOptIn(email, true, {
    firstName: body.first_name ?? null,
    lastName: body.last_name ?? null,
  });

  if (!result.ok) {
    if (result.reason === "no_audience_configured") {
      // Ohne Audience-Konfiguration koennen wir die Anmeldung nicht
      // entgegennehmen. Wir geben dem Frontend einen sanften Fehler,
      // ohne den Server-Konfigurationsmangel zu leaken.
      console.warn(
        "[api/newsletter/subscribe] RESEND_NEWSLETTER_AUDIENCE_ID nicht gesetzt"
      );
      return NextResponse.json(
        { error: "service_unavailable" },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "sync_failed", details: result.reason },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
