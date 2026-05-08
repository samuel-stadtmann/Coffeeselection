"use client";
import Link from "next/link";
import { useState } from "react";

const LOGO = "/logo.png";
const IMG_BEANS =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC-mgzdszeDV-ADPnt08LksEtq5jHo_pZiXrnzVNy7faF7CAvNwCIqw0tZ2ylgRbHNuI-cdksgJ49bjfH36AYZerX9qRPq7kE2svCJ2KsLCMhI2k4Dc50D2D5FEGms1FJKDbeS75aSghLNY7Dop_dxhV5e-766gOscbYVVzn4qpX1rtPcumcDu7hr6OQeoiBzbRrze7HIkmFAM9YOYzQFzRF1wR3U1Ec53bS5Aj9xRlWvn7KxLIHJL79Wy6T8BFR47-ulGO1PjIJKEL";
const IMG_ROASTER =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA-S5G-G2GyXwDSqhZUBVhEPzzhn6fmZjVav9MDmLRnTGguG1RMynNRtrMwDGxCBzjzoSF6OlAEDCOy47VHoi3ZWOP_lDsJTt9l2vjncVB3sPlBZ3_iqCO-t_b8t2mON0PC8klJhq85bKvLFqxRzhU2nTAf0ddAOBci5HMOPNI9RT9Fu8G5Oozu9c8wMB_n5dCv9mHBMPAzqbXs-rjZ3u7WxXvwScbAcg355mQw3rzPzcT7rHe-wZUyVGsAr1SxpcScic3PHn3AlmzX";

const tasteProfile = [
  { label: "Säure", value: 85 },
  { label: "Süße", value: 70 },
  { label: "Körper", value: 40 },
  { label: "Bitterkeit", value: 20 },
  { label: "Komplexität", value: 90 },
];

const PRICE_PER_250G = 28;
const intervals = [
  { id: "weekly", label: "Wöchentlich", note: "Für Vieltrinker" },
  { id: "biweekly", label: "Alle 2 Wochen", note: "Beliebteste Wahl", popular: true },
  { id: "monthly", label: "Monatlich", note: "Standard" },
  { id: "6weeks", label: "Alle 6 Wochen", note: "Für Genießer" },
];
const sizes = [
  { id: "250g", label: "250g", multiplier: 1, note: "1 Packung" },
  { id: "500g", label: "500g", multiplier: 1.9, note: "2 Packungen" },
  { id: "1kg", label: "1 kg", multiplier: 3.6, note: "4 Packungen · -10%" },
];

