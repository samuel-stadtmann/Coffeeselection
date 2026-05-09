"use client";
import { useState } from "react";
import Link from "next/link";
import AccountLayout, { PageHeader } from "@/components/AccountLayout";

const orders = [
  { id: "CS-2024-000142", date: "01.05.2025", coffee: "Ethiopia Yirgacheffe", roaster: "Miro Coffee", price: "CHF 45.20", status: "Geliefert", rated: false, type: "Abo" },
  { id: "CS-2024-000131", date: "17.04.2025", coffee: "Kenya AA Nyeri", roaster: "Vertical Coffee", price: "CHF 45.20", status: "Geliefert", rated: true, type: "Abo" },
  { id: "CS-2024-000118", date: "03.04.2025", coffee: "Rwanda Anaerobic", roaster: "La Cabra", price: "CHF 45.20", status: "Geliefert", rated: true, type: "Abo" },
  { id: "CS-2024-000109", date: "20.03.2025", coffee: "Ethiopia Gedeb Washed", roaster: "Miro Coffee", price: "CHF 45.20", status: "Geliefert", rated: true, type: "Abo" },
  { id: "CS-2024-000095", date: "06.03.2025", coffee: "Panama Geisha", roaster: "Sweven Coffee", price: "CHF 56.00", status: "Geliefert", rated: true, type: "Einmalig" },
  { id: "CS-2024-000082", date: "20.02.2025", coffee: "Colombia Pink Bourbon", roaster: "La Cabra", price: "CHF 45.20", status: "Geliefert", rated: false, type: "Abo" },
];

const filters = [
  { id: "all", label: "Alle" },
  { id: "subscription", label: "Abo" },
  { id: "once", label: "Einmalig" },
  { id: "unrated", label: "Unbewertet" },
];

export default function Page() {
  const [filter, setFilter] = useState("all");
  const filtered = orders.filter((o) => {
    if (filter === "subscription") return o.type === "Abo";
    if (filter === "once") return o.type === "Einmalig";
    if (filter === "unrated") return !o.rated;
    return true;
  });

  return (
    <AccountLayout>
      <PageHeader subtitle="Bestellungen" title="Bestellhistorie" description="Alle deine bisherigen Bestellungen mit Status, Bewertung und Wiederbestellungs-Option." />

      <div className="bg-white p-6 md:p-8 shadow-sm">
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-surface-container">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 font-headline text-[11px] uppercase tracking-widest font-bold transition-all ${
                filter === f.id ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {f.label}
            </button>
          ))}
          <span className="ml-auto text-sm text-on-surface-variant self-center">
            {filtered.length} Bestellungen
          </span>
        </div>

        <div className="divide-y divide-surface-container">
          {filtered.map((o) => (
            <div key={o.id} className="py-5 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 md:gap-6 items-start">
              <div>
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold">{o.date}</span>
                  <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant">{o.id}</span>
                  <span className={`font-headline text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 ${o.type === "Abo" ? "bg-tertiary/15 text-tertiary" : "bg-surface-container text-on-surface-variant"}`}>
                    {o.type}
                  </span>
                </div>
                <h4 className="font-headline font-bold text-primary uppercase tracking-tight text-lg">{o.coffee}</h4>
                <p className="text-xs text-on-surface-variant">{o.roaster}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="font-headline font-bold text-primary">{o.price}</span>
                <div className="flex gap-2">
                  {!o.rated && (
                    <button className="font-headline text-[10px] uppercase tracking-widest text-tertiary hover:text-primary transition-colors px-3 py-1 border border-tertiary">Bewerten</button>
                  )}
                  <button className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors px-3 py-1 border border-surface-container">Rechnung</button>
                  <button className="font-headline text-[10px] uppercase tracking-widest text-on-primary bg-primary hover:bg-black transition-colors px-3 py-1">Wiederbestellen</button>
                </div>
              </div>
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
