"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { QuizHeader } from "@/components/QuizShell";

export default function LoadingMatchPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.push("/login?next=/match-result"), 3500);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="bg-[#F9F5F0] min-h-screen flex flex-col">
      <QuizHeader step={12} totalSteps={12} />
      <main className="flex-1 flex items-center justify-center pt-24 px-6">
        <div className="max-w-xl w-full text-center">
          <div className="w-32 h-32 mx-auto mb-10 relative">
            <svg className="w-full h-full -rotate-90 animate-pulse" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" stroke="rgba(212, 160, 23, 0.15)" strokeWidth="3" fill="none" />
              <circle cx="50" cy="50" r="46" stroke="#D4A017" strokeWidth="3" fill="none" strokeDasharray="289" strokeDashoffset="0" className="animate-spin origin-center" style={{ animationDuration: "2s" }}>
                <animate attributeName="stroke-dashoffset" from="289" to="0" dur="2.5s" fill="freeze" />
              </circle>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-tertiary text-5xl">coffee</span>
            </div>
          </div>
          <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
            Algorithmus läuft
          </span>
          <h1 className="text-3xl md:text-4xl text-primary leading-tight mb-6 font-headline font-bold uppercase tracking-tight">
            Wir analysieren deine Antworten
          </h1>
          <p className="text-base text-on-surface-variant leading-relaxed mb-8">
            Unser Sommelier-System vergleicht dein Profil mit hunderten Schweizer Röstungen und findet dein präzises Match.
          </p>
          <div className="space-y-3 max-w-xs mx-auto text-left">
            {[
              { label: "Geschmacksprofil analysieren", delay: 0 },
              { label: "Geschmackstyp klassifizieren", delay: 800 },
              { label: "Beste Kaffees matchen", delay: 1800 },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3 text-sm">
                <span className="material-symbols-outlined text-tertiary text-base animate-pulse" style={{ animationDelay: `${s.delay}ms` }}>check_circle</span>
                <span className="text-on-surface-variant font-headline text-[11px] uppercase tracking-widest font-bold">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
