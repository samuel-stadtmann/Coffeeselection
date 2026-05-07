import Link from "next/link";
import AccountLayout, { PageHeader } from "@/components/AccountLayout";

const history = [
  { date: "01.05.2025", coffee: "Ethiopia Yirgacheffe", roaster: "Miro Coffee", match: 96, rating: null, slug: "ethiopia-yirgacheffe" },
  { date: "17.04.2025", coffee: "Kenya AA Nyeri", roaster: "Vertical Coffee", match: 94, rating: 5, slug: "kenya-aa-nyeri" },
  { date: "03.04.2025", coffee: "Rwanda Anaerobic", roaster: "La Cabra", match: 90, rating: 4, slug: "rwanda-anaerobic" },
  { date: "20.03.2025", coffee: "Ethiopia Gedeb Washed", roaster: "Miro Coffee", match: 97, rating: 5, slug: "ethiopia-gedeb-washed" },
  { date: "06.03.2025", coffee: "Panama Geisha", roaster: "Sweven Coffee", match: 95, rating: 5, slug: "panama-geisha" },
  { date: "20.02.2025", coffee: "Colombia Pink Bourbon", roaster: "La Cabra", match: 90, rating: 3, slug: "colombia-pink-bourbon" },
];

export default function Page() {
  const avgMatch = Math.round(history.reduce((s, h) => s + h.match, 0) / history.length);
  const rated = history.filter((h) => h.rating !== null);
  const avgRating = (rated.reduce((s, h) => s + (h.rating ?? 0), 0) / rated.length).toFixed(1);

  return (
    <AccountLayout>
      <PageHeader subtitle="Empfehlungen" title="Match-Historie" description="Alle Empfehlungen unseres Algorithmus mit deinen Bewertungen. Je mehr du bewertest, desto besser werden die Matches." />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Empfehlungen total", value: history.length, icon: "auto_awesome" },
          { label: "Ø Match-Score", value: `${avgMatch}%`, icon: "psychology" },
          { label: "Ø Bewertung", value: `${avgRating} / 5`, icon: "star" },
        ].map((s) => (
          <div key={s.label} className="bg-white p-6 shadow-sm">
            <span className="material-symbols-outlined text-tertiary text-2xl mb-3 block">{s.icon}</span>
            <p className="font-headline font-bold text-primary text-2xl uppercase tracking-tight">{s.value}</p>
            <p className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">{s.label}</p>
          </div>
        ))}
      </div>

      {/* History List */}
      <div className="bg-white p-6 md:p-8 shadow-sm">
        <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-6">Verlauf</h3>
        <div className="divide-y divide-surface-container">
          {history.map((h) => (
            <div key={h.date} className="py-4 grid grid-cols-1 md:grid-cols-[auto_1fr_auto_auto] gap-3 md:gap-6 items-center">
              <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold">{h.date}</span>
              <div>
                <Link href={`/coffee/${h.slug}`} className="font-headline font-bold text-primary uppercase tracking-tight hover:text-tertiary transition-colors">
                  {h.coffee}
                </Link>
                <p className="text-xs text-on-surface-variant">{h.roaster}</p>
              </div>
              <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">{h.match}% Match</span>
              <span className="font-headline text-[11px] uppercase tracking-widest font-bold">
                {h.rating ? <span className="text-tertiary">{"★".repeat(h.rating)}{"☆".repeat(5 - h.rating)}</span> : <span className="text-on-surface-variant/60">— Bewerten</span>}
              </span>
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
