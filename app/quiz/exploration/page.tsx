"use client";

import { useState } from "react";
import Link from "next/link";
import QuizNav from "@/components/QuizNav";

const IMAGE_MORGEN =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA6DP_OFaNYnRPnpRnOcwtEnUj7QhV5d7xRYfBN4vaOv39W4A73emw7WO-Agi4LvvCTuDnQoq3zsxwvLv1MZNjx4hENJXCbSwvsOGBc6LIQ80udZ4AtsnOSIibmZpirl_GtUFGWDhPb1pfNi5DxSrKFil4SAk7CJ3JapbBVGafTNVK8mqgM-GXWDMxVYu-T3ItHLgnSg1FG67BynJHnMYl-757aGV4UoJf2h2E26VTHxFltJFTfG5Bl9yFo3Rt4ccQIiDiSV5j_ElYL";

const IMAGE_NACHMITTAGS =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBJXgzSPdvKkvdjq_JwFnyXex1iJkKzsfqoX_cfOIcb7uBLrrk7zq7tObmqra79JSCHFGNgmhKQhS75eB-Oux5c9WqdUbLIuaIWMEZDJnDXiShQVa7tr5Z1n7YCCFAq0jGGMNzBH92oDdPOuLoDairag17c_41gTpgz21dcdOf6iKDmQKWWLRb_s61L60bjJziVIdCqOKOlRyp8eVTS4NDxxQ2xw9J3pUQkc-FIn9N6Rgc6DMHg2yjfMwbaZIFU--J44TFfg-rD7DqA";

const IMAGE_BUERO =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDaXHjsyOURAKC8RuCI4Wqp89O3E2bE-03bgkltqAZyxRvcE64iWoNKkOas5niVGcNDL_Y-x1eSDVkaoAY45K9uSxzApq3Y6Xx5eXAuxyNnm2ko3i0NaaQPy69_26fDs-fwLkEH39eWSiMC2yd0sSPGa5MQBllDim-b16J8b81kvGXuYXPUXvxbttS9Ylur9FnpZymcSbd_8pmSwgGosmctH2oNVq8Hk4xcN3Jps_LryeCsdvTrbpx_BsvgWXtLSMt5cBbXyAgiVX68";

const IMAGE_GENUSS =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCiBurZCHZ924vo0bmWlSOD4hOBCJMZvihcq1AAwSLyYZ1d9kyf3bgjgYDX0R1hYm4cPnCeqJePEy6OZB0VJdKAqe3UeUnjimSo1O0kLT4cs2eRYlEHfkoR5yvD6nna3giObzCWICUamFWqrrYjuy2w-lPyzHD7ZShnz2C2NKIYncSfTHQRWU9KDgcuP0bwH9pI3qTpdV4XR_aerXEm7toLDsoI4JK2_PmOFOAbxbvGcs5QqqaAGYxqkILAXvz9kaDG17cKv-EJMvmT";

