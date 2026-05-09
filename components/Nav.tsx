"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/brewing-guides", label: "Roasters" },
  { href: "/quiz", label: "Match" },
  { href: "/dashboard", label: "Account" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <header className="fixed top-0 w-full z-[60] flex justify-between items-center px-6 py-4 h-16 bg-[#fdf9f4] dark:bg-[#1a0c03] glass-nav">
      <div className="flex items-center gap-4">
        <button className="md:hidden">
          <span className="material-symbols-outlined text-[#341706] dark:text-[#fdf9f4]">menu</span>
        </button>
        <Link href="/" className="font-serif text-xl font-bold text-[#341706] dark:text-[#fdf9f4] tracking-tighter">
          Digital Sommelier
        </Link>
      </div>
      <nav className="hidden md:flex gap-8 items-center">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`font-sans text-xs uppercase tracking-[0.1em] font-semibold transition-colors duration-300 ${
              pathname === link.href
                ? "text-[#795900]"
                : "text-[#341706]/60 hover:text-[#795900]"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <Link href="/checkout/review">
        <span className="material-symbols-outlined text-[#341706] dark:text-[#fdf9f4]">shopping_bag</span>
      </Link>
    </header>
  );
}
