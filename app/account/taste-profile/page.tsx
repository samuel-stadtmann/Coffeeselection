import Link from "next/link";
import AccountLayout, { PageHeader } from "@/components/AccountLayout";

const profile = [
  { label: "Säure", value: 85 },
  { label: "Süße", value: 70 },
  { label: "Körper", value: 40 },
  { label: "Bitterkeit", value: 20 },
  { label: "Komplexität", value: 90 },
];

const aromasLove = ["Jasmin", "Bergamotte", "Erdbeere", "Limette", "Aprikose", "Schwarzer Tee"];
const aromasAvoid = ["Tabak", "Erde", "Gewürze"];

const trends = [
  { month: "Dez", value: 65 },
  { month: "Jan", value: 72 },
  { month: "Feb", value: 80 },
  { month: "Mär", value: 78 },
  { month: "Apr", value: 85 },
  { month: "Mai", value: 88 },
];

const quizAnswers = [
  { q: "Brühmethode", a: "V60 / Filter" },
  { q: "Konsum-Routine", a: "2–3 Tassen pro Tag" },
  { q: "Milch", a: "Schwarz" },
  { q: "Frühstück", a: "Leicht & frisch" },
  { q: "Schokolade", a: "Mit Frucht-Einlage" },
  { q: "Lieblings-Getränk", a: "Wein" },
  { q: "Aromen-Trigger", a: "Frische Beeren" },
  { q: "Tee", a: "Grüntee" },
  { q: "Säure-Sensitivität", a: "Keine Probleme" },
  { q: "Mouthfeel", a: "Leicht & klar" },
  { q: "Erfahrung", a: "Enthusiast" },
  { q: "Offenheit", a: "Aktive Entdeckerin" },
];

export default function Page() {
  const max = Math.max(...trends.map((t) => t.value));
  return (
    <AccountLayout>
      <PageHeader subtitle="Geschmacksprofil" title="Dein Profil" description="Detaillierte Analyse deines Geschmacks. Je mehr du bewertest, desto präziser werden die Empfehlungen." />

      {/* Type Banner */}
      <div className="bg-tertiary text-primary p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
        <span className="material-symbols-outlined text-5xl">nutrition</span>
        <div className="flex-1">
          <span className="font-headline text-[10px] uppercase tracking-widest font-bold block mb-1">Dein Geschmackstyp</span>
          <h2 className="font-headline font-bold uppercase tracking-tight text-2xl md:text-3xl">Der Fruchtfreund</h2>
          <p className="text-sm mt-2">Beerig · Lebendig · Hell</p>
        </div>
        <Link href="/taste-types/der-fruchtfreund" className="bg-primary text-on-primary px-6 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all">
          Mehr lesen
        </Link>
      </div>

      {/* Profile + Trends side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 md:p-8 shadow-sm">
          <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-6">Aromen-Achsen</h3>
          <div className="space-y-4">
            {profile.map((p) => (
              <div key={p.label}>
                <div className="flex justify-between mb-2">
                  <span className="font-headline text-[11px] uppercase tracking-widest text-on-surface-variant">{p.label}</span>
                  <span className="font-headline text-[11px] uppercase tracking-widest text-tertiary font-bold">{p.value}%</span>
                </div>
                <div className="h-1 bg-surface-container relative overflow-hidden">
                  <div className="h-full bg-tertiary" style={{ width: `${p.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 md:p-8 shadow-sm">
          <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-2">Profil-Reife</h3>
          <p className="text-xs text-on-surface-variant mb-6">Präzision deiner Empfehlungen über Zeit</p>
          <div className="flex items-end gap-3 h-40">
            {trends.map((t) => (
              <div key={t.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-tertiary/80" style={{ height: `${(t.value / max) * 100}%` }} />
                <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant">{t.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Aromas */}
      <div className="bg-white p-6 md:p-8 shadow-sm">
        <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-6">Sensorik-Profil</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold block mb-3">Du liebst</span>
            <div className="flex flex-wrap gap-2">
              {aromasLove.map((a) => (
                <span key={a} className="bg-tertiary/15 text-primary px-4 py-2 font-headline text-[11px] uppercase tracking-widest font-bold">{a}</span>
              ))}
            </div>
          </div>
          <div>
            <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-3">Vermeidet</span>
            <div className="flex flex-wrap gap-2">
              {aromasAvoid.map((a) => (
                <span key={a} className="bg-surface-container text-on-surface-variant px-4 py-2 font-headline text-[11px] uppercase tracking-widest font-bold">{a}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Answers */}
      <div className="bg-white p-6 md:p-8 shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg">Deine Quiz-Antworten</h3>
          <Link href="/quiz/question-1-brewing-method" className="font-headline text-[10px] uppercase tracking-widest text-tertiary hover:text-primary transition-colors">
            Quiz wiederholen →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quizAnswers.map((qa, i) => (
            <div key={qa.q} className="flex justify-between gap-3 py-3 border-b border-surface-container last:border-0">
              <span className="text-sm text-on-surface-variant">{i + 1}. {qa.q}</span>
              <span className="font-headline text-xs uppercase tracking-widest font-bold text-primary text-right">{qa.a}</span>
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
