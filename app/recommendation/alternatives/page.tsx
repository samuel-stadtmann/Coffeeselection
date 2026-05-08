import Link from "next/link";
import type { Metadata } from "next";
import { tasteTypes, tasteTypeBySlug, type TasteType } from "@/lib/taste-types";
import { slugify } from "@/lib/coffees";

const LOGO = "/logo.png";

// Heutiges Mock — später aus Supabase user.tasteType
const USER_MATCH_SLUG = "der-fruchtfreund";

export const metadata: Metadata = {
  title: "Alternativen zu deinem Match — Coffee Selection",
  description: "Persönliche Alternativen zu deinem Geschmackstyp. Mit Begründung, warum dieser Kaffee zu dir passen könnte.",
  robots: { index: false, follow: false },
};

const profileLookup = (t: TasteType) =>
  Object.fromEntries(t.profile.map((p) => [p.label, p.value])) as Record<string, number>;

function distance(a: TasteType, b: TasteType): number {
  const pa = profileLookup(a);
  const pb = profileLookup(b);
  return a.profile.reduce((sum, p) => sum + Math.abs(pa[p.label] - (pb[p.label] ?? pa[p.label])), 0);
}

function reasoning(match: TasteType, alt: TasteType): { headline: string; detail: string } {
  const pm = profileLookup(match);
  const pa = profileLookup(alt);
  const diffs = match.profile
    .map((p) => ({ label: p.label, diff: pa[p.label] - pm[p.label], altVal: pa[p.label], myVal: pm[p.label] }))
    .sort((x, y) => Math.abs(y.diff) - Math.abs(x.diff));

  const top = diffs[0];
  const direction = top.diff > 0 ? "mehr" : "weniger";
  const headline = `${direction.charAt(0).toUpperCase() + direction.slice(1)} ${top.label}`;
  const sharedAromas = match.aromas.filter((a) => alt.aromas.includes(a));
  const aromaText =
    sharedAromas.length > 0
      ? `Teilt ${sharedAromas.slice(0, 2).join(" & ")} mit deinem Match.`
      : `Erweitert dein Profil um ${alt.aromas.slice(0, 2).join(" & ")}.`;

  const detail = `${top.label}: ${top.altVal}% statt ${top.myVal}% (${direction} ausgeprägt). ${aromaText}`;
  return { headline, detail };
}

