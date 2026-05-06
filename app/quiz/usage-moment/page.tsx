import Link from "next/link";
import QuizNav from "@/components/QuizNav";

export default function UsageMomentPage() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <QuizNav step={6} totalSteps={7} progress={85} backHref="/quiz/exploration" />

      <main className="pt-24 pb-32 px-4 flex flex-col items-center justify-center min-h-screen">
        <div className="max-w-xl w-full mx-auto flex flex-col items-center text-center">

          {/* Progress Ring */}
          <div className="relative mb-8" style={{ width: 192, height: 192 }}>
            <svg width="192" height="192" viewBox="0 0 192 192" className="rotate-[-90deg]">
              <circle
                cx="96"
                cy="96"
                r="80"
                fill="none"
                stroke="#d5c3bb"
                strokeWidth="8"
              />
              <circle
                cx="96"
                cy="96"
                r="80"
                fill="none"
                stroke="#795900"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 80}`}
                strokeDashoffset="0"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary" style={{ fontSize: 56 }}>
                coffee
              </span>
            </div>
          </div>

          <h1 className="font-headline font-serif text-3xl text-on-surface mb-4">
            Wir finden deinen perfekten Match...
          </h1>

          {/* Analysis Badge */}
          <div className="inline-flex items-center gap-2 bg-secondary-container text-on-surface text-sm font-label font-semibold px-4 py-2 rounded-full mb-8">
            <span className="material-symbols-outlined text-base">manage_search</span>
            Analysiere dein Profil:&nbsp;<span className="text-secondary">Vibrant Explorer</span>
          </div>

          {/* Analysis Cards */}
          <div className="grid grid-cols-2 gap-4 w-full mb-8">
            <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant text-left">
              <span className="material-symbols-outlined text-secondary text-2xl mb-2 block">
                coffee_maker
              </span>
              <p className="text-on-surface-variant text-xs font-label uppercase tracking-wider mb-1">
                Methode
              </p>
              <p className="text-on-surface font-sans font-semibold text-sm leading-snug">
                V60 &amp; Pour Over Optimierung
              </p>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant text-left">
              <span className="material-symbols-outlined text-secondary text-2xl mb-2 block">
                psychology
              </span>
              <p className="text-on-surface-variant text-xs font-label uppercase tracking-wider mb-1">
                Geschmackssensorik
              </p>
              <p className="text-on-surface font-sans font-semibold text-sm leading-snug">
                Zitrische Säure &amp; Florale Noten
              </p>
            </div>
          </div>

          {/* Completion */}
          <div className="flex flex-col items-center">
            <span className="font-headline font-serif text-6xl text-secondary font-bold">
              100%
            </span>
            <p className="text-on-surface-variant font-label text-sm uppercase tracking-widest mt-1">
              Analyse Abgeschlossen
            </p>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-outline-variant px-6 py-4 flex items-center justify-between max-w-2xl mx-auto">
        <Link
          href="/quiz/exploration"
          className="w-14 h-14 rounded-full flex items-center justify-center opacity-30 cursor-not-allowed"
          aria-disabled
        >
          <span className="material-symbols-outlined text-on-surface text-2xl">arrow_back</span>
        </Link>

        <div className="flex flex-col items-center gap-1">
          <Link
            href="/quiz/matching"
            className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg"
          >
            <span className="material-symbols-outlined text-white text-2xl">arrow_forward</span>
          </Link>
          <span className="text-on-surface-variant text-xs font-label">Ergebnis anzeigen</span>
        </div>
      </div>
    </div>
  );
}
