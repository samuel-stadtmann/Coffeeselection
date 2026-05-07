"use client";
import { useState } from "react";
import Link from "next/link";
import AccountLayout, { PageHeader } from "@/components/AccountLayout";

const intervals = [
  { id: "weekly", label: "Wöchentlich", note: "Für Vieltrinker" },
  { id: "biweekly", label: "Alle 2 Wochen", note: "Beliebteste Wahl" },
  { id: "monthly", label: "Monatlich", note: "Standard" },
  { id: "6weeks", label: "Alle 6 Wochen", note: "Für Genießer" },
];

const sizes = [
  { id: "250g", label: "250g", note: "1 Sorte" },
  { id: "500g", label: "500g", note: "2 Sorten" },
  { id: "1kg", label: "1 kg", note: "4 Packungen" },
];

const upcomingDeliveries = [
  { date: "15.05.2025", status: "Geplant", coffee: "Wird kuratiert" },
  { date: "29.05.2025", status: "Geplant", coffee: "Wird kuratiert" },
  { date: "12.06.2025", status: "Geplant", coffee: "Wird kuratiert" },
];

export default function Page() {
  const [interval, setInterval] = useState("biweekly");
  const [size, setSize] = useState("500g");
  const [paused, setPaused] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  return (
    <AccountLayout>
      <PageHeader subtitle="Mein Abo" title="Abo verwalten" description="Lieferintervall, Menge, Adresse — alles flexibel anpassbar. Keine Mindestlaufzeit." />

      {/* Status Card */}
      <div className="bg-primary text-on-primary p-6 md:p-8">
        <div className="flex items-center gap-3 mb-3">
          <span className={`w-2 h-2 rounded-full ${paused ? "bg-on-primary/40" : "bg-tertiary"}`} />
          <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold">
            {paused ? "Abo pausiert" : "Abo aktiv"}
          </span>
        </div>
        <h2 className="text-2xl md:text-3xl font-headline font-bold uppercase tracking-tight mb-2">
          Discovery Abo
        </h2>
        <p className="text-on-primary/70 mb-6">
          Member seit März 2024 · 5 Lieferungen erhalten · CHF 224.40 gespart durch Abo
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => setPaused(!paused)}
            className="text-center bg-tertiary text-primary py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-white transition-all"
          >
            {paused ? "Fortsetzen" : "Pausieren"}
          </button>
          <button className="text-center border border-on-primary/30 text-on-primary py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-on-primary/10 transition-all">
            Nächste Lieferung skippen
          </button>
          <button
            onClick={() => setConfirmCancel(true)}
            className="text-center text-on-primary/60 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:text-on-primary transition-all"
          >
            Kündigen
          </button>
        </div>
      </div>

      {/* Intervall */}
      <div className="bg-white p-6 md:p-8 shadow-sm">
        <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-2">Lieferintervall</h3>
        <p className="text-sm text-on-surface-variant mb-6">Wie oft soll dein Kaffee geliefert werden?</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {intervals.map((iv) => (
            <button
              key={iv.id}
              onClick={() => setInterval(iv.id)}
              className={`p-4 text-left transition-all border-2 ${
                interval === iv.id ? "border-tertiary bg-tertiary/5" : "border-surface-container hover:border-tertiary/40"
              }`}
            >
              <h4 className="font-headline font-bold text-primary uppercase tracking-tight text-sm">{iv.label}</h4>
              <p className="text-[10px] text-on-surface-variant mt-1">{iv.note}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Menge */}
      <div className="bg-white p-6 md:p-8 shadow-sm">
        <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-2">Menge pro Lieferung</h3>
        <p className="text-sm text-on-surface-variant mb-6">Wie viel Kaffee pro Lieferung?</p>
        <div className="grid grid-cols-3 gap-3">
          {sizes.map((s) => (
            <button
              key={s.id}
              onClick={() => setSize(s.id)}
              className={`p-4 text-center transition-all border-2 ${
                size === s.id ? "border-tertiary bg-tertiary/5" : "border-surface-container hover:border-tertiary/40"
              }`}
            >
              <h4 className="font-headline font-bold text-primary uppercase tracking-tight">{s.label}</h4>
              <p className="text-[10px] text-on-surface-variant mt-1 font-headline uppercase tracking-widest">{s.note}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Liefer- & Rechnungsadresse */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 md:p-8 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg">Lieferadresse</h3>
            <button className="font-headline text-[10px] uppercase tracking-widest text-tertiary hover:text-primary transition-colors">Ändern</button>
          </div>
          <div className="text-sm text-on-surface-variant space-y-1">
            <p className="font-bold text-primary">Marco Keller</p>
            <p>Bahnhofstrasse 12</p>
            <p>8001 Zürich</p>
            <p>Schweiz</p>
          </div>
        </div>
        <div className="bg-white p-6 md:p-8 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg">Zahlungsmethode</h3>
            <button className="font-headline text-[10px] uppercase tracking-widest text-tertiary hover:text-primary transition-colors">Ändern</button>
          </div>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-tertiary text-2xl">credit_card</span>
            <div className="text-sm text-on-surface-variant">
              <p className="font-bold text-primary">Visa •••• 4242</p>
              <p>Gültig bis 12/26</p>
            </div>
          </div>
        </div>
      </div>

      {/* Kommende Lieferungen */}
      <div className="bg-white p-6 md:p-8 shadow-sm">
        <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-6">Kommende Lieferungen</h3>
        <div className="divide-y divide-surface-container">
          {upcomingDeliveries.map((d) => (
            <div key={d.date} className="py-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-headline text-[11px] uppercase tracking-widest text-tertiary font-bold">{d.date}</p>
                <p className="font-headline font-bold text-primary uppercase tracking-tight text-sm mt-1">{d.coffee}</p>
              </div>
              <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant px-3 py-1 bg-surface-container">
                {d.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {confirmCancel && (
        <div className="fixed inset-0 bg-primary/80 z-[60] flex items-center justify-center p-6" onClick={() => setConfirmCancel(false)}>
          <div className="bg-white p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-xl mb-4">Abo wirklich kündigen?</h3>
            <p className="text-on-surface-variant mb-6">
              Du verlierst deinen Abo-Rabatt von 15% und alle exklusiven Vorteile. Du kannst stattdessen auch pausieren.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setConfirmCancel(false)} className="border-2 border-primary text-primary py-3 font-headline font-bold text-xs uppercase tracking-widest">
                Doch nicht
              </button>
              <button className="bg-error text-on-error py-3 font-headline font-bold text-xs uppercase tracking-widest">
                Endgültig kündigen
              </button>
            </div>
          </div>
        </div>
      )}

      <Link href="/account/dashboard" className="font-headline text-[11px] uppercase tracking-[0.2em] text-tertiary hover:text-primary transition-colors border-b-2 border-tertiary pb-1 inline-block">
        ← Zurück zum Dashboard
      </Link>
    </AccountLayout>
  );
}
