"use client";
import Link from "next/link";

const LOGO = "/logo.png";

export function QuizHeader({ step, totalSteps }: { step?: number; totalSteps?: number }) {
  const progress = step && totalSteps ? (step / totalSteps) * 100 : 0;
  return (
    // Einheitlicher Header: feste Hoehe h-20 md:h-24, Logo via
    // overflow-hidden beschnitten. Konsistent mit Home + AccountLayout.
    <header className="fixed top-0 w-full z-50 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5">
      <div className="flex justify-between items-center h-20 md:h-24 overflow-hidden max-w-7xl mx-auto px-6 md:px-8 w-full">
        <Link href="/" className="flex items-center shrink-0">
          <img alt="Coffee Selection" className="h-36 md:h-44 w-auto object-contain shrink-0" src={LOGO} />
        </Link>
        {step && totalSteps && (
          <div className="hidden md:block font-headline text-[11px] uppercase tracking-[0.3em] text-on-surface-variant font-bold">
            Frage {String(step).padStart(2, "0")} von {String(totalSteps).padStart(2, "0")}
          </div>
        )}
        <Link href="/" className="font-headline text-[11px] uppercase tracking-[0.3em] text-primary hover:text-tertiary transition-colors flex items-center gap-2 shrink-0">
          <span className="material-symbols-outlined text-base">close</span>
          <span className="hidden sm:inline">Beenden</span>
        </Link>
      </div>
      {typeof progress === "number" && progress > 0 && (
        <div className="w-full h-[3px] bg-surface-container">
          <div className="h-full bg-tertiary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
      )}
    </header>
  );
}
