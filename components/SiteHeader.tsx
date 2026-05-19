"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { createClient } from "@/lib/supabase/client";

/**
 * Einheitlicher Public-Site-Header. Wird auf allen oeffentlichen Seiten
 * eingebunden ausser /quiz/*, /admin/*, /roaster/* (Portal),
 * /account/* (AccountLayout) und /checkout/* (fokussierter Flow).
 *
 * Struktur 1:1 wie ursprueglich auf /:
 *   - Logo (links)
 *   - Nav-Links (Coffees/Geschmackstypen/Roester/Vergleiche/Magazine) ab xl
 *   - Person-Icon (md+), Cart-Icon, Quiz-Button
 *   - Hamburger + Dropdown unter xl
 */

const LOGO = "/logo.png";

const navLinks = [
  { href: "/coffee", label: "Coffees" },
  { href: "/taste-types", label: "Geschmackstypen" },
  { href: "/roasters", label: "Röster" },
  { href: "/compare", label: "Vergleiche" },
  { href: "/learn", label: "Magazine" },
];

export default function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { count: cartCount } = useCart();
  // Auth-State: wenn eingeloggt, geht das Person-Icon direkt auf
  // /account/dashboard statt durch den Login-Loop (Mattia's Bug: jeder
  // Klick auf das Icon hat ihn zur Anmeldemaske geschickt obwohl die
  // Session frisch war).
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setLoggedIn(!!data.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!cancelled) setLoggedIn(!!session?.user);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);
  const accountHref = loggedIn
    ? "/account/dashboard"
    : "/login?next=/account/dashboard";
  return (
    <header className="fixed top-0 w-full z-50 h-20 md:h-24 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5">
      <nav className="flex justify-between items-center gap-3 h-full max-w-7xl mx-auto px-6 md:px-8 w-full">
        <Link href="/" className="flex items-center shrink-0 h-full overflow-hidden">
          <img
            alt="Coffee Selection Logo"
            className="h-12 sm:h-14 md:h-16 lg:h-20 w-auto object-contain object-left shrink-0"
            src={LOGO}
          />
        </Link>
        {/* Desktop-Nav: erst ab xl (1280px) — bei lg/Tablet zu eng */}
        <div className="hidden xl:flex items-center gap-x-8 mr-auto pl-8 xl:pl-12">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-primary hover:text-tertiary transition-colors font-headline font-bold tracking-widest uppercase text-[14px] whitespace-nowrap"
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-x-3 sm:gap-x-4 md:gap-x-5 shrink-0">
          <Link
            href={accountHref}
            className="hidden md:block"
            aria-label="Mein Konto"
          >
            <span className="material-symbols-outlined text-primary text-2xl hover:text-tertiary transition-colors">
              person
            </span>
          </Link>
          <Link
            href="/checkout/cart"
            aria-label={cartCount > 0 ? `Warenkorb (${cartCount})` : "Warenkorb"}
            className="relative"
          >
            <span className="material-symbols-outlined text-primary text-2xl hover:text-tertiary transition-colors">
              shopping_bag
            </span>
            {cartCount > 0 && (
              <span
                className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 bg-tertiary text-on-primary font-headline font-bold text-[10px] flex items-center justify-center rounded-full"
                aria-hidden
              >
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
          <Link
            href="/quiz/question-1-brewing-method"
            className="bg-primary text-white px-3 sm:px-5 md:px-6 py-2.5 md:py-3 text-[10px] sm:text-[11px] md:text-[12px] uppercase tracking-[0.15em] sm:tracking-[0.2em] font-headline font-bold hover:bg-black transition-all whitespace-nowrap"
          >
            Quiz starten
          </Link>
          {/* Hamburger — nur < xl */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="xl:hidden text-primary hover:text-tertiary transition-colors"
            aria-label="Menü"
            aria-expanded={mobileMenuOpen}
          >
            <span className="material-symbols-outlined text-3xl">
              {mobileMenuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </nav>
      {/* Mobile/Tablet-Dropdown */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#F9F5F0] border-b border-primary/10 shadow-lg">
          <div className="max-w-7xl mx-auto px-6 md:px-8 py-4 flex flex-col">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-primary hover:text-tertiary transition-colors font-headline font-bold tracking-widest uppercase text-sm py-3 border-b border-primary/5 last:border-b-0"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href={accountHref}
              onClick={() => setMobileMenuOpen(false)}
              className="text-primary hover:text-tertiary transition-colors font-headline font-bold tracking-widest uppercase text-sm py-3 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">person</span>
              Mein Konto
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
