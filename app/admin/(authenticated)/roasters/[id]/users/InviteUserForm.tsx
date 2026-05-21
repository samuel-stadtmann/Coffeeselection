"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function InviteUserForm({ roasterId }: { roasterId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"owner" | "editor">("editor");
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/roasters/${roasterId}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        details?: string;
        invited?: boolean;
      };
      if (!res.ok || !body.ok) {
        setMsg({ kind: "err", text: body.details ?? body.error ?? `HTTP ${res.status}` });
        return;
      }
      setMsg({
        kind: "ok",
        text: body.invited
          ? `Einladung an ${email} verschickt.`
          : `${email} hatte bereits einen Account und wurde dem Röster zugeordnet.`,
      });
      setEmail("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-3">
        <input
          type="email"
          required
          placeholder="email@roesterei.ch"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="px-3 py-2 bg-white border border-primary/15 focus:border-primary focus:outline-none text-sm"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "owner" | "editor")}
          className="px-3 py-2 bg-white border border-primary/15 focus:border-primary focus:outline-none text-sm"
        >
          <option value="editor">Editor — kann nur Coffees verwalten</option>
          <option value="owner">Owner — kann zusätzlich weitere User einladen</option>
        </select>
        <button
          type="submit"
          disabled={pending || !email}
          className="px-5 py-2 bg-primary text-on-primary font-headline text-[11px] uppercase tracking-widest font-bold hover:bg-black transition-all disabled:opacity-50"
        >
          {pending ? "Einladen…" : "Einladen"}
        </button>
      </div>
      {msg && (
        <p
          className={
            "text-xs p-2 " +
            (msg.kind === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800")
          }
        >
          {msg.text}
        </p>
      )}
      <div className="text-xs text-on-surface-variant space-y-1">
        <p>
          <strong>Rolle:</strong> Der Editor sieht und bearbeitet die Coffees
          dieser Rösterei. Der Owner kann zusätzlich weitere Editor/Owner
          für dieselbe Rösterei einladen oder entfernen. Im Zweifel:{" "}
          <strong>Editor</strong> wählen.
        </p>
        <p>
          <strong>Account:</strong> Wenn die E-Mail noch keinen Account hat,
          verschickt Supabase eine Set-Password-Mail. Wenn der Account schon
          existiert (z.B. als Kunde), verknüpfen wir ihn nur mit der Rösterei
          — kein neuer Login-Flow.
        </p>
      </div>
    </form>
  );
}
