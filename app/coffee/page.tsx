import Link from "next/link";
import type { Metadata } from "next";
import { coffeeCategories } from "@/lib/coffee-categories";
import { getAllCoffees } from "@/lib/coffees";

const LOGO = "/logo.png";
const COFFEE_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC-mgzdszeDV-ADPnt08LksEtq5jHo_pZiXrnzVNy7faF7CAvNwCIqw0tZ2ylgRbHNuI-cdksgJ49bjfH36AYZerX9qRPq7kE2svCJ2KsLCMhI2k4Dc50D2D5FEGms1FJKDbeS75aSghLNY7Dop_dxhV5e-766gOscbYVVzn4qpX1rtPcumcDu7hr6OQeoiBzbRrze7HIkmFAM9YOYzQFzRF1wR3U1Ec53bS5Aj9xRlWvn7KxLIHJL79Wy6T8BFR47-ulGO1PjIJKEL";

export const metadata: Metadata = {
  title: "Alle Specialty Coffees — Schweizer Auswahl | Coffee Selection",
  description: "Alle Specialty Coffees auf einen Blick. Filter Coffee, Espresso, Helle Röstung, Säurearm, Fruchtig, Floral, Schokoladig, Süß.",
  keywords: ["specialty coffee schweiz", "kaffeeauswahl", "kaffee online kaufen schweiz"],
};

export default function CoffeesOverviewPage() {
  const allCoffees = getAllCoffees();
  return (
    <div className="bg-[#F9F5F0] text-on-surface pb-20 md:pb-0">
      <header className="fixed top-0 w-full z-50 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5">
        <nav className="flex justify-between items-center max-w-7xl mx-auto px-6 md:px-8 w-full">
          <Link href="/" className="flex items-center">
            <img alt="Coffee Selection" className="h-72 md:h-96 w-auto object-contain -my-16 md:-my-24 mr-8 shrink-0" src={LOGO} />
          </Link>
          <Link
            href="/quiz/question-1-brewing-method"
            className="bg-primary text-white px-5 md:px-6 py-3 text-[11px] md:text-[12px] uppercase tracking-[0.2em] font-headline font-bold hover:bg-black transition-all"
          >
            Quiz starten
          </Link>
        </nav>
      </header>

      <main className="pt-44 md:pt-56">
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-12 md:py-16 text-center">
          <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-6 block">
            Alle Coffees
          </span>
          <h1 className="text-4xl md:text-6xl text-primary leading-[1.1] mb-6 font-headline font-bold uppercase tracking-tight max-w-4xl mx-auto">
            Specialty Coffee<br />nach deinem Geschmack
          </h1>
          <p className="text-lg text-on-surface-variant leading-relaxed max-w-2xl mx-auto">
            {allCoffees.length} kuratierte Specialty Coffees aus 8 Schweizer Top-Röstereien. Filter nach Kategorie oder mach das Quiz.
          </p>
        </section>

        {/* Categories Grid */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 mb-16">
          <h2 className="text-2xl md:text-3xl text-primary mb-8 uppercase tracking-tight font-headline font-bold text-center">
            Nach Kategorie filtern
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {coffeeCategories.map((c) => (
              <Link
                key={c.slug}
                href={`/coffee/${c.slug}`}
                className="group bg-white shadow-sm hover:shadow-xl transition-all border-l-4 border-tertiary/0 hover:border-tertiary p-6"
              >
                <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-base mb-2 group-hover:text-tertiary transition-colors">
                  {c.shortLabel}
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">{c.tagline}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* All Coffees Grid */}
        <section className="bg-surface-container-low py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-6 md:px-8">
            <h2 className="text-2xl md:text-3xl text-primary mb-8 uppercase tracking-tight font-headline font-bold text-center">
              Alle {allCoffees.length} Specialty Coffees
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allCoffees.map((c) => (
                <Link
                  key={c.slug}
                  href={`/coffee/${c.slug}`}
                  className="group bg-white shadow-sm hover:shadow-xl transition-all flex flex-col"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={COFFEE_IMG} alt={c.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold mb-1">{c.origin}</span>
                    <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-base mb-1 group-hover:text-tertiary transition-colors">
                      {c.name}
                    </h3>
                    <p className="text-xs text-on-surface-variant mb-3">{c.roaster}</p>
                    <p className="text-xs text-on-surface-variant mb-4 flex-1">{c.tasteTypes[0]?.tagline}</p>
                    <div className="flex justify-between items-center pt-3 border-t border-surface-container">
                      <span className="font-headline font-bold text-primary">{c.price}</span>
                      <span className="font-headline text-[10px] uppercase tracking-[0.3em] text-tertiary group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary text-on-primary py-20">
          <div className="max-w-3xl mx-auto px-6 md:px-8 text-center">
            <h2 className="text-3xl md:text-4xl mb-6 uppercase tracking-tight font-headline font-bold">Quiz statt Stöbern</h2>
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
            <img alt="Coffee Selection" className="h-40 md:h-56 w-auto object-contain" src={LOGO} />
          </Link>
          <span>© 2024 Coffee Selection · Handverlesen aus der Schweiz</span>
        </div>
      </footer>
    </div>
  );
}
