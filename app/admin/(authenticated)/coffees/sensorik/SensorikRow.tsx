"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Axis = "acidity" | "body" | "sweetness" | "bitterness" | "complexity";

const AXES: { key: Axis; label: string }[] = [
  { key: "acidity", label: "Säure" },
  { key: "body", label: "Körper" },
  { key: "sweetness", label: "Süße" },
  { key: "bitterness", label: "Bitterkeit" },
  { key: "complexity", label: "Komplexität" },
];

type Props = {
  id: string;
  name: string;
  slug: string;
  roasterName: string;
  // Existing SCA 1-5 values (or null) — fuer Vorbelegung *2 -> 1-10 (Approximation)
  initial: Record<Axis, number | null>;
};

export default function SensorikRow({ id, name, slug, roasterName, initial }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<Record<Axis, number>>({
    // SCA 1-5 -> Cupping 1-10 grob *2; null -> 6 (Mitte) als Startwert
    acidity: initial.acidity != null ? initial.acidity * 2 : 6,
    body: initial.body != null ? initial.body * 2 : 6,
    sweetness: initial.sweetness != null ? initial.sweetness * 2 : 6,
    bitterness: initial.bitterness != null ? initial.bitterness * 2 : 6,
    complexity: initial.complexity != null ? initial.complexity * 2 : 6,
  });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/coffees/${id}/sensorik`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => null);
      setError(j?.details ?? j?.error ?? "Fehler");
      return;
    }
    setDone(true);
    // Nach kurzer Pause refresh, damit die Zeile aus der Liste verschwindet
    setTimeout(() => router.refresh(), 800);
  };

  return (
    <div className="py-5">
      <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
        <div>
          <h3 className="font-headline font-bold text-primary uppercase tracking-tight">
            {name}
          </h3>
          <p className="text-xs text-on-surface-variant">{roasterName}</p>
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
        {AXES.map((ax) => (
          <label key={ax.key} className="text-sm">
            <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1">
              {ax.label}
            </span>
            <input
              type="number"
              min={1}
              max={10}
              step={1}
              value={values[ax.key]}
              onChange={(e) => {
                const n = Number(e.target.value);
                setValues({
                  ...values,
                  [ax.key]: Math.max(1, Math.min(10, Math.round(n))),
                });
              }}
              className="w-full bg-surface-container-low border border-surface-container px-3 py-2 text-base font-bold text-center focus:outline-none focus:border-tertiary"
            />
            <span className="text-[10px] text-on-surface-variant block mt-1">
              SCA {Math.max(1, Math.min(5, Math.ceil(values[ax.key] / 2)))} / 5
            </span>
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={save}
          disabled={saving || done}
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
