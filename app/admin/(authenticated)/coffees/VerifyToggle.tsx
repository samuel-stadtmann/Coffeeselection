"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

/**
 * Verify-/Unverify-Button pro Coffee-Zeile. Schickt POST an
 * /api/admin/coffees/[id]/verify mit {action: 'verify'|'unverify'}.
 * Nach Erfolg: router.refresh -> Server-Component re-fetcht die Liste.
 */
export default function VerifyToggle({
  coffeeId,
  verified,
}: {
  coffeeId: string;
  verified: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/coffees/${coffeeId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: verified ? "unverify" : "verify" }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? `HTTP ${res.status}`);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={
          "font-headline text-[10px] uppercase tracking-widest font-bold px-3 py-2 transition-colors disabled:opacity-50 " +
          (verified
            ? "bg-stone-100 text-stone-700 hover:bg-stone-200"
            : "bg-primary text-on-primary hover:bg-black")
        }
      >
        {pending ? "..." : verified ? "Entziehen" : "Verifizieren"}
      </button>
      {error && <span className="text-[10px] text-rose-700">{error}</span>}
    </div>
  );
}
