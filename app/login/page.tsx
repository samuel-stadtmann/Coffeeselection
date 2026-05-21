"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SiteHeader from "@/components/SiteHeader";

const LOGO = "/logo.png";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/account/dashboard";
  // Aus dem Quiz kommt der User als Neukunde → Signup als Default.
  // Bei direktem Aufruf (Profil-Icon, manuelle URL) → Login als Default.
  const initialMode: "signup" | "login" = next.includes("/match-result") ? "signup" : "login";
  const [mode, setMode] = useState<"signup" | "login">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);

    const supabase = createClient();

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // marketing_opt_in wird vom handle_new_auth_user-Trigger aus den
          // user_metadata uebernommen und auf customers.marketing_opt_in
          // geschrieben. Resend-Audience-Sync passiert dann beim ersten
          // Settings-Toggle bzw. via Migration/Backfill.
          data: {
            first_name: firstName,
            last_name: lastName,
            marketing_opt_in: marketingOptIn,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (signUpError) {
        const msg = signUpError.message.toLowerCase();
        if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
          setMode("login");
          setError(null);
          setInfo("Du hast bereits ein Konto unter dieser Email. Gib dein Passwort ein, um dich einzuloggen.");
        } else {
          setError(signUpError.message);
        }
        setSubmitting(false);
        return;
      }
      // Form-State leeren — sonst stehen Email/Passwort/Name nach
      // Confirmation-Wait noch im Browser und werden ggf. ungewollt
      // erneut abgeschickt.
      setEmail("");
      setPassword("");
      setFirstName("");
      setLastName("");
      // Email-Confirmation aktiv? Dann gibt's keine session, sondern eine Bestätigungs-Mail.
      if (!data.session) {
        setInfo("Wir haben dir eine Bestätigungs-Mail geschickt. Klick auf den Link, dann geht's weiter.");
        setSubmitting(false);
        return;
      }
      router.push(next);
      router.refresh();
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setSubmitting(false);
      return;
    }
    router.push(next);
    router.refresh();
  };

  const handleForgotPassword = async () => {
    setError(null);
    setInfo(null);
    if (!email) {
      setError("Bitte gib zuerst deine Email-Adresse oben ein.");
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setSubmitting(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setInfo("Wir haben dir eine Email mit dem Reset-Link geschickt. Schau in dein Postfach.");
  };

  return (
    <div className="bg-[#F9F5F0] min-h-screen flex flex-col">
      {/* Minimal Header */}
      <SiteHeader />

      <main className="flex-1 flex items-center justify-center pt-20 md:pt-24 pb-16 px-6">
        <div className="w-full max-w-md">
          {/* Strategic Headline — kontextabhängig */}
          <div className="text-center mb-10">
            <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
              {mode === "login" ? "Willkommen zurück" : "Dein Match wartet"}
            </span>
            <h1 className="text-3xl md:text-4xl text-primary leading-tight mb-4 font-headline font-bold uppercase tracking-tight">
              {mode === "login" ? <>Einloggen</> : <>Speichere dein<br />Geschmacksprofil</>}
            </h1>
            <p className="text-base text-on-surface-variant leading-relaxed">
              {mode === "login"
                ? "Logge dich ein, um auf dein Profil und deine Empfehlungen zuzugreifen."
                : "Erstelle dein kostenloses Konto, um deinen Geschmackstyp zu sehen, deinen Match-Kaffee zu kaufen und Empfehlungen zu speichern."}
            </p>
          </div>

          {/* Mode Toggle — Login zuerst & primär */}
          <div className="flex bg-surface-container mb-8">
            <button
              onClick={() => { setMode("login"); setError(null); setInfo(null); }}
              className={`flex-1 py-3 font-headline text-[11px] uppercase tracking-widest font-bold transition-all ${
                mode === "login" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-primary"
              }`}
            >
              Einloggen
            </button>
            <button
              onClick={() => { setMode("signup"); setError(null); setInfo(null); }}
              className={`flex-1 py-3 font-headline text-[11px] uppercase tracking-widest font-bold transition-all ${
                mode === "signup" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-primary"
              }`}
            >
              Konto erstellen
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 bg-white p-8 shadow-xl">
            {mode === "signup" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-headline text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold block mb-2">
                    Vorname
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base"
                    placeholder="Maria"
                  />
                </div>
                <div>
                  <label className="font-headline text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold block mb-2">
                    Nachname
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base"
                    placeholder="Müller"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="font-headline text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold block mb-2">
                E-Mail
              </label>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base"
                placeholder="dein@email.ch"
              />
            </div>
            <div>
              <label className="font-headline text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold block mb-2">
                Passwort
              </label>
              <input
                type="password"
                name="password"
                required
                minLength={8}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base"
                placeholder={mode === "signup" ? "Mindestens 8 Zeichen" : "••••••••"}
              />
            </div>

            {mode === "signup" && (
              <>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={marketingOptIn}
                    onChange={(e) => setMarketingOptIn(e.target.checked)}
                    className="mt-1"
                  />
                  <span className="text-xs text-on-surface-variant leading-relaxed">
                    Newsletter abonnieren — neue Röster, Specialty-Lots und Brüh-Tipps,
                    max. 1× im Monat. Jederzeit in den Einstellungen abbestellbar.
                  </span>
                </label>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Mit der Registrierung akzeptierst du unsere{" "}
                  <Link href="#" className="text-tertiary hover:text-primary underline">AGB</Link> und{" "}
                  <Link href="/privacy" className="text-tertiary hover:text-primary underline">Datenschutzerklärung</Link>.
                </p>
              </>
            )}

            {error && (
              <div className="bg-error/10 border-l-4 border-error px-4 py-3 text-sm text-primary">
                {error}
              </div>
            )}
            {info && (
              <div className="bg-tertiary/10 border-l-4 border-tertiary px-4 py-3 text-sm text-primary">
                {info}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-on-primary py-4 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
            >
              {submitting
                ? "Bitte warten..."
                : mode === "signup"
                ? next.includes("/match-result")
                  ? "Konto erstellen & Match sehen"
                  : "Konto erstellen"
                : "Einloggen"}
            </button>

            {mode === "login" && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={submitting}
                  className="font-headline text-[10px] uppercase tracking-[0.2em] text-tertiary hover:text-primary transition-colors disabled:opacity-50"
                >
                  Passwort vergessen?
                </button>
              </div>
            )}
          </form>

          {/* Social proof + benefits */}
          <div className="mt-10 space-y-3">
            {[
              { icon: "favorite", text: "Geschmacksprofil dauerhaft speichern" },
              { icon: "shopping_bag", text: "Direkter Kaufzugang zu allen Match-Kaffees" },
              { icon: "auto_awesome", text: "Personalisierte Empfehlungen jeden Monat" },
            ].map((b) => (
              <div key={b.text} className="flex items-center gap-3 text-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-tertiary text-lg">{b.icon}</span>
                {b.text}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F9F5F0]" />}>
      <LoginForm />
    </Suspense>
  );
}
