import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCoffeeBySlug, getCoffeeSlugsForStatic } from "@/lib/db/coffees";
import { coffeeCategories, categoryBySlug, getCoffeesForCategory } from "@/lib/coffee-categories";

const LOGO = "/logo.png";
const COFFEE_FALLBACK_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC-mgzdszeDV-ADPnt08LksEtq5jHo_pZiXrnzVNy7faF7CAvNwCIqw0tZ2ylgRbHNuI-cdksgJ49bjfH36AYZerX9qRPq7kE2svCJ2KsLCMhI2k4Dc50D2D5FEGms1FJKDbeS75aSghLNY7Dop_dxhV5e-766gOscbYVVzn4qpX1rtPcumcDu7hr6OQeoiBzbRrze7HIkmFAM9YOYzQFzRF1wR3U1Ec53bS5Aj9xRlWvn7KxLIHJL79Wy6T8BFR47-ulGO1PjIJKEL";

export async function generateStaticParams() {
  const coffees = await getCoffeeSlugsForStatic();
  const cats = coffeeCategories.map((c) => ({ slug: c.slug }));
  return [...coffees, ...cats];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cat = categoryBySlug(slug);
  if (cat) {
    return { title: cat.seoTitle, description: cat.seoDescription, keywords: cat.keywords };
  }
  const c = await getCoffeeBySlug(slug);
  if (!c) return {};
  const origin = c.origin_name_de ?? "Specialty";
  return {
    title: `${c.name} — ${c.roaster_name} | Coffee Selection`,
    description: `${c.name} aus ${origin}, geröstet von ${c.roaster_name}. Specialty Coffee, Direct Trade, CHF ${Number(c.price_chf).toFixed(2)}.`,
    keywords: [c.name.toLowerCase(), origin.toLowerCase(), c.roaster_name.toLowerCase(), "specialty coffee", "schweizer kaffee"],
  };
}

function Header() {
  return (
    <header className="fixed top-0 w-full z-50 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5">
      <nav className="flex justify-between items-center max-w-7xl mx-auto px-6 md:px-8 w-full">
        <Link href="/" className="flex items-center">
          <img alt="Coffee Selection" className="h-56 md:h-72 w-auto object-contain -my-10 md:-my-16" src={LOGO} />
        </Link>
        <Link
          href="/quiz/question-1-brewing-method"
          className="bg-primary text-white px-5 md:px-6 py-3 text-[11px] md:text-[12px] uppercase tracking-[0.2em] font-headline font-bold hover:bg-black transition-all"
        >
          Quiz starten
        </Link>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="w-full px-6 md:px-8 bg-[#F9F5F0] border-t border-primary/5 py-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] text-on-surface-variant/60 font-headline font-bold uppercase tracking-[0.3em]">
        <Link href="/" className="flex items-center">
          <img alt="Coffee Selection" className="h-40 md:h-56 w-auto object-contain" src={LOGO} />
        </Link>
        <span>© 2024 Coffee Selection · Handverlesen aus der Schweiz</span>
      </div>
    </footer>
  );
}

