// Supabase Edge Function: send-reclassification-emails
//
// Playbook 6.5 — wenn der Lern-Worker (process_pending_ratings) erkennt dass
// ein Customer-Embedding naeher an einem anderen Geschmackstyp-Centroid liegt
// als am eigenen, setzt er customers.reclassification_suggested_at +
// customers.reclassification_suggested_type. Diese Function pickt diese
// Kandidaten auf und sendet eine "magst du das Quiz nochmal machen?"-Mail
// per Resend.
//
// Trigger:
//   - pg_cron stuendlich via pg_net.http_post -> POST mit leerem Body
//   - Manuell zum Testen: POST {"customer_id": "<uuid>"} bypasst die
//     Pending-Auswahl und sendet sofort fuer den genannten Customer
//
// Secrets (Supabase Edge Functions -> Manage Secrets):
//   - RESEND_API_KEY              (vom User gesetzt)
//   - RESEND_FROM_EMAIL           (z.B. "Coffee Selection <hello@coffeeselection.ch>")
//   - SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (auto-injiziert)
//
// Idempotent: setzt reclassification_email_sent_at = now() pro
// gesendeter Mail. Re-Trigger sendet nur Customers wo sent_at < suggested_at.

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") ?? "Coffee Selection <onboarding@resend.dev>";

type PendingRow = {
  id: string;
  email: string;
  first_name: string | null;
  language: string;
  reclassification_suggested_at: string;
  reclassification_suggested_type: number;
  current_type: { name_de: string } | null;
  suggested_type: { name_de: string; tagline_de: string | null } | null;
};

