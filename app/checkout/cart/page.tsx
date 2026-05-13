"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCart,
  unitPriceForWeight,
  effectiveUnitPrice,
  lineTotal,
  type CartItem,
  type CartWeight,
} from "@/lib/cart";
import { INTERVAL_LABELS } from "@/lib/subscription-constants";

const LOGO = "/logo.png";
// Gleicher Fallback wie auf der Coffee-Detail-Page — vermeidet 404 wenn
// Coffee kein eigenes image_url hat. Wenn das je entfernt wird, hier auch.
const COFFEE_FALLBACK_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC-mgzdszeDV-ADPnt08LksEtq5jHo_pZiXrnzVNy7faF7CAvNwCIqw0tZ2ylgRbHNuI-cdksgJ49bjfH36AYZerX9qRPq7kE2svCJ2KsLCMhI2k4Dc50D2D5FEGms1FJKDbeS75aSghLNY7Dop_dxhV5e-766gOscbYVVzn4qpX1rtPcumcDu7hr6OQeoiBzbRrze7HIkmFAM9YOYzQFzRF1wR3U1Ec53bS5Aj9xRlWvn7KxLIHJL79Wy6T8BFR47-ulGO1PjIJKEL";
const FREE_SHIPPING_THRESHOLD_CHF = 100;
const STANDARD_SHIPPING_CHF = 6.9;

const WEIGHTS: { id: CartWeight; label: string }[] = [
  { id: 250, label: "250 g" },
  { id: 500, label: "500 g" },
  { id: 1000, label: "1 kg" },
];

