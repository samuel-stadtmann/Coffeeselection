"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart, type CartWeight } from "@/lib/cart";
import {
  SUBSCRIPTION_INTERVAL_WEEKS,
  SUBSCRIPTION_DISCOUNT_PERCENT,
  SUBSCRIPTION_DISCOUNT_MULTIPLIER,
  INTERVAL_LABELS,
  type SubscriptionIntervalWeeks,
} from "@/lib/subscription-constants";

/**
 * Abo-Configurator auf der Coffee-Detail-Page (P1B-3 UI, P1B-4 Cart).
 *
 * Schwester-Component von AddToCartButton, fuer "Fix-Abo" (immer dieser eine
 * Coffee). Trennung zur Discovery-Abo-Seite: dort waehlt der Algorithmus,
 * hier waehlt der User direkt.
 *
 * Submit ruft useCart().addSubscription({...}) und navigiert zu /checkout/cart.
 * Stripe-Subscription-Create passiert spaeter im Cart-Checkout (P1B-5).
 */

type Props = {
  coffee_id: string;
  coffee_name: string;
  coffee_slug: string;
  image_url: string | null;
  roaster_name: string;
  unit_price_chf_250g: number;
  /**
   * P2: Wenn true, wird das Abo als Discovery-Abo angelegt (Renewals
   * picken automatisch neuen Coffee aus dem Geschmackstyp). Wird vom
   * Parent gesetzt — UI im Configurator zeigt nur einen Hinweis-Banner,
   * kein eigener Toggle hier mehr.
   */
  isDiscovery?: boolean;
};

const WEIGHTS: { id: CartWeight; label: string }[] = [
  { id: 250, label: "250 g" },
  { id: 500, label: "500 g" },
  { id: 1000, label: "1 kg" },
];

