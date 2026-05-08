import Link from "next/link";
import type { Metadata } from "next";
import { tasteTypes } from "@/lib/taste-types";

const LOGO = "/logo.png";

export const metadata: Metadata = {
  title: "Die 8 Geschmackstypen — Coffee Selection",
  description: "Vom Klassiker bis zum Entdecker. Finde deinen Coffee-Geschmackstyp und entdecke passende Schweizer Specialty Coffees.",
  keywords: ["geschmackstypen kaffee", "kaffee personality", "coffee taste types", "specialty coffee schweiz"],
};

export default function TasteTypesOverviewPage() {
  return (
    <div className="bg-[#F9F5F0] text-on-surface pb-20 md:pb-0">
      <header className="fixed top-0 w-full z-50 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5">
        <nav className="flex justify-between items-center max-w-7xl mx-auto px-6 md:px-8 w-full">
          <Link href="/" className="flex items-center">
            <img alt="Coffee Selection" className="h-72 md:h-96 w-auto object-contain -my-16 md:-my-24 mr-8 shrink-0" src={LOGO} />
          </Link>
          <Link
            href="/quiz/start"
            className="bg-primary text-white px-5 md:px-6 py-3 text-[11px] md:text-[12px] uppercase tracking-[0.2em] font-headline font-bold hover:bg-black transition-all"
          >
            Quiz starten
          </Link>
        </nav>
      </header>

      <main className="pt-44 md:pt-56">
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-24 text-center">
          <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-6 block">
            Die Coffee Selection Methode
          </span>
          <h1 className="text-4xl md:text-6xl text-primary leading-[1.1] mb-8 font-headline font-bold max-w-3xl mx-auto">
            8 Geschmackstypen.<br />Ein perfekter Kaffee.
          </h1>
          <p className="text-lg text-on-surface-variant leading-relaxed mb-10 max-w-2xl mx-auto">
            Wir haben Tausende Kaffeegenuss-Profile analysiert und 8 archetypische Typen identifiziert. Finde deinen.
          </p>
          <Link
            href="/quiz/start"
            className="inline-block bg-primary text-on-primary px-10 py-5 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all"
          >
            Quiz starten · 60 Sek
          </Link>
        </section>

        <section className="max-w-7xl mx-auto px-6 md:px-8 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {tasteTypes.map((t) => (
              <Link
                key={t.slug}
                href={`/taste-types/${t.slug}`}
                className="group bg-white p-8 md:p-10 shadow-sm hover:shadow-xl transition-all border-l-4 border-tertiary/0 hover:border-tertiary"
              >
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-tertiary/10 group-hover:bg-tertiary text-tertiary group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                    <span className="material-symbols-outlined text-3xl">{t.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl md:text-2xl text-primary mb-2 uppercase tracking-tight font-headline font-bold">
                      {t.name}
                    </h2>
                    <p className="font-headline text-tertiary uppercase tracking-widest text-xs mb-4">{t.tagline}</p>
                    <p className="text-sm text-on-surface-variant leading-relaxed mb-4">{t.heroDesc}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {t.aromas.slice(0, 3).map((a) => (
                        <span key={a} className="font-headline text-[9px] uppercase tracking-widest text-on-surface-variant bg-surface-container-low px-2 py-1">
                          {a}
                        </span>
                      ))}
                    </div>
                    <span className="font-headline text-[10px] uppercase tracking-[0.3em] text-tertiary opacity-0 group-hover:opacity-100 transition-opacity">
                      Mehr erfahren →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="w-full px-6 md:px-8 bg-[#F9F5F0] border-t border-primary/5 py-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] text-on-surface-variant/60 font-headline font-bold uppercase tracking-[0.3em]">
          <Link href="/" className="flex items-center">
            <img alt="Coffee Selection" className="h-40 md:h-56 w-auto object-contain" src={LOGO} />
          </Link>
          <span>© 2024 Coffee Selection · Handverlesen aus der Schweiz</span>
        </div>
      </footer>

      <Link
        href="/quiz/start"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-primary text-on-primary py-5 text-center font-headline font-bold uppercase tracking-widest text-xs shadow-2xl border-t-2 border-tertiary"
      >
        Quiz starten · 60 Sek
      </Link>
    </div>
  );
}
