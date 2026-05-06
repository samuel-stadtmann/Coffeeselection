import Link from "next/link";
import QuizNav from "@/components/QuizNav";

export default function MatchingPage() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <QuizNav step={7} totalSteps={7} progress={100} backHref="/quiz/usage-moment" />

      <main className="pt-24 pb-32 px-4 flex flex-col items-center justify-center min-h-screen">
        <div className="max-w-xl w-full mx-auto flex flex-col items-center text-center">

          {/* Complete Ring */}
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
                task_alt
              </span>
            </div>
          </div>

          <h1 className="font-headline font-serif text-3xl text-on-surface mb-4">
            Match gefunden!
          </h1>

          <p className="text-on-surface-variant font-sans text-base mb-8 leading-relaxed">
            Dein Geschmacksprofil wurde erfolgreich ausgewertet. Dein perfekter Kaffee wartet auf dich.
          </p>

          <div className="inline-flex items-center gap-2 bg-secondary-container text-on-surface text-sm font-label font-semibold px-4 py-2 rounded-full mb-10">
            <span className="material-symbols-outlined text-base">verified</span>
            Perfekter Match:&nbsp;<span className="text-secondary">Vibrant Explorer</span>
          </div>

          <Link
            href="/match-result"
            className="w-full py-5 bg-primary text-white font-label font-semibold rounded-xl uppercase tracking-widest text-sm text-center block"
          >
            Ergebnis anzeigen
          </Link>
        </div>
      </main>
    </div>
  );
}
