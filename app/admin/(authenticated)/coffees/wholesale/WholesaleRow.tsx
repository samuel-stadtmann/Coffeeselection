"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  id: string;
  name: string;
  slug: string;
  roasterName: string;
  priceChf: number;
  weightG: number;
  initialWholesaleChf: number | null;
};

export default function WholesaleRow({
  id,
  name,
  slug,
  roasterName,
  priceChf,
  weightG,
  initialWholesaleChf,
}: Props) {
  const router = useRouter();
  const [value, setValue] = useState<string>(
    initialWholesaleChf == null ? "" : initialWholesaleChf.toFixed(2)
  );
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wholesaleNum = value === "" ? null : Number(value);
  const validNumber =
    wholesaleNum != null &&
    Number.isFinite(wholesaleNum) &&
    wholesaleNum >= 0;
  const margin =
    validNumber && wholesaleNum != null
      ? Number((priceChf - wholesaleNum).toFixed(2))
      : null;
  const marginPct =
    margin != null && priceChf > 0
      ? Math.round((margin / priceChf) * 100)
      : null;

  const save = async () => {
    if (saving || !validNumber) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/coffees/${id}/wholesale`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wholesale_price_chf: wholesaleNum }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => null);
      setError(j?.details ?? j?.error ?? "Fehler");
      return;
    }
    setDone(true);
    setTimeout(() => router.refresh(), 800);
  };

  return (
    <div className="py-5">
      <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
        <div>
          <h3 className="font-headline font-bold text-primary uppercase tracking-tight">
            {name}
          </h3>
          <p className="text-xs text-on-surface-variant">
            {roasterName} · {weightG} g · VK CHF {priceChf.toFixed(2)}
          </p>
        </div>
        <a
          href={`/coffee/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-headline text-[10px] uppercase tracking-widest text-tertiary hover:text-primary transition-colors"
        >
          Live ansehen →
        </a>
      </div>
      <div className="flex items-end gap-4 flex-wrap">
        <label className="text-sm">
          <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1">
            Einkaufspreis CHF
          </span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="14.50"
            className="w-32 bg-surface-container-low border border-surface-container px-3 py-2 text-base font-bold text-center focus:outline-none focus:border-tertiary"
          />
        </label>
        <div className="text-sm">
          <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1">
            Marge
          </span>
          <span
            className={`font-headline font-bold ${
              margin == null
                ? "text-on-surface-variant"
                : margin >= 0
                  ? "text-tertiary"
                  : "text-rose-600"
            }`}
          >
            {margin == null
              ? "—"
              : `CHF ${margin.toFixed(2)} (${marginPct}%)`}
          </span>
        </div>
        <button
          onClick={save}
          disabled={saving || done || !validNumber}
          className="bg-primary text-on-primary px-5 py-2 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all disabled:opacity-60"
        >
          {done ? "✓ Gespeichert" : saving ? "…" : "Speichern"}
        </button>
        {error && (
          <span className="text-xs text-red-600 font-headline uppercase tracking-widest">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
