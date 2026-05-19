"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Initial = {
  first_name: string;
  last_name: string;
  phone: string;
  language: string;
  marketing_opt_in: boolean;
  notify_shipping: boolean;
  notify_recommendations: boolean;
};

export default function CustomerEditForm({
  customerId,
  initial,
}: {
  customerId: string;
  initial: Initial;
}) {
  const router = useRouter();
  const [f, setF] = useState<Initial>(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setMsg(null);
    const res = await fetch(`/api/admin/customers/${customerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    setSaving(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => null)) as { error?: string };
      setMsg({ type: "err", text: j?.error ?? `HTTP ${res.status}` });
      return;
    }
    setMsg({ type: "ok", text: "Gespeichert." });
    router.refresh();
  };

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Vorname">
          <input
            value={f.first_name}
            onChange={(e) => setF({ ...f, first_name: e.target.value })}
            className="form-input"
          />
        </Field>
        <Field label="Nachname">
          <input
            value={f.last_name}
            onChange={(e) => setF({ ...f, last_name: e.target.value })}
            className="form-input"
          />
        </Field>
        <Field label="Telefon">
          <input
            value={f.phone}
            onChange={(e) => setF({ ...f, phone: e.target.value })}
            className="form-input"
          />
        </Field>
        <Field label="Sprache">
          <select
            value={f.language}
            onChange={(e) => setF({ ...f, language: e.target.value })}
            className="form-input"
          >
            <option value="de-CH">Deutsch (CH)</option>
            <option value="fr-CH">Französisch (CH)</option>
            <option value="it-CH">Italienisch (CH)</option>
            <option value="en">Englisch</option>
          </select>
        </Field>
      </div>
      <div className="space-y-2">
        <Toggle
          checked={f.marketing_opt_in}
          onChange={(v) => setF({ ...f, marketing_opt_in: v })}
          label="Newsletter (marketing_opt_in)"
        />
        <Toggle
          checked={f.notify_shipping}
          onChange={(v) => setF({ ...f, notify_shipping: v })}
          label="Liefer-Updates"
        />
        <Toggle
          checked={f.notify_recommendations}
          onChange={(v) => setF({ ...f, notify_recommendations: v })}
          label="Neue Empfehlungen"
        />
      </div>
      {msg && (
        <div
          className={`px-4 py-3 text-sm border-l-4 ${
            msg.type === "ok"
              ? "bg-tertiary/10 border-tertiary text-primary"
              : "bg-rose-50 border-rose-400 text-rose-900"
          }`}
        >
          {msg.text}
        </div>
      )}
      <button
        type="submit"
        disabled={saving}
        className="bg-primary text-on-primary px-6 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
      >
        {saving ? "Wird gespeichert…" : "Speichern"}
      </button>
      <style jsx>{`
        :global(.form-input) {
          width: 100%;
          background-color: white;
          border: 1px solid rgb(0 0 0 / 0.1);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
        :global(.form-input:focus) {
          outline: none;
          border-color: rgb(180 83 9 / 0.6);
        }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-2">
        {label}
      </span>
      {children}
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4"
      />
      <span>{label}</span>
    </label>
  );
}
