import Link from "next/link";
import type { Metadata } from "next";
import { getRoasters } from "@/lib/db/roasters";
import { getCoffees } from "@/lib/db/coffees";

const LOGO = "/logo.png";
const ROASTER_FALLBACK_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDsi0Cm5pc68_wHYzSlE9JU3hSFfItOBscVq7fRgSVQF2O2c1qq3Lur8RIyfH1J56Xmysu8_-LJxl3wpeTypHOshuMB_3c8-5Z-yuccHxOvjlh1rBBx9aJ_L6xn0ES5e12zVKtvjtl1pI1K-J8kdzYr-ifacUyJTZrRDt5L4C7tyBQLYyKcpkoNC0Go4fagorT6mBPJdkR5u6AGDLnIFfYxzAiKDRRtiCr6pss5eRNI3-kBz3TRwC3MXJQNVV9oH7rHgXvPfiZieg";

export const metadata: Metadata = {
  title: "Alle Röster — Schweizer Specialty Coffee | Coffee Selection",
  description: "Alle Schweizer Specialty-Coffee-Röstereien auf einen Blick.",
  keywords: ["schweizer kaffeeröster", "specialty coffee schweiz", "kaffeerösterei schweiz", "direct trade kaffee"],
};

const navLinks = [
  { href: "/quiz/question-1-brewing-method", label: "Quiz" },
  { href: "/taste-types", label: "Geschmackstypen" },
  { href: "/roasters", label: "Röster" },
  { href: "/subscription/discovery", label: "Subscription" },
];

export default async function RoastersOverviewPage() {
  const roasters = await getRoasters();
  const allCoffees = await getCoffees();
  const coffeesByRoaster = allCoffees.reduce<Record<string, number>>((acc, c) => {
    acc[c.roaster_slug] = (acc[c.roaster_slug] ?? 0) + 1;
    return acc;
  }, {});
  const allCities = Array.from(new Set(roasters.map((r) => r.city).filter(Boolean) as string[])).sort();
  return (
    <div className="bg-[#F9F5F0] text-on-surface pb-20 md:pb-0">
      <header className="fixed top-0 w-full z-50 h-20 md:h-24 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5">
        <nav className="flex justify-between items-center gap-3 h-full max-w-7xl mx-auto px-6 md:px-8 w-full">
          <Link href="/" className="flex items-center shrink-0 h-full overflow-hidden">
            <img alt="Coffee Selection" className="h-24 sm:h-32 md:h-40 lg:h-44 w-auto object-contain object-left mr-8 shrink-0" src={LOGO} />
          </Link>
          <div className="hidden lg:flex items-center space-x-10">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`hover:text-tertiary transition-colors font-headline font-bold tracking-widest uppercase text-[14px] ${l.href === "/roasters" ? "text-tertiary" : "text-primary"}`}
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center space-x-4 md:space-x-6">
            <Link href="/login?next=/account/dashboard" className="hidden md:block">
              <span className="material-symbols-outlined text-primary text-2xl hover:text-tertiary transition-colors">person</span>
            </Link>
            <Link href="/checkout/cart">
              <span className="material-symbols-outlined text-primary text-2xl hover:text-tertiary transition-colors">shopping_bag</span>
            </Link>
            <Link
              href="/quiz/question-1-brewing-method"
              className="bg-primary text-white px-5 md:px-6 py-3 text-[11px] md:text-[12px] uppercase tracking-[0.2em] font-headline font-bold hover:bg-black transition-all whitespace-nowrap"
            >
              Quiz starten
            </Link>
          </div>
        </nav>
      </header>

      <main className="pt-20 md:pt-24">
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-12 md:py-20 text-center">
          <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-6 block">
            Direct Trade · Handwerk · Schweiz
          </span>
          <h1 className="text-4xl md:text-6xl text-primary leading-[1.1] mb-6 font-headline font-bold uppercase tracking-tight max-w-4xl mx-auto">
            Alle Röster
          </h1>
          <p className="text-lg text-on-surface-variant leading-relaxed max-w-2xl mx-auto">
            Wir arbeiten mit {roasters.length} Specialty-Coffee-Röstereien der Schweiz zusammen. Jede mit einer eigenen Handschrift, eigenem Stil, eigener Geschichte.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {allCities.map((c) => (
              <span key={c} className="bg-white px-4 py-2 font-headline text-[10px] uppercase tracking-widest font-bold text-primary border border-primary/10">
                {c}
              </span>
            ))}
          </div>
        </section>

        {/* Roaster Grid */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {roasters.map((r) => (
              <Link
                key={r.slug}
                href={`/roasters/${r.slug}`}
                className="group bg-white shadow-sm hover:shadow-2xl transition-all flex flex-col"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-surface-container-low">
                  <img
                    src={r.hero_image_url || r.logo_url || ROASTER_FALLBACK_IMG}
                    alt={r.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="font-headline text-[10px] uppercase tracking-[0.3em] text-tertiary font-bold block mb-1">
                      {r.city ?? r.country}
                    </span>
                    <h3 className="font-headline font-bold text-on-primary uppercase tracking-tight text-xl">
                      {r.name}
                    </h3>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  {r.short_description && (
                    <p className="text-sm text-on-surface-variant leading-relaxed mb-4 flex-1">
                      {r.short_description}
                    </p>
                  )}
                  <div className="flex justify-between items-center pt-4 border-t border-surface-container">
                    <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant">
                      {coffeesByRoaster[r.slug] ?? 0} Kaffees
                    </span>
                    <span className="font-headline text-[10px] uppercase tracking-[0.3em] text-tertiary font-bold group-hover:text-primary transition-colors flex items-center gap-1">
                      Mehr <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary text-on-primary py-20">
          <div className="max-w-3xl mx-auto px-6 md:px-8 text-center">
            <h2 className="text-3xl md:text-4xl mb-6 uppercase tracking-tight font-headline font-bold">
              Welcher Röster passt zu dir?
            </h2>
            <p className="text-lg text-on-primary/70 mb-10">
              Mach das Quiz — wir matchen dich mit dem Röster, der zu deinem Geschmackstyp passt.
            </p>
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
