"use client";

import { useState } from "react";
import Link from "next/link";
import QuizNav from "@/components/QuizNav";

const VOLLAUTOMAT_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAi11hSIbmBsvMBxhlBb3-__zxs8xtPGIx9_KkrS04CxIYl1UHcgnAmfL8laJIDvOP4nQs3jDYpqDPIeJqaHy7Q7WNWkzyXfe7kVDdJvOG2UC4ULWresoJ4QM4lvUSPdeV8SptQogIhYXmChxHr3r9pa_Mx9lfs3hzKmkfUYudEnYPyj2n0mPcElocXGLz5n4AR1S8IdcCd7zX2cS6aUd1lq-K7v3DNA2Yw1mXuuvE0qCkYRG1aLmw6li82TA2vc-3BzsMAuaLmA9Tr";

const smallCards = [
  {
    id: "siebtraeger",
    icon: "coffee_maker",
    title: "Siebträger",
    subtitle: "Espresso-Handwerk",
    colSpan: "col-span-12 md:col-span-4",
  },
  {
    id: "v60",
    icon: "water_drop",
    title: "V60 / Filter",
    subtitle: "Klarheit &amp; Aroma",
    colSpan: "col-span-12 md:col-span-4",
  },
  {
    id: "french-press",
    icon: "coffee",
    title: "French Press",
    subtitle: "Vollmundiger Körper",
    colSpan: "col-span-12 md:col-span-4",
  },
  {
    id: "moka-pot",
    icon: "whatshot",
    title: "Moka Pot",
    subtitle: "Italienische Tradition",
    colSpan: "col-span-12 md:col-span-4",
  },
];

