"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function RemoveUserButton({
  roasterId,
  userId,
  email,
}: {
  roasterId: string;
  userId: string;
  email: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleRemove() {
    const what = email || userId;
    if (!confirm(`Zugriff von ${what} auf diesen Röster entfernen?`)) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/roasters/${roasterId}/users/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        alert(`Fehler: ${body.error ?? res.status}`);
        return;
      }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={pending}
      className="font-headline text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 bg-rose-100 text-rose-900 hover:bg-rose-200 transition-colors disabled:opacity-50"
    >
      {pending ? "…" : "Entfernen"}
    </button>
  );
}
