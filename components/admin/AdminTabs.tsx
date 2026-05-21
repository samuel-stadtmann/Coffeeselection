"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Tab-Navigation oben in der Admin-Sektion. Aktive-Markierung via
 * usePathname (Client). Tabs sind im Code definiert — wenn wir neue
 * Admin-Bereiche bauen, hier die Eintraege ergaenzen.
 */
type Tab = { href: string; label: string };

const TABS: Tab[] = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/customers", label: "Kunden" },
  { href: "/admin/metrics", label: "Algorithmus" },
  { href: "/admin/coffees", label: "Coffees" },
  { href: "/admin/roasters", label: "Röster" },
  { href: "/admin/marketing", label: "Marketing" },
  { href: "/admin/rewards", label: "Rewards" },
  { href: "/admin/health", label: "System" },
];

export default function AdminTabs() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-primary/10 mb-12 overflow-x-auto">
      <ul className="flex gap-2 -mb-px whitespace-nowrap">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={
                  "block px-5 py-3 font-headline text-[11px] font-bold uppercase tracking-[0.2em] border-b-2 transition-colors " +
                  (active
                    ? "text-primary border-tertiary"
                    : "text-on-surface-variant border-transparent hover:text-primary hover:border-primary/20")
                }
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
