import Link from "next/link";
import type { Metadata } from "next";
import { comparisons } from "@/lib/comparisons";

const LOGO = "/logo.png";

export const metadata: Metadata = {
  title: "Coffee Compare — Specialty Coffee Vergleiche | Coffee Selection",
  description: "Filter vs. Espresso, hell vs. dunkel, Arabica vs. Robusta — die wichtigsten Specialty-Coffee-Vergleiche im Überblick.",
  keywords: ["kaffee vergleich", "coffee comparison", "kaffee unterschied", "specialty coffee vergleich"],
};

export default function ComparePage() {
  return (
    <div className="bg-[#F9F5F0] text-on-surface pb-20 md:pb-0">
      <header className="fixed top-0 w-full z-50 h-20 md:h-24 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5">
        <nav className="flex justify-between items-center gap-3 h-full max-w-7xl mx-auto px-6 md:px-8 w-full">
          <Link href="/" className="flex items-center shrink-0 h-full overflow-hidden">
            <img alt="Coffee Selection" className="h-12 sm:h-14 md:h-16 lg:h-20 w-auto object-contain object-left shrink-0" src={LOGO} />
          </Link>
          <Link
            href="/quiz/question-1-brewing-method"
            className="bg-primary text-white px-5 md:px-6 py-3 text-[11px] md:text-[12px] uppercase tracking-[0.2em] font-headline font-bold hover:bg-black transition-all"
          >
            Quiz starten
          </Link>
        </nav>
      </header>

      <main className="pt-20 md:pt-24">
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-12 md:py-16 text-center">
          <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-6 block">
            Coffee Compare
          </span>
          <h1 className="text-4xl md:text-6xl text-primary leading-[1.1] mb-6 font-headline font-bold uppercase tracking-tight max-w-4xl mx-auto">
            A vs. B — die wichtigsten<br />Coffee-Entscheidungen
          </h1>
          <p className="text-lg text-on-surface-variant leading-relaxed max-w-2xl mx-auto">
            Klare Vergleiche, keine Schönfärberei. Find heraus, was zu dir passt.
          </p>
        </section>

        <section className="max-w-7xl mx-auto px-6 md:px-8 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {comparisons.map((c) => (
              <Link
                key={c.slug}
                href={`/compare/${c.slug}`}
                className="group bg-white shadow-sm hover:shadow-2xl transition-all"
              >
                <div className="grid grid-cols-2">
                  {/* Side A */}
                  <div className="aspect-[4/3] relative overflow-hidden bg-surface-container-low">
                    <img src={c.a.image} alt={c.a.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <span className="material-symbols-outlined text-tertiary text-2xl block mb-1">{c.a.icon}</span>
                      <h4 className="font-headline font-bold text-white uppercase tracking-tight text-base">{c.a.name}</h4>
                    </div>
                  </div>
                  {/* Side B */}
                  <div className="aspect-[4/3] relative overflow-hidden bg-primary">
                    <img src={c.b.image} alt={c.b.name} className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 text-right">
                      <span className="material-symbols-outlined text-tertiary text-2xl block mb-1 ml-auto w-fit">{c.b.icon}</span>
                      <h4 className="font-headline font-bold text-white uppercase tracking-tight text-base">{c.b.name}</h4>
                    </div>
                  </div>
                  {/* VS overlay */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none hidden">
                    <span className="bg-tertiary text-primary w-12 h-12 flex items-center justify-center font-headline font-bold uppercase">VS</span>
                  </div>
                </div>
                <div className="p-6 md:p-8">
                  <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-xl group-hover:text-tertiary transition-colors mb-2">
                    {c.title}
                  </h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed mb-4">{c.subtitle}</p>
                  <span className="font-headline text-[10px] uppercase tracking-[0.3em] text-tertiary group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold">
                    Vergleich lesen <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-primary text-on-primary py-20">
          <div className="max-w-3xl mx-auto px-6 md:px-8 text-center">
            <h2 className="text-3xl md:text-4xl mb-6 uppercase tracking-tight font-headline font-bold">
              Du brauchst keine Vergleiche — du brauchst dein Match.
            </h2>
            <p className="text-lg text-on-primary/70 mb-10">12 Fragen, dein Geschmackstyp, dein perfekter Kaffee.</p>
            <Link
              href="/quiz/question-1-brewing-method"
              className="inline-block bg-tertiary text-primary px-12 py-5 font-headline font-bold text-xs uppercase tracking-widest hover:bg-white transition-all"
            >
              Quiz starten
            </Link>
          </div>
        </section>
      </main>

      <footer className="w-full px-6 md:px-8 bg-[#F9F5F0] border-t border-primary/5 py-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] text-on-surface-variant/60 font-headline font-bold uppercase tracking-[0.3em]">
          <Link href="/" className="flex items-center">
            <img alt="Coffee Selection" className="h-14 md:h-20 w-auto object-contain" src={LOGO} />
          </Link>
          <span>© 2024 Coffee Selection · Handverlesen aus der Schweiz</span>
        </div>
      </footer>
    </div>
  );
}
