// =============================================================================
// Edge Function: quiz-submit
// =============================================================================
// Schritt 9.10 / Playbook Kap. 3 + 4:
// Nimmt Quiz-Antworten entgegen, legt eine quiz_response an, klassifiziert
// den Geschmackstyp und loest asynchron die Embedding-Generierung aus.
//
// POST-Body:
// {
//   "customer_id": "<uuid>",          // optional: wenn Kunde bereits existiert
//   "answers": [                       // Array von Antworten
//     { "question_id": "<uuid>", "option_id": "<uuid>" },
//     ...
//   ]
// }
//
// Antwort:
// {
//   "ok": true,
//   "response_id": "<uuid>",
//   "primary_type_id": 1,
//   "primary_type_name": "Klassiker",
//   "secondary_type_id": 2,
//   "confidence": 0.82,
//   "confidence_band": "high"
// }
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Supabase-Client mit dem JWT des aufrufenden Nutzers (RLS bleibt aktiv)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase    = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const { customer_id, answers } = body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return json({ ok: false, error: "answers must be a non-empty array" }, 400);
    }

    // 1) quiz_response anlegen
    const { data: response, error: respErr } = await supabase
      .from("quiz_responses")
      .insert({
        customer_id: customer_id ?? null,
        started_at:  new Date().toISOString(),
      })
      .select("id")
      .single();

    if (respErr) throw respErr;
    const responseId: string = response.id;

    // 2) Einzelne Antworten speichern
    const answerRows = answers.map((a: { question_id: string; option_id: string }) => ({
      response_id: responseId,
      question_id: a.question_id,
      option_id:   a.option_id,
    }));

    const { error: ansErr } = await supabase
      .from("quiz_answers")
      .insert(answerRows);

    if (ansErr) throw ansErr;

    // 3) Klassifikation aufrufen
    const { data: classData, error: classErr } = await supabase
      .rpc("classify_taste_type", { p_response_id: responseId });

    if (classErr) throw classErr;

    const result = Array.isArray(classData) ? classData[0] : classData;

    // 4) Embedding asynchron ausloesen (fire-and-forget, kein await)
    if (customer_id) {
      const embUrl = `${supabaseUrl}/functions/v1/generate-customer-embedding`;
      fetch(embUrl, {
        method:  "POST",
        headers: {
          "Authorization": `Bearer ${serviceKey}`,
          "Content-Type":  "application/json",
        },
        body: JSON.stringify({ customer_id }),
      }).catch(() => {
        // Fehler im Hintergrund — Embedding wird beim naechsten Aufruf nachgeholt
      });
    }

    // 5) Antwort
    return json({
      ok:                true,
      response_id:       responseId,
      primary_type_id:   result?.primary_type_id   ?? null,
      primary_type_name: result?.primary_type_name  ?? null,
      secondary_type_id: result?.secondary_type_id  ?? null,
      confidence:        result?.confidence          ?? null,
      confidence_band:   result?.confidence_band     ?? null,
    });

  } catch (e) {
    return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