export default function AlternativesPage() {
  const match = tasteTypeBySlug(USER_MATCH_SLUG);
  if (!match) return null;

  const sortedNeighbors = tasteTypes
    .filter((t) => t.slug !== match.slug)
    .map((t) => ({ type: t, dist: distance(match, t) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 3);

  // Pro Nachbar-Typ den Top-Coffee — keine Doppel-Einträge nach Name
  const seen = new Set<string>();
  const alternatives = sortedNeighbors.flatMap(({ type }) => {
    const picks = type.coffees.filter((c) => !seen.has(c.name)).slice(0, 1);
    picks.forEach((c) => seen.add(c.name));
    return picks.map((coffee) => {
      const r = reasoning(match, type);
      return { coffee, type, headline: r.headline, detail: r.detail };
    });
  });

  return (
    <div className="bg-[#F9F5F0] text-on-surface min-h-screen">
      <header className="fixed top-0 w-full z-50 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5">
        <nav className="flex justify-between items-center max-w-7xl mx-auto px-6 md:px-8 w-full">
          <Link href="/" className="flex items-center">
            <img alt="Coffee Selection" className="h-40 md:h-52 w-auto object-contain -my-6 md:-my-10 mr-8" src={LOGO} />
          </Link>
          <Link
            href="/account/dashboard"
            className="font-headline text-[11px] uppercase tracking-[0.2em] text-on-surface-variant hover:text-tertiary transition-colors font-bold"
          >
            ← Zurück zum Profil
          </Link>
        </nav>
      </header>

      <main className="pt-28 md:pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          {/* Breadcrumb */}
          <nav className="font-headline text-[10px] uppercase tracking-[0.3em] text-on-surface-variant flex items-center gap-2 flex-wrap mb-8">
            <Link href="/account/dashboard" className="hover:text-tertiary transition-colors">Mein Konto</Link>
            <span>/</span>
            <Link href="/account/recommendation-history" className="hover:text-tertiary transition-colors">Empfehlungen</Link>
            <span>/</span>
            <span className="text-primary">Alternativen</span>
          </nav>

          {/* Hero */}
          <section className="max-w-3xl mb-12 md:mb-16">
            <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
              Persönlich · Nur für dich
            </span>
            <h1 className="text-3xl md:text-5xl text-primary leading-[1.05] font-headline font-bold uppercase tracking-tight mb-6">
              Alternativen zu deinem Match
            </h1>
            <p className="text-lg text-on-surface-variant leading-relaxed">
              Du bist <span className="text-primary font-headline font-bold">{match.name}</span> — diese Kaffees liegen knapp daneben
              und könnten dich überraschen. Jeder kommt mit Begründung: was er gemeinsam hat mit deinem Profil und wo er anders ist.
            </p>
          </section>

          {/* Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {alternatives.map(({ coffee, type, headline, detail }) => {
              const slug = slugify(coffee.name);
              return (
                <article key={coffee.name} className="bg-white shadow-sm hover:shadow-xl transition-all flex flex-col">
                  <div className="p-8 flex-1">
                    <div className="flex items-start justify-between gap-3 mb-5">
                      <div>
                        <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold block mb-1">
                          {coffee.origin}
                        </span>
                        <Link href={`/coffee/${slug}`} className="block">
                          <h2 className="font-headline font-bold text-primary uppercase tracking-tight text-xl mb-1 hover:text-tertiary transition-colors">
                            {coffee.name}
                          </h2>
                        </Link>
                        <p className="text-xs text-on-surface-variant">{coffee.roaster}</p>
                      </div>
                      <span className="material-symbols-outlined text-tertiary shrink-0">{type.icon}</span>
                    </div>

                    {/* Begründung — wichtigstes Element */}
                    <div className="bg-tertiary/5 border-l-4 border-tertiary p-5 mb-6">
                      <span className="font-headline text-[10px] uppercase tracking-[0.3em] text-tertiary font-bold block mb-2">
                        Warum für dich
                      </span>
                      <p className="font-headline font-bold text-primary uppercase tracking-tight text-base mb-2">
                        {headline}
                      </p>
                      <p className="text-sm text-on-surface-variant leading-relaxed">{detail}</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-surface-container">
                      <span className="font-headline font-bold text-primary text-xl">{coffee.price}</span>
                      <Link
                        href={`/taste-types/${type.slug}`}
                        className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-tertiary transition-colors font-bold"
                      >
                        Typ: {type.name} →
                      </Link>
                    </div>
                  </div>

                  {/* CTA — wichtigstes Element */}
                  <div className="grid grid-cols-2 border-t border-primary/10">
                    <Link
                      href={`/coffee/${slug}`}
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
                </article>
              );
            })}
          </section>

          {/* Footer-CTA zurück ins Profil */}
          <section className="bg-white shadow-sm p-8 md:p-12 mt-16 text-center">
            <h2 className="text-2xl md:text-3xl text-primary mb-4 uppercase tracking-tight font-headline font-bold">
              Diese Kaffees passen nicht?
            </h2>
            <p className="text-on-surface-variant mb-8 max-w-xl mx-auto">
              Bewerte deine letzten Empfehlungen — wir verfeinern den Algorithmus jedes Mal, wenn du Sterne vergibst.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/account/recommendation-history"
                className="bg-primary text-on-primary px-8 py-4 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all"
              >
                Empfehlungen bewerten
              </Link>
              <Link
                href={`/taste-types/${match.slug}`}
                className="border border-primary text-primary px-8 py-4 font-headline font-bold text-xs uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all"
              >
                Mein Geschmackstyp
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
