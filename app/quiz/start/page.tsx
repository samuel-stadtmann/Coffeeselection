import Link from "next/link";
import type { Metadata } from "next";
import { QuizHeader } from "@/components/QuizShell";

export const metadata: Metadata = {
  title: "Kaffee-Quiz starten — Coffee Selection",
  description: "12 Fragen, 60 Sekunden. Finde heraus, welcher der 8 Coffee-Geschmackstypen du bist und erhalte deinen perfekten Specialty Coffee.",
};

const HERO =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBvySg3Uf4lIr5-6yDourpO1iHmSl4aNwlTw2vUqWLLsXTR2owxYQPnvYY_fGQw_8MJ9gOoVJhPLdSiywoMPlVXb7ydqT4-EEd-jaiFKi-e6hih5dYFPY2wSZ2XMGoSz2v_4EtSVrvraFIhMMMZzbDxXU9oJz1R1q56fSmCRpqUcuecTpmR7u1k7iIxHHSsZG1oRzB_ABrePOMz1akMTgJjZDheHKafFnhGYLfXzk4J4-0t1M3WMYJhXqzL6gGeg_YgCV3AVKxNlw";

export default function QuizStartPage() {
  return (
    <div className="bg-[#F9F5F0] min-h-screen flex flex-col">
      <QuizHeader />
      <main className="flex-1 flex items-center justify-center pt-36 md:pt-40 pb-16 px-6 md:px-8">
        <div className="max-w-5xl w-full grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-6 block">
              Coffee Personality Quiz
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl text-primary leading-[1.1] mb-6 font-headline font-bold uppercase tracking-tight">
              Bereit für<br />deinen Match?
            </h1>
            <p className="text-lg text-on-surface-variant leading-relaxed mb-10 max-w-lg">
              12 Fragen. 60 Sekunden. Wir klassifizieren dich präzise in einen der 8 Geschmackstypen und matchen dich mit deinem perfekten Schweizer Specialty Coffee.
            </p>
            <div className="space-y-4 mb-10">
              {[
                { icon: "schedule", text: "Nur 60 Sekunden für eine personalisierte Empfehlung" },
                { icon: "psychology", text: "Wissenschaftlich fundiertes Matching-System" },
                { icon: "verified_user", text: "Keine Kreditkarte nötig — komplett kostenlos" },
              ].map((f) => (
                <div key={f.text} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-tertiary/10 text-tertiary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl">{f.icon}</span>
                  </div>
                  <p className="text-sm text-on-surface-variant">{f.text}</p>
                </div>
              ))}
            </div>
            <Link
              href="/quiz/question-1-brewing-method"
              className="inline-block bg-primary text-on-primary px-12 py-5 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all"
            >
              Quiz starten →
            </Link>
            <p className="mt-6 font-headline text-[10px] uppercase tracking-[0.3em] text-on-surface-variant">
              Keine Anmeldung erforderlich · DSGVO-konform
            </p>
          </div>
          <div className="relative">
            <div className="aspect-square overflow-hidden shadow-2xl">
              <img alt="Specialty Coffee" className="w-full h-full object-cover" src={HERO} />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-tertiary text-white p-6 md:p-8 z-20 shadow-2xl">
              <p className="font-headline font-bold text-4xl md:text-5xl mb-1">12</p>
              <p className="font-headline text-[10px] uppercase tracking-widest leading-tight">Fragen<br />zu deinem Match</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
