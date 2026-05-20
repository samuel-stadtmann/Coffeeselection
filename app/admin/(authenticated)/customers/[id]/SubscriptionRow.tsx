"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Sub = {
  id: string;
  status: string;
  interval_weeks: number;
  price_chf_per_delivery: number;
  discovery_mode: boolean;
  coffee_name: string;
  quantity: number;
  weight_g: number;
  last_delivery_at: string | null;
  last_delivery_coffee: string | null;
  created_at: string;
};

const INTERVALS = [1, 2, 4, 6, 8];
const WEIGHTS = [250, 500, 1000];

function fmtChf(n: number): string {
  return n.toLocaleString("de-CH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("de-CH");
}

const STATUS_PILLS: Record<string, string> = {
  active: "bg-tertiary/20 text-tertiary",
  paused: "bg-amber-100 text-amber-900",
  cancelled: "bg-stone-200 text-stone-700",
  past_due: "bg-rose-100 text-rose-900",
  pending: "bg-stone-100 text-stone-700",
};

export default function SubscriptionRow({ sub }: { sub: Sub }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [interval, setInterval] = useState<number>(sub.interval_weeks);
  const [quantity, setQuantity] = useState<number>(sub.quantity);
  const [weightG, setWeightG] = useState<number>(sub.weight_g);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const action = async (a: "pause" | "resume" | "cancel") => {
    if (busy) return;
    if (a === "cancel") {
      if (!confirm(`Abo wirklich kündigen? Stripe stoppt sofort.`)) return;
    }
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/admin/subscriptions/${sub.id}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: a }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => null)) as { error?: string };
      setMsg({ type: "err", text: j?.error ?? `HTTP ${res.status}` });
      return;
    }
    router.refresh();
  };

  const saveEdit = async () => {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/admin/subscriptions/${sub.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        interval_weeks: interval,
        quantity,
        weight_g: weightG,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => null)) as { error?: string };
      setMsg({ type: "err", text: j?.error ?? `HTTP ${res.status}` });
      return;
    }
    setEditing(false);
    setMsg({ type: "ok", text: "Gespeichert." });
    router.refresh();
  };

  const isCancelled = sub.status === "cancelled";
  const isPaused = sub.status === "paused";

  return (
    <div className="py-5">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className={`inline-block px-2 py-0.5 text-[9px] font-headline font-bold uppercase tracking-widest ${STATUS_PILLS[sub.status] ?? "bg-stone-200 text-stone-700"}`}
            >
              {sub.status}
            </span>
            <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold">
              {sub.discovery_mode ? "Discovery" : "Fix"}
            </span>
          </div>
          <h3 className="font-headline font-bold text-primary uppercase tracking-tight">
            {sub.coffee_name}
          </h3>
          <p className="text-xs text-on-surface-variant mt-1">
            {sub.quantity}× {sub.weight_g} g · alle {sub.interval_weeks} Woche
            {sub.interval_weeks === 1 ? "" : "n"} · CHF{" "}
            {fmtChf(sub.price_chf_per_delivery)} / Lieferung
          </p>
          <p className="text-[10px] text-on-surface-variant mt-1">
            Erstellt {fmtDate(sub.created_at)}
            {sub.last_delivery_at && (
              <>
                {" "}· Letzte Lieferung {fmtDate(sub.last_delivery_at)}
                {sub.last_delivery_coffee &&
                  ` (${sub.last_delivery_coffee})`}
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!isCancelled && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="bg-primary text-on-primary px-3 py-1.5 font-headline font-bold text-[10px] uppercase tracking-widest hover:bg-black transition-all"
            >
              Bearbeiten
            </button>
          )}
          {!isCancelled && !editing && (
            <>
              {isPaused ? (
                <button
                  onClick={() => action("resume")}
                  disabled={busy}
                  className="border border-tertiary text-tertiary px-3 py-1.5 font-headline font-bold text-[10px] uppercase tracking-widest hover:bg-tertiary hover:text-primary transition-all disabled:opacity-50"
                >
                  Fortsetzen
                </button>
              ) : (
                <button
                  onClick={() => action("pause")}
                  disabled={busy}
                  className="border border-amber-500 text-amber-700 px-3 py-1.5 font-headline font-bold text-[10px] uppercase tracking-widest hover:bg-amber-50 transition-all disabled:opacity-50"
                >
                  Pausieren
                </button>
              )}
              <button
                onClick={() => action("cancel")}
                disabled={busy}
                className="border border-rose-400 text-rose-700 px-3 py-1.5 font-headline font-bold text-[10px] uppercase tracking-widest hover:bg-rose-50 transition-all disabled:opacity-50"
              >
                Kündigen
              </button>
            </>
          )}
        </div>
      </div>

      {editing && (
        <div className="mt-4 bg-surface-container-low p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1">
              Intervall (Wochen)
            </label>
            <select
              value={interval}
              onChange={(e) => setInterval(Number(e.target.value))}
              className="w-full bg-white border border-primary/10 px-3 py-2 text-sm focus:outline-none focus:border-tertiary"
            >
              {INTERVALS.map((w) => (
                <option key={w} value={w}>
                  Alle {w} Wochen
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1">
              Menge pro Lieferung
            </label>
            <select
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full bg-white border border-primary/10 px-3 py-2 text-sm focus:outline-none focus:border-tertiary"
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}× Beutel
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1">
              Gewicht je Beutel
            </label>
            <select
              value={weightG}
              onChange={(e) => setWeightG(Number(e.target.value))}
              className="w-full bg-white border border-primary/10 px-3 py-2 text-sm focus:outline-none focus:border-tertiary"
            >
              {WEIGHTS.map((g) => (
                <option key={g} value={g}>
                  {g} g
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3 flex gap-2 mt-2">
            <button
              onClick={saveEdit}
              disabled={busy}
              className="bg-primary text-on-primary px-5 py-2 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
            >
              Speichern
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setInterval(sub.interval_weeks);
                setQuantity(sub.quantity);
                setWeightG(sub.weight_g);
              }}
              className="border border-primary/30 text-primary px-5 py-2 font-headline font-bold text-xs uppercase tracking-widest hover:bg-primary/5"
            >
              Abbrechen
            </button>
            <p className="text-[10px] text-on-surface-variant flex-1 leading-snug self-center">
              Hinweis: Änderung wirkt nur auf zukünftige Renewals.
              Stripe-Subscription wird nicht umgebogen (anderes Preis-Schema).
            </p>
          </div>
        </div>
      )}

      {msg && (
        <div
          className={`mt-3 px-3 py-2 text-xs border-l-4 ${
            msg.type === "ok"
              ? "bg-tertiary/10 border-tertiary text-primary"
              : "bg-rose-50 border-rose-400 text-rose-900"
          }`}
        >
          {msg.text}
        </div>
      )}
    </div>
  );
}
