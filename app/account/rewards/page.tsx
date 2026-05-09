import Link from "next/link";
import AccountLayout, { PageHeader } from "@/components/AccountLayout";

const transactions = [
  { date: "12.04.2025", type: "Referral", desc: "Anna F. wurde Mitglied", amount: "+CHF 10" },
  { date: "01.04.2025", type: "Bewertung", desc: "5★ für Rwanda Anaerobic", amount: "+CHF 2" },
  { date: "28.03.2025", type: "Referral", desc: "Lukas B. wurde Mitglied", amount: "+CHF 10" },
  { date: "15.03.2025", type: "Treuebonus", desc: "5. Lieferung erhalten", amount: "+CHF 5" },
  { date: "20.02.2025", type: "Bewertung", desc: "Profil zu 100% ausgefüllt", amount: "+CHF 3" },
];

const earnMethods = [
  { icon: "share", title: "Freunde werben", reward: "CHF 10", desc: "Pro neuem Mitglied das eine Bestellung aufgibt" },
  { icon: "star", title: "Kaffee bewerten", reward: "CHF 2", desc: "Für jede ausführliche Bewertung mit Tasting Notes" },
  { icon: "psychology", title: "Profil vervollständigen", reward: "CHF 3", desc: "Quiz neu machen und alle 12 Fragen detailliert beantworten" },
  { icon: "loyalty", title: "Treue belohnt", reward: "CHF 5", desc: "Für jede 5. Lieferung deines Abos" },
];

export default function Page() {
  const balance = 30;
  return (
    <AccountLayout>
      <PageHeader subtitle="Rewards" title="Dein Guthaben" description="Verdient durch Empfehlungen, Bewertungen und Treue. Einlösbar bei jeder Bestellung." />

      {/* Balance Hero */}
      <div className="bg-tertiary text-primary p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="font-headline text-[10px] uppercase tracking-widest font-bold block mb-2">Aktuelles Guthaben</span>
          <p className="font-headline font-bold text-5xl md:text-7xl uppercase tracking-tight">CHF {balance}</p>
          <p className="text-sm mt-3">Wird automatisch bei deiner nächsten Bestellung abgezogen.</p>
        </div>
        <Link href="/coffee/discovery-box" className="bg-primary text-on-primary px-8 py-4 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all whitespace-nowrap">
          Jetzt einsetzen
        </Link>
      </div>

      {/* How to earn */}
      <div className="bg-white p-6 md:p-8 shadow-sm">
        <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-6">So verdienst du mehr</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {earnMethods.map((m) => (
            <div key={m.title} className="bg-surface-container-low p-5 flex items-start gap-4">
              <span className="material-symbols-outlined text-tertiary text-2xl shrink-0">{m.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-headline font-bold text-primary uppercase tracking-tight text-sm">{m.title}</h4>
                  <span className="font-headline text-tertiary uppercase tracking-widest text-sm font-bold">{m.reward}</span>
                </div>
                <p className="text-xs text-on-surface-variant">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white p-6 md:p-8 shadow-sm">
        <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-6">Transaktionen</h3>
        <div className="divide-y divide-surface-container">
          {transactions.map((t, i) => (
            <div key={i} className="py-4 grid grid-cols-[auto_1fr_auto] gap-3 items-center">
              <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant w-24">{t.date}</span>
              <div>
                <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold block">{t.type}</span>
                <p className="text-sm text-primary">{t.desc}</p>
              </div>
              <span className="font-headline font-bold text-tertiary">{t.amount}</span>
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
