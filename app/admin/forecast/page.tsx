import RoasterSidebar from "@/components/RoasterSidebar";

const forecastData = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  value: Math.round(20 + Math.sin(i * 0.5) * 15 + Math.random() * 20),
}));

export default function ForecastPage() {
  const max = Math.max(...forecastData.map((d) => d.value));
  return (
    <div className="bg-background min-h-screen">
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 h-16 bg-[#fdf9f4] border-b border-outline-variant/20">
        <h1 className="font-headline text-xl text-primary tracking-tight">Atelier Espresso</h1>
        <div className="w-10 h-10 rounded-full bg-surface-container ring-1 ring-outline-variant/20" />
      </header>
      <RoasterSidebar />

      <main className="md:pl-64 pt-24 px-8 pb-16">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="font-label text-[10px] uppercase tracking-[0.2em] text-secondary font-bold block mb-2">Predictive</span>
            <h2 className="font-headline text-4xl text-primary tracking-tighter">Order Forecast</h2>
          </div>
          <button className="bg-primary text-on-primary px-8 py-3 rounded-lg font-label text-xs uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-base">add</span>
            New Batch
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: "Next 3 Days", value: "142" },
            { label: "Next 7 Days", value: "318" },
            { label: "Next 14 Days", value: "644" },
            { label: "Next 30 Days", value: "1.2k" },
          ].map((s) => (
            <div key={s.label} className="bg-surface-container-lowest p-6 rounded-xl">
              <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant block mb-2">{s.label}</span>
              <div className="font-headline text-3xl text-primary">{s.value}</div>
              <div className="font-label text-[10px] uppercase tracking-widest text-secondary mt-1">Orders</div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="bg-surface-container-lowest p-8 rounded-xl mb-12">
          <h3 className="font-headline text-xl text-primary mb-2">30-Tage Prognose</h3>
          <p className="font-label text-xs text-on-surface-variant mb-8">Tägliches Bestellvolumen</p>
          <div className="flex items-end gap-1 h-48">
            {forecastData.map((d) => (
              <div
                key={d.day}
                className="flex-1 bg-secondary/80 rounded-t hover:bg-secondary transition-colors"
                style={{ height: `${(d.value / max) * 100}%` }}
                title={`Tag ${d.day}: ${d.value} Bestellungen`}
              />
            ))}
          </div>
        </div>

        {/* Insights */}
        <div className="bg-primary text-on-primary p-8 rounded-xl mb-12">
          <div className="flex items-start gap-4">
            <span className="material-symbols-outlined text-secondary-fixed-dim text-3xl">lightbulb</span>
            <div>
              <h3 className="font-headline text-xl mb-2">Strategische Empfehlung</h3>
              <p className="font-light text-on-primary/80 leading-relaxed">
                Basierend auf dem aktuellen Trend solltest du diese Woche 45kg äthiopische Bohnen ordern. Die Nachfrage nach hellen Röstungen steigt um 18%.
              </p>
            </div>
          </div>
        </div>

        {/* Trends */}
        <div className="bg-surface-container-lowest p-8 rounded-xl">
          <h3 className="font-headline text-xl text-primary mb-6">Aktive Trends</h3>
          <div className="space-y-4">
            {[
              { icon: "trending_up", text: "Helle Röstungen +24% gegenüber Vormonat", color: "text-emerald-700" },
              { icon: "trending_flat", text: "Espresso-Blends stabil bei 38% Marktanteil", color: "text-on-surface-variant" },
              { icon: "trending_down", text: "Single-Origin Brazil -12% (saisonal)", color: "text-red-700" },
            ].map((t) => (
              <div key={t.text} className="flex items-center gap-4 py-3 border-b border-outline-variant/10 last:border-0">
                <span className={`material-symbols-outlined ${t.color}`}>{t.icon}</span>
                <span className="font-light text-sm">{t.text}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
