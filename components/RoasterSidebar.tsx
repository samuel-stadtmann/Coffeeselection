"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const sidebarLinks = [
  { href: "/roaster", label: "Dashboard", icon: "dashboard" },
  { href: "/roaster/analytics", label: "Analytics", icon: "bar_chart" },
  { href: "/roaster/settings", label: "Settings", icon: "settings" },
  { href: "/admin/forecast", label: "Order Forecast", icon: "trending_up" },
  { href: "/admin/production", label: "Production Queue", icon: "inventory_2" },
  { href: "/admin/revenue", label: "Revenue", icon: "payments" },
  { href: "/admin/shipping", label: "Shipping Center", icon: "local_shipping" },
];

export default function RoasterSidebar() {
  const pathname = usePathname();
  // Mobile: Sidebar ist ein einblendbares Overlay. Auf md+ immer sichtbar.
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile-Hamburger — nur < md, oeffnet das Sidebar-Overlay */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Menü öffnen"
        className="md:hidden fixed top-4 left-4 z-50 bg-primary text-on-primary p-2 shadow-lg"
      >
        <span className="material-symbols-outlined">menu</span>
      </button>

      {/* Backdrop — nur wenn offen, nur Mobile */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          aria-hidden="true"
        />
      )}

      {/* Sidebar: md+ immer sichtbar (fixed), < md als Slide-In-Overlay */}
      <aside
        className={`flex flex-col h-screen pt-20 pb-8 px-4 w-64 fixed left-0 top-0 bg-[#fdf9f4] dark:bg-[#1a0b03] border-r border-outline-variant/20 z-40 transition-transform duration-300 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 px-2 flex items-center justify-between">
          <p className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold">
            Roaster Portal
          </p>
          {/* Close — nur Mobile */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Menü schließen"
            className="md:hidden text-on-surface-variant hover:text-primary"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        <nav className="flex flex-col gap-1">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                pathname === link.href
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-primary"
              }`}
            >
              <span className="material-symbols-outlined text-xl">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
