"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Passwort-Form fuer die Admin-Re-Auth. Schickt POST an
 * /api/admin/reauth — der Server validiert das Passwort gegen die
 * Supabase-Session-E-Mail und setzt das HTTP-Only-Cookie.
 * Bei Erfolg: router.push(next) + refresh.
 */
export default function ReauthForm({ email, next }: { email: string; next: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!password) {
      setError("Bitte Passwort eingeben.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/reauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(
          body.error === "invalid_password"
            ? "Falsches Passwort."
            : body.error === "unauthorized"
              ? "Session abgelaufen — bitte neu einloggen."
              : "Re-Auth fehlgeschlagen. Versuch's nochmal."
        );
        setSubmitting(false);
        return;
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Netzwerkfehler. Versuch's nochmal.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold mb-2">
          E-Mail
        </label>
        <input
          type="email"
          value={email}
          readOnly
          className="w-full bg-white border border-primary/10 px-4 py-3 text-sm text-on-surface-variant"
        />
      </div>
      <div>
        <label className="block font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold mb-2">
          Passwort
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          autoComplete="current-password"
          required
          className="w-full bg-white border border-primary/30 px-4 py-3 text-sm focus:border-tertiary outline-none transition-colors"
          placeholder="••••••••"
        />
      </div>
      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-400 px-4 py-3 text-sm text-rose-900">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-primary text-on-primary py-4 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
      >
        {submitting ? "Bitte warten..." : "Bestätigen"}
      </button>
    </form>
  );
}
