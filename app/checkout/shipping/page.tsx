"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Legacy-Route — seit dem Single-Page-Checkout-Refactor ist die Adress-Form
 * direkt auf /checkout/review eingebettet. Diese Page existiert nur noch
 * als Redirect, damit alte Links (Mail-Footer, Bookmarks, Stripe-Cancel)
 * nicht ins Leere zeigen.
 */
export default function ShippingRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/checkout/review");
  }, [router]);
  return null;
}
