"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const LOGO = "/logo.png";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Das Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push("/account/dashboard");
      router.refresh();
    }, 1200);
  };

  return (
    <div className="bg-[#F9F5F0] min-h-screen flex flex-col">
      <header className="fixed top-0 w-full z-50 h-20 md:h-24 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5">
        <div className="flex justify-between items-center gap-3 h-full max-w-7xl mx-auto px-6 md:px-8 w-full">
          <Link href="/" className="flex items-center shrink-0 h-full overflow-hidden">
            <img alt="Coffee Selection" className="h-12 sm:h-14 md:h-16 lg:h-20 w-auto object-contain object-left" src={LOGO} />
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center pt-20 md:pt-24 pb-16 px-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
              Neues Passwort setzen
            </span>
            <h1 className="text-3xl md:text-4xl text-primary leading-tight mb-4 font-headline font-bold uppercase tracking-tight">
              Passwort zurücksetzen
            </h1>
            <p className="text-base text-on-surface-variant leading-relaxed">
              Wähle ein neues Passwort. Du wirst danach automatisch eingeloggt.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 bg-white p-8 shadow-xl">
            <div>
              <label className="font-headline text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold block mb-2">
                Neues Passwort
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base"
                placeholder="Mindestens 8 Zeichen"
              />
            </div>
            <div>
              <label className="font-headline text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold block mb-2">
                Passwort bestätigen
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base"
                placeholder="Nochmal eingeben"
              />
            </div>

            {error && (
              <div className="bg-error/10 border-l-4 border-error px-4 py-3 text-sm text-primary">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-tertiary/10 border-l-4 border-tertiary px-4 py-3 text-sm text-primary">
                Passwort gesetzt — du wirst weitergeleitet…
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || success}
              className="w-full bg-primary text-on-primary py-4 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
            >
              {submitting ? "Wird gespeichert…" : "Passwort speichern"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
