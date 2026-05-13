"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

/**
 * PA-Loop3.1: /account/rate/thanks
 *
 * Confirmation-Page nach Magic-Link-Bewertung (1-Klick aus Mail).
 *
 * URL-Params:
 *   - coffee=slug, stars=N      → Erfolg, Bewertung gespeichert
 *   - error=invalid_or_expired  → Token ungueltig/abgelaufen
 *   - error=coffee_not_found    → Coffee gibt's nicht mehr
 *   - error=db_error            → Insert/Update fehlgeschlagen
 *   - error=invalid_params      → URL-Format falsch
 *
 * Kein Login-Zwang — funktioniert auch fuer Gast-Customers.
 * Wenn der User detaillierter bewerten will (Tags, Comment): Link zur
 * vollen Rate-Page (dort ist Login allerdings erforderlich).
 */

function ErrorMessage({ code }: { code: string }) {
  const messages: Record<string, { title: string; body: string }> = {
    invalid_or_expired: {
      title: "Link abgelaufen",
      body: "Der Bewertungslink ist abgelaufen oder ungültig. Bewertungs-Mails sind 14 Tage gültig. Du kannst die Bewertung weiterhin manuell abgeben — einfach einloggen.",
    },
    coffee_not_found: {
      title: "Coffee nicht gefunden",
      body: "Dieser Coffee ist nicht mehr im Sortiment. Wir konnten deine Bewertung leider nicht zuordnen.",
    },
    db_error: {
      title: "Etwas ist schiefgelaufen",
      body: "Wir konnten deine Bewertung nicht speichern. Versuche es bitte später nochmal oder schreib uns kurz an hello@coffeeselection.ch.",
    },
    invalid_params: {
      title: "Link-Format falsch",
      body: "Der Bewertungslink ist nicht korrekt formatiert. Bitte über den ursprünglichen Mail-Link öffnen.",
    },
  };
  const m = messages[code] ?? {
    title: "Unbekannter Fehler",
    body: code,
  };
  return (
    <div className="text-center max-w-md">
      <span className="material-symbols-outlined text-5xl text-on-surface-variant block mb-4">
        error
      </span>
      <h1 className="font-headline font-bold text-2xl text-primary uppercase tracking-tight mb-3">
        {m.title}
      </h1>
      <p className="text-on-surface-variant mb-6">{m.body}</p>
      <Link
        href="/account/dashboard"
        className="inline-block bg-primary text-on-primary px-8 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-tertiary hover:text-primary transition-all"
      >
        Zu Mein Konto
      </Link>
    </div>
  );
}

function SuccessMessage({
  coffeeSlug,
  stars,
}: {
  coffeeSlug: string;
  stars: number;
}) {
  return (
    <div className="text-center max-w-md">
      <div className="mb-4">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className="text-4xl"
            style={{ color: i < stars ? "#C8A064" : "#E5DCD0" }}
          >
            ★
          </span>
        ))}
      </div>
      <h1 className="font-headline font-bold text-2xl text-primary uppercase tracking-tight mb-3">
        Danke für deine Bewertung
      </h1>
      <p className="text-on-surface-variant mb-2">
        Du hast <strong>{stars} von 5 Sternen</strong> vergeben.
      </p>
      <p className="text-on-surface-variant mb-6 text-sm">
        Jede Bewertung macht unseren Empfehlungs-Algorithmus präziser.
        Beim nächsten Match werden deine Vorschläge besser zu deinem
        Geschmack passen.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href={`/account/rate/${encodeURIComponent(coffeeSlug)}?stars=${stars}`}
          className="inline-block border-2 border-primary text-primary px-6 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all"
        >
          Detailliert bewerten
        </Link>
        <Link
          href="/coffee"
          className="inline-block bg-primary text-on-primary px-6 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-tertiary hover:text-primary transition-all"
        >
          Weitere Coffees
        </Link>
      </div>
    </div>
  );
}

function ThanksPageBody() {
  const params = useSearchParams();
  const error = params.get("error");
  const coffeeSlug = params.get("coffee");
  const starsRaw = params.get("stars");
  const stars = starsRaw ? parseInt(starsRaw, 10) : 0;

  return (
    <div className="bg-[#F9F5F0] min-h-screen flex items-center justify-center p-6">
      {error ? (
        <ErrorMessage code={error} />
      ) : coffeeSlug && stars >= 1 && stars <= 5 ? (
        <SuccessMessage coffeeSlug={coffeeSlug} stars={stars} />
      ) : (
        <ErrorMessage code="invalid_params" />
      )}
    </div>
  );
}

export default function ThanksPage() {
  return (
    <Suspense fallback={null}>
      <ThanksPageBody />
    </Suspense>
  );
}
