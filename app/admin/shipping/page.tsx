"use client";
import { useState } from "react";
import RoasterSidebar from "@/components/RoasterSidebar";

const shipments = [
  { id: "CS-2024-000124", address: "Bahnhofstrasse 12, 8001 Zürich", labelId: "CH-LBL-90124", status: "Awaiting", color: "bg-amber-100 text-amber-800" },
  { id: "CS-2024-000123", address: "Marktgasse 8, 3011 Bern", labelId: "CH-LBL-90123", status: "Ready", color: "bg-blue-100 text-blue-800" },
  { id: "CS-2024-000122", address: "Spalenberg 16, 4051 Basel", labelId: "CH-LBL-90122", status: "In Transit", color: "bg-emerald-100 text-emerald-800" },
  { id: "CS-2024-000121", address: "Rue du Mont-Blanc 7, 1201 Genève", labelId: "CH-LBL-90121", status: "Delivered", color: "bg-stone-100 text-stone-700" },
];

export default function ShippingCenterPage() {
  const [autoFulfill, setAutoFulfill] = useState(true);

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
            <span className="font-label text-[10px] uppercase tracking-[0.2em] text-secondary font-bold block mb-2">Logistics</span>
            <h2 className="font-headline text-4xl text-primary tracking-tighter">Shipping Center</h2>
          </div>
          <div className="flex gap-3">
            <button className="border border-outline-variant text-primary px-6 py-3 rounded-lg font-label text-xs uppercase tracking-widest hover:bg-surface-container transition-all">
              Print All
            </button>
            <button className="bg-primary text-on-primary px-6 py-3 rounded-lg font-label text-xs uppercase tracking-widest hover:opacity-90 transition-all">
              Generate Labels
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: "Awaiting Labels", value: "124", color: "text-amber-700" },
            { label: "Ready to Print", value: "42", color: "text-blue-700" },
            { label: "In Transit", value: "1,082", color: "text-emerald-700" },
            { label: "Daily Capacity", value: "88%", color: "text-primary" },
          ].map((s) => (
            <div key={s.label} className="bg-surface-container-lowest p-6 rounded-xl">
              <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant block mb-2">{s.label}</span>
              <div className={`font-headline text-3xl ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-surface-container-lowest rounded-xl p-8 mb-12">
          <h3 className="font-headline text-xl text-primary mb-6">Logistik-Queue</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-outline-variant/30">
                  {["Order ID", "Adresse", "Label ID", "Status", "Aktion"].map((h) => (
                    <th key={h} className="py-3 font-label text-[10px] uppercase tracking-widest text-on-surface-variant">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shipments.map((s) => (
                  <tr key={s.id} className="border-b border-outline-variant/10 last:border-0">
                    <td className="py-4 font-label text-sm text-primary">{s.id}</td>
                    <td className="py-4 font-light text-sm">{s.address}</td>
                    <td className="py-4 font-label text-sm">{s.labelId}</td>
                    <td className="py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold ${s.color}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-4">
                      <button className="text-secondary font-label text-xs uppercase tracking-widest hover:text-primary transition-colors">Tracking</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Network status + auto-fulfill */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass-card p-8 rounded-xl border border-outline-variant/20">
            <h3 className="font-headline text-xl text-primary mb-6">Network Hub Status</h3>
            <div className="space-y-3">
              {[
                { hub: "Zürich Hub", status: "Operational", color: "bg-emerald-500" },
                { hub: "Bern Distribution", status: "Operational", color: "bg-emerald-500" },
                { hub: "Genf Hub", status: "Wartung", color: "bg-amber-500" },
              ].map((h) => (
                <div key={h.hub} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${h.color}`} />
                    <span className="font-label text-sm">{h.hub}</span>
                  </div>
                  <span className="font-label text-xs text-on-surface-variant">{h.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary text-on-primary p-8 rounded-xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-headline text-xl mb-2">Auto-Fulfill</h3>
                <p className="font-light text-sm text-on-primary/70">Versand-Etiketten automatisch generieren bei neuen Bestellungen</p>
              </div>
              <button
                onClick={() => setAutoFulfill(!autoFulfill)}
                className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${autoFulfill ? "bg-secondary-fixed-dim" : "bg-on-primary/20"}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${autoFulfill ? "translate-x-6" : "translate-x-0.5"}`} />
              </button>
            </div>
            <div className="pt-6 border-t border-on-primary/10">
              <span className="font-label text-[10px] uppercase tracking-widest text-on-primary/60">Status</span>
              <p className="font-headline text-lg mt-1">{autoFulfill ? "Aktiv — letzte Verarbeitung vor 3 Min" : "Manuell"}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
