import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllCoffees, getCoffeeBySlug } from "@/lib/coffees";

const LOGO = "/logo.png";
const COFFEE_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC-mgzdszeDV-ADPnt08LksEtq5jHo_pZiXrnzVNy7faF7CAvNwCIqw0tZ2ylgRbHNuI-cdksgJ49bjfH36AYZerX9qRPq7kE2svCJ2KsLCMhI2k4Dc50D2D5FEGms1FJKDbeS75aSghLNY7Dop_dxhV5e-766gOscbYVVzn4qpX1rtPcumcDu7hr6OQeoiBzbRrze7HIkmFAM9YOYzQFzRF1wR3U1Ec53bS5Aj9xRlWvn7KxLIHJL79Wy6T8BFR47-ulGO1PjIJKEL";

export function generateStaticParams() {
  return getAllCoffees().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = getCoffeeBySlug(slug);
  if (!c) return {};
  return {
    title: `${c.name} — ${c.roaster} | Coffee Selection`,
    description: `${c.name} aus ${c.origin}, geröstet von ${c.roaster}. Specialty Coffee, Direct Trade, ${c.price}.`,
    keywords: [c.name.toLowerCase(), c.origin.toLowerCase(), c.roaster.toLowerCase(), "specialty coffee", "schweizer kaffee"],
  };
}

