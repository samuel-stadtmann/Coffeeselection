import RoasterSidebar from "@/components/RoasterSidebar";

const months = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun"];
const data = [4200, 5800, 7100, 6500, 8450, 9200];

export default function RoasterAnalyticsPage() {
  const max = Math.max(...data);
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
            <span className="font-label text-[10px] uppercase tracking-[0.2em] text-secondary font-bold block mb-2">Analytics</span>
            <h2 className="font-headline text-4xl text-primary tracking-tighter">Revenue Analytics</h2>
          </div>
          <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Mai 2024</span>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: "Average Order Value", value: "CHF 42.80" },
            { label: "Customer Lifetime Value", value: "CHF 315.20" },
            { label: "Top SKU", value: "Ethiopia Yirgacheffe" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-surface-container-lowest p-8 rounded-xl">
              <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant block mb-3">{kpi.label}</span>
              <div className="font-headline text-3xl text-primary">{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Revenue Chart */}
        <div className="bg-surface-container-lowest p-8 rounded-xl mb-12">
          <h3 className="font-headline text-xl text-primary mb-2">Marketplace Revenue</h3>
          <p className="font-label text-xs text-on-surface-variant mb-8">Letzte 6 Monate</p>
          <svg viewBox="0 0 600 200" className="w-full h-48">
            <defs>
              <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#795900" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#795900" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon
              fill="url(#grad)"
              points={`0,200 ${data.map((v, i) => `${(i / (data.length - 1)) * 600},${200 - (v / max) * 180}`).join(" ")} 600,200`}
            />
            <polyline
              fill="none"
              stroke="#795900"
              strokeWidth="2"
              points={data.map((v, i) => `${(i / (data.length - 1)) * 600},${200 - (v / max) * 180}`).join(" ")}
            />
          </svg>
          <div className="flex justify-between mt-4">
            {months.map((m) => (
              <span key={m} className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">{m}</span>
            ))}
          </div>
        </div>

        {/* Quiz + Subscription Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-surface-container-lowest p-8 rounded-xl">
            <span className="font-label text-[10px] uppercase tracking-widest text-secondary block mb-3">Quiz-Conversion</span>
            <div className="font-headline text-3xl text-primary mb-1">42%</div>
            <p className="font-light text-sm text-on-surface-variant">der Quiz-Teilnehmer konvertieren zu Erstkäufern</p>
          </div>
          <div className="bg-primary text-on-primary p-8 rounded-xl">
            <span className="font-label text-[10px] uppercase tracking-widest text-on-primary/60 block mb-3">Subscription Revenue</span>
            <div className="font-headline text-3xl mb-1">CHF 24,180</div>
            <p className="font-light text-sm text-on-primary/70">Monatlich wiederkehrend</p>
          </div>
        </div>

        {/* Regional */}
        <div className="bg-surface-container-lowest p-8 rounded-xl">
          <h3 className="font-headline text-xl text-primary mb-6">Regionale Verteilung</h3>
          <div className="space-y-4">
            {[
              { region: "Zürich", value: 38, chf: 3210 },
              { region: "Bern", value: 24, chf: 2030 },
              { region: "Basel", value: 18, chf: 1520 },
              { region: "Genf", value: 12, chf: 1010 },
              { region: "Andere", value: 8, chf: 680 },
            ].map((r) => (
              <div key={r.region}>
                <div className="flex justify-between mb-2">
                  <span className="font-label text-sm">{r.region}</span>
                  <span className="font-label text-sm text-on-surface-variant">CHF {r.chf} ({r.value}%)</span>
                </div>
                <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-secondary rounded-full" style={{ width: `${r.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
