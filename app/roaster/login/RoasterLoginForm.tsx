"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function RoasterLoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    startTransition(async () => {
      const sb = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) {
        setErr("Login fehlgeschlagen — E-Mail oder Passwort prüfen.");
        return;
      }
      // Server-Layout checkt die Roster-Membership; falls keine, leitet es auf
      // /roaster/login?error=not_roaster zurueck.
      router.push(nextPath);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="font-headline text-[10px] uppercase tracking-widest font-bold text-tertiary mb-1.5 block">
          E-Mail
        </span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 bg-white border border-primary/15 focus:border-primary focus:outline-none text-sm"
        />
      </label>

      <label className="block">
        <span className="font-headline text-[10px] uppercase tracking-widest font-bold text-tertiary mb-1.5 block">
          Passwort
        </span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 bg-white border border-primary/15 focus:border-primary focus:outline-none text-sm"
        />
      </label>

      {err && (
        <div className="text-sm text-rose-700 bg-rose-50 border-l-4 border-rose-400 p-3">
          {err}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-primary text-on-primary px-6 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
      >
        {pending ? "Einloggen…" : "Einloggen"}
      </button>
    </form>
  );
}
