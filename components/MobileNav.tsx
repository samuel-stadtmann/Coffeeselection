"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/brewing-guides", label: "Roasters", icon: "local_cafe" },
  { href: "/quiz", label: "Match", icon: "temp_preferences_custom" },
  { href: "/login?next=/account/dashboard", label: "Account", icon: "person" },
];

export default function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pt-3 pb-6 bg-[#fdf9f4]/80 dark:bg-[#1a0c03]/80 backdrop-blur-xl border-t border-[#341706]/10 shadow-[0_-4px_24px_rgba(52,23,6,0.04)]">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex flex-col items-center justify-center transition-all ${
            pathname === item.href
              ? "text-[#795900] font-semibold scale-95"
              : "text-[#341706]/40 hover:text-[#341706]"
          }`}
        >
          <span className="material-symbols-outlined">{item.icon}</span>
          <span className="font-sans text-[10px] font-medium tracking-widest uppercase mt-1">
            {item.label}
          </span>
        </Link>
      ))}
    </nav>
  );
}