export default async function CoffeePageOrCategory({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = categoryBySlug(slug);

  // Category page — render filter view
  if (cat) {
    const coffees = await getCoffeesForCategory(cat);
    const otherCats = coffeeCategories.filter((c) => c.slug !== slug).slice(0, 4);
    return (
      <div className="bg-[#F9F5F0] text-on-surface pb-20 md:pb-0">
        <Header />
        <main className="pt-36 md:pt-40">
          {/* Breadcrumb */}
          <div className="max-w-7xl mx-auto px-6 md:px-8 pt-8">
            <nav className="font-headline text-[10px] uppercase tracking-[0.3em] text-on-surface-variant flex items-center gap-2 flex-wrap">
              <Link href="/" className="hover:text-tertiary transition-colors">Home</Link>
              <span>/</span>
              <Link href="/coffee" className="hover:text-tertiary transition-colors">Coffees</Link>
              <span>/</span>
              <span className="text-primary">{cat.shortLabel}</span>
            </nav>
          </div>

          {/* Hero */}
          <section className="max-w-7xl mx-auto px-6 md:px-8 py-12 md:py-16 text-center">
            <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-6 block">
              Coffee Kategorie
            </span>
            <h1 className="text-3xl md:text-5xl text-primary leading-[1.1] mb-4 font-headline font-bold uppercase tracking-tight max-w-4xl mx-auto">
              {cat.title}
            </h1>
            <p className="font-headline text-tertiary uppercase tracking-widest text-sm mb-6 font-bold">{cat.tagline}</p>
            <p className="text-lg text-on-surface-variant leading-relaxed max-w-3xl mx-auto">{cat.intro}</p>
          </section>

          {/* Coffees Grid */}
          <section className="max-w-7xl mx-auto px-6 md:px-8 mb-16">
            <div className="flex justify-between items-end mb-8 gap-4 flex-wrap">
              <h2 className="text-xl md:text-2xl text-primary uppercase tracking-tight font-headline font-bold">
                {coffees.length} {coffees.length === 1 ? "Kaffee" : "Kaffees"} in dieser Kategorie
              </h2>
              <Link
                href="/quiz/question-1-brewing-method"
                className="font-headline text-[11px] font-bold uppercase tracking-[0.3em] text-tertiary hover:text-primary transition-colors border-b-2 border-tertiary pb-2"
              >
                Quiz für Match
              </Link>
            </div>
            {coffees.length === 0 ? (
              <div className="bg-white p-12 text-center shadow-sm">
                <span className="material-symbols-outlined text-tertiary text-4xl mb-4 block">coffee</span>
                <p className="text-on-surface-variant">Aktuell keine Kaffees in dieser Kategorie. Schau bald wieder vorbei.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coffees.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/coffee/${c.slug}`}
                    className="group bg-white shadow-sm hover:shadow-xl transition-all flex flex-col"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-surface-container-low">
                      <img src={COFFEE_FALLBACK_IMG} alt={c.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold mb-1">{c.origin}</span>
                      <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-1 group-hover:text-tertiary transition-colors">
                        {c.name}
                      </h3>
                      <p className="text-xs text-on-surface-variant mb-3">{c.roaster}</p>
                      <p className="text-xs text-on-surface-variant mb-4 flex-1">{c.shortDescription ?? c.tasteTypes[0]?.tagline ?? ""}</p>
                      <div className="flex justify-between items-center pt-4 border-t border-surface-container">
                        <span className="font-headline font-bold text-primary text-lg">{c.price}</span>
                        <span className="font-headline text-[10px] uppercase tracking-[0.3em] text-tertiary group-hover:translate-x-1 transition-transform">
                          Ansehen →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Educational */}
          <section className="bg-surface-container-low py-16 md:py-20 border-y border-primary/5">
            <div className="max-w-5xl mx-auto px-6 md:px-8">
              <h2 className="text-2xl md:text-3xl text-primary mb-12 uppercase tracking-tight font-headline font-bold text-center">
                Wissen rund um {cat.shortLabel}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cat.educational.map((e) => (
                  <div key={e.heading} className="bg-white p-6 md:p-8 shadow-sm border-l-4 border-tertiary">
                    <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-base mb-3">{e.heading}</h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed">{e.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Other categories */}
          <section className="max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-20">
            <h2 className="text-2xl md:text-3xl text-primary mb-8 uppercase tracking-tight font-headline font-bold text-center">
              Andere Kategorien
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {otherCats.map((o) => (
                <Link
                  key={o.slug}
                  href={`/coffee/${o.slug}`}
                  className="group bg-white p-6 shadow-sm hover:shadow-xl transition-all border-l-4 border-tertiary/0 hover:border-tertiary"
                >
                  <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-sm mb-1 group-hover:text-tertiary transition-colors">
                    {o.shortLabel}
                  </h3>
                  <p className="text-xs text-on-surface-variant">{o.tagline}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="bg-primary text-on-primary py-16">
            <div className="max-w-3xl mx-auto px-6 md:px-8 text-center">
              <h2 className="text-2xl md:text-4xl mb-6 uppercase tracking-tight font-headline font-bold">
                Quiz statt Stöbern
              </h2>
              <p className="text-lg text-on-primary/70 mb-8">In 60 Sekunden findet unser Algorithmus den perfekten Kaffee für dich.</p>
              <Link
                href="/quiz/question-1-brewing-method"
                className="inline-block bg-tertiary text-primary px-10 py-5 font-headline font-bold text-xs uppercase tracking-widest hover:bg-white transition-all"
              >
                Quiz starten
              </Link>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  // Coffee detail page — render product view
  const coffee = await getCoffeeBySlug(slug);
  if (!coffee) notFound();

  const origin = coffee.origin_name_de ?? "Specialty";
  const priceLabel = `CHF ${Number(coffee.price_chf).toFixed(2)}`;
  const aromas = coffee.flavor_slugs ?? [];
  const brewing = coffee.recommended_brewing_slugs ?? [];
  const description =
    coffee.description ?? coffee.short_description ?? coffee.tasting_summary ?? "";

  return (
    <div className="bg-[#F9F5F0] text-on-surface pb-20 md:pb-0">
      <Header />
      <main className="pt-36 md:pt-40">
        <div className="max-w-7xl mx-auto px-6 md:px-8 pt-8">
          <nav className="font-headline text-[10px] uppercase tracking-[0.3em] text-on-surface-variant flex items-center gap-2 flex-wrap">
            <Link href="/" className="hover:text-tertiary transition-colors">Home</Link>
            <span>/</span>
            <Link href={`/roasters/${coffee.roaster_slug}`} className="hover:text-tertiary transition-colors">{coffee.roaster_name}</Link>
            <span>/</span>
            <span className="text-primary">{coffee.name}</span>
          </nav>
        </div>

        <section className="max-w-7xl mx-auto px-6 md:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            <div>
              <div className="aspect-square overflow-hidden bg-surface-container-low shadow-2xl">
                <img src={coffee.image_url || COFFEE_FALLBACK_IMG} alt={coffee.name} className="w-full h-full object-cover" />
              </div>
            </div>

            <div className="lg:sticky lg:top-28 lg:self-start space-y-8">
              <div>
                <Link
                  href={`/roasters/${coffee.roaster_slug}`}
                  className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 inline-block hover:text-primary transition-colors"
                >
                  {coffee.roaster_name}
                </Link>
                <h1 className="text-4xl md:text-5xl lg:text-6xl text-primary leading-[1.1] mb-4 font-headline font-bold uppercase tracking-tight">
                  {coffee.name}
                </h1>
                <p className="font-headline text-on-surface-variant uppercase tracking-widest text-sm mb-6">
                  {origin}{coffee.region ? ` · ${coffee.region}` : ""}{coffee.processing_name_de ? ` · ${coffee.processing_name_de}` : ""}
                </p>
                {description && (
                  <p className="text-base md:text-lg text-on-surface-variant leading-relaxed">{description}</p>
                )}
              </div>

              {aromas.length > 0 && (
                <div>
                  <h3 className="font-headline text-[11px] uppercase tracking-[0.2em] text-on-surface-variant font-bold mb-3">Aromen-Profil</h3>
                  <div className="flex flex-wrap gap-2">
                    {aromas.slice(0, 6).map((a) => (
                      <span key={a} className="bg-white border border-tertiary/30 px-4 py-2 font-headline text-[10px] uppercase tracking-widest font-bold text-primary">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white p-6 md:p-8 shadow-md grid grid-cols-2 gap-4">
                {[
                  { label: "Herkunft", value: origin },
                  { label: "Röster", value: coffee.roaster_name },
                  ...(coffee.variety_name ? [{ label: "Varietät", value: coffee.variety_name }] : []),
                  ...(coffee.processing_name_de ? [{ label: "Aufbereitung", value: coffee.processing_name_de }] : []),
                  ...(coffee.altitude_m_min ? [{ label: "Höhe", value: `${coffee.altitude_m_min}${coffee.altitude_m_max ? `–${coffee.altitude_m_max}` : ""} m` }] : []),
                  ...(coffee.harvest_year ? [{ label: "Ernte", value: String(coffee.harvest_year) }] : []),
                  ...(coffee.roast_level ? [{ label: "Röstgrad", value: coffee.roast_level }] : []),
                  ...(brewing.length ? [{ label: "Brühmethoden", value: brewing.slice(0, 3).join(", ") }] : []),
                ].slice(0, 6).map((s) => (
                  <div key={s.label}>
                    <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1">
                      {s.label}
                    </span>
                    <span className="text-primary font-headline text-sm">{s.value}</span>
                  </div>
                ))}
              </div>

              <div className="bg-primary text-on-primary p-6 md:p-8">
                <div className="mb-6">
                  <span className="font-headline text-[10px] uppercase tracking-widest text-on-primary/60 block">Preis · {coffee.weight_g}g</span>
                  <span className="font-headline font-bold text-3xl md:text-4xl text-tertiary">{priceLabel}</span>
                </div>
                <Link
                  href="/checkout/cart"
                  className="block w-full text-center bg-tertiary text-primary py-4 mb-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-white transition-all"
                >
                  In den Warenkorb · Einmalig
                </Link>
                <Link
                  href="/match-result"
                  className="block w-full text-center border-2 border-tertiary text-tertiary py-4 font-headline font-bold text-xs uppercase tracking-widest hover:bg-tertiary hover:text-primary transition-all"
                >
                  Abo konfigurieren · -15% Sparen
                </Link>
                <p className="text-xs text-on-primary/60 text-center mt-4">
                  Versand ab CHF 100 kostenlos · röstfrisch in 2–4 Werktagen
                </p>
              </div>
            </div>
          </div>
        </section>

        {(coffee.description || coffee.tasting_summary) && (
          <section className="bg-surface-container-low py-16 md:py-20 border-y border-primary/5">
            <div className="max-w-3xl mx-auto px-6 md:px-8">
              <h2 className="text-2xl md:text-3xl text-primary mb-6 uppercase tracking-tight font-headline font-bold text-center">
                Über diesen Kaffee
              </h2>
              {coffee.description && (
                <p className="text-lg text-on-surface-variant leading-relaxed">{coffee.description}</p>
              )}
              {coffee.tasting_summary && (
                <p className="text-lg text-on-surface-variant leading-relaxed mt-6">
                  <strong className="text-primary">Tasting Notes — </strong>
                  {coffee.tasting_summary}
                </p>
              )}
              {coffee.farm && (
                <p className="text-base text-on-surface-variant leading-relaxed mt-6">
                  <strong className="text-primary">Farm:</strong> {coffee.farm}
                  {coffee.producer ? ` · Produzent: ${coffee.producer}` : ""}
                </p>
              )}
            </div>
          </section>
        )}

        <section className="bg-primary text-on-primary py-16">
          <div className="max-w-3xl mx-auto px-6 md:px-8 text-center">
            <h2 className="text-2xl md:text-4xl mb-6 uppercase tracking-tight font-headline font-bold">
              Bereit für einen Schluck {coffee.name}?
            </h2>
            <Link
              href="/checkout/cart"
              className="inline-block bg-tertiary text-primary px-10 py-5 font-headline font-bold text-xs uppercase tracking-widest hover:bg-white transition-all"
            >
              Jetzt bestellen · {priceLabel}
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
