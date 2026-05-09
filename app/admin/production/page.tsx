import RoasterSidebar from "@/components/RoasterSidebar";

const queue = [
  { id: "CS-2024-000124", customer: "Marco K.", sku: "ETH-YIRG-250", weight: "250g", roast: "06.05.2026", status: "Hoch", priority: "high" },
  { id: "CS-2024-000123", customer: "Sarah M.", sku: "GUA-HUEH-500", weight: "500g", roast: "06.05.2026", status: "Normal", priority: "normal" },
  { id: "CS-2024-000122", customer: "Lukas B.", sku: "BRA-CERR-250", weight: "250g", roast: "07.05.2026", status: "Normal", priority: "normal" },
  { id: "CS-2024-000121", customer: "Anna F.", sku: "KEN-AA-250", weight: "250g", roast: "07.05.2026", status: "Hoch", priority: "high" },
  { id: "CS-2024-000120", customer: "David S.", sku: "COL-SUP-500", weight: "500g", roast: "08.05.2026", status: "Niedrig", priority: "low" },
];

const priorityColor = {
  high: "bg-red-100 text-red-800",
  normal: "bg-blue-100 text-blue-800",
  low: "bg-stone-100 text-stone-700",
};

export default function ProductionQueuePage() {
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
            <span className="font-label text-[10px] uppercase tracking-[0.2em] text-secondary font-bold block mb-2">Workshop</span>
            <h2 className="font-headline text-4xl text-primary tracking-tighter">Production Queue</h2>
          </div>
          <div className="flex gap-3">
            <button className="border border-outline-variant text-primary px-6 py-3 rounded-lg font-label text-xs uppercase tracking-widest hover:bg-surface-container transition-all">
              Export
            </button>
            <button className="bg-primary text-on-primary px-6 py-3 rounded-lg font-label text-xs uppercase tracking-widest hover:opacity-90 transition-all">
              Update Queue
            </button>
          </div>
        </div>

        {/* Capacity */}
        <div className="bg-surface-container-lowest p-8 rounded-xl mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Aktuelle Auslastung</span>
            <span className="font-headline text-2xl text-primary">84%</span>
          </div>
          <div className="h-2 bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-secondary rounded-full" style={{ width: "84%" }} />
          </div>
        </div>

        {/* Table */}
        <div className="bg-surface-container-lowest rounded-xl p-8 mb-8">
          <h3 className="font-headline text-xl text-primary mb-6">Aktuelle Aufträge</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-outline-variant/30">
                  {["Order ID", "Customer", "SKU", "Weight", "Roast Date", "Priority"].map((h) => (
                    <th key={h} className="py-3 font-label text-[10px] uppercase tracking-widest text-on-surface-variant">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {queue.map((q) => (
                  <tr key={q.id} className="border-b border-outline-variant/10 last:border-0">
                    <td className="py-4 font-label text-sm text-primary">{q.id}</td>
                    <td className="py-4 font-light text-sm">{q.customer}</td>
                    <td className="py-4 font-label text-sm">{q.sku}</td>
                    <td className="py-4 font-light text-sm">{q.weight}</td>
                    <td className="py-4 font-light text-sm">{q.roast}</td>
                    <td className="py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold ${priorityColor[q.priority as keyof typeof priorityColor]}`}>
                        {q.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center mt-6 pt-6 border-t border-outline-variant/20">
            <span className="font-label text-xs text-on-surface-variant">1–15 von 142 Bestellungen</span>
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-lg font-label text-xs hover:bg-surface-container">Zurück</button>
              <button className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label text-xs">Weiter</button>
            </div>
          </div>
        </div>

        {/* Context */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-700">warning</span>
              <div>
                <h4 className="font-headline text-base text-amber-900 mb-1">Inventar-Warnung</h4>
                <p className="font-light text-sm text-amber-800">Ethiopia Yirgacheffe: nur noch 12kg auf Lager. Nachbestellung empfohlen.</p>
              </div>
            </div>
          </div>
          <div className="bg-primary text-on-primary p-6 rounded-xl">
            <p className="font-headline italic text-sm leading-relaxed">
              &ldquo;Quality is never an accident; it is always the result of intelligent effort.&rdquo;
            </p>
            <span className="font-label text-[10px] uppercase tracking-widest text-on-primary/60 mt-3 block">— John Ruskin</span>
          </div>
        </div>
      </main>
    </div>
  );
}
