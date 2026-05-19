"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Spend = {
  id: string;
  category: string;
  categoryLabel: string;
  name: string;
  description: string | null;
  budget_chf: number;
  spent_chf: number;
  starts_at: string;
  ends_at: string | null;
};

export default function MarketingRow({ spend }: { spend: Spend }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [spent, setSpent] = useState(spend.spent_chf.toFixed(2));
  const [busy, setBusy] = useState(false);

  const saveSpent = async () => {
    if (busy) return;
    setBusy(true);
    await fetch(`/api/admin/marketing/${spend.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spent_chf: Number(spent) }),
    });
    setBusy(false);
    setEditing(false);
    router.refresh();
  };

  const remove = async () => {
    if (!confirm(`Aktivität "${spend.name}" wirklich löschen?`)) return;
    setBusy(true);
    await fetch(`/api/admin/marketing/${spend.id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  };

  const overspent = Number(spent) > spend.budget_chf;
  const pct = spend.budget_chf > 0
    ? Math.min(100, Math.round((Number(spent) / spend.budget_chf) * 100))
    : 0;

  return (
    <div className="py-5 flex flex-col md:flex-row gap-4 md:items-start">
      <div className="flex-1 min-w-0">
        <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold block mb-1">
          {spend.categoryLabel}
        </span>
        <h3 className="font-headline font-bold text-primary uppercase tracking-tight">
          {spend.name}
        </h3>
        {spend.description && (
          <p className="text-xs text-on-surface-variant mt-1">
            {spend.description}
          </p>
        )}
        <p className="text-[10px] text-on-surface-variant mt-1">
          {new Date(spend.starts_at).toLocaleDateString("de-CH")}
          {spend.ends_at &&
            ` – ${new Date(spend.ends_at).toLocaleDateString("de-CH")}`}
        </p>
      </div>
      <div className="md:w-48 shrink-0">
        <div className="flex justify-between mb-1 text-[10px] font-headline uppercase tracking-widest font-bold">
          <span className="text-on-surface-variant">
            CHF {Number(spent).toFixed(2)}
          </span>
          <span className="text-on-surface-variant">
            / {spend.budget_chf.toFixed(2)}
          </span>
        </div>
        <div className="h-1.5 bg-surface-container">
          <div
            className={`h-full ${overspent ? "bg-rose-500" : "bg-tertiary"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {!editing ? (
          <div className="flex gap-2 mt-2 justify-end">
            <button
              onClick={() => setEditing(true)}
              className="font-headline text-[10px] uppercase tracking-widest text-tertiary hover:text-primary"
            >
              Update
            </button>
            <button
              onClick={remove}
              disabled={busy}
              className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-rose-700"
            >
              Löschen
            </button>
          </div>
        ) : (
          <div className="flex gap-2 mt-2">
            <input
              type="number"
              step="0.01"
              min={0}
              value={spent}
              onChange={(e) => setSpent(e.target.value)}
              className="flex-1 bg-surface-container px-2 py-1 text-xs focus:outline-none focus:border-tertiary border border-surface-container"
            />
            <button
              onClick={saveSpent}
              disabled={busy}
              className="bg-primary text-on-primary px-3 py-1 font-headline text-[10px] uppercase tracking-widest font-bold disabled:opacity-50"
            >
              OK
            </button>
            <button
              onClick={() => {
                setSpent(spend.spent_chf.toFixed(2));
                setEditing(false);
              }}
              className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant"
            >
              Abbr.
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
