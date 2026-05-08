import Link from "next/link";
import type { Metadata } from "next";
import { cities } from "@/lib/cities";

const LOGO = "/logo.png";

export const metadata: Metadata = {
  title: "Coffee Subscription Schweiz — Städte | Coffee Selection",
  description: "Specialty Coffee Subscription in allen Schweizer Städten. Zürich, Bern, Basel, Genf, Luzern, Zug — überall in 1-2 Werktagen.",
  keywords: ["coffee subscription schweiz städte", "kaffee abo schweiz", "specialty coffee städte"],
};

export default function CitiesOverview() {
  return (
    <div className="bg-[#F9F5F0] text-on-surface pb-20 md:pb-0">
      <header className="fixed top-0 w-full z-50 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5">
        <nav className="flex justify-between items-center max-w-7xl mx-auto px-6 md:px-8 w-full">
          <Link href="/" className="flex items-center">
            <img alt="Coffee Selection" className="h-72 md:h-96 w-auto object-contain -my-16 md:-my-24 mr-8" src={LOGO} />
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
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-12 md:py-16 text-center">
          <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-6 block">
            Coffee Subscription · Schweizweit
          </span>
          <h1 className="text-4xl md:text-6xl text-primary leading-[1.1] mb-6 font-headline font-bold uppercase tracking-tight max-w-4xl mx-auto">
            Specialty Coffee<br />in deiner Stadt
          </h1>
          <p className="text-lg text-on-surface-variant leading-relaxed max-w-2xl mx-auto">
            Wir liefern röstfrischen Specialty Coffee in alle 26 Kantone der Schweiz. Von Genf bis Zürich, von Basel bis Lugano. Find heraus, wie&apos;s in deiner Stadt funktioniert.
          </p>
        </section>

        <section className="max-w-7xl mx-auto px-6 md:px-8 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cities.map((c) => (
              <Link
                key={c.slug}
                href={`/seo-city/${c.slug}`}
                className="group bg-white p-8 shadow-sm hover:shadow-xl transition-all border-l-4 border-tertiary/0 hover:border-tertiary"
              >
                <span className="material-symbols-outlined text-tertiary text-3xl mb-4 block">location_on</span>
                <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-2xl mb-2 group-hover:text-tertiary transition-colors">
                  {c.city}
                </h3>
                <p className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold mb-3">
                  {c.region} · {c.population}
                </p>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {c.localRoasters.length} {c.localRoasters.length === 1 ? "lokaler Röster" : "lokale Röster"} · 1–2 Werktage Lieferung
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-primary text-on-primary py-20">
          <div className="max-w-3xl mx-auto px-6 md:px-8 text-center">
            <h2 className="text-3xl md:text-4xl mb-6 uppercase tracking-tight font-headline font-bold">
              Egal wo — wir liefern.
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
