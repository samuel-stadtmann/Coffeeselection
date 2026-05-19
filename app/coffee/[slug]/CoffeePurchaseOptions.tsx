"use client";

import { useEffect, useState } from "react";
import { AddToCartButton } from "./AddToCartButton";
import { SubscriptionConfigurator } from "./SubscriptionConfigurator";
import { SUBSCRIPTION_DISCOUNT_PERCENT } from "@/lib/subscription-constants";
import { hasDiscoveryIntent } from "@/lib/discovery-intent";

/**
 * P1B-3c + P2: Tab-Wrapper "Einmalig | Abo | Discovery" auf der
 * Coffee-Detail-Page.
 *
 *   - Einmalig   → AddToCartButton (one-time, P1A)
 *   - Abo        → SubscriptionConfigurator fix (P1B)
 *   - Discovery  → SubscriptionConfigurator mit isDiscovery=true (P2)
 *
 * Auto-Preselect "Discovery" wenn der User aus dem Discovery-
 * Funnel kommt (Flag in sessionStorage, siehe lib/discovery-intent.ts).
 */

type Props = {
  coffee_id: string;
  coffee_name: string;
  coffee_slug: string;
  image_url: string | null;
  roaster_name: string;
  unit_price_chf_250g: number;
};

type Mode = "once" | "subscription" | "discovery";

export function CoffeePurchaseOptions(props: Props) {
  const [mode, setMode] = useState<Mode>("once");

  // Beim Mount pruefen ob der User aus dem Discovery-Funnel kommt — dann
  // direkt den Discovery-Tab vorauswaehlen. Nur einmal beim ersten Render
  // (User darf nachher manuell wechseln, ohne dass wir ihn zurueckziehen).
  useEffect(() => {
    if (hasDiscoveryIntent()) {
      setMode("discovery");
    }
  }, []);

  return (
    <div>
      {/* Tab-Switcher — 3 Spalten, scrollbar auf engen Mobiles */}
      <div
        role="tablist"
        aria-label="Kaufoption"
        className="grid grid-cols-3 gap-0 mb-6 border border-on-primary/20"
      >
        <TabButton
          active={mode === "once"}
          onClick={() => setMode("once")}
          label="Einmalig"
        />
        <TabButton
          active={mode === "subscription"}
          onClick={() => setMode("subscription")}
          label="Abo"
          badge={`−${SUBSCRIPTION_DISCOUNT_PERCENT}%`}
        />
        <TabButton
          active={mode === "discovery"}
          onClick={() => setMode("discovery")}
          label="Discovery"
          badge={`−${SUBSCRIPTION_DISCOUNT_PERCENT}%`}
        />
      </div>

      {mode === "once" && (
        <AddToCartButton
          coffee_id={props.coffee_id}
          coffee_name={props.coffee_name}
          coffee_slug={props.coffee_slug}
          image_url={props.image_url}
          roaster_name={props.roaster_name}
          unit_price_chf_250g={props.unit_price_chf_250g}
        />
      )}
      {(mode === "subscription" || mode === "discovery") && (
        <SubscriptionConfigurator
          coffee_id={props.coffee_id}
          coffee_name={props.coffee_name}
          coffee_slug={props.coffee_slug}
          image_url={props.image_url}
          roaster_name={props.roaster_name}
          unit_price_chf_250g={props.unit_price_chf_250g}
          isDiscovery={mode === "discovery"}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  badge?: string;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      type="button"
      onClick={onClick}
      className={`relative py-3 px-2 font-headline text-[11px] uppercase tracking-widest transition-all whitespace-nowrap ${
        active
          ? "bg-tertiary text-primary font-bold"
          : "text-on-primary/70 hover:text-on-primary"
      }`}
    >
      {label}
      {badge && (
        <span
          className={`ml-2 font-headline text-[9px] font-bold ${
            active ? "text-primary/70" : "text-tertiary"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
