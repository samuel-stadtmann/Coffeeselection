import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { sendMail } from "@/lib/email/send";

/**
 * POST /api/contact
 *
 * Anonyme Contact-Form-Submission. Sendet die Nachricht an die in
 * CONTACT_INBOX_EMAIL konfigurierte Adresse (Fallback EMAIL_FROM).
 * Customer bekommt KEINE Bestaetigungs-Mail in dieser ersten Iteration
 * — kann spaeter ergaenzt werden.
 *
 * Anti-Spam: Honeypot-Feld + Min-Laenge-Check. Kein Captcha (zu nervig
 * fuer Schweizer User-Base), bei Spam-Wave kommt das nachtraeglich.
 */

const BodySchema = z.object({
  name: z.string().min(1).max(120),
  email: z.email().max(254),
  betreff: z.string().min(1).max(200),
  nachricht: z.string().min(5).max(5000),
  // Honeypot: Spambots fuellen Hidden-Felder gerne automatisch aus.
  // Wenn dieses Feld nicht leer ist → Spam, silent-OK zurueck.
  website: z.string().max(0).optional().default(""),
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getInboxEmail(): string {
  return (
    process.env.CONTACT_INBOX_EMAIL?.trim() ||
    process.env.EMAIL_FROM?.trim() ||
    "hello@coffeeselection.ch"
  );
}

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

  // Honeypot-Hit → wir tun so als ob's geklappt hat, aber senden nichts.
  if (body.website && body.website.length > 0) {
    return NextResponse.json({ success: true });
  }

  const inbox = getInboxEmail();
  const subject = `[Contact] ${body.betreff}`;
  const html = `
    <p><strong>Von:</strong> ${escapeHtml(body.name)} &lt;${escapeHtml(body.email)}&gt;</p>
    <p><strong>Betreff:</strong> ${escapeHtml(body.betreff)}</p>
    <hr />
    <p style="white-space: pre-wrap;">${escapeHtml(body.nachricht)}</p>
  `;
  const result = await sendMail({
    to: inbox,
    subject,
    html,
    replyTo: body.email,
    tags: [{ name: "type", value: "contact_form" }],
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: "send_failed", details: result.error },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true });
}
