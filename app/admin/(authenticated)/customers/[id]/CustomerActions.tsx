"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CustomerActions({
  customerId,
  email,
  alreadyDeleted,
}: {
  customerId: string;
  email: string;
  alreadyDeleted: boolean;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [amount, setAmount] = useState("10.00");
  const [reason, setReason] = useState("Marketing-Code (Admin)");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const grantCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/admin/customers/${customerId}/credit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount_chf: Number(amount),
        reason: reason.trim() || "Admin-Gutschrift",
        campaign_code: code.trim() || null,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => null)) as { error?: string };
      setMsg({ type: "err", text: j?.error ?? `HTTP ${res.status}` });
      return;
    }
    setMsg({ type: "ok", text: "Gutschrift gebucht." });
    setCode("");
    setAmount("10.00");
    router.refresh();
  };

  const softDelete = async () => {
    if (
      !confirm(
        `Konto von ${email} wirklich löschen? Daten werden anonymisiert, Bestellungen bleiben aus Buchhaltungs-Gründen.`
      )
    )
      return;
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/admin/customers/${customerId}`, {
      method: "DELETE",
    });
    setBusy(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => null)) as { error?: string };
      setMsg({ type: "err", text: j?.error ?? `HTTP ${res.status}` });
      return;
    }
    setMsg({ type: "ok", text: "Konto soft-gelöscht." });
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={grantCredit} className="bg-surface-container-low p-4 space-y-3">
        <h3 className="font-headline text-[11px] uppercase tracking-widest text-tertiary font-bold">
          Marketing-Code / Gutschrift zuweisen
        </h3>
        <p className="text-xs text-on-surface-variant">
          Direkter customer_credits-Eintrag. Wird mit positiver
          amount_chf als Guthaben gebucht (Customer kann's beim nächsten
          Checkout anwenden).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="text-sm">
            <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1">
              Betrag CHF
            </span>
            <input
              type="number"
              step="0.01"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-white border border-primary/10 px-3 py-2 text-sm focus:outline-none focus:border-tertiary"
            />
          </label>
          <label className="text-sm">
            <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1">
              Kampagnen-Code (optional)
            </span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="WELCOME10"
              className="w-full bg-white border border-primary/10 px-3 py-2 text-sm focus:outline-none focus:border-tertiary"
            />
          </label>
          <label className="text-sm">
            <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1">
              Grund/Note
            </span>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-white border border-primary/10 px-3 py-2 text-sm focus:outline-none focus:border-tertiary"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="bg-primary text-on-primary px-5 py-2 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
        >
          {busy ? "…" : "Gutschrift buchen"}
        </button>
      </form>

      {!alreadyDeleted && (
        <div className="bg-rose-50 border-l-4 border-rose-400 p-4">
          <h3 className="font-headline text-[11px] uppercase tracking-widest text-rose-900 font-bold mb-2">
            Konto löschen (Soft-Delete)
          </h3>
          <p className="text-xs text-rose-900 mb-3">
            Setzt customers.deleted_at + anonymisiert Email/Name (DSGVO-konform).
            Bestellungen bleiben aus Buchhaltungs-Gründen.
          </p>
          <button
            onClick={softDelete}
            disabled={busy}
            className="bg-rose-600 text-white px-5 py-2 font-headline font-bold text-xs uppercase tracking-widest hover:bg-rose-700 transition-all disabled:opacity-50"
          >
            Konto löschen
          </button>
        </div>
      )}

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
    </div>
  );
}
