"use client";
import { useState } from "react";

type Result = {
  summary: { processed: number; ok: number; skipped: number; failed: number };
  results: Array<{ order: string; status: string; error?: string }>;
};

export default function InvoiceBackfillButton() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setResult(null);
    const res = await fetch("/api/admin/orders/backfill-invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ limit: 100 }),
    });
    const j = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(j.error ?? "Fehler");
      return;
    }
    setResult(j);
  };

  return (
    <div>
      <p className="text-sm text-on-surface-variant mb-4">
        Holt fehlende Stripe-Rechnungs-URLs fuer bereits bezahlte Alt-Bestellungen nach.
        Idempotent — laeuft pro Aufruf max. 100 Orders. Mehrfach klickbar.
      </p>
      <button
        onClick={run}
        disabled={busy}
        className="bg-primary text-on-primary px-6 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all disabled:opacity-60"
      >
        {busy ? "Läuft…" : "Rechnungs-URLs nachfüllen"}
      </button>
      {error && (
        <p className="text-xs text-red-600 font-headline uppercase tracking-widest mt-3">
          {error}
        </p>
      )}
      {result && (
        <div className="mt-4 text-sm">
          <p className="font-headline font-bold text-primary uppercase tracking-tight">
            {result.summary.processed} verarbeitet · {result.summary.ok} aktualisiert ·{" "}
            {result.summary.skipped} übersprungen · {result.summary.failed} Fehler
          </p>
          {result.results.length > 0 && (
            <details className="mt-2">
              <summary className="text-xs text-on-surface-variant cursor-pointer">
                Details ({result.results.length})
              </summary>
              <div className="mt-2 max-h-64 overflow-y-auto text-xs font-mono">
                {result.results.map((r, i) => (
                  <div
                    key={i}
                    className={
                      r.status === "ok"
                        ? "text-emerald-700"
                        : r.status === "stripe_error" || r.status === "update_failed"
                        ? "text-red-700"
                        : "text-on-surface-variant"
                    }
                  >
                    {r.order}: {r.status}
                    {r.error ? ` — ${r.error}` : ""}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
