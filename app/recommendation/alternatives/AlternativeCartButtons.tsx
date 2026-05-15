"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart, type CartWeight } from "@/lib/cart";
import { SUBSCRIPTION_DISCOUNT_PERCENT } from "@/lib/subscription-constants";

type Props = {
  coffee_id: string;
  coffee_name: string;
  coffee_slug: string;
  image_url: string | null;
  roaster_name: string;
  unit_price_chf_250g: number;
};

// Default-Konfiguration: 250g, 1x — Kunde kann im Cart oder unter
// /coffee/<slug> weiter anpassen.
const DEFAULT_WEIGHT: CartWeight = 250;
const DEFAULT_INTERVAL = 2;

export default function AlternativeCartButtons(props: Props) {
  const router = useRouter();
  const { add, addSubscription } = useCart();
  const [busy, setBusy] = useState<"once" | "sub" | null>(null);

  const handle = (mode: "once" | "sub") => {
    if (busy) return;
    setBusy(mode);
    const common = {
      coffee_id: props.coffee_id,
      coffee_name: props.coffee_name,
      coffee_slug: props.coffee_slug,
      image_url: props.image_url,
      roaster_name: props.roaster_name,
      unit_price_chf_250g: props.unit_price_chf_250g,
      weight_g: DEFAULT_WEIGHT,
      quantity: 1,
    };
    if (mode === "sub") {
      addSubscription({ ...common, interval_weeks: DEFAULT_INTERVAL });
    } else {
      add(common);
    }
    setTimeout(() => router.push("/checkout/cart"), 200);
  };

  return (
    <div className="grid grid-cols-2 border-t border-primary/10">
      <button
        onClick={() => handle("once")}
        disabled={busy !== null}
        className="text-center py-4 font-headline text-[10px] uppercase tracking-widest text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors font-bold disabled:opacity-60"
      >
        {busy === "once" ? "…" : "Einmal kaufen"}
      </button>
      <button
        onClick={() => handle("sub")}
        disabled={busy !== null}
        className="text-center py-4 font-headline text-[10px] uppercase tracking-widest bg-primary text-on-primary hover:bg-black transition-colors font-bold disabled:opacity-60"
      >
        {busy === "sub" ? "…" : `Abo · −${SUBSCRIPTION_DISCOUNT_PERCENT}%`}
      </button>
    </div>
  );
}
