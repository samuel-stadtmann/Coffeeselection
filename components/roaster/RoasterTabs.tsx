"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { href: string; label: string };

const TABS: Tab[] = [
  { href: "/roaster/dashboard", label: "Übersicht" },
  { href: "/roaster/coffees", label: "Meine Coffees" },
];

export default function RoasterTabs() {
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
