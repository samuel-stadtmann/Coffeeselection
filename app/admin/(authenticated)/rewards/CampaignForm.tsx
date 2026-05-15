"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const CHANNELS = ["email", "instagram", "facebook", "partnership", "print", "other"];

export default function CampaignForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      code: String(fd.get("code") ?? "").toUpperCase().trim(),
      name: String(fd.get("name") ?? "").trim(),
      description: String(fd.get("description") ?? "").trim() || null,
      credit_chf: Number(fd.get("credit_chf")),
      max_uses_per_customer: Number(fd.get("max_uses_per_customer") || 1),
      max_total_uses: fd.get("max_total_uses")
        ? Number(fd.get("max_total_uses"))
        : null,
      valid_until: String(fd.get("valid_until") ?? "") || null,
      channel: String(fd.get("channel") ?? "") || null,
      notes: String(fd.get("notes") ?? "").trim() || null,
    };
    const res = await fetch("/api/admin/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await res.json();
    if (!res.ok) {
      setError(j.error ?? "Fehler");
      setSubmitting(false);
      return;
    }
    (e.target as HTMLFormElement).reset();
    setSubmitting(false);
    router.refresh();
  };

  const inputCls =
    "w-full bg-surface-container-low border border-surface-container px-3 py-2 text-sm focus:outline-none focus:border-tertiary";
  const labelCls =
    "font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1";

  return (
    <form onSubmit={handle} className="space-y-4">
      <div>
        <label className={labelCls}>Code *</label>
        <input
          name="code"
          required
          placeholder="WELCOME10"
          className={inputCls}
          maxLength={32}
        />
      </div>
      <div>
        <label className={labelCls}>Name *</label>
        <input name="name" required placeholder="Newsletter Q2" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Beschreibung</label>
        <input name="description" placeholder="optional" className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>CHF Reward *</label>
          <input
            name="credit_chf"
            type="number"
            step="0.50"
            min="0.50"
            required
            placeholder="10.00"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Max / Kunde</label>
          <input
            name="max_uses_per_customer"
            type="number"
            min="1"
            defaultValue="1"
            className={inputCls}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Max gesamt</label>
          <input
            name="max_total_uses"
            type="number"
            min="1"
            placeholder="leer = unbegrenzt"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Gültig bis</label>
          <input name="valid_until" type="date" className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Channel</label>
        <select name="channel" className={inputCls}>
          <option value="">—</option>
          {CHANNELS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelCls}>Interne Notiz</label>
        <textarea name="notes" rows={2} className={inputCls} />
      </div>
      {error && (
        <p className="text-xs text-red-600 font-headline uppercase tracking-widest">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-primary text-on-primary py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all disabled:opacity-60"
      >
        {submitting ? "…" : "Kampagne anlegen"}
      </button>
    </form>
  );
}
