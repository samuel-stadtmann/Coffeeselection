import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cities, cityBySlug } from "@/lib/cities";
import { roastersForCity } from "@/lib/roasters";
import { coffeesForCity } from "@/lib/coffees";
import { IMG_ZURICH, IMG_BERN, IMG_BASEL, IMG_GENEVA, IMG_LUCERNE, IMG_ZUG, IMG_SWITZERLAND } from "@/lib/images";

const LOGO = "/logo.png";

const CITY_IMAGES: Record<string, string> = {
  "coffee-subscription-zurich": IMG_ZURICH,
  "coffee-subscription-bern": IMG_BERN,
  "coffee-subscription-basel": IMG_BASEL,
  "coffee-subscription-geneva": IMG_GENEVA,
  "coffee-subscription-lucerne": IMG_LUCERNE,
  "coffee-subscription-zug": IMG_ZUG,
  "coffee-subscription-switzerland": IMG_SWITZERLAND,
};

export function generateStaticParams() {
  return cities.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = cityBySlug(slug);
  if (!c) return {};
  return { title: c.seoTitle, description: c.seoDescription, keywords: c.keywords };
}

export default async function CityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const city = cityBySlug(slug);
  if (!city) notFound();

  // Auto-derived from roaster.city + coffee.roaster — keine Hardcoding-Pflege nötig
  const localRoasters = roastersForCity(city.city);
  const localCoffees = coffeesForCity(city.city);
  const otherCities = cities.filter((c) => c.slug !== slug && c.slug !== "coffee-subscription-switzerland").slice(0, 4);

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
            <Link href="/seo-city" className="hover:text-tertiary transition-colors">Städte</Link>
            <span>/</span>
            <span className="text-primary">{city.city}</span>
          </nav>
        </div>

        {/* Hero with city image */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-8 md:py-12">
          <div className="aspect-[21/9] md:aspect-[3/1] overflow-hidden bg-surface-container relative shadow-2xl">
            <img src={CITY_IMAGES[city.slug] || IMG_SWITZERLAND} alt={city.city} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 text-on-primary">
              <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[10px] md:text-[11px] mb-3 block">
                <span className="material-symbols-outlined text-base align-middle mr-1">location_on</span>
                {city.region} · {city.population} Einwohner
              </span>
              <h1 className="text-3xl md:text-5xl lg:text-6xl leading-[1.05] font-headline font-bold uppercase tracking-tight">
                Coffee Subscription<br /><span className="text-tertiary">{city.city}</span>
              </h1>
            </div>
          </div>
          <p className="text-lg text-on-surface-variant leading-relaxed max-w-3xl mx-auto text-center mt-8 md:mt-12">{city.hero}</p>
        </section>

        {/* Delivery Info Strip */}
        <section className="bg-primary text-on-primary py-10 md:py-12">
          <div className="max-w-7xl mx-auto px-6 md:px-8 flex flex-wrap justify-center gap-x-8 md:gap-x-16 gap-y-8">
            {city.deliveryInfo.map((d) => (
              <div key={d.label} className="text-center min-w-[140px] md:min-w-[180px]">
                <span className="material-symbols-outlined text-tertiary text-3xl mb-2 block">{d.icon}</span>
                <p className="font-headline font-bold text-tertiary text-base uppercase tracking-tight mb-1">{d.value}</p>
                <p className="font-headline text-[10px] uppercase tracking-widest text-on-primary/60 font-bold">{d.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Coffee Scene */}
        <section className="max-w-3xl mx-auto px-6 md:px-8 py-16 md:py-20">
          <h2 className="text-2xl md:text-3xl text-primary mb-6 uppercase tracking-tight font-headline font-bold text-center">
            Die {city.city} Coffee-Szene
          </h2>
          <p className="text-lg text-on-surface-variant leading-relaxed">{city.coffeeScene}</p>
        </section>

        {/* Local Roasters */}
        {localRoasters.length > 0 && (
          <section className="bg-surface-container-low py-16 md:py-20 border-y border-primary/5">
            <div className="max-w-7xl mx-auto px-6 md:px-8">
              <div className="text-center mb-12">
                <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
                  Aus {city.city}
                </span>
                <h2 className="text-2xl md:text-3xl text-primary uppercase tracking-tight font-headline font-bold">
                  Lokale Röstereien im Sortiment
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {localRoasters.map((r) => r && (
                  <Link
                    key={r.slug}
                    href={`/roasters/${r.slug}`}
                    className="group bg-white shadow-sm hover:shadow-xl transition-all"
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      <img src={r.image} alt={r.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>
                    <div className="p-6">
                      <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold block mb-1">{r.city} · seit {r.founded}</span>
                      <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-xl group-hover:text-tertiary transition-colors mb-2">
                        {r.name}
                      </h3>
                      <p className="text-sm text-on-surface-variant leading-relaxed">{r.shortDesc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Coffees aus dieser Stadt — auto-derived */}
        {localCoffees.length > 0 && (
          <section className="max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-20">
            <div className="text-center mb-12">
              <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
                Im Sortiment
              </span>
              <h2 className="text-2xl md:text-3xl text-primary uppercase tracking-tight font-headline font-bold">
                Kaffee aus {city.city}
              </h2>
              <p className="text-on-surface-variant mt-3">{localCoffees.length} {localCoffees.length === 1 ? "Kaffee" : "Kaffees"} der lokalen Röstereien</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {localCoffees.map((c) => (
                <Link
                  key={c.slug}
                  href={`/coffee/${c.slug}`}
                  className="group bg-white shadow-sm hover:shadow-xl transition-all p-6 flex flex-col"
                >
                  <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold mb-1">{c.origin}</span>
                  <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-1 group-hover:text-tertiary transition-colors">
                    {c.name}
                  </h3>
                  <p className="text-xs text-on-surface-variant mb-3">{c.roaster}</p>
                  <p className="text-xs text-on-surface-variant mb-4 flex-1">{c.tasteTypes[0]?.tagline}</p>
                  <div className="flex justify-between items-center pt-3 border-t border-surface-container">
                    <span className="font-headline font-bold text-primary">{c.price}</span>
                    <span className="font-headline text-[10px] uppercase tracking-[0.3em] text-tertiary group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Why Abo */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-20">
          <h2 className="text-2xl md:text-3xl text-primary mb-12 uppercase tracking-tight font-headline font-bold text-center">
            Warum Coffee Subscription in {city.city}?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {city.whyAbo.map((b) => (
              <div key={b.title} className="bg-white p-6 md:p-8 shadow-sm border-l-4 border-tertiary">
                <span className="material-symbols-outlined text-tertiary text-3xl mb-4 block">{b.icon}</span>
                <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-3">{b.title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{b.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Neighborhoods */}
        <section className="bg-surface-variant py-12 md:py-16">
          <div className="max-w-5xl mx-auto px-6 md:px-8 text-center">
            <h2 className="text-xl md:text-2xl text-primary mb-6 uppercase tracking-tight font-headline font-bold">
              Wir liefern in alle Quartiere
            </h2>
            <div className="flex flex-wrap justify-center gap-2 md:gap-3">
              {city.neighborhoods.map((n) => (
                <span key={n} className="bg-white px-4 py-2 font-headline text-[11px] uppercase tracking-widest font-bold text-primary border border-primary/10">
                  {n}
                </span>
              ))}
            </div>
            <p className="text-xs text-on-surface-variant mt-6">Postleitzahlen: {city.postcodes}</p>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-6 md:px-8 py-16 md:py-20">
          <h2 className="text-2xl md:text-3xl text-primary mb-8 uppercase tracking-tight font-headline font-bold text-center">
            Häufige Fragen — {city.city}
          </h2>
          <div className="space-y-3">
            {city.faqs.map((f) => (
              <details key={f.q} className="bg-white shadow-sm group">
                <summary className="flex justify-between items-center cursor-pointer p-6 list-none">
                  <span className="font-headline font-bold text-primary uppercase tracking-tight pr-4">{f.q}</span>
                  <span className="material-symbols-outlined text-tertiary group-open:rotate-180 transition-transform shrink-0">expand_more</span>
                </summary>
                <div className="px-6 pb-6 text-on-surface-variant leading-relaxed">{f.a}</div>
              </details>
            ))}
          </div>
        </section>

        {/* Other Cities */}
        {otherCities.length > 0 && (
          <section className="bg-surface-container-low py-16 md:py-20 border-t border-primary/5">
            <div className="max-w-7xl mx-auto px-6 md:px-8">
              <h2 className="text-2xl md:text-3xl text-primary mb-8 uppercase tracking-tight font-headline font-bold text-center">
                Weitere Städte
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {otherCities.map((o) => (
                  <Link
                    key={o.slug}
                    href={`/seo-city/${o.slug}`}
                    className="group bg-white p-5 shadow-sm hover:shadow-xl transition-all border-l-4 border-tertiary/0 hover:border-tertiary"
                  >
                    <span className="material-symbols-outlined text-tertiary text-xl mb-2 block">location_on</span>
                    <h3 className="font-headline font-bold text-primary uppercase tracking-tight group-hover:text-tertiary transition-colors mb-1">
                      {o.city}
                    </h3>
                    <p className="text-xs text-on-surface-variant">{o.region}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="bg-primary text-on-primary py-20">
          <div className="max-w-3xl mx-auto px-6 md:px-8 text-center">
            <h2 className="text-3xl md:text-4xl mb-6 uppercase tracking-tight font-headline font-bold">
              Bereit für deinen Match in {city.city}?
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
            <img alt="Coffee Selection" className="h-40 md:h-56 w-auto object-contain" src={LOGO} />
          </Link>
          <span>© 2024 Coffee Selection · Handverlesen aus der Schweiz</span>
        </div>
      </footer>
    </div>
  );
}
