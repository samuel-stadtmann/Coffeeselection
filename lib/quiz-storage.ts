/**
 * localStorage-Persistenz für Quiz-Antworten während User noch nicht
 * eingeloggt ist. Wird nach erfolgreicher Persistierung in DB gelöscht.
 */

const KEY = "cs_quiz_answers_v1";

export type LocalQuizAnswer = {
  question_code: string;
  answer_code: string;
};

export function setLocalAnswer(question_code: string, answer_code: string) {
  if (typeof window === "undefined") return;
  const all = getLocalAnswers();
  const next = all.filter((a) => a.question_code !== question_code);
  next.push({ question_code, answer_code });
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function getLocalAnswers(): LocalQuizAnswer[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((a) => a && a.question_code && a.answer_code);
  } catch {
    return [];
  }
}

export function getLocalAnswerFor(question_code: string): string | null {
  return getLocalAnswers().find((a) => a.question_code === question_code)?.answer_code ?? null;
}

export function clearLocalAnswers() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
