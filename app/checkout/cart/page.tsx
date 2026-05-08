"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const LOGO = "/logo.png";
const COFFEE_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC-mgzdszeDV-ADPnt08LksEtq5jHo_pZiXrnzVNy7faF7CAvNwCIqw0tZ2ylgRbHNuI-cdksgJ49bjfH36AYZerX9qRPq7kE2svCJ2KsLCMhI2k4Dc50D2D5FEGms1FJKDbeS75aSghLNY7Dop_dxhV5e-766gOscbYVVzn4qpX1rtPcumcDu7hr6OQeoiBzbRrze7HIkmFAM9YOYzQFzRF1wR3U1Ec53bS5Aj9xRlWvn7KxLIHJL79Wy6T8BFR47-ulGO1PjIJKEL";

const PRICE_PER_250G = 28;
const FREE_SHIPPING_THRESHOLD = 100;
const SHIPPING_COST = 6.9;

const sizes = [
  { id: "250g", label: "250g", multiplier: 1, note: "1 Sorte" },
  { id: "500g", label: "500g", multiplier: 1.9, note: "2 Sorten" },
  { id: "1kg", label: "1 kg", multiplier: 3.6, note: "4 Pkg · -10%" },
];

const intervals = [
  { id: "weekly", label: "Wöchentlich", note: "Für Vieltrinker" },
  { id: "biweekly", label: "Alle 2 Wochen", note: "Beliebteste Wahl", popular: true },
  { id: "monthly", label: "Monatlich", note: "Standard" },
  { id: "6weeks", label: "Alle 6 Wochen", note: "Für Genießer" },
];

