import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import RoasterLoginForm from "./RoasterLoginForm";
import { getRoasterUser } from "@/lib/roaster/auth";

export const metadata: Metadata = {
  title: "Röster-Portal · Login — Coffee Selection",
  robots: { index: false, follow: false },
};

const LOGO = "/logo.png";

export default async function RoasterLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  // Schon eingeloggt + Roester-User -> direkt ins Portal.
  const existing = await getRoasterUser();
  if (existing) redirect(next || "/roaster/dashboard");

  return (
    <div className="bg-[#F9F5F0] min-h-screen flex flex-col">
      <header className="border-b border-primary/5 overflow-hidden">
        <nav className="flex justify-between items-center max-w-7xl mx-auto px-6 md:px-8">
          <Link href="/" className="flex items-center shrink-0 h-full overflow-hidden">
            <img
              alt="Coffee Selection"
              className="h-12 sm:h-14 md:h-16 lg:h-20 w-auto object-contain object-left"
              src={LOGO}
            />
          </Link>
          <span className="font-headline text-[10px] uppercase tracking-[0.3em] text-tertiary font-bold">
            Röster-Portal
          </span>
        </nav>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
            B2B · Partner-Login
          </span>
          <h1 className="text-3xl md:text-4xl text-primary uppercase tracking-tight font-headline font-bold mb-3">
            Willkommen zurück
          </h1>
          <p className="text-on-surface-variant text-sm mb-8 leading-relaxed">
            Logge dich ein um dein Sortiment zu pflegen — neue Coffees einreichen,
            Preise aktualisieren, Geschmacksprofile anpassen.
          </p>

          {error === "not_roaster" && (
            <div className="bg-rose-50 border-l-4 border-rose-400 p-4 mb-6 text-sm text-rose-900">
              Dein Account ist nicht als Röster freigeschaltet. Falls das ein
              Fehler ist, melde dich bei{" "}
              <a
                href="mailto:hello@coffeeselection.ch"
                className="underline hover:text-tertiary"
              >
                hello@coffeeselection.ch
              </a>
              .
            </div>
          )}

          <RoasterLoginForm nextPath={next || "/roaster/dashboard"} />

          <div className="mt-8 pt-6 border-t border-primary/10 text-xs text-on-surface-variant">
            <p className="mb-1">
              <strong>Noch kein Zugang?</strong>
            </p>
            <p>
              Schreib uns an{" "}
              <a
                href="mailto:hello@coffeeselection.ch"
                className="underline hover:text-tertiary"
              >
                hello@coffeeselection.ch
              </a>{" "}
              — wir richten dich als Partner ein.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
