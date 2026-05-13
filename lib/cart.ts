"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * useCart — Hook fuer den Warenkorb-Zustand.
 *
 * Persistenz: SessionStorage unter Key STORAGE_KEY. Bleibt erhalten beim
 * Tab-Reload, ist aber beim Schliessen aller Tabs weg. Reicht fuer den
 * normalen Bestellweg (Browse → Cart → Checkout → Stripe → Success in
 * einer Session). Falls Kunde 30min spaeter zurueckkommt: leerer Cart.
 *
 * Cross-Tab-Sync: Ja, via 'storage'-Event. Wenn Tab A einen Coffee zufuegt,
 * sieht Tab B das.
 *
 * SSR-Safe: useState mit Lazy-Initializer, der nur clientseitig aus dem
 * Storage liest. Auf dem Server liefert er leeren Cart, beim Hydrate
 * korrigiert sich's.
 *
 * NICHT geeignet fuer:
 *   - Subscriptions (Abo-Konfiguration ist eigener State, kommt in Phase 1B)
 *   - Multi-Step-Checkout-Daten ausser Items (z.B. Adresse → useCheckout)
 *   - Server-seitige Cart-Recovery (kein Login = kein Recover; sollten wir
 *     in Phase 2 fuer Auth-User koennen)
 */

const STORAGE_KEY = "cs.cart.v1";

export type CartWeight = 250 | 500 | 1000;

export type CartItem = {
  // Eindeutige ID fuer DIESEN Cart-Eintrag (nicht coffee_id) — erlaubt
  // gleichen Kaffee zweimal mit verschiedenen Mahlgraden / Mengen.
  id: string;
  coffee_id: string;
  coffee_name: string;
  coffee_slug: string;
  image_url: string | null;
  roaster_name: string;
  // Preis fuer 250g Default (Server berechnet bei Order-Create linear hoch).
  unit_price_chf_250g: number;
  weight_g: CartWeight;
  quantity: number;
  grind_preference?: string | null;
  added_at: string; // ISO-Date
};

export type Cart = {
  items: CartItem[];
};

function emptyCart(): Cart {
  return { items: [] };
}

function loadFromStorage(): Cart {
  if (typeof window === "undefined") return emptyCart();
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyCart();
    const parsed = JSON.parse(raw) as Cart;
    if (!parsed || !Array.isArray(parsed.items)) return emptyCart();
    return parsed;
  } catch {
    return emptyCart();
  }
}

function saveToStorage(cart: Cart) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    // Eigenes Event fuer Cross-Hook-Sync im gleichen Tab. SessionStorage
    // triggert kein 'storage'-Event im setzenden Tab.
    window.dispatchEvent(new CustomEvent("cs:cart:change"));
  } catch {
    // Storage voll / privat-modus / etc — wir lassen den State im Memory.
  }
}

export function useCart() {
  const [cart, setCart] = useState<Cart>(emptyCart);
  // 'loaded' wird true nachdem useEffect den initialen Storage-Read gemacht hat.
  // WICHTIG: ohne dieses Flag wuerden Pages die auf items.length===0 redirecten
  // (z.B. /checkout/shipping → /checkout/cart) waehrend des Hydration-Moments
  // false-positiv ausloesen, weil der initiale useState noch leer ist.
  const [loaded, setLoaded] = useState(false);

  // Initial-Load aus Storage (nur clientseitig, vermeidet SSR-Hydration-Mismatch)
  useEffect(() => {
    setCart(loadFromStorage());
    setLoaded(true);
  }, []);

  // Cross-Hook-Sync (gleicher Tab) und Cross-Tab-Sync
  useEffect(() => {
    const sync = () => setCart(loadFromStorage());
    window.addEventListener("storage", sync); // andere Tabs
    window.addEventListener("cs:cart:change", sync); // gleicher Tab, eigenes Event
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("cs:cart:change", sync);
    };
  }, []);

  const update = useCallback((updater: (c: Cart) => Cart) => {
    setCart((prev) => {
      const next = updater(prev);
      saveToStorage(next);
      return next;
    });
  }, []);

  const add = useCallback(
    (item: Omit<CartItem, "id" | "added_at">) => {
      update((c) => {
        // Wenn coffee_id + weight_g + grind schon im Cart: nur Menge erhoehen
        const existingIdx = c.items.findIndex(
          (i) =>
            i.coffee_id === item.coffee_id &&
            i.weight_g === item.weight_g &&
            (i.grind_preference ?? null) === (item.grind_preference ?? null)
        );
        if (existingIdx >= 0) {
          const updated = [...c.items];
          updated[existingIdx] = {
            ...updated[existingIdx],
            quantity: updated[existingIdx].quantity + item.quantity,
          };
          return { ...c, items: updated };
        }
        // Sonst: neues CartItem mit frischer ID
        const newItem: CartItem = {
          ...item,
          id: cryptoRandomId(),
          added_at: new Date().toISOString(),
        };
        return { ...c, items: [...c.items, newItem] };
      });
    },
    [update]
  );

  const remove = useCallback(
    (itemId: string) => {
      update((c) => ({ ...c, items: c.items.filter((i) => i.id !== itemId) }));
    },
    [update]
  );

  const updateQty = useCallback(
    (itemId: string, quantity: number) => {
      if (quantity < 1) return remove(itemId);
      if (quantity > 20) quantity = 20; // sane upper bound
      update((c) => ({
        ...c,
        items: c.items.map((i) =>
          i.id === itemId ? { ...i, quantity } : i
        ),
      }));
    },
    [update, remove]
  );

  const updateWeight = useCallback(
    (itemId: string, weight_g: CartWeight) => {
      update((c) => ({
        ...c,
        items: c.items.map((i) =>
          i.id === itemId ? { ...i, weight_g } : i
        ),
      }));
    },
    [update]
  );

  const updateGrind = useCallback(
    (itemId: string, grind_preference: string | null) => {
      update((c) => ({
        ...c,
        items: c.items.map((i) =>
          i.id === itemId ? { ...i, grind_preference } : i
        ),
      }));
    },
    [update]
  );

  const clear = useCallback(() => {
    update(() => emptyCart());
  }, [update]);

  // Berechnete Werte
  const count = cart.items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cart.items.reduce((s, i) => {
    const weightFactor = i.weight_g / 250;
    return s + i.unit_price_chf_250g * weightFactor * i.quantity;
  }, 0);

  return {
    items: cart.items,
    count,
    subtotal: Number(subtotal.toFixed(2)),
    loaded,
    add,
    remove,
    updateQty,
    updateWeight,
    updateGrind,
    clear,
  };
}

function cryptoRandomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback fuer ganz alte Browser
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
