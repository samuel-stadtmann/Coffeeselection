import RoasterSidebar from "@/components/RoasterSidebar";

export default function AdminRevenuePage() {
  return (
    <div className="bg-background min-h-screen">
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 h-16 bg-[#fdf9f4] border-b border-outline-variant/20">
        <h1 className="font-headline text-xl text-primary tracking-tight">Atelier Espresso</h1>
        <div className="w-10 h-10 rounded-full bg-surface-container ring-1 ring-outline-variant/20" />
      </header>
      <RoasterSidebar />

      <main className="md:pl-64 pt-24 px-8 pb-16">
        <div className="mb-12">
          <span className="font-label text-[10px] uppercase tracking-[0.2em] text-secondary font-bold block mb-2">Finance</span>
          <h2 className="font-headline text-4xl text-primary tracking-tighter">Revenue Overview</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: "MRR", value: "CHF 24,180", change: "+12%" },
            { label: "ARR", value: "CHF 290,160", change: "+18%" },
            { label: "Avg Order Value", value: "CHF 42.80", change: "+4%" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-surface-container-lowest p-8 rounded-xl">
              <div className="flex justify-between items-start mb-4">
                <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">{kpi.label}</span>
                <span className="font-label text-[10px] uppercase tracking-widest text-emerald-700 font-bold">{kpi.change}</span>
              </div>
              <div className="font-headline text-3xl text-primary">{kpi.value}</div>
            </div>
          ))}
        </div>

        <div className="bg-surface-container-lowest p-8 rounded-xl mb-12">
          <h3 className="font-headline text-xl text-primary mb-6">Umsatz-Aufschlüsselung</h3>
          <div className="space-y-4">
            {[
              { source: "Subscriptions", chf: 18420, pct: 76 },
              { source: "One-time Orders", chf: 4280, pct: 18 },
              { source: "Quiz Conversions", chf: 1480, pct: 6 },
            ].map((s) => (
              <div key={s.source}>
                <div className="flex justify-between mb-2">
                  <span className="font-label text-sm">{s.source}</span>
                  <span className="font-label text-sm text-on-surface-variant">CHF {s.chf.toLocaleString()} ({s.pct}%)</span>
                </div>
                <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-secondary rounded-full" style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-surface-container-lowest p-8 rounded-xl">
            <h3 className="font-headline text-xl text-primary mb-6">Top Produkte</h3>
            {["Ethiopia Yirgacheffe", "Guatemala Huehuetenango", "Kenya AA"].map((p, i) => (
              <div key={p} className="flex justify-between items-center py-3 border-b border-outline-variant/10 last:border-0">
                <div className="flex items-center gap-4">
                  <span className="font-headline text-2xl text-secondary/30">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-light text-sm">{p}</span>
                </div>
                <span className="font-label text-xs text-on-surface-variant">CHF {[6420, 4280, 3140][i]}</span>
              </div>
            ))}
          </div>
          <div className="bg-primary text-on-primary p-8 rounded-xl">
            <h3 className="font-headline text-xl mb-6">Wachstum</h3>
            <div className="space-y-4">
              {[
                { label: "MoM Growth", value: "+12.4%" },
                { label: "YoY Growth", value: "+84%" },
                { label: "Churn Rate", value: "2.1%" },
              ].map((g) => (
                <div key={g.label} className="flex justify-between items-center py-2">
                  <span className="font-label text-sm text-on-primary/70">{g.label}</span>
                  <span className="font-headline text-xl">{g.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
