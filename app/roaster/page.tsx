import RoasterSidebar from "@/components/RoasterSidebar";

const orders = [
  { id: "CS-2024-000124", customer: "Marco K.", product: "Ethiopia Yirgacheffe 250g", weight: "250g", status: "Ausstehend", color: "bg-amber-100 text-amber-800" },
  { id: "CS-2024-000123", customer: "Sarah M.", product: "Guatemala Huehuetenango 500g", weight: "500g", status: "Versandt", color: "bg-emerald-100 text-emerald-800" },
  { id: "CS-2024-000122", customer: "Lukas B.", product: "Brazil Cerrado 250g", weight: "250g", status: "Geröstet", color: "bg-blue-100 text-blue-800" },
  { id: "CS-2024-000121", customer: "Anna F.", product: "Kenya AA 250g", weight: "250g", status: "Ausstehend", color: "bg-amber-100 text-amber-800" },
  { id: "CS-2024-000120", customer: "David S.", product: "Colombia Supremo 500g", weight: "500g", status: "Geliefert", color: "bg-stone-100 text-stone-700" },
];

const kpis = [
  { label: "Aktive Abonnenten", value: "342", icon: "groups", trend: "+12" },
  { label: "Offene Bestellungen", value: "18", icon: "shopping_basket", trend: "" },
  { label: "Umsatz (30d)", value: "CHF 8,450", icon: "payments", trend: "+8%" },
  { label: "Zufriedenheit", value: "4.8★", icon: "star", trend: "" },
];

export default function RoasterDashboardPage() {
  return (
    <div className="bg-background min-h-screen">
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 h-16 bg-[#fdf9f4] border-b border-outline-variant/20">
        <h1 className="font-headline text-xl text-primary tracking-tight">Atelier Espresso</h1>
        <div className="w-10 h-10 rounded-full bg-surface-container overflow-hidden ring-1 ring-outline-variant/20" />
      </header>

      <RoasterSidebar />

      <main className="md:pl-64 pt-24 px-8 pb-16">
        <div className="mb-12">
          <span className="font-label text-[10px] uppercase tracking-[0.2em] text-secondary font-bold block mb-2">Roaster Portal</span>
          <h2 className="font-headline text-4xl text-primary tracking-tighter">Dashboard</h2>
        </div>

        {/* KPI Bento */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="bg-surface-container-lowest p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="material-symbols-outlined text-secondary">{kpi.icon}</span>
                {kpi.trend && (
                  <span className="font-label text-[10px] uppercase tracking-widest text-secondary">{kpi.trend}</span>
                )}
              </div>
              <div className="font-headline text-3xl text-primary mb-1">{kpi.value}</div>
              <div className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* Orders Table */}
        <div className="bg-surface-container-lowest rounded-xl p-8 mb-12">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline text-xl text-primary">Letzte Bestellungen</h3>
            <button className="font-label text-xs uppercase tracking-widest text-secondary hover:text-primary transition-colors">
              Alle anzeigen →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-outline-variant/30">
                  {["Order ID", "Kunde", "Produkt", "Gewicht", "Status"].map((h) => (
                    <th key={h} className="py-3 font-label text-[10px] uppercase tracking-widest text-on-surface-variant">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-outline-variant/10 last:border-0">
                    <td className="py-4 font-label text-sm text-primary">{o.id}</td>
                    <td className="py-4 font-light text-sm">{o.customer}</td>
                    <td className="py-4 font-light text-sm">{o.product}</td>
                    <td className="py-4 font-light text-sm">{o.weight}</td>
                    <td className="py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold ${o.color}`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top coffees */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-surface-container-lowest p-8 rounded-xl">
            <h3 className="font-headline text-xl text-primary mb-6">Top Kaffees (30d)</h3>
            <div className="space-y-4">
              {[
                { rank: "01", name: "Ethiopia Yirgacheffe", units: 142 },
                { rank: "02", name: "Guatemala Huehuetenango", units: 98 },
                { rank: "03", name: "Kenya AA", units: 76 },
              ].map((c) => (
                <div key={c.name} className="flex items-center gap-4">
                  <span className="font-headline text-2xl text-secondary/30">{c.rank}</span>
                  <div className="flex-1">
                    <div className="font-headline text-base text-primary">{c.name}</div>
                    <div className="font-label text-xs text-on-surface-variant">{c.units} Einheiten</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-primary text-on-primary p-8 rounded-xl">
            <h3 className="font-headline text-xl mb-6">Geschmacks-Insights</h3>
            <p className="font-light leading-relaxed text-on-primary/80 mb-4">
              80% deiner Kunden bevorzugen helle bis mittlere Röstungen mit fruchtigen Noten.
            </p>
            <p className="font-label text-[10px] uppercase tracking-widest text-on-primary/60">
              Empfehlung: Erweitere dein Sortiment mit einer afrikanischen Anaerobic-Variante.
            </p>
          </div>
        </div>
      </main>

      <button className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-primary text-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform z-50">
        <span className="material-symbols-outlined">add</span>
      </button>
    </div>
  );
}
