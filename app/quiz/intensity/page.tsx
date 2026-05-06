"use client";

import { useState } from "react";
import Link from "next/link";
import QuizNav from "@/components/QuizNav";

const options = [
  {
    id: "mild",
    icon: "light_mode",
    title: "Mild",
    desc: "Sanft geröstet mit floralen Noten und einer feinen, hellen Säure. Perfekt für Genießer feiner Nuancen.",
  },
  {
    id: "balanced",
    icon: "balance",
    title: "Balanced",
    desc: "Die goldene Mitte. Harmonisches Profil aus nussigen Aromen und dezenter Karamellsüße.",
  },
  {
    id: "intensiv",
    icon: "bolt",
    title: "Intensiv",
    desc: "Kräftige Röstung mit Noten von dunkler Schokolade. Ein vollmundiger Körper für Charakter-Liebhaber.",
  },
  {
    id: "sehr-kraeftig",
    icon: "local_fire_department",
    title: "Sehr kräftig",
    desc: "Italienische Tradition. Dunkel, rauchig und fast sirupartig. Der ultimative Espresso-Moment.",
  },
];

export default function IntensityPage() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <QuizNav step={2} totalSteps={7} progress={28} />

      <main className="flex-1 flex flex-col items-center px-4 py-10 md:py-16">
        <div className="w-full max-w-3xl">
          <div className="mb-8 text-center">
            <h1 className="font-headline text-3xl md:text-4xl text-primary mb-3">
              Wie intensiv magst du deinen Kaffee?
            </h1>
            <p className="font-body text-on-surface-variant text-base">
              Wähle die Rösttiefe, die deinen Gaumen am besten schmeichelt.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelected(option.id)}
                className={`relative bg-surface-container-lowest rounded-xl p-8 text-left border transition hover:shadow-xl focus:outline-none ${
                  selected === option.id
                    ? "border-secondary shadow-lg"
                    : "border-outline-variant/15"
                }`}
              >
                {/* Radio dot top-right */}
                <span className="absolute top-4 right-4 flex items-center justify-center w-5 h-5 rounded-full border-2 border-outline-variant">
                  {selected === option.id && (
                    <span className="block w-2.5 h-2.5 rounded-full bg-secondary" />
                  )}
                </span>

                {/* Icon top-left */}
                <span className="material-symbols-outlined text-primary/40 text-4xl mb-4 block">
                  {option.icon}
                </span>

                <h3 className="font-headline text-2xl text-primary mb-2">
                  {option.title}
                </h3>
                <p className="font-body text-on-surface-variant text-sm leading-relaxed">
                  {option.desc}
                </p>
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="mt-10 flex items-center justify-between">
            <Link
              href="/quiz"
              className="flex items-center gap-2 font-label text-on-surface-variant hover:text-primary transition"
            >
              <span className="material-symbols-outlined text-xl">arrow_back</span>
              <span>Zurück</span>
            </Link>

            <Link
              href="/quiz/brewing-method"
              className={`flex items-center gap-2 px-8 py-3 rounded-full font-label font-semibold text-white transition ${
                selected
                  ? "bg-gradient-to-r from-secondary to-primary hover:opacity-90"
                  : "bg-gradient-to-r from-secondary/50 to-primary/50 pointer-events-none"
              }`}
            >
              Weiter
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
