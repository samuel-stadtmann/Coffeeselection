import Link from "next/link";
import AccountLayout, { PageHeader } from "@/components/AccountLayout";

const favorites = [
  { name: "Ethiopia Yirgacheffe", roaster: "Miro Coffee", origin: "Äthiopien", price: "CHF 28", slug: "ethiopia-yirgacheffe" },
  { name: "Kenya AA Nyeri", roaster: "Vertical Coffee", origin: "Kenia", price: "CHF 32", slug: "kenya-aa-nyeri" },
  { name: "Panama Geisha", roaster: "Sweven Coffee", origin: "Panama", price: "CHF 48", slug: "panama-geisha" },
  { name: "Colombia Pink Bourbon", roaster: "La Cabra", origin: "Kolumbien", price: "CHF 36", slug: "colombia-pink-bourbon" },
];

const favRoasters = [
  { name: "Miro Coffee", city: "Zürich", count: 4 },
  { name: "Vertical Coffee", city: "Bern", count: 2 },
  { name: "La Cabra Schweiz", city: "Basel", count: 2 },
];

export default function Page() {
  return (
    <AccountLayout>
      <PageHeader subtitle="Favoriten" title="Deine Lieblings-Kaffees" description="Schneller Zugriff auf die Kaffees und Röster, die du markiert hast." />

      {/* Coffees */}
      <div className="bg-white p-6 md:p-8 shadow-sm">
        <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-6">Kaffees ({favorites.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favorites.map((c) => (
            <div key={c.slug} className="bg-surface-container-low p-5 flex items-start justify-between gap-4 group">
              <div className="flex-1 min-w-0">
                <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold">{c.origin}</span>
                <Link href={`/coffee/${c.slug}`} className="block">
                  <h4 className="font-headline font-bold text-primary uppercase tracking-tight group-hover:text-tertiary transition-colors">{c.name}</h4>
                </Link>
                <p className="text-xs text-on-surface-variant">{c.roaster}</p>
                <p className="font-headline font-bold text-primary mt-2">{c.price}</p>
              </div>
              <div className="flex flex-col gap-2">
                <button className="text-tertiary hover:text-primary transition-colors" aria-label="Aus Favoriten">
                  <span className="material-symbols-outlined">favorite</span>
                </button>
                <Link href={`/coffee/${c.slug}`} className="bg-primary text-on-primary px-3 py-1 font-headline text-[10px] uppercase tracking-widest font-bold hover:bg-black transition-all whitespace-nowrap">
                  Bestellen
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Roasters */}
      <div className="bg-white p-6 md:p-8 shadow-sm">
        <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-6">Lieblings-Röster ({favRoasters.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {favRoasters.map((r) => (
            <div key={r.name} className="bg-surface-container-low p-5 border-l-4 border-tertiary">
              <h4 className="font-headline font-bold text-primary uppercase tracking-tight">{r.name}</h4>
              <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold">{r.city}</span>
              <p className="text-xs text-on-surface-variant mt-3">{r.count} Kaffees in deinen Favoriten</p>
            </div>
          ))}
        </div>
      </div>

      <Link href="/account/dashboard" className="font-headline text-[11px] uppercase tracking-[0.2em] text-tertiary hover:text-primary transition-colors border-b-2 border-tertiary pb-1 inline-block">
        ← Zurück zum Dashboard
      </Link>
    </AccountLayout>
  );
}
