"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
  return (
    <aside className="hidden md:flex flex-col h-screen pt-20 pb-8 px-4 w-64 fixed left-0 top-0 bg-[#fdf9f4] dark:bg-[#1a0b03] border-r border-outline-variant/20 z-40">
      <div className="mb-8 px-2">
        <p className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold">
          Roaster Portal
        </p>
      </div>
      <nav className="flex flex-col gap-1">
        {sidebarLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
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
  );
}
