"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart, type CartWeight } from "@/lib/cart";
import { SUBSCRIPTION_DISCOUNT_PERCENT } from "@/lib/subscription-constants";
import type { CoffeeWithDetails } from "@/lib/db/coffees";

const COFFEE_FALLBACK_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC-mgzdszeDV-ADPnt08LksEtq5jHo_pZiXrnzVNy7faF7CAvNwCIqw0tZ2ylgRbHNuI-cdksgJ49bjfH36AYZerX9qRPq7kE2svCJ2KsLCMhI2k4Dc50D2D5FEGms1FJKDbeS75aSghLNY7Dop_dxhV5e-766gOscbYVVzn4qpX1rtPcumcDu7hr6OQeoiBzbRrze7HIkmFAM9YOYzQFzRF1wR3U1Ec53bS5Aj9xRlWvn7KxLIHJL79Wy6T8BFR47-ulGO1PjIJKEL";

const ROAST_LABEL: Record<string, string> = {
  light: "Hell",
  medium_light: "Mittel-hell",
  medium: "Mittel",
  medium_dark: "Mittel-dunkel",
  dark: "Dunkel",
};
const ROAST_ORDER = ["light", "medium_light", "medium", "medium_dark", "dark"];

// Umgangssprachliche Bruehmethoden-Bezeichnungen. Wenn ein Slug nicht
// im Map ist, faellt prettyLabel() ein (Capitalized).
const BREWING_LABEL: Record<string, string> = {
  v60: "Hand-Filter (V60)",
  filter: "Filtermaschine",
  espresso: "Siebträger",
  fully_auto: "Vollautomat",
  french_press: "French Press",
  aeropress: "AeroPress",
  chemex: "Chemex",
  moka: "Espressokocher (Bialetti)",
  kalita: "Hand-Filter (Kalita)",
  whole_bean: "Vollbohne",
};

