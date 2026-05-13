/**
 * Zentrale Subscription-Konstanten.
 *
 * Single Source of Truth fuer:
 *   - Abo-Rabatt-Prozentsatz (wird in subscriptions.discount_percent
 *     gesnapshottet, damit Aenderungen hier alte Abos nicht beeinflussen)
 *   - Erlaubte Lieferintervalle (muss zur DB-Constraint passen, siehe
 *     supabase/migrations/20260512000000_subscriptions_stripe_extension.sql)
 *
 * Wenn der Wert hier sich aendert: alle UI-Strings die "10%" hart kodieren
 * suchen und auf SUBSCRIPTION_DISCOUNT_PERCENT umstellen, oder den Text
 * via Template-String generieren.
 */

export const SUBSCRIPTION_DISCOUNT_PERCENT = 10;

/**
 * Multiplikator: regulaerer Preis → Abo-Preis.
 * Beispiel: priceChf * SUBSCRIPTION_DISCOUNT_MULTIPLIER = Abo-Preis.
 */
export const SUBSCRIPTION_DISCOUNT_MULTIPLIER =
  1 - SUBSCRIPTION_DISCOUNT_PERCENT / 100;

/**
 * Erlaubte Lieferintervalle in Wochen.
 * MUSS zur DB-Check-Constraint passen.
 */
export const SUBSCRIPTION_INTERVAL_WEEKS = [1, 2, 4, 6, 8] as const;

export type SubscriptionIntervalWeeks =
  (typeof SUBSCRIPTION_INTERVAL_WEEKS)[number];

/**
 * Label fuer Intervall — kurz fuer Buttons, lang fuer Texte.
 */
export const INTERVAL_LABELS: Record<
  SubscriptionIntervalWeeks,
  { short: string; long: string }
> = {
  1: { short: "Woechentlich", long: "Jede Woche" },
  2: { short: "Alle 2 Wochen", long: "Alle 2 Wochen" },
  4: { short: "Monatlich", long: "Alle 4 Wochen (monatlich)" },
  6: { short: "Alle 6 Wochen", long: "Alle 6 Wochen" },
  8: { short: "Alle 8 Wochen", long: "Alle 8 Wochen" },
};
