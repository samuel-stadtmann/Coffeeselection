"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// 4 Haupt-Tabs in der Bottom-Bar, der Rest wandert ins "Mehr"-Sheet.
const primary = [
  { href: "/account/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/account/subscription", label: "Abo", icon: "autorenew" },
  { href: "/account/order-history", label: "Bestellungen", icon: "receipt_long" },
  { href: "/account/favorites", label: "Favoriten", icon: "favorite" },
];
const more = [
  { href: "/account/taste-profile", label: "Geschmacksprofil", icon: "psychology" },
  { href: "/account/recommendation-history", label: "Empfehlungen", icon: "auto_awesome" },
  { href: "/account/referrals", label: "Referrals", icon: "share" },
  { href: "/account/rewards", label: "Rewards", icon: "redeem" },
  { href: "/account/settings", label: "Einstellungen", icon: "settings" },
];

/**
 * Konto-Navigation fuer Mobile/Tablet (< lg) als App-artige Bottom-Tab-Bar.
 *
 * Ersetzt das frueher seitenfuellende Vertikalmenue, das den gesamten
 * ersten Screen einnahm. 4 Haupt-Tabs sind immer erreichbar, "Mehr"
 * oeffnet die restlichen Punkte + Abmelden als Bottom-Sheet. Ab lg
 * uebernimmt wieder die vertikale Sidebar.
 *
 * Konsumenten muessen unten >= 5rem Platz lassen (pb-20), damit die fixe
 * Bar keinen Content verdeckt.
 */
export default function AccountMobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Body-Scroll sperren solange das Sheet offen ist.
  useEffect(() => {
    if (!sheetOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sheetOpen]);

  const isActive = (href: string) =>
    pathname === href ||
    (href !== "/account/dashboard" && (pathname?.startsWith(href) ?? false));
  const moreActive = more.some((m) => isActive(m.href));

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const tabClass = (active: boolean) =>
    `flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${
      active ? "text-tertiary" : "text-on-surface-variant"
    }`;

  return (
    <>
      {/* "Mehr"-Sheet */}
      {sheetOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button
            aria-label="Menü schließen"
            className="absolute inset-0 bg-black/40"
            onClick={() => setSheetOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <span className="font-headline text-[11px] uppercase tracking-[0.3em] text-on-surface-variant font-bold">
                Mein Konto
              </span>
              <button
                aria-label="Schließen"
                onClick={() => setSheetOpen(false)}
                className="text-on-surface-variant hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <nav className="pb-2">
              {more.map((l) => {
                const active = isActive(l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setSheetOpen(false)}
                    className={`flex items-center gap-3 px-6 py-3.5 font-headline text-[12px] uppercase tracking-widest font-bold border-l-4 transition-colors ${
                      active
                        ? "border-tertiary bg-tertiary/5 text-primary"
                        : "border-transparent text-on-surface-variant"
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{l.icon}</span>
                    {l.label}
                  </Link>
                );
              })}
            </nav>
            <div className="px-6 py-4 border-t border-surface-container">
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex items-center gap-2 font-headline text-[11px] uppercase tracking-widest text-on-surface-variant hover:text-tertiary transition-colors font-bold disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">logout</span>
                {signingOut ? "Wird abgemeldet…" : "Abmelden"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom-Tab-Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F9F5F0]/95 backdrop-blur-md border-t border-primary/10 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-stretch">
          {primary.map((l) => {
            const active = isActive(l.href);
            return (
              <Link key={l.href} href={l.href} className={tabClass(active)}>
                <span className="material-symbols-outlined text-xl">{l.icon}</span>
                <span className="font-headline text-[9px] uppercase tracking-tight font-bold leading-none text-center">
                  {l.label}
                </span>
              </Link>
            );
          })}
          <button
            onClick={() => setSheetOpen(true)}
            className={tabClass(moreActive || sheetOpen)}
          >
            <span className="material-symbols-outlined text-xl">more_horiz</span>
            <span className="font-headline text-[9px] uppercase tracking-tight font-bold leading-none">
              Mehr
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
