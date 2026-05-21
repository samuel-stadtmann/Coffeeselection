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

type AddressForm = {
  id: string | null;
  recipient_name: string;
  company: string;
  street: string;
  street_additional: string;
  postal_code: string;
  city: string;
  region: string;
  country: string;
  delivery_instructions: string;
};

export default function CustomerEditForm({
  customerId,
  initial,
  address,
}: {
  customerId: string;
  initial: Initial;
  address: AddressForm;
}) {
  const router = useRouter();
  const [f, setF] = useState<Initial>(initial);
  const [a, setA] = useState<AddressForm>(address);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setMsg(null);
    // 1) Customer-Stammdaten
    const res = await fetch(`/api/admin/customers/${customerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    if (!res.ok) {
      setSaving(false);
      const j = (await res.json().catch(() => null)) as { error?: string };
      setMsg({ type: "err", text: `Stammdaten: ${j?.error ?? `HTTP ${res.status}`}` });
      return;
    }
    // 2) Address upsert wenn Pflichtfelder ausgefuellt (sonst nichts).
    if (a.recipient_name.trim() && a.street.trim() && a.postal_code.trim() && a.city.trim()) {
      const addrRes = await fetch(`/api/admin/customers/${customerId}/address`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: a.id,
          recipient_name: a.recipient_name.trim(),
          company: a.company.trim() || null,
          street: a.street.trim(),
          street_additional: a.street_additional.trim() || null,
          postal_code: a.postal_code.trim(),
          city: a.city.trim(),
          region: a.region.trim() || null,
          country: a.country.trim() || "CH",
          delivery_instructions: a.delivery_instructions.trim() || null,
        }),
      });
      if (!addrRes.ok) {
        setSaving(false);
        const j = (await addrRes.json().catch(() => null)) as { error?: string };
        setMsg({ type: "err", text: `Adresse: ${j?.error ?? `HTTP ${addrRes.status}`}` });
        return;
      }
      const addrJson = (await addrRes.json().catch(() => null)) as { id?: string };
      if (addrJson?.id) setA((prev) => ({ ...prev, id: addrJson.id! }));
    }
    setSaving(false);
    setMsg({ type: "ok", text: "Gespeichert." });
    router.refresh();
  };

  return (
    <form onSubmit={save} className="space-y-6">
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

      {/* Standard-Lieferadresse — direkt in Stammdaten editierbar.
          Beim ersten Save wird ein customer_addresses-Eintrag mit
          is_default=true + type=shipping angelegt; spaeter ge-PATCH-ed. */}
      <div className="pt-6 border-t border-surface-container">
        <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-base mb-4">
          Standard-Lieferadresse
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Empfänger*in">
            <input
              value={a.recipient_name}
              onChange={(e) => setA({ ...a, recipient_name: e.target.value })}
              className="form-input"
              autoComplete="name"
            />
          </Field>
          <Field label="Firma (optional)">
            <input
              value={a.company}
              onChange={(e) => setA({ ...a, company: e.target.value })}
              className="form-input"
              autoComplete="organization"
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Strasse + Nr.">
              <input
                value={a.street}
                onChange={(e) => setA({ ...a, street: e.target.value })}
                className="form-input"
                autoComplete="address-line1"
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Adresszusatz (optional)">
              <input
                value={a.street_additional}
                onChange={(e) => setA({ ...a, street_additional: e.target.value })}
                className="form-input"
                autoComplete="address-line2"
              />
            </Field>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <Field label="PLZ">
            <input
              value={a.postal_code}
              onChange={(e) => setA({ ...a, postal_code: e.target.value.trim() })}
              className="form-input"
              autoComplete="postal-code"
            />
          </Field>
          <Field label="Stadt">
            <input
              value={a.city}
              onChange={(e) => setA({ ...a, city: e.target.value })}
              className="form-input"
              autoComplete="address-level2"
            />
          </Field>
          <Field label="Kanton (optional)">
            <input
              value={a.region}
              onChange={(e) => setA({ ...a, region: e.target.value })}
              className="form-input"
              autoComplete="address-level1"
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Field label="Land">
            <select
              value={a.country}
              onChange={(e) => setA({ ...a, country: e.target.value })}
              className="form-input"
            >
              <option value="CH">Schweiz</option>
              <option value="LI">Liechtenstein</option>
            </select>
          </Field>
          <Field label="Lieferhinweis (optional)">
            <input
              value={a.delivery_instructions}
              onChange={(e) => setA({ ...a, delivery_instructions: e.target.value })}
              className="form-input"
              placeholder="z.B. Bei Nachbar, 2. Stock"
            />
          </Field>
        </div>
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
