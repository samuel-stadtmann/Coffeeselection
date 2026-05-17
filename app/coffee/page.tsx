import Link from "next/link";
import type { Metadata } from "next";
import { getCoffees } from "@/lib/db/coffees";
import CoffeeShopView from "./CoffeeShopView";

const LOGO = "/logo.png";

export const metadata: Metadata = {
  title: "Alle Specialty Coffees — Schweizer Auswahl | Coffee Selection",
  description:
    "Für dich kuratierte Specialty Coffees aus Schweizer Top-Röstereien. Filter nach Zubereitung, Röstung und Geschmack — oder mach das Quiz.",
  keywords: [
    "specialty coffee schweiz",
    "kaffeeauswahl",
    "kaffee online kaufen schweiz",
  ],
};

export default async function CoffeesOverviewPage() {
  const allCoffees = await getCoffees();
  return (
    <div className="bg-[#F9F5F0] text-on-surface pb-20 md:pb-0">
      <header className="fixed top-0 w-full z-50 h-20 md:h-24 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5">
        <nav className="flex justify-between items-center gap-3 h-full max-w-7xl mx-auto px-6 md:px-8 w-full">
          <Link
            href="/"
            className="flex items-center shrink-0 h-full overflow-hidden"
          >
            <img
              alt="Coffee Selection"
              className="h-12 sm:h-14 md:h-16 lg:h-20 w-auto object-contain object-left shrink-0"
              src={LOGO}
            />
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
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-12 md:py-16 text-center">
          <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-6 block">
            Alle Coffees
          </span>
          <h1 className="text-4xl md:text-6xl text-primary leading-[1.1] mb-6 font-headline font-bold uppercase tracking-tight max-w-4xl mx-auto">
            Specialty Coffee<br />
            nach deinem Geschmack
          </h1>
          <p className="text-lg text-on-surface-variant leading-relaxed max-w-2xl mx-auto">
            Für dich kuratierte Specialty Coffees aus Schweizer Top-Röstereien.
            Filter nach Kategorie oder mach das Quiz.
          </p>
        </section>

        <CoffeeShopView coffees={allCoffees} />

        {/* CTA */}
        <section className="bg-primary text-on-primary py-20">
          <div className="max-w-3xl mx-auto px-6 md:px-8 text-center">
            <h2 className="text-3xl md:text-4xl mb-6 uppercase tracking-tight font-headline font-bold">
              Quiz statt Stöbern
            </h2>
            <Link
              href="/quiz/question-1-brewing-method"
              className="inline-block bg-tertiary text-primary px-12 py-5 font-headline font-bold text-xs uppercase tracking-widest hover:bg-white transition-all"
            >
              Quiz starten · 60 Sek
            </Link>
          </div>
        </section>
      </main>

      <footer className="w-full px-6 md:px-8 bg-[#F9F5F0] border-t border-primary/5 py-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] text-on-surface-variant/60 font-headline font-bold uppercase tracking-[0.3em]">
          <Link href="/" className="flex items-center">
            <img
              alt="Coffee Selection"
              className="h-14 md:h-20 w-auto object-contain"
              src={LOGO}
            />
          </Link>
          <span>© 2024 Coffee Selection · Handverlesen aus der Schweiz</span>
        </div>
      </footer>
    </div>
  );
}
