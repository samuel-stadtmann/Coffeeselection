import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { roasters, roasterBySlug } from "@/lib/roasters";
import { getCoffeeBySlug } from "@/lib/coffees";

const LOGO = "/logo.png";

export function generateStaticParams() {
  return roasters.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const r = roasterBySlug(slug);
  if (!r) return {};
  return {
    title: `${r.name} — ${r.city} | Coffee Selection`,
    description: `${r.shortDesc} ${r.tagline}. Specialty Coffee aus ${r.city} seit ${r.founded}.`,
    keywords: [r.name.toLowerCase(), r.city.toLowerCase(), "rösterei", "specialty coffee", ...r.values.map((v) => v.toLowerCase())],
  };
}

export default async function RoasterDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const roaster = roasterBySlug(slug);
  if (!roaster) notFound();

  const otherRoasters = roasters.filter((r) => r.slug !== slug).slice(0, 3);
  const roasterCoffees = roaster.coffees.map((s) => getCoffeeBySlug(s)).filter(Boolean);

  return (
    <div className="bg-[#F9F5F0] text-on-surface pb-20 md:pb-0">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5">
        <nav className="flex justify-between items-center max-w-7xl mx-auto px-6 md:px-8 w-full">
          <Link href="/" className="flex items-center">
            <img alt="Coffee Selection" className="h-56 md:h-72 w-auto object-contain -my-10 md:-my-16 mr-8" src={LOGO} />
          </Link>
          <Link
            href="/quiz/question-1-brewing-method"
            className="bg-primary text-white px-5 md:px-6 py-3 text-[11px] md:text-[12px] uppercase tracking-[0.2em] font-headline font-bold hover:bg-black transition-all"
          >
            Quiz starten
          </Link>
        </nav>
      </header>

      <main className="pt-36 md:pt-40">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-6 md:px-8 pt-8">
          <nav className="font-headline text-[10px] uppercase tracking-[0.3em] text-on-surface-variant flex items-center gap-2 flex-wrap">
            <Link href="/" className="hover:text-tertiary transition-colors">Home</Link>
            <span>/</span>
            <Link href="/roasters" className="hover:text-tertiary transition-colors">Röster</Link>
            <span>/</span>
            <span className="text-primary">{roaster.name}</span>
          </nav>
        </div>

        {/* Hero */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-12 md:py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="relative">
            <div className="aspect-[4/5] overflow-hidden shadow-2xl">
              <img src={roaster.image} alt={roaster.name} className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-tertiary text-primary p-5 md:p-6 z-20 shadow-2xl">
              <p className="font-headline font-bold text-2xl md:text-3xl mb-1">seit {roaster.founded}</p>
              <p className="font-headline text-[10px] uppercase tracking-widest leading-tight">
                {roaster.stats.yearsActive} Jahre Handwerk
              </p>
            </div>
          </div>
          <div>
            <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
              {roaster.city} · {roaster.region}
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl text-primary leading-[1.05] mb-4 font-headline font-bold uppercase tracking-tight">
              {roaster.name}
            </h1>
            <p className="font-headline text-tertiary uppercase tracking-widest text-sm mb-6 font-bold">
              {roaster.tagline}
            </p>
            <p className="text-lg text-on-surface-variant leading-relaxed mb-8">{roaster.shortDesc}</p>
            <div className="flex flex-wrap gap-2 mb-8">
              {roaster.values.map((v) => (
                <span key={v} className="bg-white border border-tertiary/30 px-3 py-2 font-headline text-[10px] uppercase tracking-widest font-bold text-primary">
                  {v}
                </span>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="#coffees"
                className="bg-primary text-on-primary px-8 py-4 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all text-center"
              >
                {roaster.coffees.length} Kaffees ansehen
              </a>
              {roaster.social.web && (
                <a
                  href={`https://${roaster.social.web}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 font-headline font-bold text-primary px-6 py-4 hover:bg-surface-container-low transition-colors uppercase tracking-widest text-[11px]"
                >
                  <span className="material-symbols-outlined text-2xl">open_in_new</span>
                  {roaster.social.web}
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-primary text-on-primary py-12">
          <div className="max-w-7xl mx-auto px-6 md:px-8 grid grid-cols-3 gap-6">
            {[
              { label: "Aktiv seit", value: `${roaster.stats.yearsActive} Jahren` },
              { label: "Kaffees geröstet", value: roaster.stats.coffeesRoasted },
              { label: "Kunden bedient", value: roaster.stats.clientsServed },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-headline font-bold text-tertiary text-2xl md:text-4xl uppercase tracking-tight mb-2">{s.value}</p>
                <p className="font-headline text-[10px] uppercase tracking-widest text-on-primary/60 font-bold">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Story */}
        <section className="bg-surface-container-low py-16 md:py-20 border-y border-primary/5">
          <div className="max-w-3xl mx-auto px-6 md:px-8">
            <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block text-center">
              Die Geschichte
            </span>
            <h2 className="text-2xl md:text-3xl text-primary mb-8 uppercase tracking-tight font-headline font-bold text-center">
              {roaster.tagline}
            </h2>
            <p className="text-lg text-on-surface-variant leading-relaxed">{roaster.story}</p>
          </div>
        </section>

        {/* Specialty + Certifications */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-20 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="bg-white p-6 md:p-8 shadow-sm">
            <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold block mb-2">Spezialität</span>
            <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-xl mb-4">{roaster.specialty}</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {roaster.tagline}. Ein klar definierter Stil, der diesen Röster von anderen unterscheidet.
            </p>
          </div>
          <div className="bg-white p-6 md:p-8 shadow-sm">
            <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold block mb-2">Zertifizierungen</span>
            <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-xl mb-4">Qualität geprüft</h3>
            <div className="flex flex-wrap gap-2">
              {roaster.certifications.map((c) => (
                <span key={c} className="bg-surface-container px-3 py-2 font-headline text-[10px] uppercase tracking-widest font-bold text-primary">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Coffees */}
        {roasterCoffees.length > 0 && (
          <section id="coffees" className="bg-surface-variant py-16 md:py-20">
            <div className="max-w-7xl mx-auto px-6 md:px-8">
              <div className="text-center mb-12">
                <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
                  Im Sortiment
                </span>
                <h2 className="text-3xl md:text-4xl text-primary uppercase tracking-tight font-headline font-bold">
                  Kaffees von {roaster.name}
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roasterCoffees.map((c) => c && (
                  <Link
                    key={c.slug}
                    href={`/coffee/${c.slug}`}
                    className="group bg-white p-8 shadow-sm hover:shadow-xl transition-all"
                  >
                    <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold">{c.origin}</span>
                    <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-xl group-hover:text-tertiary transition-colors mt-1 mb-2">
                      {c.name}
                    </h3>
                    <p className="text-xs text-on-surface-variant mb-4">{c.tasteTypes[0]?.name}</p>
                    <div className="flex justify-between items-center pt-4 border-t border-surface-container">
                      <span className="font-headline font-bold text-primary text-xl">{c.price}</span>
                      <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        Ansehen <span className="material-symbols-outlined text-base">arrow_forward</span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Other Roasters */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl text-primary uppercase tracking-tight font-headline font-bold mb-4">
              Andere Röster entdecken
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {otherRoasters.map((r) => (
              <Link
                key={r.slug}
                href={`/roasters/${r.slug}`}
                className="group bg-white shadow-sm hover:shadow-xl transition-all"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={r.image} alt={r.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold block mb-1">{r.city}</span>
                    <h3 className="font-headline font-bold text-on-primary uppercase tracking-tight">{r.name}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              href="/roasters"
              className="font-headline text-[11px] font-bold uppercase tracking-[0.3em] text-tertiary hover:text-primary transition-colors border-b-2 border-tertiary pb-2"
            >
              Alle Röster ansehen
            </Link>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-primary text-on-primary py-20">
          <div className="max-w-3xl mx-auto px-6 md:px-8 text-center">
            <h2 className="text-3xl md:text-4xl mb-6 uppercase tracking-tight font-headline font-bold">
              Bereit für einen <span className="text-tertiary">{roaster.name.split(" ")[0]}-Kaffee?</span>
            </h2>
            <p className="text-lg text-on-primary/70 mb-10">Mach das Quiz und finde heraus, welcher Kaffee dieser Rösterei zu dir passt.</p>
            <Link
              href="/quiz/question-1-brewing-method"
              className="inline-block bg-tertiary text-primary px-12 py-5 font-headline font-bold text-xs uppercase tracking-widest hover:bg-white transition-all"
            >
              Match finden
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
