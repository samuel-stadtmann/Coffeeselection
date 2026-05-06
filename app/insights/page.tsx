import Link from "next/link";
import Nav from "@/components/Nav";
import MobileNav from "@/components/MobileNav";
import Footer from "@/components/Footer";

const tasteData = [
  { month: "Dez", value: 65 },
  { month: "Jan", value: 72 },
  { month: "Feb", value: 80 },
  { month: "Mär", value: 78 },
  { month: "Apr", value: 85 },
  { month: "Mai", value: 88 },
];

export default function InsightsPage() {
  return (
    <div className="bg-background min-h-screen">
      <Nav />
      <main className="pt-32 pb-32 max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <span className="font-label text-xs uppercase tracking-[0.2em] text-secondary font-semibold block mb-4">Dein Profil</span>
          <h1 className="text-5xl md:text-6xl font-headline text-primary tracking-tighter">Customer Insights</h1>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: "Total Ratings", value: "24", icon: "star" },
            { label: "Top Kategorie", value: "Helle Röstungen", icon: "local_cafe" },
            { label: "Erkundungsquote", value: "68%", icon: "explore" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-surface-container-lowest p-8 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">{kpi.label}</span>
                <span className="material-symbols-outlined text-secondary">{kpi.icon}</span>
              </div>
              <div className="font-headline text-3xl text-primary">{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Trend chart */}
        <div className="grid md:grid-cols-12 gap-6 mb-12">
          <div className="md:col-span-8 bg-surface-container-lowest p-8 rounded-xl">
            <h3 className="font-headline text-xl text-primary mb-2">Geschmacks-Trend</h3>
            <p className="font-label text-xs text-on-surface-variant mb-8">Profil-Reife über die letzten 6 Monate</p>
            <div className="flex items-end gap-4 h-48">
              {tasteData.map((d) => (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-secondary/80 rounded-t" style={{ height: `${d.value}%` }} />
                  <span className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">{d.month}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="md:col-span-4 bg-primary text-on-primary p-8 rounded-xl flex flex-col justify-center">
            <span className="material-symbols-outlined mb-4">auto_awesome</span>
            <p className="font-headline italic text-lg leading-relaxed mb-4">
              &ldquo;Dein Profil zeigt eine wachsende Vorliebe für helle, florale Röstungen. Nächster Schritt: ein Geisha-Varietät erkunden.&rdquo;
            </p>
            <span className="font-label text-[10px] uppercase tracking-widest text-on-primary/60">— Sommelier-Empfehlung</span>
          </div>
        </div>

        {/* Sentiment tags */}
        <div className="bg-surface-container-lowest p-8 rounded-xl mb-12">
          <h3 className="font-headline text-xl text-primary mb-6">Sensorik-Profil</h3>
          <div className="space-y-4">
            <div>
              <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant block mb-3">Positive Aromen</span>
              <div className="flex flex-wrap gap-2">
                {["floral", "fruity", "bright", "citrus", "jasmine"].map((tag) => (
                  <span key={tag} className="px-4 py-2 rounded-full bg-secondary/15 text-secondary font-label text-xs uppercase tracking-wider">{tag}</span>
                ))}
              </div>
            </div>
            <div>
              <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant block mb-3">Vermeiden</span>
              <div className="flex flex-wrap gap-2">
                {["bitter", "smoky", "dark"].map((tag) => (
                  <span key={tag} className="px-4 py-2 rounded-full bg-error/10 text-error font-label text-xs uppercase tracking-wider">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Link href="/dashboard" className="font-label text-xs uppercase tracking-widest text-primary hover:text-secondary transition-colors">
            ← Zurück zum Dashboard
          </Link>
        </div>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}