export default function BrewingMethodPage() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <QuizNav step={3} totalSteps={7} progress={42} />

      <main className="flex-1 flex flex-col items-center px-4 py-10 md:py-16">
        <div className="w-full max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="font-headline text-3xl md:text-4xl text-primary mb-3">
              Wie bereitest du Kaffee zu?
            </h1>
          </div>

          <div className="grid grid-cols-12 gap-4">
            {/* Siebträger — col-span-4 */}
            <button
              onClick={() => setSelected("siebtraeger")}
              className={`col-span-12 md:col-span-4 bg-surface-container-lowest p-8 rounded-lg text-center border-b-2 hover:bg-white transition focus:outline-none ${
                selected === "siebtraeger"
                  ? "border-secondary"
                  : "border-outline-variant/20 hover:border-secondary/20"
              }`}
            >
              <span className="material-symbols-outlined text-primary text-4xl mb-3 block">
                coffee_maker
              </span>
              <h3 className="font-headline text-xl text-primary mb-1">Siebträger</h3>
              <p className="font-label text-on-surface-variant text-sm">Espresso-Handwerk</p>
              {selected === "siebtraeger" && (
                <span className="mt-3 inline-flex items-center justify-center w-5 h-5 rounded-full bg-secondary">
                  <span className="block w-2 h-2 rounded-full bg-white" />
                </span>
              )}
            </button>

            {/* Vollautomat — col-span-8, featured */}
            <button
              onClick={() => setSelected("vollautomat")}
              className={`col-span-12 md:col-span-8 bg-surface-container-lowest rounded-lg border-b-2 overflow-hidden hover:bg-white transition focus:outline-none group ${
                selected === "vollautomat"
                  ? "border-secondary"
                  : "border-outline-variant/20 hover:border-secondary/20"
              }`}
            >
              <div className="flex flex-col md:flex-row h-full">
                <div className="flex-1 p-8 text-left flex flex-col justify-center">
                  <span className="material-symbols-outlined text-primary text-4xl mb-3 block">
                    settings_input_component
                  </span>
                  <h3 className="font-headline text-xl text-primary mb-2">Vollautomat</h3>
                  <p className="font-body text-on-surface-variant text-sm leading-relaxed">
                    Präzision auf Knopfdruck für den perfekten Alltagsmoment ohne Kompromisse.
                  </p>
                  {selected === "vollautomat" && (
                    <span className="mt-4 inline-flex items-center justify-center w-5 h-5 rounded-full bg-secondary">
                      <span className="block w-2 h-2 rounded-full bg-white" />
                    </span>
                  )}
                </div>
                <div className="w-full md:w-48 h-40 md:h-auto flex-shrink-0 overflow-hidden">
                  <img
                    src={VOLLAUTOMAT_IMAGE}
                    alt="Vollautomat"
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-500"
                  />
                </div>
              </div>
            </button>

            {/* V60 / Filter — col-span-4 */}
            <button
              onClick={() => setSelected("v60")}
              className={`col-span-12 md:col-span-4 bg-surface-container-lowest p-8 rounded-lg text-center border-b-2 hover:bg-white transition focus:outline-none ${
                selected === "v60"
                  ? "border-secondary"
                  : "border-outline-variant/20 hover:border-secondary/20"
              }`}
            >
              <span className="material-symbols-outlined text-primary text-4xl mb-3 block">
                water_drop
              </span>
              <h3 className="font-headline text-xl text-primary mb-1">V60 / Filter</h3>
              <p className="font-label text-on-surface-variant text-sm">Klarheit &amp; Aroma</p>
              {selected === "v60" && (
                <span className="mt-3 inline-flex items-center justify-center w-5 h-5 rounded-full bg-secondary">
                  <span className="block w-2 h-2 rounded-full bg-white" />
                </span>
              )}
            </button>

            {/* French Press — col-span-4 */}
            <button
              onClick={() => setSelected("french-press")}
              className={`col-span-12 md:col-span-4 bg-surface-container-lowest p-8 rounded-lg text-center border-b-2 hover:bg-white transition focus:outline-none ${
                selected === "french-press"
                  ? "border-secondary"
                  : "border-outline-variant/20 hover:border-secondary/20"
              }`}
            >
              <span className="material-symbols-outlined text-primary text-4xl mb-3 block">
                coffee
              </span>
              <h3 className="font-headline text-xl text-primary mb-1">French Press</h3>
              <p className="font-label text-on-surface-variant text-sm">Vollmundiger Körper</p>
              {selected === "french-press" && (
                <span className="mt-3 inline-flex items-center justify-center w-5 h-5 rounded-full bg-secondary">
                  <span className="block w-2 h-2 rounded-full bg-white" />
                </span>
              )}
            </button>

            {/* Moka Pot — col-span-4 */}
            <button
              onClick={() => setSelected("moka-pot")}
              className={`col-span-12 md:col-span-4 bg-surface-container-lowest p-8 rounded-lg text-center border-b-2 hover:bg-white transition focus:outline-none ${
                selected === "moka-pot"
                  ? "border-secondary"
                  : "border-outline-variant/20 hover:border-secondary/20"
              }`}
            >
              <span className="material-symbols-outlined text-primary text-4xl mb-3 block">
                whatshot
              </span>
              <h3 className="font-headline text-xl text-primary mb-1">Moka Pot</h3>
              <p className="font-label text-on-surface-variant text-sm">Italienische Tradition</p>
              {selected === "moka-pot" && (
                <span className="mt-3 inline-flex items-center justify-center w-5 h-5 rounded-full bg-secondary">
                  <span className="block w-2 h-2 rounded-full bg-white" />
                </span>
              )}
            </button>
          </div>

          {/* Navigation */}
          <div className="mt-10 flex items-center justify-between">
            <Link
              href="/quiz/intensity"
              className="flex items-center gap-2 font-label text-on-surface-variant hover:text-primary transition"
            >
              <span className="material-symbols-outlined text-xl">arrow_back</span>
              <span>Zurück</span>
            </Link>

            <Link
              href="/quiz/roast-preference"
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