function prettyLabel(slug: string): string {
  return slug
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const PROMO_INTERVAL = 2;

type Filters = {
  brewing: Set<string>;
  roast: Set<string>;
  flavor: Set<string>;
};

export default function CoffeeShopView({ coffees }: { coffees: CoffeeWithDetails[] }) {
  const router = useRouter();
  const { add, addSubscription } = useCart();
  const [busy, setBusy] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    brewing: new Set(),
    roast: new Set(),
    flavor: new Set(),
  });

  const { brewingOpts, roastOpts, flavorOpts } = useMemo(() => {
    const b = new Set<string>();
    const r = new Set<string>();
    const f = new Set<string>();
    for (const c of coffees) {
      c.recommended_brewing_slugs?.forEach((s) => b.add(s));
      if (c.roast_level) r.add(c.roast_level);
      c.flavor_slugs?.forEach((s) => f.add(s));
    }
    return {
      brewingOpts: Array.from(b).sort(),
      roastOpts: Array.from(r).sort(
        (x, y) => ROAST_ORDER.indexOf(x) - ROAST_ORDER.indexOf(y)
      ),
      flavorOpts: Array.from(f).sort(),
    };
  }, [coffees]);

  const filtered = useMemo(() => {
    return coffees.filter((c) => {
      if (filters.brewing.size > 0) {
        const cs = c.recommended_brewing_slugs ?? [];
        if (!Array.from(filters.brewing).some((b) => cs.includes(b))) return false;
      }
      if (filters.roast.size > 0) {
        if (!c.roast_level || !filters.roast.has(c.roast_level)) return false;
      }
      if (filters.flavor.size > 0) {
        const fs = c.flavor_slugs ?? [];
        if (!Array.from(filters.flavor).some((f) => fs.includes(f))) return false;
      }
      return true;
    });
  }, [coffees, filters]);

  const toggle = (group: keyof Filters, value: string) => {
    setFilters((prev) => {
      const next = new Set(prev[group]);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { ...prev, [group]: next };
    });
  };

  const reset = () => setFilters({ brewing: new Set(), roast: new Set(), flavor: new Set() });
  const activeCount = filters.brewing.size + filters.roast.size + filters.flavor.size;

  const handleOnce = (c: CoffeeWithDetails) => {
    if (busy) return;
    setBusy(c.id);
    add({
      coffee_id: c.id,
      coffee_name: c.name,
      coffee_slug: c.slug,
      image_url: c.image_url,
      roaster_name: c.roaster_name,
      unit_price_chf_250g: priceFor250g(c),
      weight_g: 250 as CartWeight,
      quantity: 1,
    });
    setTimeout(() => router.push("/checkout/cart"), 200);
  };
  const handleAbo = (c: CoffeeWithDetails) => {
    if (busy) return;
    setBusy(c.id);
    addSubscription({
      coffee_id: c.id,
      coffee_name: c.name,
      coffee_slug: c.slug,
      image_url: c.image_url,
      roaster_name: c.roaster_name,
      unit_price_chf_250g: priceFor250g(c),
      weight_g: 250 as CartWeight,
      quantity: 1,
      interval_weeks: PROMO_INTERVAL,
    });
    setTimeout(() => router.push("/checkout/cart"), 200);
  };

  return (
    <>
      {/* Filter-Bar — drei Dropdowns + Reset + Counter */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 mb-10">
        <div className="bg-white p-4 md:p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <FilterDropdown
              title="Zubereitung"
              options={brewingOpts}
              selected={filters.brewing}
              labelFor={(s) => BREWING_LABEL[s] ?? prettyLabel(s)}
              onToggle={(v) => toggle("brewing", v)}
              onClear={() =>
                setFilters((p) => ({ ...p, brewing: new Set() }))
              }
            />
            <FilterDropdown
              title="Röstung"
              options={roastOpts}
              selected={filters.roast}
              labelFor={(s) => ROAST_LABEL[s] ?? prettyLabel(s)}
              onToggle={(v) => toggle("roast", v)}
              onClear={() => setFilters((p) => ({ ...p, roast: new Set() }))}
            />
            <FilterDropdown
              title="Geschmack"
              options={flavorOpts}
              selected={filters.flavor}
              labelFor={prettyLabel}
              onToggle={(v) => toggle("flavor", v)}
              onClear={() => setFilters((p) => ({ ...p, flavor: new Set() }))}
            />
            <span className="font-headline text-[11px] uppercase tracking-widest text-on-surface-variant font-bold ml-auto">
              {filtered.length} {filtered.length === 1 ? "Coffee" : "Coffees"}
              {activeCount > 0 && ` · ${activeCount} Filter`}
            </span>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={reset}
                className="font-headline text-[11px] uppercase tracking-widest text-tertiary hover:text-primary transition-colors font-bold"
              >
                Zurücksetzen
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Coffees Grid */}
      <section className="bg-surface-container-low py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          {filtered.length === 0 ? (
            <div className="bg-white p-8 text-center shadow-sm">
              <p className="text-on-surface-variant">
                Mit dieser Auswahl gibt's gerade keinen passenden Coffee. Filter anpassen oder zurücksetzen.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((c) => {
                const unit250 = priceFor250g(c);
                return (
                  <article
                    key={c.id}
                    className="bg-white shadow-sm hover:shadow-xl transition-all flex flex-col"
                  >
                    <Link href={`/coffee/${c.slug}`} className="block group">
                      <div className="aspect-[4/3] overflow-hidden">
                        <img
                          src={c.image_url || COFFEE_FALLBACK_IMG}
                          alt={c.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                    </Link>
                    <div className="p-6 flex-1 flex flex-col">
                      <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold mb-1">
                        {c.origin_name_de ?? "Specialty"}
                      </span>
                      <Link href={`/coffee/${c.slug}`}>
                        <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-base mb-1 hover:text-tertiary transition-colors">
                          {c.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-on-surface-variant mb-3">{c.roaster_name}</p>
                      {(c.tasting_summary || c.short_description) && (
                        <p className="text-xs text-on-surface-variant mb-4 flex-1">
                          {c.tasting_summary || c.short_description}
                        </p>
                      )}
                      <div className="flex justify-between items-center pt-3 border-t border-surface-container">
                        <span className="font-headline font-bold text-primary text-lg">
                          CHF {unit250.toFixed(2)}
                        </span>
                        <span className="font-headline text-[9px] uppercase tracking-widest text-on-surface-variant">
                          pro 250g
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 border-t border-primary/10">
                      <button
                        onClick={() => handleOnce(c)}
                        disabled={busy === c.id}
                        className="text-center py-3.5 font-headline text-[10px] uppercase tracking-widest text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors font-bold disabled:opacity-60"
                      >
                        {busy === c.id ? "…" : "Einmal kaufen"}
                      </button>
                      <button
                        onClick={() => handleAbo(c)}
                        disabled={busy === c.id}
                        className="text-center py-3.5 font-headline text-[10px] uppercase tracking-widest bg-primary text-on-primary hover:bg-black transition-colors font-bold disabled:opacity-60"
                      >
                        {busy === c.id ? "…" : `Abo · −${SUBSCRIPTION_DISCOUNT_PERCENT}%`}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function priceFor250g(c: CoffeeWithDetails): number {
  if (!c.weight_g || c.weight_g <= 0) return Number(c.price_chf);
  return Number(((Number(c.price_chf) * 250) / c.weight_g).toFixed(2));
}

function FilterDropdown({
  title,
  options,
  selected,
  labelFor,
  onToggle,
  onClear,
}: {
  title: string;
  options: string[];
  selected: Set<string>;
  labelFor: (s: string) => string;
  onToggle: (v: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Outside-Click und Esc schliessen das Panel.
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  if (options.length === 0) return null;
  const count = selected.size;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex items-center gap-2 px-4 py-2.5 font-headline text-[11px] uppercase tracking-widest font-bold border transition-colors ${
          count > 0
            ? "bg-primary text-on-primary border-primary"
            : "bg-white text-primary border-surface-container hover:border-tertiary"
        }`}
      >
        {title}
        {count > 0 && (
          <span
            className={`px-1.5 py-0.5 text-[9px] ${
              count > 0 ? "bg-tertiary text-on-primary" : ""
            }`}
          >
            {count}
          </span>
        )}
        <span className={`material-symbols-outlined text-base transition-transform ${open ? "rotate-180" : ""}`}>
          expand_more
        </span>
      </button>
      {open && (
        <div className="absolute z-30 top-full mt-2 left-0 min-w-[240px] bg-white shadow-xl border border-surface-container p-3">
          <div className="max-h-72 overflow-y-auto">
            {options.map((opt) => {
              const active = selected.has(opt);
              return (
                <label
                  key={opt}
                  className="flex items-center gap-3 px-2 py-2 hover:bg-surface-container-low cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => onToggle(opt)}
                    className="w-4 h-4 accent-tertiary"
                  />
                  <span className="text-sm text-primary">{labelFor(opt)}</span>
                </label>
              );
            })}
          </div>
          {count > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="block w-full mt-2 pt-2 border-t border-surface-container text-center font-headline text-[10px] uppercase tracking-widest text-tertiary hover:text-primary transition-colors font-bold"
            >
              Auswahl leeren
            </button>
          )}
        </div>
      )}
    </div>
  );
}