export default function MatchResultPage() {
  const [orderType, setOrderType] = useState<"once" | "subscription">("subscription");
  const [interval, setInterval] = useState("biweekly");
  const [size, setSize] = useState("500g");

  const sizeMultiplier = sizes.find((s) => s.id === size)?.multiplier ?? 1;
  const basePrice = PRICE_PER_250G * sizeMultiplier;
  const discount = orderType === "subscription" ? 0.85 : 1;
  const totalPrice = (basePrice * discount).toFixed(2);
  const savings = orderType === "subscription" ? (basePrice * 0.15).toFixed(2) : null;

  return (
    <div className="bg-[#F9F5F0] text-on-surface min-h-screen pb-20 md:pb-0">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-6 md:px-8 w-full">
          <Link href="/" className="flex items-center">
            <img alt="Coffee Selection" className="h-72 md:h-96 w-auto object-contain -my-16 md:-my-24" src={LOGO} />
          </Link>
          <Link href="/login?next=/account/dashboard" className="font-headline text-[11px] uppercase tracking-[0.3em] text-primary hover:text-tertiary transition-colors">
            Mein Konto
          </Link>
        </div>
      </header>

      <main className="pt-44 md:pt-56">
        {/* Hero — Geschmackstyp */}
        <section className="bg-primary text-on-primary py-12 md:py-16 border-b border-tertiary/20">
          <div className="max-w-5xl mx-auto px-6 md:px-8 text-center">
            <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
              Dein Geschmackstyp
            </span>
            <h1 className="text-4xl md:text-6xl mb-4 font-headline font-bold uppercase tracking-tight leading-tight">
              Der Fruchtfreund
            </h1>
            <p className="font-headline text-tertiary uppercase tracking-widest text-sm mb-6">
              Beerig · Lebendig · Hell
            </p>
            <p className="text-base md:text-lg text-on-primary/80 max-w-2xl mx-auto leading-relaxed">
              Du liebst lebendige Säure, beerige Aromen und florale Klarheit. Äthiopien und Kenia sind dein Spielfeld.
            </p>
          </div>
        </section>

        {/* Match Coffee + Configurator */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Coffee Image + Profile */}
            <div className="space-y-6">
              <div className="aspect-[4/5] overflow-hidden bg-surface-container-low">
                <img src={IMG_BEANS} alt="Ethiopia Yirgacheffe" className="w-full h-full object-cover" />
              </div>
              <div className="bg-white p-8 shadow-md">
                <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-6">
                  Geschmacksprofil
                </h3>
                <div className="space-y-4">
                  {tasteProfile.map((p) => (
                    <div key={p.label}>
                      <div className="flex justify-between mb-2">
                        <span className="font-headline text-[11px] uppercase tracking-widest text-on-surface-variant">{p.label}</span>
                        <span className="font-headline text-[11px] uppercase tracking-widest text-tertiary font-bold">{p.value}%</span>
                      </div>
                      <div className="h-1 bg-surface-container relative overflow-hidden">
                        <div className="h-full bg-tertiary transition-all duration-1000" style={{ width: `${p.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white p-6 shadow-md flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-surface-variant shrink-0">
                  <img src={IMG_ROASTER} alt="Roaster" className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold">Zürich · Direct Trade</span>
                  <h4 className="font-headline font-bold text-primary uppercase tracking-tight">Miro Coffee Roasters</h4>
                </div>
              </div>
            </div>

            {/* Configurator */}
            <div className="lg:sticky lg:top-28 lg:self-start space-y-8">
              <div>
                <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-3 block">
                  Dein Match
                </span>
                <h2 className="text-3xl md:text-5xl text-primary leading-tight mb-4 font-headline font-bold uppercase tracking-tight">
                  Ethiopia<br />Yirgacheffe
                </h2>
                <p className="font-serif italic text-base md:text-lg text-on-surface-variant leading-relaxed mb-2">
                  &ldquo;Lebendige Jasmin- und Limettennoten mit klarem, hellem Körper. Eine perfekte Balance aus floraler Eleganz und beeriger Frische.&rdquo;
                </p>
                <div className="flex flex-wrap gap-2 mt-6">
                  {["Jasmin", "Limette", "Erdbeere", "Bergamotte"].map((a) => (
                    <span key={a} className="bg-surface-container px-3 py-1 font-headline text-[10px] uppercase tracking-widest font-bold text-primary">{a}</span>
                  ))}
                </div>
              </div>

              {/* Order Type Toggle */}
              <div>
                <h3 className="font-headline text-[11px] uppercase tracking-[0.2em] text-on-surface-variant font-bold mb-3">Bestelltyp</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setOrderType("subscription")}
                    className={`relative p-5 text-left transition-all border-2 ${
                      orderType === "subscription"
                        ? "border-tertiary bg-tertiary/5"
                        : "border-surface-container bg-white hover:border-tertiary/40"
                    }`}
                  >
                    <span className="absolute -top-3 left-3 bg-tertiary text-white px-2 py-0.5 font-headline text-[9px] uppercase tracking-widest font-bold">
                      -15% Sparen
                    </span>
                    <h4 className="font-headline font-bold text-primary uppercase tracking-tight text-base mb-1">Abo</h4>
                    <p className="text-xs text-on-surface-variant">Regelmäßig liefern, jederzeit pausieren</p>
                  </button>
                  <button
                    onClick={() => setOrderType("once")}
                    className={`p-5 text-left transition-all border-2 ${
                      orderType === "once"
                        ? "border-tertiary bg-tertiary/5"
                        : "border-surface-container bg-white hover:border-tertiary/40"
                    }`}
                  >
                    <h4 className="font-headline font-bold text-primary uppercase tracking-tight text-base mb-1">Einmal</h4>
                    <p className="text-xs text-on-surface-variant">Nur diese Lieferung, kein Abo</p>
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <h3 className="font-headline text-[11px] uppercase tracking-[0.2em] text-on-surface-variant font-bold mb-3">Menge pro Lieferung</h3>
                <div className="grid grid-cols-3 gap-3">
                  {sizes.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSize(s.id)}
                      className={`p-4 text-center transition-all border-2 ${
                        size === s.id
                          ? "border-tertiary bg-tertiary/5"
                          : "border-surface-container bg-white hover:border-tertiary/40"
                      }`}
                    >
                      <h4 className="font-headline font-bold text-primary uppercase tracking-tight text-base">{s.label}</h4>
                      <p className="text-[10px] text-on-surface-variant mt-1 font-headline uppercase tracking-widest">{s.note}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Interval — only if subscription */}
              {orderType === "subscription" && (
                <div>
                  <h3 className="font-headline text-[11px] uppercase tracking-[0.2em] text-on-surface-variant font-bold mb-3">Lieferintervall</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {intervals.map((iv) => (
                      <button
                        key={iv.id}
                        onClick={() => setInterval(iv.id)}
                        className={`relative p-4 text-left transition-all border-2 ${
                          interval === iv.id
                            ? "border-tertiary bg-tertiary/5"
                            : "border-surface-container bg-white hover:border-tertiary/40"
                        }`}
                      >
                        {iv.popular && (
                          <span className="absolute -top-2 right-2 bg-primary text-white px-2 py-0.5 font-headline text-[9px] uppercase tracking-widest font-bold">
                            Top
                          </span>
                        )}
                        <h4 className="font-headline font-bold text-primary uppercase tracking-tight text-sm">{iv.label}</h4>
                        <p className="text-[10px] text-on-surface-variant mt-1">{iv.note}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Summary + CTA */}
              <div className="bg-primary text-on-primary p-6 md:p-8">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <span className="font-headline text-[10px] uppercase tracking-widest text-on-primary/60 block">
                      {orderType === "subscription" ? "Pro Lieferung" : "Einmaliger Preis"}
                    </span>
                    <span className="font-headline font-bold text-3xl md:text-4xl text-tertiary">
                      CHF {totalPrice}
                    </span>
                  </div>
                  {savings && (
                    <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold">
                      Du sparst CHF {savings}
                    </span>
                  )}
                </div>
                <p className="text-xs text-on-primary/60 mb-5">
                  inkl. Versand · {orderType === "subscription" ? "jederzeit pausieren oder kündigen" : "keine Bindung"}
                </p>
                <Link
                  href="/checkout/cart"
                  className="block w-full text-center bg-tertiary text-primary py-4 font-headline font-bold text-xs uppercase tracking-widest hover:bg-white transition-all"
                >
                  {orderType === "subscription" ? "Abo starten" : "Jetzt bestellen"}
                </Link>
                <Link
                  href="/quiz/question-1-brewing-method"
                  className="block w-full text-center mt-3 py-3 font-headline text-[10px] uppercase tracking-widest text-on-primary/60 hover:text-tertiary transition-colors"
                >
                  Quiz wiederholen
                </Link>
              </div>

              {/* Trust */}
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { icon: "local_shipping", label: "Versand inkl." },
                  { icon: "verified", label: "Direct Trade" },
                  { icon: "autorenew", label: "Pause jederzeit" },
                ].map((t) => (
                  <div key={t.label} className="bg-white p-3">
                    <span className="material-symbols-outlined text-tertiary text-xl block mb-1">{t.icon}</span>
                    <span className="font-headline text-[9px] uppercase tracking-widest text-on-surface-variant font-bold">{t.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Sticky Mobile CTA */}
      <Link
        href="/checkout/cart"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-tertiary text-primary py-5 text-center font-headline font-bold uppercase tracking-widest text-xs shadow-2xl"
      >
        {orderType === "subscription" ? `Abo starten · CHF ${totalPrice}` : `Bestellen · CHF ${totalPrice}`}
      </Link>
    </div>
  );
}
