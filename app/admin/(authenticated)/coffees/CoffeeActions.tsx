"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

/**
 * Aktion-Buttons pro Coffee-Zeile. Status + Verifikation in einer
 * horizontalen Reihe, damit alle Zeilen visuell auf gleicher Hoehe sind.
 *
 * Beschriftung in Endkunden-Sprache (nicht Status-Slang):
 *   - draft        -> "Im Shop veroeffentlichen" + "Ablehnen"
 *   - active       -> "Im Shop verstecken" + "Auslaufen lassen"
 *   - paused       -> "Wieder veroeffentlichen"
 *   - discontinued -> "Wieder veroeffentlichen"
 */
type Status = "draft" | "active" | "paused" | "discontinued";

export default function CoffeeActions({
  coffeeId,
  status,
  verified,
}: {
  coffeeId: string;
  status: Status;
  verified: boolean;
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

  function toggleVerify() {
    setErr(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/coffees/${coffeeId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: verified ? "unverify" : "verify" }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(body.error ?? `HTTP ${res.status}`);
        return;
      }
      router.refresh();
    });
  }

  const baseBtn =
    "font-headline text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 transition-colors disabled:opacity-50 whitespace-nowrap";
  const primary = baseBtn + " bg-emerald-600 text-white hover:bg-emerald-700";
  const secondary = baseBtn + " bg-stone-100 text-stone-700 hover:bg-stone-200";
  const danger = baseBtn + " bg-rose-100 text-rose-900 hover:bg-rose-200";
  const verifyBtn =
    baseBtn +
    (verified ? " bg-emerald-100 text-emerald-800 hover:bg-emerald-200" : " bg-white text-on-surface-variant border border-primary/20 hover:border-primary/40");

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex gap-2 items-center">
        {status === "draft" && (
          <>
            <button
              type="button"
              onClick={() => setStatus("active", "Coffee freigeben und im Shop veröffentlichen?")}
              disabled={pending}
              className={primary}
              title="Setzt status=active. Der Coffee wird für Kunden sichtbar und kommt in die Empfehlungen."
            >
              Im Shop veröffentlichen
            </button>
            <button
              type="button"
              onClick={() => setStatus("discontinued", "Coffee ablehnen?")}
              disabled={pending}
              className={danger}
              title="Setzt status=discontinued. Coffee bleibt erhalten, ist aber nicht eligible."
            >
              Ablehnen
            </button>
          </>
        )}
        {status === "active" && (
          <>
            <button
              type="button"
              onClick={() => setStatus("paused")}
              disabled={pending}
              className={secondary}
              title="Setzt status=paused. Coffee verschwindet aus dem Shop, bleibt aber im System."
            >
              Im Shop verstecken
            </button>
            <button
              type="button"
              onClick={() => setStatus("discontinued", "Coffee in den Auslauf setzen?")}
              disabled={pending}
              className={danger}
              title="Setzt status=discontinued. Nicht mehr empfehlbar, kann aber reaktiviert werden."
            >
              Auslaufen lassen
            </button>
          </>
        )}
        {(status === "paused" || status === "discontinued") && (
          <button
            type="button"
            onClick={() => setStatus("active")}
            disabled={pending}
            className={primary}
            title="Setzt status=active. Coffee ist wieder eligible."
          >
            Wieder veröffentlichen
          </button>
        )}
        <button
          type="button"
          onClick={toggleVerify}
          disabled={pending}
          className={verifyBtn}
          title={
            verified
              ? "Verifikation entziehen (-2 auf Quality-Score)"
              : "Als verifiziert markieren (+2 auf Quality-Score nach eigener Verkostung)"
          }
        >
          {verified ? "✓ Verifiziert" : "Verifizieren"}
        </button>
      </div>
      {err && <span className="text-[10px] text-rose-700">{err}</span>}
    </div>
  );
}
