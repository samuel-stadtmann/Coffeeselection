"use client";

import { useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import AdminFooterLink from "@/components/AdminFooterLink";

const LOGO = "/logo.png";

type State = "idle" | "sending" | "success" | "error";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [betreff, setBetreff] = useState("");
  const [nachricht, setNachricht] = useState("");
  // Honeypot — versteckt vor Usern, befuellt von Spambots
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, betreff, nachricht, website }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setErrorMsg(
          j.error === "invalid_body"
            ? "Bitte alle Felder korrekt ausfüllen."
            : "Konnte gerade nicht senden — bitte später nochmal versuchen."
        );
        setState("error");
        return;
      }
      setState("success");
      setName("");
      setEmail("");
      setBetreff("");
      setNachricht("");
    } catch {
      setErrorMsg("Konnte gerade nicht senden — bitte später nochmal versuchen.");
      setState("error");
    }
  };

  return (
    <div className="bg-[#F9F5F0] text-on-surface pb-20 md:pb-0">
      <SiteHeader />

      <main className="pt-20 md:pt-24">
        <section className="max-w-3xl mx-auto px-6 md:px-8 py-12 md:py-20">
          <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
            Kontakt
          </span>
          <h1 className="text-4xl md:text-5xl text-primary leading-[1.05] mb-6 font-headline font-bold uppercase tracking-tight">
            Lust auf einen Kaffee mit uns?
          </h1>
          <p className="text-lg text-on-surface-variant leading-relaxed mb-12">
            Schreib uns über das Formular — wir antworten innerhalb von
            48 Stunden. Du kannst uns auch direkt eine Mail schicken an{" "}
            <a
              href="mailto:hello@coffeeselection.ch"
              className="text-tertiary hover:text-primary underline"
            >
              hello@coffeeselection.ch
            </a>
            .
          </p>

          {state === "success" ? (
            <div className="bg-white p-8 md:p-12 shadow-sm border-l-4 border-tertiary">
              <span className="material-symbols-outlined text-tertiary text-5xl mb-4 block">
                check_circle
              </span>
              <h2 className="text-2xl text-primary font-headline font-bold uppercase tracking-tight mb-4">
                Vielen Dank!
              </h2>
              <p className="text-on-surface-variant mb-6">
                Wir haben deine Nachricht erhalten und melden uns schnellstmöglich.
              </p>
              <Link
                href="/"
                className="inline-block bg-primary text-on-primary px-6 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all"
              >
                Zurück zur Startseite
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="bg-white p-6 md:p-8 shadow-sm space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-headline text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold block mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base"
                  />
                </div>
                <div>
                  <label className="font-headline text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold block mb-2">
                    E-Mail *
                  </label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base"
                  />
                </div>
              </div>
              <div>
                <label className="font-headline text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold block mb-2">
                  Betreff *
                </label>
                <input
                  type="text"
                  required
                  value={betreff}
                  onChange={(e) => setBetreff(e.target.value)}
                  className="w-full bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base"
                />
              </div>
              <div>
                <label className="font-headline text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold block mb-2">
                  Nachricht *
                </label>
                <textarea
                  required
                  minLength={5}
                  rows={5}
                  value={nachricht}
                  onChange={(e) => setNachricht(e.target.value)}
                  className="w-full bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base resize-none"
                />
              </div>
              {/* Honeypot — versteckt vor Usern, von Spambots befuellt. */}
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="sr-only"
                aria-hidden="true"
                name="website"
              />
              {state === "error" && errorMsg && (
                <div className="bg-rose-50 border-l-4 border-rose-400 p-3 text-sm text-rose-900">
                  {errorMsg}
                </div>
              )}
              <button
                type="submit"
                disabled={state === "sending"}
                className="w-full bg-primary text-on-primary py-4 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
              >
                {state === "sending" ? "Wird gesendet…" : "Nachricht senden"}
              </button>
            </form>
          )}
        </section>
      </main>

      <footer className="w-full px-6 md:px-8 bg-[#F9F5F0] border-t border-primary/5 py-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] text-on-surface-variant/60 font-headline font-bold uppercase tracking-[0.3em]">
          <Link href="/" className="flex items-center">
            <img alt="Coffee Selection" className="h-14 md:h-20 w-auto object-contain" src={LOGO} />
          </Link>
          <span>© 2026 Coffee Selection GmbH · Handverlesen aus der Schweiz</span>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <Link href="/privacy" className="hover:text-tertiary transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-tertiary transition-colors">Terms</Link>
            <Link href="/roaster/login" className="hover:text-tertiary transition-colors">Röster-Portal</Link>
            <AdminFooterLink />
          </div>
        </div>
      </footer>
    </div>
  );
}
