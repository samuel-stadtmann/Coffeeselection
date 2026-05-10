import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { persistQuizForCurrentUser } from "@/lib/db/quiz";

// Playbook 9.10: POST /api/quiz/submit
//   Input: { answers: [{question_code, answer_code}] }
//   (customer_id wird aus der Session gezogen — nicht vom Client; sonst kann
//    jeder fuer beliebige Customer Antworten einreichen.)
//   Aktion:
//     - Antworten in quiz_answers persistieren (via persistQuizForCurrentUser)
//     - classify_taste_type aequivalent (Score-Berechnung, max-scores, primary)
//     - customers.taste_type_id setzen
//     - Embedding-Generation triggern (in persistQuizForCurrentUser drin)
//   Output: { taste_type_id, confidence, type_name, type_description }

const BodySchema = z.object({
  answers: z
    .array(
      z.object({
        question_code: z.string().min(1).max(64),
        answer_code: z.string().min(1).max(64),
      })
    )
    .min(1)
    .max(50),
});

export async function POST(req: NextRequest) {
  let parsed: z.infer<typeof BodySchema>;
  try {
    const json = await req.json();
    parsed = BodySchema.parse(json);
  } catch (err) {
    return NextResponse.json(
      { error: "invalid_body", details: err instanceof z.ZodError ? err.issues : String(err) },
      { status: 400 }
    );
  }

  // Auth-Check: nur eingeloggte User duerfen Quiz absenden.
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const tasteTypeId = await persistQuizForCurrentUser(parsed.answers);
    if (tasteTypeId == null) {
      return NextResponse.json({ error: "quiz_processing_failed" }, { status: 500 });
    }

    // Geschmackstyp-Metadaten + frisch gesetzte Confidence laden.
    const [typeResult, customerResult] = await Promise.all([
      supabase
        .from("taste_types")
        .select("id, name_de, description_de")
        .eq("id", tasteTypeId)
        .maybeSingle(),
      supabase
        .from("customers")
        .select("confidence")
        .eq("auth_user_id", auth.user.id)
        .maybeSingle(),
    ]);

    return NextResponse.json({
      taste_type_id: tasteTypeId,
      type_name: typeResult.data?.name_de ?? null,
      type_description: typeResult.data?.description_de ?? null,
      confidence: customerResult.data?.confidence ?? null,
    });
  } catch (err) {
    console.error("[api/quiz/submit] error", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
