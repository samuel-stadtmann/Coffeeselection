import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { tasteTypes, tasteTypeBySlug } from "@/lib/taste-types";
import { slugify } from "@/lib/coffees";

const LOGO = "/logo.png";

export function generateStaticParams() {
  return tasteTypes.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = tasteTypeBySlug(slug);
  if (!t) return {};
  return {
    title: `${t.name} — ${t.seoTitle}`,
    description: t.seoDescription,
    keywords: t.seoKeywords,
  };
}

export default async function TasteTypePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const type = tasteTypeBySlug(slug);
  if (!type) notFound();

  const otherTypes = tasteTypes.filter((t) => t.slug !== slug).slice(0, 4);

  return (
    <div className="bg-[#F9F5F0] text-on-surface pb-20 md:pb-0">
      {/* Minimal Header */}
      <header className="fixed top-0 w-full z-50 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5">
        <nav className="flex justify-between items-center max-w-7xl mx-auto px-6 md:px-8 w-full">
          <Link href="/" className="flex items-center">
            <img alt="Coffee Selection" className="h-72 md:h-96 w-auto object-contain -my-16 md:-my-24 mr-8" src={LOGO} />
          </Link>
          <Link
            href="/quiz/start"
            className="bg-primary text-white px-5 md:px-6 py-3 text-[11px] md:text-[12px] uppercase tracking-[0.2em] font-headline font-bold hover:bg-black transition-all"
          >
            Quiz starten
          </Link>
        </nav>
      </header>

      <main className="pt-36 md:pt-40">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-6 md:px-8 pt-8">
          <nav className="font-headline text-[10px] uppercase tracking-[0.3em] text-on-surface-variant flex items-center gap-2">
            <Link href="/" className="hover:text-tertiary transition-colors">Home</Link>
            <span>/</span>
            <Link href="/taste-types" className="hover:text-tertiary transition-colors">Geschmackstypen</Link>
            <span>/</span>
            <span className="text-primary">{type.name}</span>
          </nav>
        </div>

        {/* HERO */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-12 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-16 items-center">
            <div className="lg:col-span-7">
              <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-6 block">
                Geschmackstyp · Specialty Coffee
              </span>
              <div className="flex items-center gap-6 mb-6">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-tertiary text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-4xl md:text-5xl">{type.icon}</span>
                </div>
                <h1 className="text-4xl md:text-6xl text-primary leading-[1.05] font-headline font-bold">
                  {type.name}
                </h1>
              </div>
              <p className="font-headline text-tertiary uppercase tracking-widest text-sm mb-6">{type.tagline}</p>
              <p className="text-lg text-on-surface-variant leading-relaxed mb-10">{type.heroDesc}</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/quiz/start"
                  className="bg-primary text-on-primary px-8 py-4 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all text-center"
                >
                  Bin ich der {type.name}?
                </Link>
                <Link
                  href="/coffee/discovery-box"
                  className="flex items-center justify-center gap-3 font-headline font-bold text-primary px-6 py-4 hover:bg-surface-container-low transition-colors uppercase tracking-widest text-[11px]"
                >
                  <span className="material-symbols-outlined text-2xl">shopping_basket</span>
                  Discovery Box ansehen
                </Link>
              </div>
            </div>

            {/* Profile Bars */}
            <div className="lg:col-span-5 bg-white p-8 md:p-10 shadow-xl">
              <h2 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-6">
                Geschmacksprofil
              </h2>
              <div className="space-y-5">
                {type.profile.map((p) => (
                  <div key={p.label}>
                    <div className="flex justify-between mb-2">
                      <span className="font-headline text-[11px] uppercase tracking-widest text-on-surface-variant">{p.label}</span>
                      <span className="font-headline text-[11px] uppercase tracking-widest text-tertiary font-bold">{p.value}%</span>
                    </div>
                    <div className="h-1 bg-surface-container relative overflow-hidden">
                      <div className="h-full bg-tertiary" style={{ width: `${p.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Long Description */}
        <section className="bg-surface-container-low py-16 md:py-20 border-y border-primary/5">
          <div className="max-w-3xl mx-auto px-6 md:px-8">
            <h2 className="text-2xl md:text-3xl text-primary mb-6 uppercase tracking-tight font-headline font-bold text-center">
              Was {type.name} ausmacht
            </h2>
            <p className="text-lg text-on-surface-variant leading-relaxed">{type.longDesc}</p>
          </div>
        </section>

        {/* Aromen */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-20">
          <div className="text-center mb-12">
            <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
              Typische Aromen
            </span>
            <h2 className="text-2xl md:text-3xl text-primary uppercase tracking-tight font-headline font-bold">
              Was du in der Tasse findest
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3 md:gap-4 max-w-3xl mx-auto">
            {type.aromas.map((a) => (
              <span
                key={a}
                className="bg-white border border-tertiary/30 px-5 py-3 font-headline text-xs uppercase tracking-widest font-bold text-primary"
              >
                {a}
              </span>
            ))}
          </div>
          <div className="text-center mt-12 text-sm text-on-surface-variant">
            <span className="font-headline text-[11px] uppercase tracking-widest font-bold mr-2 text-primary">Brühmethoden:</span>
            {type.brewing.join(" · ")}
          </div>
        </section>

        {/* Empfohlene Kaffees */}
        <section className="bg-surface-container-low py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-6 md:px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
              <div>
                <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
                  Top Match
                </span>
                <h2 className="text-3xl md:text-4xl text-primary uppercase tracking-tight font-headline font-bold">
                  Kaffees für {type.name}
                </h2>
              </div>
              <Link
                href="/coffee/new-arrivals"
                className="font-headline text-[11px] font-bold uppercase tracking-[0.3em] text-tertiary hover:text-primary transition-colors border-b-2 border-tertiary pb-2"
              >
                Alle Kaffees
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {type.coffees.map((c) => {
                const coffeeSlug = slugify(c.name);
                return (
                  <div key={c.name} className="bg-white shadow-md hover:shadow-xl transition-shadow group flex flex-col">
                    <Link href={`/coffee/${coffeeSlug}`} className="block p-8 flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold">{c.origin}</span>
                        <span className="bg-tertiary text-white px-3 py-1 font-headline text-[10px] uppercase tracking-widest font-bold">
                          {c.matchScore}% Match
                        </span>
                      </div>
                      <h3 className="text-xl text-primary mb-2 uppercase tracking-tight font-headline font-bold group-hover:text-tertiary transition-colors">{c.name}</h3>
                      <p className="text-sm text-on-surface-variant mb-6">{c.roaster}</p>
                      <div className="pt-4 border-t border-primary/10">
                        <span className="font-headline font-bold text-primary text-xl">{c.price}</span>
                      </div>
                    </Link>
                    <div className="grid grid-cols-2 border-t border-primary/10">
                      <Link
                        href={`/coffee/${coffeeSlug}`}
                        className="text-center py-4 font-headline text-[10px] uppercase tracking-widest text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors font-bold"
                      >
                        Details
                      </Link>
                      <Link
                        href="/checkout/cart"
                        className="text-center py-4 font-headline text-[10px] uppercase tracking-widest bg-primary text-on-primary hover:bg-black transition-colors font-bold"
                      >
                        In den Warenkorb
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Empfohlene Röster */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-20">
          <div className="text-center mb-12">
            <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
              Direct Trade
            </span>
            <h2 className="text-3xl md:text-4xl text-primary uppercase tracking-tight font-headline font-bold">
              Schweizer Röster für dich
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {type.roasters.map((r) => (
              <div key={r.name} className="bg-white border-l-4 border-tertiary p-8 shadow-sm">
                <h3 className="text-lg text-primary mb-1 uppercase tracking-tight font-headline font-bold">{r.name}</h3>
                <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold">{r.city}</span>
                <p className="text-sm text-on-surface-variant mt-4 leading-relaxed">{r.specialty}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Subscription CTA */}
        <section className="bg-primary text-on-primary py-20">
          <div className="max-w-3xl mx-auto px-6 md:px-8 text-center">
            <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
              Discovery Subscription
            </span>
            <h2 className="text-3xl md:text-4xl mb-6 uppercase tracking-tight font-headline font-bold">
              Jeden Monat ein neuer {type.name}-Kaffee
            </h2>
            <p className="text-lg text-on-primary/70 mb-10">
              Die Discovery Box bringt dir 2x 250g, perfekt auf deinen Geschmackstyp abgestimmt.
              Ab CHF 24.00 monatlich. Pausieren oder kündigen jederzeit.
            </p>
            <Link
              href="/coffee/discovery-box"
              className="inline-block bg-tertiary text-primary px-10 py-5 font-headline font-bold text-xs uppercase tracking-widest hover:bg-white transition-all"
            >
              Discovery Box bestellen
            </Link>
          </div>
        </section>

        {/* Other Taste Types */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl text-primary uppercase tracking-tight font-headline font-bold mb-4">
              Andere Geschmackstypen
            </h2>
            <p className="text-on-surface-variant">Vielleicht passt einer der anderen besser zu dir?</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {otherTypes.map((t) => (
              <Link
                key={t.slug}
                href={`/taste-types/${t.slug}`}
                className="group bg-white border-l-4 border-tertiary/0 hover:border-tertiary p-6 shadow-sm hover:shadow-xl transition-all"
              >
                <span className="material-symbols-outlined text-tertiary text-2xl mb-3 block">{t.icon}</span>
                <h3 className="text-base text-primary mb-1 uppercase tracking-tight font-headline font-bold">{t.name}</h3>
                <p className="text-xs text-on-surface-variant">{t.tagline}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Final Quiz CTA */}
        <section className="bg-surface-variant py-16 md:py-20">
          <div className="max-w-3xl mx-auto px-6 md:px-8 text-center">
            <h2 className="text-3xl md:text-4xl text-primary mb-6 uppercase tracking-tight font-headline font-bold">
              Nicht sicher ob du der {type.name} bist?
            </h2>
            <p className="text-lg text-on-surface-variant mb-10">
              Unser 12-Fragen-Quiz klassifiziert dich präzise. 60 Sekunden, keine Anmeldung.
            </p>
            <Link
              href="/quiz/start"
              className="inline-block bg-primary text-on-primary px-10 py-5 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all"
            >
              Geschmackstyp finden
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full px-6 md:px-8 bg-[#F9F5F0] border-t border-primary/5 py-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] text-on-surface-variant/60 font-headline font-bold uppercase tracking-[0.3em]">
          <Link href="/" className="flex items-center">
            <img alt="Coffee Selection" className="h-40 md:h-56 w-auto object-contain" src={LOGO} />
          </Link>
          <span>© 2024 Coffee Selection · Handverlesen aus der Schweiz</span>
        </div>
      </footer>

      {/* Sticky Mobile CTA */}
      <Link
        href="/quiz/start"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-primary text-on-primary py-5 text-center font-headline font-bold uppercase tracking-widest text-xs shadow-2xl border-t-2 border-tertiary"
      >
        Quiz starten · 60 Sek
      </Link>
    </div>
  );
}
