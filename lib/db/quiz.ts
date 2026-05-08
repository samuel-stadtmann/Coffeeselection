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

  // 1) quiz_responses anlegen
  const { data: response, error: respErr } = await supabase
    .from("quiz_responses")
    .insert({
      customer_id: customer.id,
      version: "v1",
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

  // Confidence = Score / max_score pro Typ
  const { data: maxScores } = await supabase
    .from("taste_type_max_scores")
    .select("taste_type_id, max_score")
    .eq("quiz_version", "v1");
  const maxByType = new Map<number, number>(
    (maxScores ?? []).map((m) => [m.taste_type_id, m.max_score])
  );

  const ranked = Array.from(sumByType.entries())
    .map(([type, score]) => {
      const max = maxByType.get(type) ?? 1;
      return { type, score, normalized: score / Math.max(max, 1) };
    })
    .sort((a, b) => b.normalized - a.normalized);

  if (ranked.length === 0) {
    console.error("No scoring matches — falling back to type 1");
    return null;
  }

  const primary = ranked[0];
  const secondary = ranked[1];
  const confidence = Number((primary.normalized * 100).toFixed(2));

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

  // 5) customers updaten
  await supabase
    .from("customers")
    .update({
      taste_type_id: primary.type,
      secondary_type: secondary?.type ?? null,
      confidence,
    })
    .eq("id", customer.id);

  return primary.type;
}