export default function CartPage() {
  const router = useRouter();
  const [orderType, setOrderType] = useState<"once" | "subscription">("once");
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState("250g");
  const [interval, setInterval] = useState("biweekly");

  const sizeMultiplier = sizes.find((s) => s.id === size)?.multiplier ?? 1;
  const unitPrice = orderType === "subscription" ? PRICE_PER_250G * sizeMultiplier : PRICE_PER_250G;
  const itemTotal = unitPrice * (orderType === "once" ? qty : 1);
  const discount = orderType === "subscription" ? itemTotal * 0.15 : 0;
  const subtotal = itemTotal - discount;
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = (subtotal + shipping).toFixed(2);
  const amountToFreeShipping = (FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2);
  const intervalLabel = intervals.find((i) => i.id === interval)?.label;

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

      <main className="pt-44 md:pt-56 pb-12">
        {/* Progress Stepper */}
        <div className="max-w-3xl mx-auto px-6 md:px-8 mb-10">
          <div className="flex items-center gap-2">
            {[
              { label: "Warenkorb", active: true },
              { label: "Adresse" },
              { label: "Zahlung" },
              { label: "Bestätigung" },
            ].map((s, i, arr) => (
              <div key={s.label} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 flex items-center justify-center font-headline font-bold text-xs ${s.active ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>
                    {i + 1}
                  </div>
                  <span className={`mt-2 font-headline text-[10px] uppercase tracking-widest font-bold ${s.active ? "text-primary" : "text-on-surface-variant"}`}>
                    {s.label}
                  </span>
                </div>
                {i < arr.length - 1 && <div className="flex-1 h-px mx-2 bg-surface-container" />}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="mb-8">
            <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-3 block">Warenkorb</span>
            <h1 className="text-3xl md:text-5xl text-primary mb-2 font-headline font-bold uppercase tracking-tight">
              Dein Warenkorb
            </h1>
            <p className="text-on-surface-variant">
              {orderType === "subscription" ? `Abo · ${intervalLabel} · ${size}` : `Einmalige Bestellung · ${qty}× 250g`}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Type Toggle */}
              <div className="bg-white p-6 md:p-8 shadow-sm">
                <h3 className="font-headline text-[11px] uppercase tracking-[0.2em] text-on-surface-variant font-bold mb-3">
                  Bestelltyp
                </h3>
                <div className="grid grid-cols-2 gap-3">
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
                </div>
              </div>

              {/* Subscription Configurator — appears only when abo selected */}
              {orderType === "subscription" && (
                <>
                  <div className="bg-white p-6 md:p-8 shadow-sm border-l-4 border-tertiary">
                    <h3 className="font-headline text-[11px] uppercase tracking-[0.2em] text-on-surface-variant font-bold mb-3">
                      Menge pro Lieferung
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {sizes.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setSize(s.id)}
                          className={`p-4 text-center transition-all border-2 ${
                            size === s.id ? "border-tertiary bg-tertiary/5" : "border-surface-container bg-white hover:border-tertiary/40"
                          }`}
                        >
                          <h4 className="font-headline font-bold text-primary uppercase tracking-tight">{s.label}</h4>
                          <p className="text-[10px] text-on-surface-variant mt-1 font-headline uppercase tracking-widest">{s.note}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-6 md:p-8 shadow-sm border-l-4 border-tertiary">
                    <h3 className="font-headline text-[11px] uppercase tracking-[0.2em] text-on-surface-variant font-bold mb-3">
                      Lieferintervall
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {intervals.map((iv) => (
                        <button
                          key={iv.id}
                          onClick={() => setInterval(iv.id)}
                          className={`relative p-4 text-left transition-all border-2 ${
                            interval === iv.id ? "border-tertiary bg-tertiary/5" : "border-surface-container bg-white hover:border-tertiary/40"
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
                </>
              )}

              {/* Cart Item */}
              <div className="bg-white p-6 md:p-8 shadow-sm flex gap-4 md:gap-6">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-surface-container-low overflow-hidden shrink-0">
                  <img src={COFFEE_IMG} alt="Ethiopia Yirgacheffe" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold">Äthiopien</span>
                      <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg md:text-xl mt-1">
                        Ethiopia Yirgacheffe
                      </h3>
                      <p className="text-xs text-on-surface-variant mt-1">
                        Miro Coffee Roasters · {orderType === "subscription" ? size : "250g"}
                      </p>
                      {orderType === "subscription" && (
                        <span className="inline-block mt-2 bg-tertiary/15 text-tertiary px-2 py-1 font-headline text-[9px] uppercase tracking-widest font-bold">
                          Abo · {intervalLabel} · -15%
                        </span>
                      )}
                    </div>
                    <button className="text-on-surface-variant hover:text-error transition-colors" aria-label="Entfernen">
                      <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                  </div>
                  <div className="flex justify-between items-end mt-4 pt-4 border-t border-surface-container">
                    {/* Quantity controls — only for one-time orders */}
                    {orderType === "once" ? (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setQty(Math.max(1, qty - 1))}
                          disabled={qty <= 1}
                          className="w-8 h-8 border-2 border-primary text-primary font-headline font-bold hover:bg-primary hover:text-on-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Weniger"
                        >
                          −
                        </button>
                        <span className="font-headline font-bold text-primary text-lg w-8 text-center">{qty}</span>
                        <button
                          onClick={() => setQty(qty + 1)}
                          className="w-8 h-8 border-2 border-primary text-primary font-headline font-bold hover:bg-primary hover:text-on-primary transition-all"
                          aria-label="Mehr"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <div className="font-headline text-xs text-on-surface-variant uppercase tracking-widest">
                        Pro Lieferung: {size}
                      </div>
                    )}
                    <span className="font-headline font-bold text-primary text-xl">CHF {itemTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Continue shopping */}
              <Link
                href="/coffee/ethiopia-yirgacheffe"
                className="inline-flex items-center gap-2 font-headline text-[11px] uppercase tracking-[0.2em] text-tertiary hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                Weiter stöbern
              </Link>

              {/* Free shipping progress */}
              {shipping > 0 && (
                <div className="bg-tertiary/10 border-l-4 border-tertiary p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="material-symbols-outlined text-tertiary">local_shipping</span>
                    <p className="font-headline text-sm font-bold text-primary uppercase tracking-tight">
                      Noch CHF {amountToFreeShipping} bis Gratis-Versand
                    </p>
                  </div>
                  <div className="h-1.5 bg-surface-container relative overflow-hidden">
                    <div className="h-full bg-tertiary transition-all duration-500" style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }} />
                  </div>
                  <p className="text-xs text-on-surface-variant mt-2">
                    Versand ab CHF {FREE_SHIPPING_THRESHOLD} kostenlos. Sonst CHF {SHIPPING_COST.toFixed(2)}.
                  </p>
                </div>
              )}

              {shipping === 0 && (
                <div className="bg-tertiary/15 border-l-4 border-tertiary p-5 flex items-center gap-3">
                  <span className="material-symbols-outlined text-tertiary text-2xl">check_circle</span>
                  <div>
                    <p className="font-headline text-sm font-bold text-primary uppercase tracking-tight">Gratis-Versand erreicht</p>
                    <p className="text-xs text-on-surface-variant">Schweizweit kostenlos</p>
                  </div>
                </div>
              )}
            </div>

            {/* Summary */}
            <aside className="lg:sticky lg:top-32 lg:self-start">
              <div className="bg-white p-6 md:p-8 shadow-md">
                <h2 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-6">Zusammenfassung</h2>
                <div className="space-y-3 text-sm pb-6 mb-6 border-b border-surface-container">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">
                      {orderType === "subscription" ? `Pro Lieferung (${size})` : `${qty}× 250g`}
                    </span>
                    <span className="font-headline font-bold text-primary">CHF {itemTotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-tertiary font-headline text-xs uppercase tracking-widest font-bold">Abo-Rabatt (-15%)</span>
                      <span className="text-tertiary font-headline font-bold">− CHF {discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Versand</span>
                    {shipping === 0 ? (
                      <span className="text-tertiary font-headline font-bold uppercase text-xs tracking-widest">Gratis</span>
                    ) : (
                      <span className="font-headline font-bold text-primary">CHF {shipping.toFixed(2)}</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-end mb-2">
                  <span className="font-headline font-bold text-primary uppercase tracking-tight">Total</span>
                  <span className="font-headline font-bold text-2xl text-tertiary">CHF {total}</span>
                </div>
                {orderType === "subscription" && (
                  <p className="text-xs text-on-surface-variant mb-6">Pro Lieferung · {intervalLabel}</p>
                )}
                {orderType === "once" && <div className="mb-6" />}
                <button
                  onClick={() => router.push("/checkout/shipping")}
                  className="block w-full text-center bg-primary text-on-primary py-4 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all"
                >
                  Weiter zur Adresse
                </button>
                <div className="mt-6 space-y-2 text-xs text-on-surface-variant">
                  {[
                    { i: "lock", t: "SSL-verschlüsselt via Shopify" },
                    { i: "local_shipping", t: "Lieferung in 2–4 Werktagen" },
                    { i: "autorenew", t: "Abo jederzeit pausierbar" },
                  ].map((x) => (
                    <div key={x.t} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-tertiary text-sm">{x.i}</span>
                      {x.t}
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Sticky Mobile CTA */}
      <button
        onClick={() => router.push("/checkout/shipping")}
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-primary text-on-primary py-5 text-center font-headline font-bold uppercase tracking-widest text-xs shadow-2xl border-t-2 border-tertiary"
      >
        Weiter · CHF {total}
      </button>
    </div>
  );
}
