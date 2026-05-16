"use client";
import { useState } from "react";

type Result = {
  summary: { candidates: number; ok: number; failed: number };
  results: Array<{ customer_id: string; status: string; error?: string }>;
};

export default function EmbeddingBackfillButton() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setResult(null);
    const res = await fetch("/api/admin/customers/backfill-embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ limit: 50 }),
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
        Generiert <code>customers.taste_embedding</code> via OpenAI fuer
        bestehende Kunden mit Quiz-Resultat aber ohne Embedding. Aktiviert
        damit den Hybrid-Match-Score (cosine similarity zu coffees.flavor_embedding).
        Max 50 Kunden / Aufruf — bei mehr mehrfach klicken. Dauert ~2s pro Kunde.
      </p>
      <button
        onClick={run}
        disabled={busy}
        className="bg-primary text-on-primary px-6 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all disabled:opacity-60"
      >
        {busy ? "Läuft… (kann 1-2 Min dauern)" : "Customer-Embeddings backfillen"}
      </button>
      {error && (
        <p className="text-xs text-red-600 font-headline uppercase tracking-widest mt-3">
          {error}
        </p>
      )}
      {result && (
        <div className="mt-4 text-sm">
          <p className="font-headline font-bold text-primary uppercase tracking-tight">
            {result.summary.candidates} Kandidaten · {result.summary.ok} ok ·{" "}
            {result.summary.failed} Fehler
          </p>
          {result.summary.failed > 0 && (
            <details className="mt-2">
              <summary className="text-xs text-on-surface-variant cursor-pointer">
                Fehler-Details
              </summary>
              <div className="mt-2 max-h-64 overflow-y-auto text-xs font-mono">
                {result.results
                  .filter((r) => r.status !== "ok")
                  .map((r) => (
                    <div key={r.customer_id} className="text-red-700">
                      {r.customer_id.slice(0, 8)}…: {r.status} — {r.error}
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
