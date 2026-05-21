"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Payout = {
  bank_account_holder: string;
  iban: string;
  bic: string;
  bank_name: string;
  payout_method: string;
  payout_currency: string;
  payout_threshold_chf: number;
  commission_pct: number | null;
  contract_start_on: string;
  contract_end_on: string;
  contract_notes: string;
};

export default function RoasterPayoutForm({
  roasterId,
  initial,
}: {
  roasterId: string;
  initial: Payout;
}) {
  const router = useRouter();
  const [p, setP] = useState<Payout>(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setMsg(null);
    const res = await fetch(`/api/admin/roasters/${roasterId}/payout`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bank_account_holder: p.bank_account_holder.trim() || null,
        iban: p.iban.replace(/\s+/g, "").toUpperCase() || null,
        bic: p.bic.trim() || null,
        bank_name: p.bank_name.trim() || null,
        payout_method: p.payout_method,
        payout_currency: p.payout_currency.trim().toUpperCase() || "CHF",
        payout_threshold_chf: Number(p.payout_threshold_chf || 0),
        commission_pct:
          p.commission_pct === null || Number.isNaN(p.commission_pct)
            ? null
            : Number(p.commission_pct),
        contract_start_on: p.contract_start_on || null,
        contract_end_on: p.contract_end_on || null,
        contract_notes: p.contract_notes.trim() || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => null)) as { error?: string; details?: string };
      setMsg({ type: "err", text: j?.details ?? j?.error ?? `HTTP ${res.status}` });
      return;
    }
    setMsg({ type: "ok", text: "Auszahlungs-Daten gespeichert." });
    router.refresh();
  };

  return (
    <form onSubmit={save} className="bg-white p-6 md:p-8 shadow-sm space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Konto-Inhaber">
          <input
            value={p.bank_account_holder}
            onChange={(e) => setP({ ...p, bank_account_holder: e.target.value })}
            className="form-input"
            placeholder="z.B. MAME Specialty Coffee AG"
          />
        </Field>
        <Field label="Bank-Name">
          <input
            value={p.bank_name}
            onChange={(e) => setP({ ...p, bank_name: e.target.value })}
            className="form-input"
            placeholder="z.B. ZKB"
          />
        </Field>
        <Field label="IBAN" hint="Ohne Leerzeichen, z.B. CH9300762011623852957">
          <input
            value={p.iban}
            onChange={(e) => setP({ ...p, iban: e.target.value })}
            className="form-input font-mono"
            placeholder="CH.."
          />
        </Field>
        <Field label="BIC (bei Auslandsbank)">
          <input
            value={p.bic}
            onChange={(e) => setP({ ...p, bic: e.target.value })}
            className="form-input font-mono"
          />
        </Field>
        <Field label="Auszahlungs-Methode">
          <select
            value={p.payout_method}
            onChange={(e) => setP({ ...p, payout_method: e.target.value })}
            className="form-input"
          >
            <option value="bank_transfer">Banküberweisung</option>
            <option value="twint">TWINT</option>
            <option value="manual">Manuell</option>
            <option value="none">Keine</option>
          </select>
        </Field>
        <Field label="Währung">
          <input
            value={p.payout_currency}
            onChange={(e) => setP({ ...p, payout_currency: e.target.value })}
            className="form-input"
            maxLength={3}
          />
        </Field>
        <Field label="Auszahlungs-Schwelle CHF" hint="Erst auszahlen ab diesem Betrag. 0 = immer.">
          <input
            type="number"
            step="0.01"
            min={0}
            value={p.payout_threshold_chf}
            onChange={(e) =>
              setP({ ...p, payout_threshold_chf: Number(e.target.value) })
            }
            className="form-input"
          />
        </Field>
        <Field
          label="Provision % (optional)"
          hint="Nur Marktplatz-relevant. Im Reseller-Modell leer lassen."
        >
          <input
            type="number"
            step="0.01"
            min={0}
            max={100}
            value={p.commission_pct ?? ""}
            onChange={(e) =>
              setP({
                ...p,
                commission_pct:
                  e.target.value === "" ? null : Number(e.target.value),
              })
            }
            className="form-input"
          />
        </Field>
        <Field label="Vertrag Start">
          <input
            type="date"
            value={p.contract_start_on}
            onChange={(e) => setP({ ...p, contract_start_on: e.target.value })}
            className="form-input"
          />
        </Field>
        <Field label="Vertrag Ende (optional)">
          <input
            type="date"
            value={p.contract_end_on}
            onChange={(e) => setP({ ...p, contract_end_on: e.target.value })}
            className="form-input"
          />
        </Field>
      </div>
      <Field label="Vertrags-Notizen">
        <textarea
          rows={2}
          value={p.contract_notes}
          onChange={(e) => setP({ ...p, contract_notes: e.target.value })}
          className="form-input resize-none"
        />
      </Field>

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
        {saving ? "Wird gespeichert…" : "Auszahlungs-Daten speichern"}
      </button>

      <style jsx>{`
        :global(.form-input) {
          width: 100%;
          background-color: white;
          border: 1px solid rgb(0 0 0 / 0.1);
          padding: 0.625rem 0.875rem;
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

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block">
        <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1.5">
          {label}
        </span>
        {children}
      </label>
      {hint && <p className="text-[11px] text-on-surface-variant/70 mt-1">{hint}</p>}
    </div>
  );
}
