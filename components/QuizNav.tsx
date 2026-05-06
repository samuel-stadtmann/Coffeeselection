import Link from "next/link";

interface QuizNavProps {
  step: number;
  totalSteps: number;
  onClose?: string;
  backHref?: string;
  progress?: number;
}

export default function QuizNav({ step, totalSteps, onClose = "/", progress: progressProp }: QuizNavProps) {
  const progress = progressProp ?? (step / totalSteps) * 100;
  return (
    <header className="fixed top-0 w-full z-50 bg-[#F9F5F0]/90 backdrop-blur-md">
      <div className="flex justify-between items-center px-6 py-4 w-full max-w-7xl mx-auto h-20">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-2xl">coffee</span>
          <span className="text-xl font-headline font-bold tracking-widest text-primary uppercase">
            Coffee Selection
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <span className="font-label tracking-[0.2em] uppercase text-[10px] font-bold text-secondary">
            Step {String(step).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}
          </span>
        </div>
        <Link href={onClose} className="p-2 text-primary hover:opacity-70 transition-all">
          <span className="material-symbols-outlined">close</span>
        </Link>
      </div>
      <div className="w-full h-[1px] bg-outline-variant/30">
        <div
          className="h-full bg-secondary transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </header>
  );
}
