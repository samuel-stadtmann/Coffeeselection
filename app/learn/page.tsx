import Link from "next/link";
import type { Metadata } from "next";
import { articles, allCategories } from "@/lib/articles";

const LOGO = "/logo.png";

export const metadata: Metadata = {
  title: "Coffee Magazine — Alles über Specialty Coffee | Coffee Selection",
  description: "Das Coffee Selection Magazine: Tutorials, Guides und Wissen rund um Specialty Coffee. Von V60 bis Geschmackstypen.",
  keywords: ["coffee magazine", "specialty coffee blog", "kaffee guides", "kaffee tutorials"],
};

export default function MagazinePage() {
  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <div className="bg-[#F9F5F0] text-on-surface pb-20 md:pb-0">
      <header className="fixed top-0 w-full z-50 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5">
        <nav className="flex justify-between items-center max-w-7xl mx-auto px-6 md:px-8 w-full">
          <Link href="/" className="flex items-center">
            <img alt="Coffee Selection" className="h-40 md:h-52 w-auto object-contain -my-6 md:-my-10 mr-8" src={LOGO} />
          </Link>
          <Link
            href="/quiz/question-1-brewing-method"
            className="bg-primary text-white px-5 md:px-6 py-3 text-[11px] md:text-[12px] uppercase tracking-[0.2em] font-headline font-bold hover:bg-black transition-all"
          >
            Quiz starten
          </Link>
        </nav>
      </header>

      <main className="pt-28 md:pt-32">
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-12 md:py-16 text-center">
          <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-6 block">
            Coffee Magazine
          </span>
          <h1 className="text-4xl md:text-6xl text-primary leading-[1.1] mb-6 font-headline font-bold uppercase tracking-tight max-w-4xl mx-auto">
            Werde zum Kaffee-Sommelier
          </h1>
          <p className="text-lg text-on-surface-variant leading-relaxed max-w-2xl mx-auto">
            Tutorials, Guides und Wissen rund um Specialty Coffee. Von der V60-Technik bis zu den 8 Geschmackstypen.
          </p>
        </section>

        {/* Featured */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 mb-12">
          <Link
            href={`/learn/${featured.slug}`}
            className="group block bg-white shadow-lg hover:shadow-2xl transition-all"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-0">
              <div className="aspect-[4/3] lg:aspect-auto overflow-hidden bg-surface-container-low">
                <img src={featured.image} alt={featured.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
              </div>
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-tertiary text-primary px-3 py-1 font-headline text-[10px] uppercase tracking-widest font-bold">
                    Featured
                  </span>
                  <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                    {featured.category} · {featured.readingTime}
                  </span>
                </div>
                <h2 className="text-2xl md:text-4xl text-primary mb-4 font-headline font-bold uppercase tracking-tight group-hover:text-tertiary transition-colors">
                  {featured.title}
                </h2>
                <p className="text-on-surface-variant leading-relaxed mb-6">{featured.excerpt}</p>
                <span className="font-headline text-[11px] uppercase tracking-[0.3em] text-tertiary group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold">
                  Artikel lesen <span className="material-symbols-outlined text-base">arrow_forward</span>
                </span>
              </div>
            </div>
          </Link>
        </section>

        {/* Category Pills */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 mb-8">
          <div className="flex flex-wrap gap-2">
            {allCategories.map((c) => (
              <span key={c} className="bg-white px-4 py-2 font-headline text-[10px] uppercase tracking-widest font-bold text-primary border border-primary/10">
                {c}
              </span>
            ))}
          </div>
        </section>

        {/* Article Grid */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {rest.map((a) => (
              <Link
                key={a.slug}
                href={`/learn/${a.slug}`}
                className="group bg-white shadow-sm hover:shadow-xl transition-all flex flex-col"
              >
                <div className="aspect-[4/3] overflow-hidden bg-surface-container-low">
                  <img src={a.image} alt={a.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold mb-2">
                    {a.category} · {a.readingTime}
                  </span>
                  <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-3 group-hover:text-tertiary transition-colors">
                    {a.title}
                  </h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed flex-1 mb-4">{a.excerpt}</p>
                  <span className="font-headline text-[10px] uppercase tracking-[0.3em] text-tertiary group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Lesen <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary text-on-primary py-20">
          <div className="max-w-3xl mx-auto px-6 md:px-8 text-center">
            <h2 className="text-3xl md:text-4xl mb-6 uppercase tracking-tight font-headline font-bold">
              Bereit, deinen Kaffee zu finden?
            </h2>
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
            <img alt="Coffee Selection" className="h-40 md:h-56 w-auto object-contain" src={LOGO} />
          </Link>
          <span>© 2024 Coffee Selection · Handverlesen aus der Schweiz</span>
        </div>
      </footer>
    </div>
  );
}
