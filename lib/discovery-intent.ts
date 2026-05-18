"use client";

/**
 * Discovery-Intent — speichert in der Browser-Session, dass der User aus
 * dem Discovery-Funnel kommt (Home-Section 6 oder /subscription/discovery).
 *
 * Wird in:
 *   - CoffeePurchaseOptions: preselect Tab "Discovery"
 *   - match-result: preselect Order-Type "subscription" + is_discovery
 *
 * Lebenszeit: SessionStorage — bleibt fuer den ganzen Browse-Pfad bis
 * Bestellung erhalten, ist beim naechsten Besuch weg.
 *
 * Tip: NICHT als URL-Param weitergeben, weil der Quiz-Flow den Param
 * nach jeder Frage verlieren wuerde.
 */

const KEY = "cs.intent.discovery";

export function setDiscoveryIntent() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, "1");
  } catch {
    // Privat-Modus etc — best-effort
  }
}

export function clearDiscoveryIntent() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // best-effort
  }
}

export function hasDiscoveryIntent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}