export function SubscriptionConfigurator(props: Props) {
  const router = useRouter();
  const { addSubscription } = useCart();
  const [weight, setWeight] = useState<CartWeight>(250);
  const [qty, setQty] = useState(1);
  const [intervalWeeks, setIntervalWeeks] =
    useState<SubscriptionIntervalWeeks>(2);
  const isDiscovery = props.isDiscovery === true;
  const [adding, setAdding] = useState(false);

  // Preise: Basis linear nach Gewicht skaliert (wie AddToCartButton),
  // dann Abo-Rabatt drauf.
  const basePerDelivery = props.unit_price_chf_250g * (weight / 250) * qty;
  const discountedPerDelivery =
    basePerDelivery * SUBSCRIPTION_DISCOUNT_MULTIPLIER;
  const savingsPerDelivery = basePerDelivery - discountedPerDelivery;

  const handleSubmit = () => {
    if (adding) return;
    setAdding(true);
    addSubscription({
      coffee_id: props.coffee_id,
      coffee_name: props.coffee_name,
      coffee_slug: props.coffee_slug,
      image_url: props.image_url,
      roaster_name: props.roaster_name,
      unit_price_chf_250g: props.unit_price_chf_250g,
      weight_g: weight,
      quantity: qty,
      interval_weeks: intervalWeeks,
      is_discovery: isDiscovery,
    });
    setTimeout(() => router.push("/checkout/cart"), 250);
  };

  return (
    <div>
      {/* Gewichts-Auswahl */}
      <div className="mb-4">
        <span className="font-headline text-[10px] uppercase tracking-widest text-on-primary/60 block mb-2">
          Gewicht pro Lieferung
        </span>
        <div className="grid grid-cols-3 gap-2">
          {WEIGHTS.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => setWeight(w.id)}
              className={`py-2 font-headline text-xs uppercase tracking-widest border-2 transition-all ${
                weight === w.id
                  ? "border-tertiary bg-tertiary text-primary font-bold"
                  : "border-on-primary/30 text-on-primary hover:border-tertiary"
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mengen-Stepper (mehrere Beutel je Lieferung) */}
      <div className="mb-4 flex items-center justify-between">
        <span className="font-headline text-[10px] uppercase tracking-widest text-on-primary/60">
          Menge pro Lieferung
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-8 h-8 border border-on-primary/30 hover:border-tertiary text-on-primary text-lg leading-none"
            aria-label="Menge verringern"
          >
            −
          </button>
          <span className="font-headline font-bold text-lg w-6 text-center">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(20, q + 1))}
            className="w-8 h-8 border border-on-primary/30 hover:border-tertiary text-on-primary text-lg leading-none"
            aria-label="Menge erhöhen"
          >
            +
          </button>
        </div>
      </div>

      {/* Lieferintervall */}
      <div className="mb-4">
        <label
          htmlFor="sub-interval-weeks"
          className="font-headline text-[10px] uppercase tracking-widest text-on-primary/60 block mb-2"
        >
          Lieferintervall
        </label>
        <select
          id="sub-interval-weeks"
          value={intervalWeeks}
          onChange={(e) =>
            setIntervalWeeks(
              Number(e.target.value) as SubscriptionIntervalWeeks
            )
          }
          className="w-full py-2 px-3 bg-primary border-2 border-on-primary/30 text-on-primary font-headline text-sm focus:border-tertiary focus:outline-none appearance-none cursor-pointer"
        >
          {SUBSCRIPTION_INTERVAL_WEEKS.map((w) => (
            <option key={w} value={w} className="bg-primary text-on-primary">
              {INTERVAL_LABELS[w].long}
            </option>
          ))}
        </select>
      </div>

      {/* P2: Hinweis-Banner bei Discovery-Modus — Toggle liegt im Parent
          (CoffeePurchaseOptions) als eigener Tab. */}
      {isDiscovery && (
        <div className="mb-4 bg-tertiary/15 p-3 border-l-2 border-tertiary">
          <p className="text-[11px] text-on-primary leading-snug">
            <span className="font-headline text-[11px] uppercase tracking-widest text-tertiary font-bold block mb-0.5">
              Überraschungs-Abo aktiv
            </span>
            Bei jeder Folgelieferung wählen wir einen NEUEN Coffee aus deinem
            Geschmackstyp — nie zweimal das Gleiche. Erste Lieferung ist der
            hier gewählte Coffee.
          </p>
        </div>
      )}

      {/* Liefer-Hinweis (kein User-w&auml;hlbares Startdatum: R&ouml;ster
          steuert Timing, R&ouml;stung erfolgt fris&ouml;st) */}
      <div className="mb-6 flex items-start gap-2 bg-on-primary/5 p-3 border-l-2 border-on-primary/20">
        <span className="material-symbols-outlined text-tertiary text-base mt-0.5 shrink-0">
          local_shipping
        </span>
        <p className="text-[11px] text-on-primary/80 leading-snug">
          Wird bei der nächsten Röstung röstfrisch an dich geliefert. Folgelieferungen
          dann automatisch im gewählten Intervall.
        </p>
      </div>

      {/* Live-Preis-Vergleich */}
      <div className="mb-6 bg-on-primary/5 p-4 border-l-2 border-tertiary">
        <div className="flex justify-between items-baseline mb-1">
          <span className="font-headline text-[10px] uppercase tracking-widest text-on-primary/60">
            Pro Lieferung
          </span>
          <span className="font-headline text-xs text-on-primary/50 line-through">
            CHF {basePerDelivery.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="font-headline font-bold text-tertiary text-[10px] uppercase tracking-widest">
            Abo-Preis ({SUBSCRIPTION_DISCOUNT_PERCENT}% Rabatt)
          </span>
          <span className="font-headline font-bold text-2xl text-tertiary">
            CHF {discountedPerDelivery.toFixed(2)}
          </span>
        </div>
        <p className="text-[10px] text-on-primary/60 mt-2">
          Du sparst CHF {savingsPerDelivery.toFixed(2)} pro Lieferung ·{" "}
          {INTERVAL_LABELS[intervalWeeks].long}
        </p>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={adding}
        className="block w-full text-center bg-tertiary text-primary py-4 mb-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50"
      >
        {adding ? "Wird hinzugefügt…" : `Abo in den Warenkorb · −${SUBSCRIPTION_DISCOUNT_PERCENT}%`}
      </button>
      <p className="text-[10px] text-on-primary/50 text-center">
        Jederzeit pausieren, Intervall ändern oder kündigen — keine Mindestlaufzeit
      </p>
    </div>
  );
}
