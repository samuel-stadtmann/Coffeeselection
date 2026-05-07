"use client";
import { useState } from "react";
import Link from "next/link";
import AccountLayout, { PageHeader } from "@/components/AccountLayout";

const REFERRAL_CODE = "MARCO10";
const REFERRAL_URL = "coffeeselection.ch/r/MARCO10";

const referred = [
  { name: "Anna F.", date: "12.04.2025", status: "Eingelöst", reward: "CHF 10" },
  { name: "Lukas B.", date: "28.03.2025", status: "Eingelöst", reward: "CHF 10" },
  { name: "Sophie L.", date: "15.03.2025", status: "Pending", reward: "—" },
];

export default function Page() {
  const [copied, setCopied] = useState(false);
  const handleCopy = (text: string) => {
    if (typeof navigator !== "undefined") navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AccountLayout>
      <PageHeader subtitle="Referrals" title="Empfehle Coffee Selection" description="Teile deinen Code mit Freunden — du erhältst CHF 10 Guthaben pro neuem Mitglied, dein Freund 20% Rabatt auf die erste Bestellung." />

      {/* Hero Card */}
      <div className="bg-primary text-on-primary p-8 md:p-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2">
            <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold block mb-2">Dein persönlicher Code</span>
            <p className="font-headline font-bold text-3xl md:text-5xl text-tertiary uppercase tracking-tight mb-4">{REFERRAL_CODE}</p>
            <p className="text-on-primary/70 text-sm">Teile diesen Code oder den Link unten. Pro neuem Mitglied: CHF 10 für dich.</p>
          </div>
          <div className="space-y-3">
            <button onClick={() => handleCopy(REFERRAL_CODE)} className="w-full bg-tertiary text-primary py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-white transition-all">
              {copied ? "Kopiert ✓" : "Code kopieren"}
            </button>
            <button onClick={() => handleCopy(REFERRAL_URL)} className="w-full border border-on-primary/30 text-on-primary py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-on-primary/10 transition-all">
              Link kopieren
            </button>
          </div>
        </div>
        <p className="text-xs font-headline text-on-primary/60 uppercase tracking-widest mt-6">Link: {REFERRAL_URL}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Geworben", value: "3", icon: "group_add" },
          { label: "Eingelöst", value: "2", icon: "check_circle" },
          { label: "Verdient", value: "CHF 20", icon: "payments" },
        ].map((s) => (
          <div key={s.label} className="bg-white p-6 shadow-sm">
            <span className="material-symbols-outlined text-tertiary text-2xl mb-3 block">{s.icon}</span>
            <p className="font-headline font-bold text-primary text-2xl uppercase tracking-tight">{s.value}</p>
            <p className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">{s.label}</p>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="bg-white p-6 md:p-8 shadow-sm">
        <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-6">Geworbene Freunde</h3>
        <div className="divide-y divide-surface-container">
          {referred.map((r) => (
            <div key={r.name} className="py-4 grid grid-cols-3 gap-3 items-center">
              <div>
                <p className="font-headline font-bold text-primary uppercase tracking-tight">{r.name}</p>
                <p className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant">{r.date}</p>
              </div>
              <span className={`font-headline text-[10px] uppercase tracking-widest font-bold justify-self-center px-3 py-1 ${
                r.status === "Eingelöst" ? "bg-tertiary/15 text-tertiary" : "bg-surface-container text-on-surface-variant"
              }`}>
                {r.status}
              </span>
              <span className="font-headline font-bold text-primary justify-self-end">{r.reward}</span>
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
