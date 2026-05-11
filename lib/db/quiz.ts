import { createStaticClient } from "@/lib/supabase/static";
import { createClient } from "@/lib/supabase/server";

export type QuizOption = {
  question_code: string;
  answer_code: string;
  position: number;
  text_de: string;
};

export type QuizQuestion = {
  question_code: string;
  position: number;
  text_de: string;
  options: QuizOption[];
};

/** Build-Zeit / Cookie-loser Fetch für Quiz-Fragen + Optionen.
 *  Quiz-Daten sind public, daher anon-readable. */
export async function getQuizQuestions(): Promise<QuizQuestion[]> {
  const supabase = createStaticClient();
  if (!supabase) return [];
  const [{ data: questions }, { data: options }] = await Promise.all([
    supabase
      .from("quiz_questions")
      .select("question_code, position, text_de")
      .eq("is_active", true)
      .order("position", { ascending: true }),
    supabase
      .from("quiz_options")
      .select("question_code, answer_code, position, text_de")
      .eq("is_active", true)
      .order("position", { ascending: true }),
  ]);
  if (!questions) return [];
  return questions.map((q) => ({
    ...q,
    options: (options ?? []).filter((o) => o.question_code === q.question_code),
  })) as QuizQuestion[];
}

/** Liefert die Frage an Position N (1-basiert) plus deren Optionen. */
export async function getQuizQuestionAtPosition(position: number): Promise<QuizQuestion | null> {
  const all = await getQuizQuestions();
  return all.find((q) => q.position === position) ?? null;
}

/** Verarbeitet das komplette Quiz für einen eingeloggten User:
 *  schreibt response + answers, berechnet Scores, updatet customers.
 *  Returns the resulting taste_type_id (1–8) or null on failure. */
