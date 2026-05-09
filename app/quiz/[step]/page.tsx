"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import { QuizHeader } from "@/components/QuizShell";
import { createClient } from "@/lib/supabase/client";
import { setLocalAnswer, getLocalAnswerFor } from "@/lib/quiz-storage";

type Option = { question_code: string; answer_code: string; position: number; text_de: string };
type Question = { question_code: string; position: number; text_de: string };

const TOTAL_STEPS = 12;

function positionFromSlug(slug: string): number | null {
  const m = slug.match(/^question-(\d+)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n >= 1 && n <= TOTAL_STEPS ? n : null;
}

function slugForQuestion(question_code: string, position: number): string {
  const part = question_code.replace(/^Q\d+_/, "").replace(/_/g, "-");
  return `question-${position}-${part}`;
}

export default function QuizQuestionPage({ params }: { params: Promise<{ step: string }> }) {
  const router = useRouter();
  const { step: slug } = use(params);
  const position = positionFromSlug(slug);

  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [question, setQuestion] = useState<Question | null>(null);
  const [options, setOptions] = useState<Option[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (position == null) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    (async () => {
      const [{ data: questions }, { data: opts }] = await Promise.all([
        supabase
          .from("quiz_questions")
          .select("question_code, position, text_de")
          .eq("is_active", true)
          .order("position"),
        supabase
          .from("quiz_options")
          .select("question_code, answer_code, position, text_de")
          .eq("is_active", true)
          .order("position"),
      ]);
      const qList = (questions ?? []) as Question[];
      setAllQuestions(qList);
      const q = qList.find((x) => x.position === position) ?? null;
      setQuestion(q);
      setOptions(((opts ?? []) as Option[]).filter((o) => o.question_code === q?.question_code));
      if (q) {
        const stored = getLocalAnswerFor(q.question_code);
        if (stored) setSelected(stored);
      }
      setLoading(false);
    })();
  }, [position]);

  if (loading) {
    return (
      <div className="bg-[#F9F5F0] min-h-screen flex flex-col">
        <QuizHeader step={position ?? 1} totalSteps={TOTAL_STEPS} />
        <main className="flex-1 flex items-center justify-center pt-36 md:pt-40">
          <p className="text-on-surface-variant">Lade Frage…</p>
        </main>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F5F0] p-6">
        <div className="text-center">
          <h1 className="font-headline font-bold text-2xl text-primary mb-4 uppercase">Frage nicht gefunden</h1>
          <Link href="/quiz/start" className="font-headline text-xs uppercase tracking-widest text-tertiary hover:text-primary border-b-2 border-tertiary pb-1">
            Zum Quiz-Start
          </Link>
        </div>
      </div>
    );
  }

  const handleSelect = (answer_code: string) => {
    setSelected(answer_code);
    setLocalAnswer(question.question_code, answer_code);
  };

  const handleNext = () => {
    if (!selected) return;
    const nextQuestion = allQuestions.find((q) => q.position === question.position + 1);
    if (nextQuestion) {
      router.push(`/quiz/${slugForQuestion(nextQuestion.question_code, nextQuestion.position)}`);
    } else {
      router.push("/quiz/loading-match");
    }
  };

  const handleBack = () => {
    const prevQuestion = allQuestions.find((q) => q.position === question.position - 1);
    if (prevQuestion) {
      router.push(`/quiz/${slugForQuestion(prevQuestion.question_code, prevQuestion.position)}`);
    } else {
      router.push("/quiz/start");
    }
  };

  return (
    <div className="bg-[#F9F5F0] min-h-screen flex flex-col">
      <QuizHeader step={question.position} totalSteps={TOTAL_STEPS} />

      <main className="flex-1 flex flex-col pt-36 md:pt-40 pb-32">
        <div className="max-w-4xl mx-auto px-6 md:px-8 w-full flex-1 flex flex-col">
          <div className="mb-10 md:mb-14">
            <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
              Schritt {question.position} / {TOTAL_STEPS}
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl text-primary leading-[1.2] font-headline font-bold uppercase tracking-tight mb-4 break-words">
              {question.text_de}
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 flex-1">
            {options.map((opt) => {
              const isSelected = selected === opt.answer_code;
              return (
                <button
                  key={opt.answer_code}
                  onClick={() => handleSelect(opt.answer_code)}
                  className={`group text-left p-6 md:p-7 transition-all duration-200 border-l-4 ${
                    isSelected
                      ? "bg-primary text-on-primary border-tertiary shadow-xl"
                      : "bg-white text-primary border-tertiary/0 hover:border-tertiary hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-lg md:text-xl uppercase tracking-tight font-headline font-bold ${isSelected ? "text-on-primary" : "text-primary"}`}>
                        {opt.text_de}
                      </h3>
                    </div>
                    <div className={`w-6 h-6 border-2 shrink-0 mt-1 flex items-center justify-center transition-all ${
                      isSelected ? "bg-tertiary border-tertiary" : "border-tertiary/30 group-hover:border-tertiary"
                    }`}>
                      {isSelected && <span className="material-symbols-outlined text-white text-base">check</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 w-full z-40 bg-[#F9F5F0]/95 backdrop-blur-md border-t border-primary/10">
        <div className="max-w-4xl mx-auto px-6 md:px-8 py-4 md:py-5 flex justify-between items-center gap-4">
          <button
            onClick={handleBack}
            className="font-headline text-[11px] uppercase tracking-[0.2em] text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2 font-bold"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span className="hidden sm:inline">Zurück</span>
          </button>
          <div className="hidden md:block text-on-surface-variant text-xs">
            {TOTAL_STEPS - question.position > 0
              ? `Noch ${TOTAL_STEPS - question.position} ${TOTAL_STEPS - question.position === 1 ? "Frage" : "Fragen"}`
              : "Letzte Frage"}
          </div>
          <button
            onClick={handleNext}
            disabled={!selected}
            className={`px-8 md:px-10 py-3 md:py-4 font-headline font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
              selected
                ? "bg-primary text-on-primary hover:bg-black"
                : "bg-surface-container text-on-surface-variant cursor-not-allowed"
            }`}
          >
            {question.position === TOTAL_STEPS ? "Match finden" : "Weiter"}
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
