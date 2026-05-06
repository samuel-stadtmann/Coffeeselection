import Link from "next/link";
import QuizNav from "@/components/QuizNav";
import Footer from "@/components/Footer";

const IMG_COFFEE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDSb4m6IGOUeMwA4Yg9ULM6o03fNDEOBwl5QFpTistR845sK9zaWSx38ve29l3nhbEam7NGDdwLdqqZ1rXkSi7xLsfJ4-hQmUkdVf6CrdYBtPIBEREwGTBm0a0UQWDANAA-CpXQJqmW2Scx7j0sP98X_gTaK6MO3z0jiBenMOymOD8FKr2AubntZfPypvUL7FF0nX7rliGh792VC74TpGapin2Cgv-ByVBHBu2HJs6dVpE96gcBmWFm5agCUeGaT6UaBg5woxih6WH2";

export default function QuizStartPage() {
  return (
    <div className="min-h-screen flex flex-col font-body bg-[#F9F5F0]">
      <QuizNav step={0} totalSteps={7} onClose="/" />

      <main className="flex-grow flex items-center justify-center pt-32 pb-24 px-6">
        <div className="max-w-5xl w-full grid md:grid-cols-2 gap-16 md:gap-24 items-center">
          {/* Quiz Intro Content */}
          <div className="order-1 space-y-10 flex flex-col justify-center">
            <div className="space-y-6">
              <span className="font-label text-secondary tracking-[0.3em] uppercase text-[10px] font-bold block">
                The Sommelier Quiz
              </span>
              <h1 className="font-headline text-4xl md:text-6xl font-normal text-primary leading-[1.15] tracking-tight">
                Bist du bereit für deinen perfekten Kaffee?
              </h1>
              <p className="text-primary/70 text-lg md:text-xl font-light leading-relaxed tracking-wide">
                Entdecke durch unsere kuratierte Analyse genau die Röstungen, die harmonisch zu
                deinem individuellen Geschmacksprofil und deinen Brühmethoden passen.
              </p>
            </div>

            <div className="space-y-8 pt-4">
              {[
                {
                  icon: "bolt",
                  title: "Schnell & Präzise",
                  desc: "Nur 2 Minuten für eine personalisierte Empfehlung.",
                },
                {
                  icon: "verified",
                  title: "Experten-Matching",
                  desc: "Basierend auf den Profilen unserer Schweizer Röstmeister.",
                },
                {
                  icon: "favorite",
                  title: "Persönlich",
                  desc: "Dein Profil verbessert sich mit jeder Bewertung.",
                },
              ].map((f) => (
                <div key={f.title} className="flex items-start gap-6">
                  <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-xl">{f.icon}</span>
                  </div>
                  <div className="pt-1">
                    <h3 className="font-headline text-sm font-bold text-primary uppercase tracking-[0.15em] mb-1">
                      {f.title}
                    </h3>
                    <p className="text-sm text-primary/60 font-light leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-8">
              <Link
                href="/quiz/brewing-method"
                className="group relative inline-flex items-center justify-center px-12 py-6 font-label font-bold text-white bg-primary rounded-lg overflow-hidden transition-all duration-300 active:scale-95 shadow-2xl shadow-primary/20"
              >
                <span className="relative z-10 flex items-center gap-4 tracking-[0.25em] uppercase text-xs">
                  Quiz starten
                  <span className="material-symbols-outlined text-sm transform group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </span>
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <p className="mt-6 text-[10px] font-label text-primary/40 uppercase tracking-[0.2em]">
                Keine Anmeldung erforderlich. Kostenlos &amp; Unverbindlich.
              </p>
            </div>
          </div>

          {/* Visual */}
          <div className="order-2 relative group">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl shadow-primary/5 bg-surface-container">
              <img
                src={IMG_COFFEE}
                alt="Coffee Brewing"
                className="w-full h-full object-cover grayscale-[0.1] group-hover:scale-105 transition-transform duration-[2000ms] ease-out"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-surface-container-low text-primary/60 font-label text-[10px] uppercase tracking-[0.25em] px-8 py-5 rounded-lg shadow-xl border border-white/40 backdrop-blur-sm">
              Swiss Made Quality
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