export default function ExplorationPage() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24">
      <QuizNav step={5} totalSteps={7} progress={71} />

      <main className="flex-1 flex flex-col items-center px-4 py-10 md:py-16">
        <div className="w-full max-w-3xl">
          <div className="mb-8 text-center">
            <h1 className="font-headline text-3xl md:text-4xl text-primary mb-3">
              Wann trinkst du hauptsächlich Kaffee?
            </h1>
            <p className="font-body text-on-surface-variant text-base">
              Der richtige Röstgrad entfaltet sein volles Potenzial je nach Tageszeit und Umfeld.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Morgen */}
            <button
              onClick={() => setSelected("morgen")}
              className={`col-span-1 rounded-xl overflow-hidden bg-surface-container-low transition hover:scale-95 focus:outline-none ${
                selected === "morgen" ? "ring-2 ring-secondary" : ""
              }`}
            >
              <div className="w-full aspect-[4/3] overflow-hidden">
                <img
                  src={IMAGE_MORGEN}
                  alt="Morgen"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="bg-surface-container-lowest p-6 text-left flex items-start justify-between">
                <div>
                  <h3 className="font-headline text-xl text-primary mb-1">Morgen</h3>
                  <p className="font-label text-on-surface-variant text-sm">Erwachen</p>
                </div>
                <span className="flex-shrink-0 mt-1 flex items-center justify-center w-5 h-5 rounded-full border-2 border-outline-variant">
                  {selected === "morgen" && (
                    <span className="block w-2.5 h-2.5 rounded-full bg-secondary" />
                  )}
                </span>
              </div>
            </button>

            {/* Nachmittags */}
            <button
              onClick={() => setSelected("nachmittags")}
              className={`col-span-1 rounded-xl overflow-hidden bg-surface-container-low transition hover:scale-95 focus:outline-none ${
                selected === "nachmittags" ? "ring-2 ring-secondary" : ""
              }`}
            >
              <div className="w-full aspect-[4/3] overflow-hidden">
                <img
                  src={IMAGE_NACHMITTAGS}
                  alt="Nachmittags"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="bg-surface-container-lowest p-6 text-left flex items-start justify-between">
                <div>
                  <h3 className="font-headline text-xl text-primary mb-1">Nachmittags</h3>
                  <p className="font-label text-on-surface-variant text-sm">Pause</p>
                </div>
                <span className="flex-shrink-0 mt-1 flex items-center justify-center w-5 h-5 rounded-full border-2 border-outline-variant">
                  {selected === "nachmittags" && (
                    <span className="block w-2.5 h-2.5 rounded-full bg-secondary" />
                  )}
                </span>
              </div>
            </button>

            {/* Büro / Fokus — col-span-2, left-right layout */}
            <button
              onClick={() => setSelected("buero")}
              className={`col-span-2 rounded-xl overflow-hidden bg-surface-container-low transition hover:scale-95 focus:outline-none ${
                selected === "buero" ? "ring-2 ring-secondary" : ""
              }`}
            >
              <div className="flex flex-col md:flex-row">
                <div className="bg-surface-container-lowest p-6 text-left flex-1 flex flex-col justify-center">
                  <h3 className="font-headline text-xl text-primary mb-1">Büro / Fokus</h3>
                  <p className="font-label text-secondary text-sm mb-2">Konzentration</p>
                  <p className="font-body text-on-surface-variant text-sm leading-relaxed">
                    Klarheit und Energie für produktive Stunden und präzise Arbeit.
                  </p>
                  <span className="mt-4 flex items-center justify-center w-5 h-5 rounded-full border-2 border-outline-variant self-start">
                    {selected === "buero" && (
                      <span className="block w-2.5 h-2.5 rounded-full bg-secondary" />
                    )}
                  </span>
                </div>
                <div className="w-full md:w-64 h-44 md:h-auto flex-shrink-0 overflow-hidden">
                  <img
                    src={IMAGE_BUERO}
                    alt="Büro / Fokus"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </button>

            {/* Genussmoment — col-span-2, right-left layout */}
            <button
              onClick={() => setSelected("genuss")}
              className={`col-span-2 rounded-xl overflow-hidden bg-surface-container-low transition hover:scale-95 focus:outline-none ${
                selected === "genuss" ? "ring-2 ring-secondary" : ""
              }`}
            >
              <div className="flex flex-col md:flex-row-reverse">
                <div className="bg-surface-container-lowest p-6 text-left flex-1 flex flex-col justify-center">
                  <h3 className="font-headline text-xl text-primary mb-1">Genussmoment</h3>
                  <p className="font-label text-secondary text-sm mb-2">Ritual</p>
                  <p className="font-body text-on-surface-variant text-sm leading-relaxed">
                    Wenn Zeit keine Rolle spielt und nur das Aroma der Röstung zählt.
                  </p>
                  <span className="mt-4 flex items-center justify-center w-5 h-5 rounded-full border-2 border-outline-variant self-start">
                    {selected === "genuss" && (
                      <span className="block w-2.5 h-2.5 rounded-full bg-secondary" />
                    )}
                  </span>
                </div>
                <div className="w-full md:w-64 h-44 md:h-auto flex-shrink-0 overflow-hidden">
                  <img
                    src={IMAGE_GENUSS}
                    alt="Genussmoment"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </button>
          </div>
        </div>
      </main>

      {/* Floating bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-sm border-t border-outline-variant/20 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href="/quiz/roast-preference"
            className="flex items-center justify-center w-12 h-12 rounded-full text-on-surface-variant opacity-30 hover:opacity-60 transition focus:outline-none"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </Link>

          <Link
            href="/quiz/frequency"
            className={`flex items-center justify-center w-12 h-12 rounded-full text-white transition focus:outline-none ${
              selected ? "bg-primary hover:opacity-90" : "bg-primary/40 pointer-events-none"
            }`}
          >
            <span className="material-symbols-outlined text-2xl">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
