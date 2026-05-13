"use client";

import { useState } from "react";
import { AddToCartButton } from "./AddToCartButton";
import { SubscriptionConfigurator } from "./SubscriptionConfigurator";
import { SUBSCRIPTION_DISCOUNT_PERCENT } from "@/lib/subscription-constants";

/**
 * P1B-3c: Tab-Wrapper "Einmalig | Abo" auf der Coffee-Detail-Page.
 *
 * Beide Kauf-Pfade fuer einen konkreten Coffee:
 *   - Einmalig → AddToCartButton (one-time purchase, P1A)
 *   - Abo     → SubscriptionConfigurator (recurring delivery, P1B)
 *
 * Der "Lass mich ueberraschen"-Pfad (Discovery-Abo via /match-result) bleibt
 * separat als Link unter dieser Component — andere Mechanik (KI-Match),
 * gehoert nicht in die gleichen Tabs.
 */

type Props = {
  coffee_id: string;
  coffee_name: string;
  coffee_slug: string;
  image_url: string | null;
  roaster_name: string;
  unit_price_chf_250g: number;
};

type Mode = "once" | "subscription";

export function CoffeePurchaseOptions(props: Props) {
  const [mode, setMode] = useState<Mode>("once");

  return (
    <div>
      {/* Tab-Switcher */}
      <div
        role="tablist"
        aria-label="Kaufoption"
        className="grid grid-cols-2 gap-0 mb-6 border border-on-primary/20"
      >
        <button
          role="tab"
          aria-selected={mode === "once"}
          type="button"
          onClick={() => setMode("once")}
          className={`py-3 font-headline text-[11px] uppercase tracking-widest transition-all ${
            mode === "once"
              ? "bg-tertiary text-primary font-bold"
              : "text-on-primary/70 hover:text-on-primary"
          }`}
        >
          Einmalig
        </button>
        <button
          role="tab"
          aria-selected={mode === "subscription"}
          type="button"
          onClick={() => setMode("subscription")}
          className={`relative py-3 font-headline text-[11px] uppercase tracking-widest transition-all ${
            mode === "subscription"
              ? "bg-tertiary text-primary font-bold"
              : "text-on-primary/70 hover:text-on-primary"
          }`}
        >
          Abo
          <span
            className={`ml-2 font-headline text-[9px] font-bold ${
              mode === "subscription" ? "text-primary/70" : "text-tertiary"
            }`}
          >
            −{SUBSCRIPTION_DISCOUNT_PERCENT}%
          </span>
        </button>
      </div>

      {/* Tab-Panel */}
      {mode === "once" ? (
        <AddToCartButton
          coffee_id={props.coffee_id}
          coffee_name={props.coffee_name}
          coffee_slug={props.coffee_slug}
          image_url={props.image_url}
          roaster_name={props.roaster_name}
          unit_price_chf_250g={props.unit_price_chf_250g}
        />
      ) : (
        <SubscriptionConfigurator
          coffee_id={props.coffee_id}
          coffee_name={props.coffee_name}
          coffee_slug={props.coffee_slug}
          image_url={props.image_url}
          roaster_name={props.roaster_name}
          unit_price_chf_250g={props.unit_price_chf_250g}
        />
      )}
    </div>
  );
}
