"use client";

import { useState } from "react";
import Link from "next/link";
import QuizNav from "@/components/QuizNav";

const IMAGE_HELL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAY2O-anAQphHP12QvSMRlb2TQ2LotVt3khFGmiqNn5BP1EvEFXoUXNzYJVoaRWaK6jkJSUhmaBWTLg06JEe5cnlD8juKbgCqXypGBd65goXMtQOrtymjajAV2YAdY-b7tzTAokhCaWcGZSYOdtnXVqCkrxEdkq5lZvqJD4HGZArUxSgtgSmhbNEY4_nkRWu8r_tf7ssjnAemr3j6AbKvLEnvattwapfkJejfSVMirl7u3j8i5yS2iDKG2ZpQPcIJRn-METX1b-Qd9b";

const IMAGE_MITTEL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuASjsgE1DQrSNL3vfbM43xx04aK08psn1PRXnU41lAkQOOQ32CocENCgmQmYOSz_yBxvOhCP3o2FfbJq7y8qsWnOYCxn4k3l1N27VCxTnECzBLWhq7ndRIDnQi01caFERyTy0B7H8HU9fc9Ksy_68rsWVeWc0xcrW0r2OTc9Q84c9DLRhEYzxRaTpr0h1NBBr0RK5C9ZFXVnD3jSKZjaUWNAzqSBojrtNO9-C3KMC6kQM_dDwngpjh3uNHVfHRMI6qYMTyBAT9Ulpxq";

const IMAGE_DUNKEL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBN8IgtovkYQlygVeCT7-HQJ3MxBIeXLHA7DLDxl1WsR_OhCTGdjP5WesE-1cuQRX2vSR__im3sOEI3Io4OQIaVy0Id7JoExY3qQQYId3uFZ0QVQ97HAEuACLlAIx1qmx6h9H7xFKRyQu1GTx1w87_FIcnKzg7zHh6N1JV8CH_0r5HSJp1bQCci05GFg8a9-XCnRtJRO_Y0T3nVzh4tLab0BxXGH_-yl0BwzYHtUSYMv6Gj_lGWgVZf3eVU60m2PPVUZdFKNue8cwtB";

export default function RoastPreferencePage() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24">
      <QuizNav step={4} totalSteps={7} progress={57} />

      <main className="flex-1 flex flex-col items-center px-4 py-10 md:py-16">
        <div className="w-full max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="font-headline text-3xl md:text-4xl text-primary mb-3">
              Welche Röstung bevorzugst du?
            </h1>
            <p className="font-body text-on-surface-variant text-base">
              Der Röstgrad definiert die Intensität und die Säure deines Kaffees.
            </p>
          </div>

          <div className="grid grid-cols-12 gap-4">
            {/* Hell — col-span-5 */}
            <button
              onClick={() => setSelected("hell")}
              className={`col-span-12 md:col-span-5 relative rounded-xl overflow-hidden aspect-[4/5] group transition duration-300 hover:-translate-y-1 focus:outline-none ${
                selected === "hell" ? "ring-2 ring-secondary" : ""
              }`}
            >
              <img
                src={IMAGE_HELL}
                alt="Helle Röstung"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
              <div className="absolute bottom-0 left-0 p-5 text-left">
                <h3 className="font-headline text-2xl text-white">Hell</h3>
                <p className="font-label text-white/80 text-sm">Zitrus &amp; Floral</p>
              </div>
              {selected === "hell" && (
                <span className="absolute top-4 right-4 flex items-center justify-center w-6 h-6 rounded-full bg-secondary">
                  <span className="block w-3 h-3 rounded-full bg-white" />
                </span>
              )}
            </button>

            {/* Mittel — col-span-7 */}
            <button
              onClick={() => setSelected("mittel")}
              className={`col-span-12 md:col-span-7 relative rounded-xl overflow-hidden aspect-[16/9] group transition duration-300 hover:-translate-y-1 focus:outline-none ${
                selected === "mittel" ? "ring-2 ring-secondary" : ""
              }`}
            >
              <img
                src={IMAGE_MITTEL}
                alt="Mittlere Röstung"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
              <div className="absolute bottom-0 left-0 p-5 text-left">
                <h3 className="font-headline text-2xl text-white">Mittel</h3>
                <p className="font-label text-white/80 text-sm">Balance &amp; Schokolade</p>
              </div>
              {selected === "mittel" && (
                <span className="absolute top-4 right-4 flex items-center justify-center w-6 h-6 rounded-full bg-secondary">
                  <span className="block w-3 h-3 rounded-full bg-white" />
                </span>
              )}
            </button>

            {/* Dunkel — col-span-7 */}
            <button
              onClick={() => setSelected("dunkel")}
              className={`col-span-12 md:col-span-7 relative rounded-xl overflow-hidden aspect-[16/9] group transition duration-300 hover:-translate-y-1 focus:outline-none ${
                selected === "dunkel" ? "ring-2 ring-secondary" : ""
              }`}
            >
              <img
                src={IMAGE_DUNKEL}
                alt="Dunkle Röstung"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
              <div className="absolute bottom-0 left-0 p-5 text-left">
                <h3 className="font-headline text-2xl text-white">Dunkel</h3>
                <p className="font-label text-white/80 text-sm">Kräftig &amp; Würzig</p>
              </div>
              {selected === "dunkel" && (
                <span className="absolute top-4 right-4 flex items-center justify-center w-6 h-6 rounded-full bg-secondary">
                  <span className="block w-3 h-3 rounded-full bg-white" />
                </span>
              )}
            </button>

            {/* Weiß ich nicht — col-span-5 */}
            <button
              onClick={() => setSelected("weiss-ich-nicht")}
              className={`col-span-12 md:col-span-5 relative bg-surface-container-lowest rounded-xl p-8 text-left border transition duration-300 hover:-translate-y-1 hover:shadow-xl focus:outline-none flex flex-col justify-center ${
                selected === "weiss-ich-nicht"
                  ? "border-secondary shadow-lg"
                  : "border-outline-variant/15"
              }`}
            >
              <span className="absolute top-4 right-4 flex items-center justify-center w-5 h-5 rounded-full border-2 border-outline-variant">
                {selected === "weiss-ich-nicht" && (
                  <span className="block w-2.5 h-2.5 rounded-full bg-secondary" />
                )}
              </span>
              <span className="material-symbols-outlined text-primary/40 text-4xl mb-4 block">
                help_outline
              </span>
              <h3 className="font-headline text-2xl text-primary mb-2">Weiß ich nicht</h3>
              <p className="font-body text-on-surface-variant text-sm leading-relaxed">
                Wir empfehlen dir eine Auswahl basierend auf deinem Geschmacksprofil.
              </p>
            </button>
          </div>
        </div>
      </main>

      {/* Floating bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-sm border-t border-outline-variant/20 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/quiz/brewing-method"
            className="flex items-center justify-center w-14 h-14 rounded-full text-on-surface-variant opacity-30 hover:opacity-60 transition focus:outline-none"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </Link>

          <Link
            href="/quiz/exploration"
            className={`flex items-center justify-center w-14 h-14 rounded-full text-white transition focus:outline-none ${
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
