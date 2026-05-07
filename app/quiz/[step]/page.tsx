"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import { QuizHeader } from "@/components/QuizShell";
import { quizQuestionBySlug, nextQuizSlug, prevQuizSlug, totalQuizSteps } from "@/lib/quiz";

export default function QuizQuestionPage({ params }: { params: Promise<{ step: string }> }) {
  const router = useRouter();
  const { step: slug } = use(params);
  const question = quizQuestionBySlug(slug);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (question && typeof window !== "undefined") {
      const stored = localStorage.getItem(`quiz_${question.slug}`);
      if (stored) setSelected(stored);
    }
  }, [question]);

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

  const handleSelect = (id: string) => {
    setSelected(id);
    if (typeof window !== "undefined") localStorage.setItem(`quiz_${question.slug}`, id);
  };

  const handleNext = () => {
    if (!selected) return;
    const next = nextQuizSlug(question.slug);
    router.push(next ? `/quiz/${next}` : "/quiz/loading-match");
  };

  const handleBack = () => {
    const prev = prevQuizSlug(question.slug);
    router.push(prev ? `/quiz/${prev}` : "/quiz/start");
  };

  return (
    <div className="bg-[#F9F5F0] min-h-screen flex flex-col">
      <QuizHeader step={question.step} totalSteps={totalQuizSteps} />

      <main className="flex-1 flex flex-col pt-24 md:pt-28 pb-32">
        <div className="max-w-4xl mx-auto px-6 md:px-8 w-full flex-1 flex flex-col">
          {/* Question */}
          <div className="mb-10 md:mb-14">
            <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
              Schritt {question.step} / {totalQuizSteps}
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl text-primary leading-[1.2] font-headline font-bold uppercase tracking-tight mb-4 break-words">
              {question.title}
            </h1>
            {question.subtitle && (
              <p className="text-base md:text-lg text-on-surface-variant max-w-2xl leading-relaxed">
                {question.subtitle}
              </p>
            )}
          </div>

          {/* Options — uniform 2-col grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 flex-1">
            {question.options.map((opt) => {
              const isSelected = selected === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(opt.id)}
                  className={`group text-left p-6 md:p-7 transition-all duration-200 border-l-4 ${
                    isSelected
                      ? "bg-primary text-on-primary border-tertiary shadow-xl"
                      : "bg-white text-primary border-tertiary/0 hover:border-tertiary hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-lg md:text-xl uppercase tracking-tight font-headline font-bold mb-1 ${isSelected ? "text-on-primary" : "text-primary"}`}>
                        {opt.label}
                      </h3>
                      {opt.description && (
                        <p className={`text-sm leading-relaxed ${isSelected ? "text-on-primary/70" : "text-on-surface-variant"}`}>
                          {opt.description}
                        </p>
                      )}
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

      {/* Sticky Footer Nav */}
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
            {totalQuizSteps - question.step > 0
              ? `Noch ${totalQuizSteps - question.step} ${totalQuizSteps - question.step === 1 ? "Frage" : "Fragen"}`
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
            {question.step === totalQuizSteps ? "Match finden" : "Weiter"}
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