export async function persistQuizForCurrentUser(
  answers: { question_code: string; answer_code: string }[]
): Promise<number | null> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  // Customer-Row finden
  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", auth.user.id)
    .single();
  if (!customer) return null;

  // 0) Bestehende active deaktivieren (Unique-Constraint: one active per customer)
  await supabase
    .from("quiz_responses")
    .update({ is_active: false })
    .eq("customer_id", customer.id)
    .eq("is_active", true);

  // 1) quiz_responses anlegen
  const { data: response, error: respErr } = await supabase
    .from("quiz_responses")
    .insert({
      customer_id: customer.id,
      version: "v1.0",
      is_active: true,
    })
    .select("id")
    .single();
  if (respErr || !response) {
    console.error("quiz_responses insert failed", respErr);
    return null;
  }

  // 2) quiz_answers (12 Einträge)
  const answerRows = answers.map((a) => ({
    response_id: response.id,
    question_code: a.question_code,
    answer_code: a.answer_code,
    is_imputed: false,
  }));
  const { error: ansErr } = await supabase.from("quiz_answers").insert(answerRows);
  if (ansErr) {
    console.error("quiz_answers insert failed", ansErr);
    return null;
  }

  // 3) Score-Aggregation: Summe pro taste_type_id über alle gegebenen Antworten
  const codes = answers.map((a) => `${a.question_code}::${a.answer_code}`);
  const { data: scoringRules } = await supabase
    .from("quiz_scoring")
    .select("question_code, answer_code, taste_type_id, points");
  const matched = (scoringRules ?? []).filter((r) =>
    codes.includes(`${r.question_code}::${r.answer_code}`)
  );
  const sumByType = new Map<number, number>();
  for (const r of matched) {
    sumByType.set(r.taste_type_id, (sumByType.get(r.taste_type_id) ?? 0) + r.points);
  }

  const { data: maxScores } = await supabase
    .from("taste_type_max_scores")
    .select("taste_type_id, max_score, quiz_version");
  const maxByType = new Map<number, number>();
  (maxScores ?? []).forEach((m) => {
    const cur = maxByType.get(m.taste_type_id) ?? 0;
    if (m.max_score > cur) maxByType.set(m.taste_type_id, m.max_score);
  });

  const ranked = Array.from(sumByType.entries())
    .map(([type, score]) => {
      const max = maxByType.get(type);
      const fallbackMax = Math.max(...Array.from(sumByType.values()), 1);
      const denom = Math.max(max ?? fallbackMax, 1);
      const normalized = Math.min(1, score / denom);
      return { type, score, normalized };
    })
    .sort((a, b) => b.normalized - a.normalized);

  if (ranked.length === 0) {
    console.error("No scoring matches — falling back to type 1");
    return null;
  }

  const primary = ranked[0];
  const secondary = ranked[1];
  // confidence als 0–1 Fraktion mit 3 Nachkommastellen (NUMERIC(4,3))
  const confidence = Number(primary.normalized.toFixed(3));

  // 4) quiz_responses Resultat-Felder updaten
  await supabase
    .from("quiz_responses")
    .update({
      completed_at: new Date().toISOString(),
      taste_type_id: primary.type,
      secondary_type: secondary?.type ?? null,
      primary_score: primary.score,
      secondary_score: secondary?.score ?? null,
      confidence,
    })
    .eq("id", response.id);

  // 5) customers updaten — nur taste-type-Felder.
  //
  // NICHT abgeleitet: Frage 9 (Magen-Empfindlichkeit / Säuretoleranz).
  // Semantisch waere requires_decaf falsch — Saeure-Empfindlichkeit ist
  // NICHT gleich Koffein-Empfindlichkeit. Die richtige Mappung waere eine
  // neue Spalte `prefers_low_acidity` plus Integration in das Soft-Scoring
  // (Target-Profile-Adjustment). Bewusst aufgeschoben — separater PR.
  await supabase
    .from("customers")
    .update({
      taste_type_id: primary.type,
      secondary_type: secondary?.type ?? null,
      confidence,
    })
    .eq("id", customer.id);

  // 5b) Frage 1 (Bruehmethode) -> customer_brewing_methods (n:m mit Catalog).
  //     Mapping Quiz-answer_code -> brewing_methods_catalog.slug.
  //     Wir setzen genau einen Eintrag als is_primary=true (Partial Unique
  //     Index erlaubt nur einen).
  const brewingAnswer = answers.find(
    (a) => a.question_code === "question-1-brewing-method"
  )?.answer_code;
  const slugByAnswer: Record<string, string> = {
    vollautomat: "fully_auto",
    siebtraeger: "espresso",
    "v60-filter": "v60",
    "french-press": "frenchpress",
    "moka-pot": "moka",
  };
  const brewingSlug = brewingAnswer ? slugByAnswer[brewingAnswer] : undefined;
  if (brewingSlug) {
    // Catalog-ID nachschlagen
    const { data: bm } = await supabase
      .from("brewing_methods_catalog")
      .select("id")
      .eq("slug", brewingSlug)
      .maybeSingle();
    if (bm?.id) {
      // Bestehende primary deaktivieren (Re-Quiz-Fall)
      await supabase
        .from("customer_brewing_methods")
        .update({ is_primary: false })
        .eq("customer_id", customer.id)
        .eq("is_primary", true);
      // Upsert auf (customer_id, brewing_method_id)
      await supabase
        .from("customer_brewing_methods")
        .upsert(
          {
            customer_id: customer.id,
            brewing_method_id: bm.id,
            is_primary: true,
            frequency: "daily",
          },
          { onConflict: "customer_id,brewing_method_id" }
        );
    } else {
      console.warn(
        "[quiz] brewing_methods_catalog slug not found:",
        brewingSlug,
        "— customer_brewing_methods not updated"
      );
    }
  }

  // 6) Embedding-Generation triggern (fire-and-forget, blockiert die Quiz-Antwort nicht).
  //    Edge Function build-customer-embedding berechnet das taste_embedding aus
  //    embedding_seed_text + aroma_families des neuen Geschmackstyps.
  triggerCustomerEmbedding(customer.id).catch((err) => {
    console.error("[quiz] build-customer-embedding trigger failed", err);
  });

  return primary.type;
}

async function triggerCustomerEmbedding(customerId: string): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn("[quiz] supabase env vars missing — skipping embedding trigger");
    return;
  }
  const res = await fetch(`${url}/functions/v1/build-customer-embedding`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ customer_id: customerId }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`build-customer-embedding ${res.status}: ${body}`);
  }
}
