"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart, type CartWeight } from "@/lib/cart";

/**
 * C-6.1: Add-to-Cart auf der Coffee-Detail-Page.
 *
 * Client-Komponente — die Page selbst ist Server-Komponente, holt Coffee-
 * Daten aus der DB. Hier ist alles was Interaktion + Cart-State braucht.
 *
 * Verhalten:
 *   - User waehlt Gewicht (250g / 500g / 1kg) und Menge
 *   - Klick "In den Warenkorb" → useCart().add() + Redirect zu /checkout/cart
 *   - Visuelles Feedback: kurzer "Hinzugefuegt"-Status vor dem Navigieren
 */

type Props = {
  coffee_id: string;
  coffee_name: string;
  coffee_slug: string;
  image_url: string | null;
  roaster_name: string;
  // Preis fuer den Default-Weight (250g) als Referenz. Wir skalieren
  // clientseitig linear fuer 500g/1kg-Anzeige; Server tut's nochmal autoritativ
  // beim Order-Create.
  unit_price_chf_250g: number;
};

const WEIGHTS: { id: CartWeight; label: string }[] = [
  { id: 250, label: "250 g" },
  { id: 500, label: "500 g" },
  { id: 1000, label: "1 kg" },
];

export function AddToCartButton(props: Props) {
  const router = useRouter();
  const { add } = useCart();
  const [weight, setWeight] = useState<CartWeight>(250);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  const priceForWeight = props.unit_price_chf_250g * (weight / 250);
  const lineTotal = priceForWeight * qty;

  const handleAdd = () => {
    if (adding) return;
    setAdding(true);
    add({
      coffee_id: props.coffee_id,
      coffee_name: props.coffee_name,
      coffee_slug: props.coffee_slug,
      image_url: props.image_url,
      roaster_name: props.roaster_name,
      unit_price_chf_250g: props.unit_price_chf_250g,
      weight_g: weight,
      quantity: qty,
    });
    // Kurzer optischer Feedback-Moment, dann ab zum Cart
    setTimeout(() => router.push("/checkout/cart"), 250);
  };

  return (
    <div>
      {/* Gewichts-Auswahl */}
      <div className="mb-4">
        <span className="font-headline text-[10px] uppercase tracking-widest text-on-primary/60 block mb-2">
          Gewicht
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

      {/* Mengen-Stepper */}
      <div className="mb-6 flex items-center justify-between">
        <span className="font-headline text-[10px] uppercase tracking-widest text-on-primary/60">
          Menge
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

      {/* Live-Preis */}
      <div className="mb-6 flex justify-between items-baseline">
        <span className="font-headline text-[10px] uppercase tracking-widest text-on-primary/60">
          Zwischensumme
        </span>
        <span className="font-headline font-bold text-2xl text-tertiary">
          CHF {lineTotal.toFixed(2)}
        </span>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={handleAdd}
        disabled={adding}
        className="block w-full text-center bg-tertiary text-primary py-4 mb-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50"
      >
        {adding ? "Wird hinzugefügt…" : "In den Warenkorb · Einmalig"}
      </button>
    </div>
  );
}
