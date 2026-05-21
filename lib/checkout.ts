"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * useCheckout — Hook fuer Checkout-Daten (Kunde + Adressen) ueber 4-Step-Flow.
 *
 * Persistiert in SessionStorage, gleiches Muster wie useCart. Cart-Items
 * leben in cs.cart.v1; Checkout-Daten (Adresse + Email) in cs.checkout.v1.
 * Trennung weil:
 *   - Cart wird haeufig veraendert (item add/remove/qty)
 *   - Checkout-Daten nur in Shipping-Step + nicht so haeufig
 *   - Server-Schema-Trennung: cart-items vs order_create-body.customer/address
 */

const STORAGE_KEY = "cs.checkout.v1";

export type CheckoutAddress = {
  recipient_name: string;
  company: string;
  street: string;
  street_additional: string;
  postal_code: string;
  city: string;
  region: string;
  country: string; // ISO-2 (CH, DE, AT, FR, IT, LI, ...)
  delivery_instructions: string;
};

export type CheckoutCustomer = {
  email: string;
  first_name: string;
  last_name: string;
  language: "de-CH" | "fr-CH" | "it-CH" | "en";
  marketing_opt_in: boolean;
};

export type CheckoutData = {
  customer: CheckoutCustomer;
  shipping_address: CheckoutAddress;
  billing_address_same_as_shipping: boolean;
  billing_address: CheckoutAddress;
  customer_note: string;
};

const EMPTY_ADDRESS: CheckoutAddress = {
  recipient_name: "",
  company: "",
  street: "",
  street_additional: "",
  postal_code: "",
  city: "",
  region: "",
  country: "CH",
  delivery_instructions: "",
};

const EMPTY_DATA: CheckoutData = {
  customer: {
    email: "",
    first_name: "",
    last_name: "",
    language: "de-CH",
    marketing_opt_in: false,
  },
  shipping_address: EMPTY_ADDRESS,
  billing_address_same_as_shipping: true,
  billing_address: EMPTY_ADDRESS,
  customer_note: "",
};

function loadFromStorage(): CheckoutData {
  if (typeof window === "undefined") return EMPTY_DATA;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_DATA;
    const parsed = JSON.parse(raw) as Partial<CheckoutData>;
    // Defensive Merge — falls Schema sich aendert, keine kaputten States
    return {
      customer: { ...EMPTY_DATA.customer, ...parsed.customer },
      shipping_address: {
        ...EMPTY_DATA.shipping_address,
        ...parsed.shipping_address,
      },
      billing_address_same_as_shipping:
        parsed.billing_address_same_as_shipping ??
        EMPTY_DATA.billing_address_same_as_shipping,
      billing_address: {
        ...EMPTY_DATA.billing_address,
        ...parsed.billing_address,
      },
      customer_note: parsed.customer_note ?? "",
    };
  } catch {
    return EMPTY_DATA;
  }
}

function saveToStorage(data: CheckoutData) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("cs:checkout:change"));
  } catch {
    // ignore
  }
}

export function useCheckout() {
  const [data, setData] = useState<CheckoutData>(EMPTY_DATA);
  // 'loaded' Flag — verhindert false-positive redirects waehrend Hydration.
  // Siehe useCart fuer Erklaerung des Patterns.
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setData(loadFromStorage());
    setLoaded(true);
  }, []);

  useEffect(() => {
    const sync = () => setData(loadFromStorage());
    window.addEventListener("storage", sync);
    window.addEventListener("cs:checkout:change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("cs:checkout:change", sync);
    };
  }, []);

  const update = useCallback((updater: (d: CheckoutData) => CheckoutData) => {
    setData((prev) => {
      const next = updater(prev);
      saveToStorage(next);
      return next;
    });
  }, []);

  const setCustomer = useCallback(
    (patch: Partial<CheckoutCustomer>) => {
      update((d) => ({ ...d, customer: { ...d.customer, ...patch } }));
    },
    [update]
  );

  const setShippingAddress = useCallback(
    (patch: Partial<CheckoutAddress>) => {
      update((d) => ({
        ...d,
        shipping_address: { ...d.shipping_address, ...patch },
      }));
    },
    [update]
  );

  const setBillingAddress = useCallback(
    (patch: Partial<CheckoutAddress>) => {
      update((d) => ({
        ...d,
        billing_address: { ...d.billing_address, ...patch },
      }));
    },
    [update]
  );

  const setBillingSameAsShipping = useCallback(
    (same: boolean) => {
      update((d) => ({ ...d, billing_address_same_as_shipping: same }));
    },
    [update]
  );

  const setCustomerNote = useCallback(
    (note: string) => {
      update((d) => ({ ...d, customer_note: note }));
    },
    [update]
  );

  const clear = useCallback(() => {
    update(() => EMPTY_DATA);
  }, [update]);

  // Validierung — fuer "Weiter"-Buttons in den Pages
  const shippingValid =
    data.customer.email.includes("@") &&
    data.shipping_address.recipient_name.trim().length > 0 &&
    data.shipping_address.street.trim().length > 0 &&
    data.shipping_address.postal_code.trim().length > 0 &&
    data.shipping_address.city.trim().length > 0 &&
    data.shipping_address.country.length === 2;

  const billingValid =
    data.billing_address_same_as_shipping ||
    (data.billing_address.recipient_name.trim().length > 0 &&
      data.billing_address.street.trim().length > 0 &&
      data.billing_address.postal_code.trim().length > 0 &&
      data.billing_address.city.trim().length > 0);

  return {
    data,
    loaded,
    setCustomer,
    setShippingAddress,
    setBillingAddress,
    setBillingSameAsShipping,
    setCustomerNote,
    clear,
    shippingValid,
    billingValid,
    isComplete: shippingValid && billingValid,
  };
}
