import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { comparisons, comparisonBySlug } from "@/lib/comparisons";

const LOGO = "/logo.png";

export function generateStaticParams() {
  return comparisons.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = comparisonBySlug(slug);
  if (!c) return {};
  return {
    title: c.seoTitle,
    description: c.seoDescription,
    keywords: c.keywords,
  };
}

export default async function ComparisonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cmp = comparisonBySlug(slug);
  if (!cmp) notFound();

  const relatedComparisons = cmp.related.map((s) => comparisonBySlug(s)).filter(Boolean);

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
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-6 md:px-8 pt-8">
          <nav className="font-headline text-[10px] uppercase tracking-[0.3em] text-on-surface-variant flex items-center gap-2 flex-wrap">
            <Link href="/" className="hover:text-tertiary transition-colors">Home</Link>
            <span>/</span>
            <Link href="/compare" className="hover:text-tertiary transition-colors">Compare</Link>
            <span>/</span>
            <span className="text-primary">{cmp.title}</span>
          </nav>
        </div>

        {/* Hero */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-12 md:py-16 text-center">
          <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-6 block">
            Vergleich
          </span>
          <h1 className="text-4xl md:text-6xl text-primary leading-[1.05] mb-6 font-headline font-bold uppercase tracking-tight">
            {cmp.title}
          </h1>
          <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">{cmp.subtitle}</p>
        </section>

        {/* A vs B Hero Cards */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 mb-12 md:mb-16">
          <div className="grid grid-cols-2 gap-4 md:gap-8 relative">
            {[cmp.a, cmp.b].map((side, i) => (
              <div key={i} className={`relative overflow-hidden shadow-2xl ${i === 1 ? "bg-primary" : "bg-surface-variant"}`}>
                <div className="aspect-[4/5] md:aspect-[3/4] relative">
                  <img src={side.image} alt={side.name} className={`w-full h-full object-cover ${i === 1 ? "opacity-60" : ""}`} />
                  <div className={`absolute inset-0 bg-gradient-to-t ${i === 1 ? "from-primary/95 via-primary/40" : "from-surface-variant/90 via-surface-variant/30"} to-transparent`} />
                  <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10">
                    <span className={`material-symbols-outlined text-3xl md:text-5xl mb-3 ${i === 1 ? "text-tertiary" : "text-primary"}`}>{side.icon}</span>
                    <h2 className={`font-headline font-bold uppercase tracking-tight text-2xl md:text-4xl mb-2 ${i === 1 ? "text-white" : "text-primary"}`}>
                      {side.name}
                    </h2>
                    <p className={`font-headline text-[11px] uppercase tracking-widest font-bold ${i === 1 ? "text-tertiary" : "text-tertiary"}`}>
                      {side.tagline}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {/* VS Center Badge */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="bg-tertiary text-primary w-12 h-12 md:w-16 md:h-16 flex items-center justify-center font-headline font-bold uppercase shadow-2xl text-sm md:text-lg">
                VS
              </div>
            </div>
          </div>
        </section>

        {/* Intro */}
        <section className="max-w-3xl mx-auto px-6 md:px-8 mb-12 md:mb-16">
          <p className="text-lg md:text-xl text-on-surface-variant leading-relaxed">{cmp.intro}</p>
        </section>

        {/* Comparison Table */}
        <section className="max-w-5xl mx-auto px-6 md:px-8 mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl text-primary mb-8 uppercase tracking-tight font-headline font-bold text-center">
            Direkter Vergleich
          </h2>
          <div className="bg-white shadow-md overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-3 bg-primary text-on-primary">
              <div className="p-4 md:p-6 font-headline font-bold uppercase tracking-widest text-[10px] md:text-xs">Eigenschaft</div>
              <div className="p-4 md:p-6 font-headline font-bold uppercase tracking-tight text-sm md:text-base text-tertiary border-l border-on-primary/10">{cmp.a.name}</div>
              <div className="p-4 md:p-6 font-headline font-bold uppercase tracking-tight text-sm md:text-base text-tertiary border-l border-on-primary/10">{cmp.b.name}</div>
            </div>
            {/* Rows */}
            {cmp.table.map((row, i) => (
              <div key={i} className={`grid grid-cols-3 ${i % 2 ? "bg-surface-container-low" : "bg-white"} border-b border-surface-container last:border-0`}>
                <div className="p-4 md:p-6 font-headline text-[10px] md:text-xs uppercase tracking-widest text-on-surface-variant font-bold">{row.label}</div>
                <div className="p-4 md:p-6 font-body text-xs md:text-sm text-primary border-l border-surface-container">{row.a}</div>
                <div className="p-4 md:p-6 font-body text-xs md:text-sm text-primary border-l border-surface-container">{row.b}</div>
              </div>
            ))}
          </div>
        </section>

        {/* When to choose what */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl text-primary mb-8 uppercase tracking-tight font-headline font-bold text-center">
            Wann passt was?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="bg-white p-6 md:p-8 shadow-sm border-l-4 border-tertiary">
              <div className="flex items-center gap-4 mb-6">
                <span className="material-symbols-outlined text-tertiary text-3xl">{cmp.a.icon}</span>
                <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-xl">{cmp.a.name} — wann?</h3>
              </div>
              <ul className="space-y-3">
                {cmp.aBest.map((item, i) => (
                  <li key={i} className="flex gap-3 text-on-surface-variant">
                    <span className="material-symbols-outlined text-tertiary text-base shrink-0 mt-0.5">{item.icon}</span>
                    <span className="text-sm">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-primary text-on-primary p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <span className="material-symbols-outlined text-tertiary text-3xl">{cmp.b.icon}</span>
                <h3 className="font-headline font-bold uppercase tracking-tight text-xl text-tertiary">{cmp.b.name} — wann?</h3>
              </div>
              <ul className="space-y-3">
                {cmp.bBest.map((item, i) => (
                  <li key={i} className="flex gap-3 text-on-primary/80">
                    <span className="material-symbols-outlined text-tertiary text-base shrink-0 mt-0.5">{item.icon}</span>
                    <span className="text-sm">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Who is who */}
        <section className="bg-surface-variant py-12 md:py-16 mb-12 md:mb-16">
          <div className="max-w-3xl mx-auto px-6 md:px-8 text-center">
            <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
              Sommelier-Insight
            </span>
            <p className="text-xl md:text-2xl text-primary italic font-headline leading-relaxed">
              &ldquo;{cmp.whoIsWho}&rdquo;
            </p>
          </div>
        </section>

        {/* Conclusion + CTA */}
        <section className="max-w-3xl mx-auto px-6 md:px-8 mb-16">
          <h2 className="text-2xl md:text-3xl text-primary mb-6 uppercase tracking-tight font-headline font-bold text-center">
            Fazit
          </h2>
          <p className="text-lg text-on-surface-variant leading-relaxed mb-10">{cmp.conclusion}</p>
          <div className="bg-tertiary/10 border-l-4 border-tertiary p-6 md:p-8 text-center">
            <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-3">
              Welche Seite ist deine?
            </h3>
            <p className="text-on-surface-variant mb-6">Mach das 12-Fragen-Quiz und finde deinen Geschmackstyp.</p>
            <Link
              href="/quiz/question-1-brewing-method"
              className="inline-block bg-primary text-on-primary px-8 py-4 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all"
            >
              Quiz starten
            </Link>
          </div>
        </section>

        {/* Related */}
        {relatedComparisons.length > 0 && (
          <section className="bg-surface-container-low py-16 md:py-20 border-t border-primary/5">
            <div className="max-w-7xl mx-auto px-6 md:px-8">
              <h2 className="text-2xl md:text-3xl text-primary mb-8 uppercase tracking-tight font-headline font-bold text-center">
                Weitere Vergleiche
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedComparisons.map((r) => r && (
                  <Link
                    key={r.slug}
                    href={`/compare/${r.slug}`}
                    className="group bg-white p-6 md:p-8 shadow-sm hover:shadow-xl transition-all"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span className="material-symbols-outlined text-tertiary text-2xl">{r.a.icon}</span>
                      <span className="font-headline text-tertiary font-bold uppercase tracking-tight">vs.</span>
                      <span className="material-symbols-outlined text-tertiary text-2xl">{r.b.icon}</span>
                    </div>
                    <h3 className="font-headline font-bold text-primary uppercase tracking-tight group-hover:text-tertiary transition-colors mb-2">
                      {r.title}
                    </h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">{r.subtitle}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
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
