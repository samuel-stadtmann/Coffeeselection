"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  categories: Record<string, string>;
};

const TODAY = () => new Date().toISOString().slice(0, 10);

export default function MarketingForm({ categories }: Props) {
  const router = useRouter();
  const [category, setCategory] = useState<string>("social_media");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [spent, setSpent] = useState("");
  const [startsAt, setStartsAt] = useState(TODAY());
  const [endsAt, setEndsAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/marketing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category,
        name: name.trim(),
        description: description.trim() || null,
        budget_chf: Number(budget),
        spent_chf: Number(spent || 0),
        starts_at: startsAt,
        ends_at: endsAt || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => null)) as { error?: string; details?: unknown };
      setError(
        typeof j?.details === "string"
          ? j.details
          : j?.error ?? `HTTP ${res.status}`
      );
      return;
    }
    setName("");
    setDescription("");
    setBudget("");
    setSpent("");
    setEndsAt("");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1">
          Kanal
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full bg-surface-container px-3 py-2 text-sm focus:outline-none focus:border-tertiary border border-surface-container"
        >
          {Object.entries(categories).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1">
          Name
        </label>
        <input
          required
          minLength={2}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z.B. Instagram-Promo April"
          className="w-full bg-surface-container px-3 py-2 text-sm focus:outline-none focus:border-tertiary border border-surface-container"
        />
      </div>
      <div>
        <label className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1">
          Beschreibung (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full bg-surface-container px-3 py-2 text-sm focus:outline-none focus:border-tertiary border border-surface-container"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1">
            Budget CHF
          </label>
          <input
            required
            type="number"
            step="0.01"
            min={0}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="w-full bg-surface-container px-3 py-2 text-sm focus:outline-none focus:border-tertiary border border-surface-container"
          />
        </div>
        <div>
          <label className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1">
            Bereits ausgegeben
          </label>
          <input
            type="number"
            step="0.01"
            min={0}
            value={spent}
            onChange={(e) => setSpent(e.target.value)}
            placeholder="0.00"
            className="w-full bg-surface-container px-3 py-2 text-sm focus:outline-none focus:border-tertiary border border-surface-container"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1">
            Start
          </label>
          <input
            required
            type="date"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="w-full bg-surface-container px-3 py-2 text-sm focus:outline-none focus:border-tertiary border border-surface-container"
          />
        </div>
        <div>
          <label className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1">
            Ende (optional)
          </label>
          <input
            type="date"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="w-full bg-surface-container px-3 py-2 text-sm focus:outline-none focus:border-tertiary border border-surface-container"
          />
        </div>
      </div>
      {error && (
        <p className="text-xs text-rose-700 bg-rose-50 border-l-4 border-rose-400 p-3">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={saving}
        className="w-full bg-primary text-on-primary py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
      >
        {saving ? "Wird gespeichert…" : "Aktivität anlegen"}
      </button>
    </form>
  );
}
