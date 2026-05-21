"use client";

import Link from "next/link";
import { setDiscoveryIntent } from "@/lib/discovery-intent";

/**
 * CTA-Link, der zusaetzlich das Discovery-Intent in der Session setzt.
 * Verwendet ueberall wo der User explizit den Discovery-Funnel betritt
 * (Home-Section 6, /subscription/discovery — Hero, Bestseller-Cards, Final-CTA).
 */
export default function DiscoveryCtaLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => setDiscoveryIntent()}
    >
      {children}
    </Link>
  );
}
