"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

/**
 * Status-Aktionen pro Coffee-Zeile im Admin. Was sichtbar ist haengt
 * vom aktuellen Status ab:
 *   - draft       -> "Freigeben" (active) + "Verwerfen" (discontinued)
 *   - active      -> "Pausieren" (paused) + "Auslauf" (discontinued)
 *   - paused      -> "Reaktivieren" (active)
 *   - discontinued -> "Reaktivieren" (active)
 */
type Status = "draft" | "active" | "paused" | "discontinued";

export default function StatusActions({
  coffeeId,
  status,
}: {
  coffeeId: string;
  status: Status;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function setStatus(next: Status, confirmMsg?: string) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setErr(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/coffees/${coffeeId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(body.error ?? `HTTP ${res.status}`);
        return;
      }
      router.refresh();
    });
  }

  const cls = "font-headline text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 transition-colors disabled:opacity-50";

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        {status === "draft" && (
          <>
            <button
              onClick={() => setStatus("active", "Coffee freigeben? Wird sofort sichtbar fuer Kunden.")}
              disabled={pending}
              className={cls + " bg-emerald-600 text-white hover:bg-emerald-700"}
            >
              ✓ Freigeben
            </button>
            <button
              onClick={() => setStatus("discontinued", "Coffee verwerfen?")}
              disabled={pending}
              className={cls + " bg-rose-100 text-rose-900 hover:bg-rose-200"}
            >
              ✕ Verwerfen
            </button>
          </>
        )}
        {status === "active" && (
          <>
            <button
              onClick={() => setStatus("paused")}
              disabled={pending}
              className={cls + " bg-stone-100 text-stone-700 hover:bg-stone-200"}
            >
              Pausieren
            </button>
            <button
              onClick={() => setStatus("discontinued", "Coffee in Auslauf setzen?")}
              disabled={pending}
              className={cls + " bg-rose-100 text-rose-900 hover:bg-rose-200"}
            >
              Auslauf
            </button>
          </>
        )}
        {(status === "paused" || status === "discontinued") && (
          <button
            onClick={() => setStatus("active")}
            disabled={pending}
            className={cls + " bg-emerald-600 text-white hover:bg-emerald-700"}
          >
            Reaktivieren
          </button>
        )}
      </div>
      {err && <span className="text-[10px] text-rose-700">{err}</span>}
    </div>
  );
}