function buildEmailBody(c: PendingRow): { subject: string; text: string; html: string } {
  const greeting = c.first_name ? `Hallo ${c.first_name},` : "Hallo,";
  const currentName = c.current_type?.name_de ?? "deinem aktuellen Profil";
  const suggested = c.suggested_type;
  const suggestedName = suggested?.name_de ?? "einem anderen Profil";
  const suggestedHint = suggested?.tagline_de
    ? ` (${suggested.tagline_de})`
    : "";

  const subject = `Hat sich dein Kaffee-Geschmack weiterentwickelt?`;
  const text = [
    greeting,
    "",
    `wir haben anhand deiner letzten Bewertungen festgestellt, dass sich dein`,
    `Kaffeegeschmack moeglicherweise weiterentwickelt hat.`,
    "",
    `Vom ${currentName} hin zu einem Profil mit dem Charakter "${suggestedName}"${suggestedHint}.`,
    "",
    `Magst du das Quiz nochmal machen? Es dauert 2 Minuten:`,
    `https://coffeeselection.ch/quiz/start`,
    "",
    `Oder wir behalten dein aktuelles Profil — du entscheidest.`,
    "",
    `Herzlich,`,
    `Coffee Selection`,
  ].join("\n");

  // Markenlayout inline (Edge Function kann lib/email nicht importieren) —
  // gleiche Tokens wie lib/email/layout.ts: primary #4D2C19, gold #D4A017,
  // surface #F9F5F0, muted #6D5244, border #E9DFD4.
  const SITE = Deno.env.get("SITE_URL")?.replace(/\/$/, "") ?? "https://coffeeselection.ch";
  const html = `<!doctype html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Coffee Selection</title></head>
<body style="margin:0;padding:0;background:#F9F5F0;font-family:'Helvetica',Arial,sans-serif;color:#4D2C19;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F9F5F0;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;">
        <tr><td style="height:4px;background:#D4A017;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:28px 32px 20px 32px;border-bottom:1px solid #E9DFD4;">
          <img src="${SITE}/logo.png" width="180" alt="Coffee Selection" style="display:block;border:0;outline:none;text-decoration:none;height:auto;max-height:44px;width:auto;max-width:220px;">
          <div style="font-size:11px;color:#6D5244;margin-top:8px;letter-spacing:0.1em;">Spezialitaetenkaffee aus der Schweiz</div>
        </td></tr>
        <tr><td style="padding:32px;font-size:15px;line-height:1.6;color:#4D2C19;">
          <h1 style="font-family:'Georgia',serif;font-weight:700;font-size:22px;text-transform:uppercase;letter-spacing:0.02em;margin:0 0 8px 0;color:#4D2C19;">${greeting}</h1>
          <p style="margin:0 0 16px 0;">wir haben anhand deiner letzten Bewertungen festgestellt, dass sich dein Kaffeegeschmack möglicherweise weiterentwickelt hat.</p>
          <p style="margin:0 0 16px 0;">Vom <strong>${currentName}</strong> hin zu einem Profil mit dem Charakter <strong>"${suggestedName}"</strong>${suggestedHint}.</p>
          <p style="margin:0 0 8px 0;">Magst du das Quiz nochmal machen? Es dauert 2 Minuten.</p>
        </td></tr>
        <tr><td style="padding:8px 0 8px 0;text-align:center;">
          <a href="${SITE}/quiz/start" style="display:inline-block;padding:14px 36px;background:#4D2C19;color:#F9F5F0;font-family:'Georgia',serif;font-weight:700;font-size:13px;letter-spacing:0.15em;text-transform:uppercase;text-decoration:none;border-radius:4px;">Quiz starten</a>
        </td></tr>
        <tr><td style="padding:8px 32px 0 32px;font-size:15px;line-height:1.6;color:#4D2C19;">
          <p style="margin:0;">Oder wir behalten dein aktuelles Profil — du entscheidest.</p>
        </td></tr>
        <tr><td style="padding:24px 32px 32px 32px;border-top:1px solid #E9DFD4;font-size:11px;color:#6D5244;line-height:1.5;margin-top:24px;">
          <p style="margin:0 0 8px 0;">Coffee Selection · Schweiz · <a href="${SITE}" style="color:#6D5244;text-decoration:underline;">coffeeselection.ch</a></p>
          <p style="margin:0;">Fragen? Antworte einfach auf diese Mail.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}

async function sendEmail(to: string, body: ReturnType<typeof buildEmailBody>) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [to],
      subject: body.subject,
      text: body.text,
      html: body.html,
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Resend ${res.status}: ${detail}`);
  }
  return (await res.json()) as { id: string };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method !== "POST") return jsonResponse({ error: "method not allowed" }, 405);
  if (!RESEND_API_KEY) return jsonResponse({ error: "RESEND_API_KEY not configured" }, 500);

  let bodyJson: any = {};
  try {
    bodyJson = await req.json();
  } catch {
    /* leerer body ist ok — pg_cron-Aufruf */
  }
  const explicitId: string | undefined = bodyJson.customer_id;

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Pending-Kandidaten laden — entweder ein expliziter Customer oder alle.
  // Joins sind als ARRAY-mit-1-Zeile zurueckgeliefert (PostgREST-Default),
  // daher das defensive [0]-Fold danach.
  let q = supabase
    .from("customers")
    .select(
      `
      id, email, first_name, language,
      reclassification_suggested_at, reclassification_suggested_type, reclassification_email_sent_at,
      current_type:taste_type_id ( name_de ),
      suggested_type:reclassification_suggested_type ( name_de, tagline_de )
    `
    )
    .not("reclassification_suggested_at", "is", null);

  if (explicitId) {
    q = q.eq("id", explicitId);
  } else {
    // Pending = noch nie eine Reklass-Mail rausgegangen.
    // (Der Re-Send-nach-30-Tagen-Fall — sent_at < suggested_at —
    //  laesst sich mit PostgREST nicht direkt ausdruecken weil
    //  Spalte<Spalte-Vergleiche dort nicht gehen. Das holen wir
    //  spaeter via DB-View nach falls noetig.)
    q = q.is("reclassification_email_sent_at", null);
  }
  // Schutz gegen Mail-Flut: max 50 pro Lauf.
  q = q.limit(50);

  const { data: rows, error } = await q;
  if (error) return jsonResponse({ error: "load failed", details: error.message }, 500);

  let sent = 0;
  let failed = 0;
  const results: Array<{ customer_id: string; status: "sent" | "failed"; reason?: string }> = [];

  for (const row of (rows ?? []) as any[]) {
    const c: PendingRow = {
      id: row.id,
      email: row.email,
      first_name: row.first_name,
      language: row.language,
      reclassification_suggested_at: row.reclassification_suggested_at,
      reclassification_suggested_type: row.reclassification_suggested_type,
      current_type: Array.isArray(row.current_type) ? row.current_type[0] ?? null : row.current_type ?? null,
      suggested_type: Array.isArray(row.suggested_type) ? row.suggested_type[0] ?? null : row.suggested_type ?? null,
    };

    if (!c.email) {
      failed++;
      results.push({ customer_id: c.id, status: "failed", reason: "no email" });
      continue;
    }

    try {
      const body = buildEmailBody(c);
      await sendEmail(c.email, body);
      const { error: updErr } = await supabase
        .from("customers")
        .update({ reclassification_email_sent_at: new Date().toISOString() })
        .eq("id", c.id);
      if (updErr) {
        failed++;
        results.push({ customer_id: c.id, status: "failed", reason: `update: ${updErr.message}` });
      } else {
        sent++;
        results.push({ customer_id: c.id, status: "sent" });
      }
    } catch (err) {
      failed++;
      results.push({ customer_id: c.id, status: "failed", reason: (err as Error).message });
    }
  }

  return jsonResponse({ ok: true, sent, failed, total: rows?.length ?? 0, results });
});
