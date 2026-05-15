"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart, type CartWeight } from "@/lib/cart";
import type { OrderRow } from "./page";

const filters = [
  { id: "all", label: "Alle" },
  { id: "subscription", label: "Abo" },
  { id: "once", label: "Einmalig" },
  { id: "unrated", label: "Unbewertet" },
];

export default function OrderHistoryView({ orders }: { orders: OrderRow[] }) {
  const [filter, setFilter] = useState("all");
  const router = useRouter();
  const { add } = useCart();
  const [reordering, setReordering] = useState<string | null>(null);

  const filtered = orders.filter((o) => {
    if (filter === "subscription") return o.type === "Abo";
    if (filter === "once") return o.type === "Einmalig";
    if (filter === "unrated") return !o.rated;
    return true;
  });

  const handleReorder = (order: OrderRow) => {
    if (reordering) return;
    setReordering(order.id);
    // Identische Konfiguration: alle Items als Einmalkauf mit Original-Gewicht,
    // Menge und Mahlgrad ins Cart legen. Abo-Reorder ist bewusst nicht
    // automatisch — Kunde landet im Cart und kann dort wieder Abo waehlen.
    for (const it of order.items) {
      if (!it.coffee_slug) continue; // Coffee aus Sortiment entfernt → skip
      add({
        coffee_id: it.coffee_id,
        coffee_name: it.coffee_name,
        coffee_slug: it.coffee_slug,
        image_url: it.image_url,
        roaster_name: it.roaster_name,
        unit_price_chf_250g: it.unit_price_chf_250g,
        weight_g: it.weight_g as CartWeight,
        quantity: it.quantity,
        grind_preference: it.grind_preference,
      });
    }
    setTimeout(() => router.push("/checkout/cart"), 200);
  };

  if (orders.length === 0) {
    return (
      <div className="bg-white p-8 md:p-12 text-center shadow-sm">
        <p className="text-on-surface-variant mb-6">
          Du hast noch keine Bestellungen. Sobald du eine aufgegeben hast, erscheint sie hier.
        </p>
        <Link
          href="/coffee"
          className="inline-block bg-primary text-on-primary px-6 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all"
        >
          Kaffees entdecken
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 md:p-8 shadow-sm">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-surface-container">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 font-headline text-[11px] uppercase tracking-widest font-bold transition-all ${
              filter === f.id
                ? "bg-primary text-on-primary"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-sm text-on-surface-variant self-center">
          {filtered.length} {filtered.length === 1 ? "Bestellung" : "Bestellungen"}
        </span>
      </div>

      <div className="divide-y divide-surface-container">
        {filtered.map((o) => (
          <div key={o.id} className="py-5 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 md:gap-6 items-start">
              <div>
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold">
                    {o.date}
                  </span>
                  <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant">
                    {o.order_number}
                  </span>
                  <span
                    className={`font-headline text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 ${
                      o.type === "Abo"
                        ? "bg-tertiary/15 text-tertiary"
                        : "bg-surface-container text-on-surface-variant"
                    }`}
                  >
                    {o.type}
                  </span>
                  <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant">
                    {o.status}
                  </span>
                </div>
                <ul className="mt-1 space-y-0.5">
                  {o.items.map((it, i) => (
                    <li key={i} className="text-sm">
                      <span className="font-headline font-bold text-primary uppercase tracking-tight">
                        {it.coffee_name}
                      </span>
                      <span className="text-on-surface-variant">
                        {" "}
                        · {it.roaster_name} · {it.weight_g}g × {it.quantity}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col items-start md:items-end gap-2">
                <span className="font-headline font-bold text-primary">
                  CHF {o.total.toFixed(2)}
                </span>
                <div className="flex gap-2 flex-wrap">
                  {!o.rated && (
                    <Link
                      href={`/account/rate/${o.id}`}
                      className="font-headline text-[10px] uppercase tracking-widest text-tertiary hover:text-primary transition-colors px-3 py-1 border border-tertiary"
                    >
                      Bewerten
                    </Link>
                  )}
                  <button
                    onClick={() => handleReorder(o)}
                    disabled={reordering === o.id || o.items.every((i) => !i.coffee_slug)}
                    className="font-headline text-[10px] uppercase tracking-widest text-on-primary bg-primary hover:bg-black transition-colors px-3 py-1 disabled:opacity-50"
                  >
                    {reordering === o.id ? "…" : "Wiederbestellen"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