export default function CartPage() {
  const router = useRouter();
  const {
    oneTimeItems,
    subscriptionItems,
    count,
    subtotal,
    subscriptionSubtotal,
    hasSubscriptions,
    remove,
    updateQty,
    updateWeight,
  } = useCart();

  const shipping =
    subtotal >= FREE_SHIPPING_THRESHOLD_CHF || subtotal === 0
      ? 0
      : STANDARD_SHIPPING_CHF;
  const total = subtotal + shipping;
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD_CHF - subtotal);

  const isEmpty = oneTimeItems.length === 0 && subscriptionItems.length === 0;

  return (
    <div className="bg-[#F9F5F0] text-on-surface min-h-screen pb-20 md:pb-0">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-6 md:px-8 w-full">
          <Link href="/" className="flex items-center">
            <img
              alt="Coffee Selection"
              className="h-56 md:h-72 w-auto object-contain -my-10 md:-my-16"
              src={LOGO}
            />
          </Link>
          <Link
            href="/login?next=/account/dashboard"
            className="font-headline text-[11px] uppercase tracking-[0.3em] text-primary hover:text-tertiary transition-colors"
          >
            Mein Konto
          </Link>
        </div>
      </header>

      <main className="pt-36 md:pt-40 pb-12">
        <Stepper active={0} />

        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="mb-8">
            <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-3 block">
              Warenkorb
            </span>
            <h1 className="text-3xl md:text-5xl text-primary mb-2 font-headline font-bold uppercase tracking-tight">
              Dein Warenkorb
            </h1>
            {!isEmpty && (
              <p className="text-on-surface-variant">
                {count} {count === 1 ? "Artikel" : "Artikel"}
              </p>
            )}
          </div>

          {isEmpty ? (
            <EmptyCart />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Items column */}
              <div className="lg:col-span-2 space-y-6">
                {oneTimeItems.length > 0 && (
                  <section>
                    {hasSubscriptions && (
                      <h2 className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant mb-3">
                        Einmalkauf
                      </h2>
                    )}
                    <div className="space-y-4">
                      {oneTimeItems.map((item) => (
                        <CartItemCard
                          key={item.id}
                          item={item}
                          onRemove={() => remove(item.id)}
                          onQty={(q) => updateQty(item.id, q)}
                          onWeight={(w) => updateWeight(item.id, w)}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {subscriptionItems.length > 0 && (
                  <section>
                    <h2 className="font-headline font-bold text-xs uppercase tracking-widest text-tertiary mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">autorenew</span>
                      Im Abo · wiederkehrend
                    </h2>
                    <div className="space-y-4">
                      {subscriptionItems.map((item) => (
                        <CartItemCard
                          key={item.id}
                          item={item}
                          onRemove={() => remove(item.id)}
                          onQty={(q) => updateQty(item.id, q)}
                          onWeight={(w) => updateWeight(item.id, w)}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {!hasSubscriptions && (
                  <div className="bg-tertiary/5 border-2 border-dashed border-tertiary/30 p-6 text-center">
                    <p className="text-sm text-on-surface-variant mb-2">
                      Möchtest du regelmäßig beliefert werden?
                    </p>
                    <Link
                      href="/match-result"
                      className="inline-block font-headline text-xs uppercase tracking-widest text-tertiary hover:text-primary font-bold"
                    >
                      Abo konfigurieren · -10% sparen →
                    </Link>
                  </div>
                )}
              </div>

              {/* Summary column */}
              <div className="lg:col-span-1">
                <div className="bg-primary text-on-primary p-6 md:p-8 lg:sticky lg:top-32">
                  <h2 className="font-headline font-bold text-base uppercase tracking-tight mb-6">
                    Übersicht
                  </h2>
                  <div className="space-y-3 text-sm mb-6">
                    <SummaryRow label="Zwischensumme" value={`CHF ${subtotal.toFixed(2)}`} />
                    <SummaryRow
                      label="Versand"
                      value={
                        shipping === 0 ? "Gratis" : `CHF ${shipping.toFixed(2)}`
                      }
                    />
                    {amountToFreeShipping > 0 && (
                      <p className="text-xs text-on-primary/60 pt-1">
                        Noch CHF {amountToFreeShipping.toFixed(2)} für gratis Versand
                      </p>
                    )}
                  </div>
                  <div className="border-t border-on-primary/20 pt-4 mb-6">
                    <SummaryRow
                      label="Heute zu zahlen"
                      value={`CHF ${total.toFixed(2)}`}
                      bold
                    />
                    {hasSubscriptions && (
                      <p className="text-[11px] text-on-primary/70 mt-2 leading-snug">
                        Davon CHF {subscriptionSubtotal.toFixed(2)} im Abo —
                        wiederholt sich automatisch zum gewählten Intervall,
                        jederzeit kündbar.
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push("/checkout/shipping")}
                    className="block w-full text-center bg-tertiary text-primary py-4 mb-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-white transition-all"
                  >
                    Weiter zu Versand
                  </button>
                  <Link
                    href="/coffee"
                    className="block w-full text-center border-2 border-tertiary/40 text-on-primary/80 py-3 font-headline font-bold text-[11px] uppercase tracking-widest hover:bg-tertiary hover:text-primary transition-all"
                  >
                    Weiter einkaufen
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Mobile sticky bar */}
      {!isEmpty && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-primary text-on-primary p-4 shadow-2xl z-40">
          <div className="flex justify-between items-center mb-3">
            <span className="font-headline text-[10px] uppercase tracking-widest text-on-primary/60">
              Total ({count})
            </span>
            <span className="font-headline font-bold text-xl">
              CHF {total.toFixed(2)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => router.push("/checkout/shipping")}
            className="block w-full text-center bg-tertiary text-primary py-3 font-headline font-bold text-xs uppercase tracking-widest"
          >
            Weiter zu Versand
          </button>
        </div>
      )}
    </div>
  );
}

function Stepper({ active }: { active: number }) {
  const steps = [
    { label: "Warenkorb" },
    { label: "Adresse" },
    { label: "Zahlung" },
    { label: "Bestätigung" },
  ];
  return (
    <div className="max-w-3xl mx-auto px-6 md:px-8 mb-10">
      <div className="flex items-center gap-2">
        {steps.map((s, i, arr) => (
          <div
            key={s.label}
            className="flex items-center flex-1 last:flex-none"
          >
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 flex items-center justify-center font-headline font-bold text-xs ${
                  i === active
                    ? "bg-primary text-on-primary"
                    : i < active
                    ? "bg-tertiary text-on-primary"
                    : "bg-surface-container text-on-surface-variant"
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`mt-2 font-headline text-[10px] uppercase tracking-widest font-bold ${
                  i === active
                    ? "text-primary"
                    : i < active
                    ? "text-tertiary"
                    : "text-on-surface-variant"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < arr.length - 1 && (
              <div className="flex-1 h-px mx-2 bg-surface-container" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="bg-white p-12 md:p-16 text-center shadow-sm">
      <span className="material-symbols-outlined text-6xl text-on-surface-variant block mb-4">
        shopping_cart
      </span>
      <h2 className="font-headline font-bold text-2xl text-primary uppercase tracking-tight mb-3">
        Warenkorb ist leer
      </h2>
      <p className="text-on-surface-variant mb-6">
        Entdecke unsere Auswahl an Spezialitätenkaffees aus der Schweiz.
      </p>
      <Link
        href="/coffee"
        className="inline-block bg-primary text-on-primary px-8 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-tertiary hover:text-primary transition-all"
      >
        Kaffees entdecken
      </Link>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex justify-between items-baseline ${
        bold ? "font-headline font-bold text-lg" : ""
      }`}
    >
      <span className={bold ? "" : "text-on-primary/80"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function CartItemCard({
  item,
  onRemove,
  onQty,
  onWeight,
}: {
  item: CartItem;
  onRemove: () => void;
  onQty: (q: number) => void;
  onWeight: (w: CartWeight) => void;
}) {
  const isSub = item.is_subscription === true;
  const baseUnit = unitPriceForWeight(item);
  const effUnit = effectiveUnitPrice(item);
  const total = lineTotal(item);
  const discountPct = item.discount_percent ?? 0;

  return (
    <div
      className={`bg-white p-6 md:p-8 shadow-sm flex gap-4 md:gap-6 ${
        isSub ? "border-l-4 border-tertiary" : ""
      }`}
    >
      <Link
        href={`/coffee/${item.coffee_slug}`}
        className="w-24 h-24 md:w-32 md:h-32 bg-surface-container-low overflow-hidden shrink-0"
      >
        <img
          src={item.image_url || COFFEE_FALLBACK_IMG}
          alt={item.coffee_name}
          className="w-full h-full object-cover"
        />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <div>
            {isSub && (
              <span className="inline-block bg-tertiary text-primary font-headline font-bold text-[9px] uppercase tracking-widest px-2 py-0.5 mb-1">
                Abo · −{discountPct}%
              </span>
            )}
            <Link
              href={`/coffee/${item.coffee_slug}`}
              className="block font-headline font-bold text-primary uppercase tracking-tight text-lg md:text-xl hover:text-tertiary transition-colors"
            >
              {item.coffee_name}
            </Link>
            <p className="text-xs text-on-surface-variant mt-1">
              {item.roaster_name}
            </p>
            {isSub && item.interval_weeks && (
              <p className="text-xs text-on-surface-variant mt-2">
                <span className="font-bold">
                  {INTERVAL_LABELS[item.interval_weeks].long}
                </span>
                {" · Röstfrisch bei nächster Röstung"}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="text-on-surface-variant hover:text-red-600 text-xs uppercase tracking-widest font-headline font-bold"
            aria-label="Entfernen"
          >
            Entfernen
          </button>
        </div>

        {/* Gewicht-Selector */}
        <div className="mt-4">
          <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-2">
            Gewicht
          </span>
          <div className="flex gap-2">
            {WEIGHTS.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => onWeight(w.id)}
                className={`px-3 py-1.5 text-xs font-headline uppercase tracking-widest border-2 transition-all ${
                  item.weight_g === w.id
                    ? "border-tertiary bg-tertiary text-on-primary font-bold"
                    : "border-surface-container text-on-surface-variant hover:border-tertiary"
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        {/* Menge + Linienpreis */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onQty(item.quantity - 1)}
              className="w-7 h-7 border border-surface-container hover:border-tertiary text-primary text-base leading-none"
              aria-label="Menge verringern"
            >
              −
            </button>
            <span className="font-headline font-bold text-base w-6 text-center">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onQty(item.quantity + 1)}
              className="w-7 h-7 border border-surface-container hover:border-tertiary text-primary text-base leading-none"
              aria-label="Menge erhöhen"
            >
              +
            </button>
          </div>
          <div className="text-right">
            {isSub && baseUnit !== effUnit && (
              <span className="font-headline text-xs text-on-surface-variant line-through block leading-none">
                CHF {(baseUnit * item.quantity).toFixed(2)}
              </span>
            )}
            <span className="font-headline font-bold text-primary text-lg">
              CHF {total.toFixed(2)}
            </span>
            {isSub && (
              <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant block">
                pro Lieferung
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
