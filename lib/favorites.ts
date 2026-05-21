"use client";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "cs_favorites_v1";
const EVENT = "cs:favorites:change";

type FavState = {
  coffeeIds: string[];
  roasterIds: string[];
  loaded: boolean;
};

function load(): FavState {
  if (typeof window === "undefined") {
    return { coffeeIds: [], roasterIds: [], loaded: false };
  }
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { coffeeIds: [], roasterIds: [], loaded: false };
    const parsed = JSON.parse(raw);
    return {
      coffeeIds: Array.isArray(parsed.coffeeIds) ? parsed.coffeeIds : [],
      roasterIds: Array.isArray(parsed.roasterIds) ? parsed.roasterIds : [],
      loaded: true,
    };
  } catch {
    return { coffeeIds: [], roasterIds: [], loaded: false };
  }
}

function save(s: FavState) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ coffeeIds: s.coffeeIds, roasterIds: s.roasterIds })
    );
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    /* storage voll / privat-modus */
  }
}

/**
 * Hook fuer Coffee/Roaster-Favoriten. Pattern wie useCart:
 *   - SessionStorage als Memo (sofort sichtbar nach erstem Load)
 *   - DB-Sync on mount (RLS filtert auf eigene Zeilen)
 *   - Toggle schreibt optimistisch + Server, dispatcht Event fuer Cross-Hook-Sync
 *   - Nicht eingeloggte User: Toggle redirected via Caller (Button-Komponente)
 *     auf /login, hier nur read-only Hinweis via loggedIn-Flag.
 */
export function useFavorites() {
  const [state, setState] = useState<FavState>(load);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  // 1) Cross-Tab/Hook-Sync via Custom-Event
  useEffect(() => {
    const handler = () => setState(load());
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  // 2) Initial-Sync von der DB
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!auth.user) {
        setLoggedIn(false);
        setState({ coffeeIds: [], roasterIds: [], loaded: true });
        save({ coffeeIds: [], roasterIds: [], loaded: true });
        return;
      }
      setLoggedIn(true);
      const [{ data: cs }, { data: rs }] = await Promise.all([
        supabase.from("customer_favorite_coffees").select("coffee_id"),
        supabase.from("customer_favorite_roasters").select("roaster_id"),
      ]);
      if (cancelled) return;
      const next: FavState = {
        coffeeIds: (cs ?? []).map((r: { coffee_id: string }) => r.coffee_id),
        roasterIds: (rs ?? []).map((r: { roaster_id: string }) => r.roaster_id),
        loaded: true,
      };
      setState(next);
      save(next);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isCoffeeFavorite = useCallback(
    (coffeeId: string) => state.coffeeIds.includes(coffeeId),
    [state.coffeeIds]
  );
  const isRoasterFavorite = useCallback(
    (roasterId: string) => state.roasterIds.includes(roasterId),
    [state.roasterIds]
  );

  const toggleCoffee = useCallback(async (coffeeId: string): Promise<boolean> => {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return false;
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("auth_user_id", auth.user.id)
      .single();
    if (!customer) return false;

    const isFav = state.coffeeIds.includes(coffeeId);
    // Optimistisches Update
    const nextIds = isFav
      ? state.coffeeIds.filter((id) => id !== coffeeId)
      : [...state.coffeeIds, coffeeId];
    const next = { ...state, coffeeIds: nextIds, loaded: true };
    setState(next);
    save(next);

    // Server-Sync
    if (isFav) {
      await supabase
        .from("customer_favorite_coffees")
        .delete()
        .eq("customer_id", customer.id)
        .eq("coffee_id", coffeeId);
      return false;
    } else {
      await supabase
        .from("customer_favorite_coffees")
        .insert({ customer_id: customer.id, coffee_id: coffeeId });
      return true;
    }
  }, [state]);

  const toggleRoaster = useCallback(async (roasterId: string): Promise<boolean> => {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return false;
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("auth_user_id", auth.user.id)
      .single();
    if (!customer) return false;

    const isFav = state.roasterIds.includes(roasterId);
    const nextIds = isFav
      ? state.roasterIds.filter((id) => id !== roasterId)
      : [...state.roasterIds, roasterId];
    const next = { ...state, roasterIds: nextIds, loaded: true };
    setState(next);
    save(next);

    if (isFav) {
      await supabase
        .from("customer_favorite_roasters")
        .delete()
        .eq("customer_id", customer.id)
        .eq("roaster_id", roasterId);
      return false;
    } else {
      await supabase
        .from("customer_favorite_roasters")
        .insert({ customer_id: customer.id, roaster_id: roasterId });
      return true;
    }
  }, [state]);

  return {
    loaded: state.loaded,
    loggedIn,
    coffeeIds: state.coffeeIds,
    roasterIds: state.roasterIds,
    isCoffeeFavorite,
    isRoasterFavorite,
    toggleCoffee,
    toggleRoaster,
  };
}
