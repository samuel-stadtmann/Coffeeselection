"use client";

import { useState } from "react";

type State = "idle" | "sending" | "success" | "error";

/**
 * Footer-Newsletter-Form. Postet die E-Mail an /api/newsletter/subscribe,
 * das die Resend-Audience-Sync macht. Anonyme Anmeldung — Leads landen
 * direkt in der Resend-Audience (RESEND_NEWSLETTER_AUDIENCE_ID).
 *
 * Erfolg/Fehler werden inline angezeigt, das Input verschwindet im
 * Erfolgsfall. Bei "service_unavailable" (Audience nicht konfiguriert)
 * geben wir einen freundlichen Generic-Error zurueck.
 */
export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "sending") return;
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setErrorMsg("Bitte gültige E-Mail eingeben.");
      setState("error");
      return;
    }
    setState("sending");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setErrorMsg(
          body.error === "invalid_body"
            ? "Diese E-Mail-Adresse ist ungültig."
            : "Hat gerade nicht geklappt — bitte später nochmal versuchen."
        );
        setState("error");
        return;
      }
      setState("success");
      setEmail("");
    } catch {
      setErrorMsg("Hat gerade nicht geklappt — bitte später nochmal versuchen.");
      setState("error");
    }
  };

  if (state === "success") {
    return (
      <p className="text-xs text-tertiary font-headline uppercase tracking-widest font-bold py-2">
        ✓ Danke — du bist dabei.
      </p>
    );
  }

  return (
    <form onSubmit={submit}>
      <div className="flex border-b border-primary/30 pb-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state === "error") setState("idle");
          }}
          placeholder="Deine E-Mail"
          aria-label="E-Mail für Newsletter"
          className="bg-transparent border-none focus:ring-0 text-xs w-full px-0 font-headline placeholder:text-on-surface-variant/40 outline-none"
        />
        <button
          type="submit"
          disabled={state === "sending"}
          aria-label="Newsletter abonnieren"
          className="text-primary hover:text-tertiary transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-lg">
            {state === "sending" ? "hourglass_empty" : "arrow_forward"}
          </span>
        </button>
      </div>
      {state === "error" && errorMsg && (
        <p className="text-[10px] text-rose-700 mt-2">{errorMsg}</p>
      )}
    </form>
  );
}