export default async function CoffeeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const coffee = getCoffeeBySlug(slug);
  if (!coffee) notFound();

  const primaryType = coffee.tasteTypes[0];

  return (
    <div className="bg-[#F9F5F0] text-on-surface pb-20 md:pb-0">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5">
        <nav className="flex justify-between items-center max-w-7xl mx-auto px-6 md:px-8 w-full">
          <Link href="/" className="flex items-center">
            <img alt="Coffee Selection" className="h-40 md:h-52 w-auto object-contain -my-6 md:-my-10" src={LOGO} />
          </Link>
          <Link
            href="/checkout/payment"
            className="bg-primary text-white px-5 md:px-6 py-3 text-[11px] md:text-[12px] uppercase tracking-[0.2em] font-headline font-bold hover:bg-black transition-all"
          >
            In den Warenkorb
          </Link>
        </nav>
      </header>

      <main className="pt-28 md:pt-32">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-6 md:px-8 pt-8">
          <nav className="font-headline text-[10px] uppercase tracking-[0.3em] text-on-surface-variant flex items-center gap-2 flex-wrap">
            <Link href="/" className="hover:text-tertiary transition-colors">Home</Link>
            <span>/</span>
            <Link href={`/taste-types/${primaryType.slug}`} className="hover:text-tertiary transition-colors">{primaryType.name}</Link>
            <span>/</span>
            <span className="text-primary">{coffee.name}</span>
          </nav>
        </div>

        {/* Coffee Hero */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            <div>
              <div className="aspect-square overflow-hidden bg-surface-container-low shadow-2xl">
                <img src={COFFEE_IMG} alt={coffee.name} className="w-full h-full object-cover" />
              </div>
            </div>

            <div className="lg:sticky lg:top-28 lg:self-start space-y-8">
              <div>
                <Link
                  href={`/taste-types/${primaryType.slug}`}
                  className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 inline-block hover:text-primary transition-colors"
                >
                  Für {primaryType.name}
                </Link>
                <h1 className="text-4xl md:text-5xl lg:text-6xl text-primary leading-[1.1] mb-4 font-headline font-bold uppercase tracking-tight">
                  {coffee.name}
                </h1>
                <p className="font-headline text-on-surface-variant uppercase tracking-widest text-sm mb-6">
                  {coffee.roaster} · {coffee.origin}
                </p>
                <p className="text-base md:text-lg text-on-surface-variant leading-relaxed">
                  {primaryType.heroDesc.split(".")[0]}. Dieser Kaffee wurde sorgfältig von {coffee.roaster} geröstet — Direct Trade, röstfrisch, in Kleinmengen.
                </p>
              </div>

              {/* Tasting Notes */}
              <div>
                <h3 className="font-headline text-[11px] uppercase tracking-[0.2em] text-on-surface-variant font-bold mb-3">Aromen-Profil</h3>
                <div className="flex flex-wrap gap-2">
                  {primaryType.aromas.slice(0, 5).map((a) => (
                    <span key={a} className="bg-white border border-tertiary/30 px-4 py-2 font-headline text-[10px] uppercase tracking-widest font-bold text-primary">
                      {a}
                    </span>
                  ))}
                </div>
              </div>

              {/* Coffee specs */}
              <div className="bg-white p-6 md:p-8 shadow-md grid grid-cols-2 gap-4">
                {[
                  { label: "Herkunft", value: coffee.origin },
                  { label: "Röster", value: coffee.roaster },
                  { label: "Brühmethoden", value: primaryType.brewing.slice(0, 2).join(", ") },
                  { label: "Trade", value: "Direct Trade" },
                ].map((s) => (
                  <div key={s.label}>
                    <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1">
                      {s.label}
                    </span>
                    <span className="text-primary font-headline text-sm">{s.value}</span>
                  </div>
                ))}
              </div>

              {/* Price + CTA */}
              <div className="bg-primary text-on-primary p-6 md:p-8">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <span className="font-headline text-[10px] uppercase tracking-widest text-on-primary/60 block">Preis · 250g</span>
                    <span className="font-headline font-bold text-3xl md:text-4xl text-tertiary">{coffee.price}</span>
                  </div>
                  <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold">
                    {coffee.matchScore}% Match
                  </span>
                </div>
                <Link
                  href="/checkout/payment"
                  className="block w-full text-center bg-tertiary text-primary py-4 mb-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-white transition-all"
                >
                  In den Warenkorb · Einmalig
                </Link>
                <Link
                  href="/subscription/discovery"
                  className="block w-full text-center border-2 border-tertiary text-tertiary py-4 font-headline font-bold text-xs uppercase tracking-widest hover:bg-tertiary hover:text-primary transition-all"
                >
                  Abo starten · -15% Sparen
                </Link>
                <p className="text-xs text-on-primary/60 text-center mt-4">
                  Inkl. Versand · röstfrisch in 2–4 Werktagen
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Long Story */}
        <section className="bg-surface-container-low py-16 md:py-20 border-y border-primary/5">
          <div className="max-w-3xl mx-auto px-6 md:px-8">
            <h2 className="text-2xl md:text-3xl text-primary mb-6 uppercase tracking-tight font-headline font-bold text-center">
              Über diesen Kaffee
            </h2>
            <p className="text-lg text-on-surface-variant leading-relaxed">{primaryType.longDesc}</p>
            <p className="text-lg text-on-surface-variant leading-relaxed mt-6">
              <strong className="text-primary">{coffee.roaster}</strong> röstet diesen {coffee.origin}-Kaffee in kleinen Chargen. Du erhältst ihn röstfrisch — die Bohnen werden erst nach deiner Bestellung verpackt.
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary text-on-primary py-16">
          <div className="max-w-3xl mx-auto px-6 md:px-8 text-center">
            <h2 className="text-2xl md:text-4xl mb-6 uppercase tracking-tight font-headline font-bold">
              Bereit für einen Schluck {coffee.name}?
            </h2>
            <Link
              href="/checkout/payment"
              className="inline-block bg-tertiary text-primary px-10 py-5 font-headline font-bold text-xs uppercase tracking-widest hover:bg-white transition-all"
            >
              Jetzt bestellen · {coffee.price}
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

      {/* Sticky Mobile CTA */}
      <Link
        href="/checkout/payment"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-tertiary text-primary py-5 text-center font-headline font-bold uppercase tracking-widest text-xs shadow-2xl"
      >
        Bestellen · {coffee.price}
      </Link>
    </div>
  );
}
