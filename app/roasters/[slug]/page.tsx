import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getRoasters, getRoasterBySlug, getRoasterSlugsForStatic } from "@/lib/db/roasters";
import { getCoffeesByRoasterSlug } from "@/lib/db/coffees";

const LOGO = "/logo.png";
const ROASTER_FALLBACK_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDsi0Cm5pc68_wHYzSlE9JU3hSFfItOBscVq7fRgSVQF2O2c1qq3Lur8RIyfH1J56Xmysu8_-LJxl3wpeTypHOshuMB_3c8-5Z-yuccHxOvjlh1rBBx9aJ_L6xn0ES5e12zVKtvjtl1pI1K-J8kdzYr-ifacUyJTZrRDt5L4C7tyBQLYyKcpkoNC0Go4fagorT6mBPJdkR5u6AGDLnIFfYxzAiKDRRtiCr6pss5eRNI3-kBz3TRwC3MXJQNVV9oH7rHgXvPfiZieg";

export async function generateStaticParams() {
  return await getRoasterSlugsForStatic();
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const r = await getRoasterBySlug(slug);
  if (!r) return {};
  return {
    title: `${r.name}${r.city ? ` — ${r.city}` : ""} | Coffee Selection`,
    description: r.short_description ?? `Specialty Coffee von ${r.name}.`,
    keywords: [r.name.toLowerCase(), ...(r.city ? [r.city.toLowerCase()] : []), "rösterei", "specialty coffee"],
  };
}

export default async function RoasterDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const roaster = await getRoasterBySlug(slug);
  if (!roaster) notFound();

  const allRoasters = await getRoasters();
  const otherRoasters = allRoasters.filter((r) => r.slug !== slug).slice(0, 3);
  const roasterCoffees = await getCoffeesByRoasterSlug(slug);

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
          <div className="aspect-[4/5] overflow-hidden shadow-2xl">
            <img
              src={roaster.hero_image_url || roaster.logo_url || ROASTER_FALLBACK_IMG}
              alt={roaster.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            {(roaster.city || roaster.region) && (
              <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
                {roaster.city}{roaster.region ? ` · ${roaster.region}` : ""}
              </span>
            )}
            <h1 className="text-4xl md:text-5xl lg:text-6xl text-primary leading-[1.05] mb-4 font-headline font-bold uppercase tracking-tight">
              {roaster.name}
            </h1>
            {roaster.short_description && (
              <p className="text-lg text-on-surface-variant leading-relaxed mb-8">{roaster.short_description}</p>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              {roasterCoffees.length > 0 && (
                <a
                  href="#coffees"
                  className="bg-primary text-on-primary px-8 py-4 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all text-center"
                >
                  {roasterCoffees.length} Kaffees ansehen
                </a>
              )}
              {roaster.website_url && (
                <a
                  href={roaster.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 font-headline font-bold text-primary px-6 py-4 hover:bg-surface-container-low transition-colors uppercase tracking-widest text-[11px]"
                >
                  <span className="material-symbols-outlined text-2xl">open_in_new</span>
                  Website
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Story */}
        {(roaster.description || roaster.story) && (
          <section className="bg-surface-container-low py-16 md:py-20 border-y border-primary/5">
            <div className="max-w-3xl mx-auto px-6 md:px-8">
              <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block text-center">
                Die Geschichte
              </span>
              <h2 className="text-2xl md:text-3xl text-primary mb-8 uppercase tracking-tight font-headline font-bold text-center">
                Über {roaster.name}
              </h2>
              {roaster.description && (
                <p className="text-lg text-on-surface-variant leading-relaxed mb-6">{roaster.description}</p>
              )}
              {roaster.story && (
                <p className="text-lg text-on-surface-variant leading-relaxed">{roaster.story}</p>
              )}
            </div>
          </section>
        )}

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
                {roasterCoffees.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/coffee/${c.slug}`}
                    className="group bg-white p-8 shadow-sm hover:shadow-xl transition-all"
                  >
                    <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold">{c.origin_name_de ?? "Specialty"}</span>
                    <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-xl group-hover:text-tertiary transition-colors mt-1 mb-2">
                      {c.name}
                    </h3>
                    {c.tasting_summary && (
                      <p className="text-xs text-on-surface-variant mb-4 line-clamp-2">{c.tasting_summary}</p>
                    )}
                    <div className="flex justify-between items-center pt-4 border-t border-surface-container">
                      <span className="font-headline font-bold text-primary text-xl">CHF {Number(c.price_chf).toFixed(2)}</span>
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
        {otherRoasters.length > 0 && (
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
                    <img src={r.hero_image_url || r.logo_url || ROASTER_FALLBACK_IMG} alt={r.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold block mb-1">{r.city ?? r.country}</span>
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
        )}

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
            <img alt="Coffee Selection" className="h-14 md:h-20 w-auto object-contain" src={LOGO} />
          </Link>
          <span>© 2024 Coffee Selection · Handverlesen aus der Schweiz</span>
        </div>
      </footer>
    </div>
  );
}
