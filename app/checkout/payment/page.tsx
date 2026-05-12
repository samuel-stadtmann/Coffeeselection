"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * C-6.5: /checkout/payment ist nach dem Stripe-Umbau redundant —
 * /checkout/review macht die API-Calls und leitet direkt zu Stripe.
 * Diese Page existiert nur noch als Weiterleitung, falls
 * jemand sie direkt aufruft oder von einer alten Stelle aus verlinkt
 * wurde (z.B. /subscription/discovery → /checkout/payment).
 *
 * Falls Cart leer → /checkout/cart, sonst → /checkout/review.
 */
export default function PaymentRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Auf Client warten bis sessionStorage gelesen werden kann.
    if (typeof window === "undefined") return;
    try {
      const raw = window.sessionStorage.getItem("cs.cart.v1");
      const cart = raw ? (JSON.parse(raw) as { items?: unknown[] }) : null;
      const hasItems = !!cart?.items?.length;
      router.replace(hasItems ? "/checkout/review" : "/checkout/cart");
    } catch {
      router.replace("/checkout/cart");
    }
  }, [router]);

  return (
    <div className="bg-[#F9F5F0] min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 mb-4">
          <span className="material-symbols-outlined text-3xl text-primary animate-spin">
            progress_activity
          </span>
        </div>
        <p className="font-headline text-sm uppercase tracking-widest text-on-surface-variant">
          Weiterleitung …
        </p>
        <Link
          href="/checkout/cart"
          className="block mt-4 text-xs underline text-tertiary"
        >
          Falls dies länger dauert: zum Warenkorb
        </Link>
      </div>
    </div>
  );
}
