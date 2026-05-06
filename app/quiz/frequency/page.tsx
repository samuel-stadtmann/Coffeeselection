"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import QuizNav from "@/components/QuizNav";

const options = [
  {
    id: "biweekly",
    label: "Alle 2 Wochen",
    icon: "calendar_today",
    desc: "Für den täglichen Genuss und maximale Frische in deiner Tasse.",
    badge: "Am Beliebtesten",
  },
  {
    id: "monthly",
    label: "Monatlich",
    icon: "event_repeat",
    desc: "Der Standard für Kaffeeliebhaber. Ideal für 1-2 Tassen pro Tag.",
    badge: null,
  },
  {
    id: "sixweeks",
    label: "Alle 6 Wochen",
    icon: "history",
    desc: "Wenn du gerne variierst oder etwas weniger Kaffee trinkst.",
    badge: null,
  },
  {
    id: "once",
    label: "Nur einmalig",
    icon: "package_2",
    desc: "Zum Testen unserer Auswahl ohne automatische Folgelieferung.",
    badge: null,
  },
];

export default function FrequencyPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background font-sans">
      <QuizNav step={6} totalSteps={7} progress={85} backHref="/quiz/exploration" />

      <main className="pt-24 pb-40 px-4 max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="font-headline font-serif text-3xl text-on-surface mb-2">
            Wie oft brauchst du Nachschub?
          </h1>
          <p className="italic text-secondary font-sans text-base">
            Wähle dein bevorzugtes Lieferintervall für frische Bohnen.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelected(option.id)}
              className={`relative bg-surface-container-lowest rounded-xl p-8 border text-left transition-all duration-200 hover:border-secondary/30 ${
                selected === option.id
                  ? "border-secondary shadow-md"
                  : "border-outline-variant"
              }`}
            >
              {option.badge && (
                <span className="absolute -top-3 left-4 bg-secondary-container text-on-surface text-xs font-label font-semibold px-3 py-1 rounded-full">
                  {option.badge}
                </span>
              )}

              <div
                className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selected === option.id
                    ? "border-secondary bg-secondary"
                    : "border-outline-variant bg-transparent"
                }`}
              >
                {selected === option.id && (
                  <div className="w-2.5 h-2.5 rounded-full bg-surface-container-lowest" />
                )}
              </div>

              <span className="material-symbols-outlined text-secondary text-3xl mb-3 block">
                {option.icon}
              </span>

              <p className="font-sans font-semibold text-on-surface text-base mb-2">
                {option.label}
              </p>
              <p className="font-sans text-on-surface-variant text-sm leading-relaxed">
                {option.desc}
              </p>
            </button>
          ))}
        </div>

        <button
          onClick={() => router.push("/match-result")}
          disabled={!selected}
          className="w-full py-5 bg-primary text-white font-label font-semibold rounded-xl uppercase tracking-widest text-sm transition-opacity disabled:opacity-40 mb-4"
        >
          Ergebnis anzeigen
        </button>

        <p className="text-center text-on-surface-variant text-xs font-sans">
          Keine Sorge, du kannst dein Abo jederzeit anpassen.
        </p>
      </main>
    </div>
  );
}
