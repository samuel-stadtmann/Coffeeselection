"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/account/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/account/taste-profile", label: "Geschmacksprofil", icon: "psychology" },
  { href: "/account/subscription", label: "Mein Abo", icon: "autorenew" },
  { href: "/account/order-history", label: "Bestellungen", icon: "receipt_long" },
  { href: "/account/favorites", label: "Favoriten", icon: "favorite" },
  { href: "/account/recommendation-history", label: "Empfehlungen", icon: "auto_awesome" },
  { href: "/account/referrals", label: "Referrals", icon: "share" },
  { href: "/account/rewards", label: "Rewards", icon: "redeem" },
  { href: "/account/settings", label: "Einstellungen", icon: "settings" },
];

/**
 * Konto-Navigation fuer Mobile/Tablet (< lg).
 *
 * Ersetzt das frueher seitenfuellende Vertikalmenue, das den gesamten
 * ersten Screen einnahm — sticky horizontale Tab-Leiste direkt unter dem
 * Header, konsistent mit dem Admin-/Roester-Portal. Wird in AccountLayout
 * ausserhalb des Grids gerendert, damit `sticky` ueber die ganze
 * Seitenhoehe greift (im kurzen Grid-Item haette es keinen Reiseweg).
 */
export default function AccountMobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const isActive = (href: string) =>
    pathname === href ||
    (href !== "/account/dashboard" && (pathname?.startsWith(href) ?? false));

  return (
    <div className="lg:hidden sticky top-20 md:top-24 z-30 mb-6 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5">
      <div className="max-w-7xl mx-auto flex items-center overflow-x-auto no-scrollbar px-6 md:px-8">
        {links.map((l) => {
          const active = isActive(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-2 shrink-0 px-3 py-3.5 font-headline text-[11px] uppercase tracking-wider font-bold border-b-2 transition-colors ${
                active
                  ? "border-tertiary text-primary"
                  : "border-transparent text-on-surface-variant hover:text-primary"
              }`}
            >
              <span className="material-symbols-outlined text-lg">{l.icon}</span>
              {l.label}
            </Link>
          );
        })}
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-2 shrink-0 px-3 py-3.5 ml-1 border-l border-surface-container font-headline text-[11px] uppercase tracking-wider font-bold text-on-surface-variant hover:text-tertiary transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          {signingOut ? "…" : "Abmelden"}
        </button>
      </div>
    </div>
  );
}
