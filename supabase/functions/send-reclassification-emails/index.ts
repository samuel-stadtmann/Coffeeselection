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

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
      <p>${greeting}</p>
      <p>wir haben anhand deiner letzten Bewertungen festgestellt, dass sich dein
      Kaffeegeschmack möglicherweise weiterentwickelt hat.</p>
      <p>Vom <strong>${currentName}</strong> hin zu einem Profil mit dem Charakter
      <strong>"${suggestedName}"</strong>${suggestedHint}.</p>
      <p>Magst du das Quiz nochmal machen? Es dauert 2 Minuten.</p>
      <p>
        <a href="https://coffeeselection.ch/quiz/start"
           style="display:inline-block;background:#1a1a1a;color:#fff;padding:12px 24px;text-decoration:none;font-weight:bold;letter-spacing:0.05em;text-transform:uppercase;font-size:12px;">
          Quiz starten
        </a>
      </p>
      <p>Oder wir behalten dein aktuelles Profil — du entscheidest.</p>
      <p style="margin-top:32px;color:#888;font-size:12px;">Herzlich,<br/>Coffee Selection</p>
    </div>
  `.trim();

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
    // Pending: nie gesendet ODER vor dem letzten Vorschlag gesendet.
    q = q.or(
      "reclassification_email_sent_at.is.null,reclassification_email_sent_at.lt.reclassification_suggested_at"
    );
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
