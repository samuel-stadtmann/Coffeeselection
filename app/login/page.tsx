"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

const LOGO = "/logo.png";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/match-result";
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // TODO: wire up Supabase Auth — for now just continue to result
    setTimeout(() => router.push(next), 600);
  };

  return (
    <div className="bg-[#F9F5F0] min-h-screen flex flex-col">
      {/* Minimal Header */}
      <header className="fixed top-0 w-full z-50 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-6 md:px-8 w-full">
          <Link href="/" className="flex items-center">
            <img alt="Coffee Selection" className="h-56 md:h-72 w-auto object-contain -my-10 md:-my-16" src={LOGO} />
          </Link>
          <Link href="/" className="font-headline text-[11px] uppercase tracking-[0.3em] text-primary hover:text-tertiary transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-base">close</span>
            <span className="hidden sm:inline">Beenden</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center pt-36 md:pt-40 pb-16 px-6">
        <div className="w-full max-w-md">
          {/* Strategic Headline */}
          <div className="text-center mb-10">
            <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
              Dein Match wartet
            </span>
            <h1 className="text-3xl md:text-4xl text-primary leading-tight mb-4 font-headline font-bold uppercase tracking-tight">
              Speichere dein<br />Geschmacksprofil
            </h1>
            <p className="text-base text-on-surface-variant leading-relaxed">
              Erstelle dein kostenloses Konto, um deinen Geschmackstyp zu sehen, deinen Match-Kaffee zu kaufen und Empfehlungen zu speichern.
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex bg-surface-container mb-8">
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-3 font-headline text-[11px] uppercase tracking-widest font-bold transition-all ${
                mode === "signup" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-primary"
              }`}
            >
              Konto erstellen
            </button>
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-3 font-headline text-[11px] uppercase tracking-widest font-bold transition-all ${
                mode === "login" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-primary"
              }`}
            >
              Einloggen
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 bg-white p-8 shadow-xl">
            {mode === "signup" && (
              <div>
                <label className="font-headline text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold block mb-2">
                  Vorname
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base"
                  placeholder="Maria"
                />
              </div>
            )}
            <div>
              <label className="font-headline text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold block mb-2">
                E-Mail
              </label>
              <input
                type="email"
                required
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
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base"
                placeholder={mode === "signup" ? "Mindestens 8 Zeichen" : "••••••••"}
              />
            </div>

            {mode === "signup" && (
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Mit der Registrierung akzeptierst du unsere{" "}
                <Link href="#" className="text-tertiary hover:text-primary underline">AGB</Link> und{" "}
                <Link href="/privacy" className="text-tertiary hover:text-primary underline">Datenschutzerklärung</Link>.
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-on-primary py-4 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
            >
              {submitting ? "Bitte warten..." : mode === "signup" ? "Konto erstellen & Match sehen" : "Einloggen & Match sehen"}
            </button>

            {mode === "login" && (
              <div className="text-center">
                <Link href="#" className="font-headline text-[10px] uppercase tracking-[0.2em] text-tertiary hover:text-primary transition-colors">
                  Passwort vergessen?
                </Link>
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
