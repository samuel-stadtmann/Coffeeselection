"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart, lineTotal } from "@/lib/cart";
import { useCheckout, type CheckoutAddress } from "@/lib/checkout";
import { INTERVAL_LABELS } from "@/lib/subscription-constants";

const LOGO = "/logo.png";
const COFFEE_FALLBACK_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC-mgzdszeDV-ADPnt08LksEtq5jHo_pZiXrnzVNy7faF7CAvNwCIqw0tZ2ylgRbHNuI-cdksgJ49bjfH36AYZerX9qRPq7kE2svCJ2KsLCMhI2k4Dc50D2D5FEGms1FJKDbeS75aSghLNY7Dop_dxhV5e-766gOscbYVVzn4qpX1rtPcumcDu7hr6OQeoiBzbRrze7HIkmFAM9YOYzQFzRF1wR3U1Ec53bS5Aj9xRlWvn7KxLIHJL79Wy6T8BFR47-ulGO1PjIJKEL";
const FREE_SHIPPING_THRESHOLD_CHF = 100;
const STANDARD_SHIPPING_CHF = 6.9;

/**
 * C-6.4: /checkout/review
 *
 * Vorletzter Schritt. Zeigt Items + Adressen + Total. Klick "Bezahlen":
 *   1. POST /api/orders/create   → bekommt order_id
 *   2. POST /api/checkout/session → bekommt Stripe-checkout_url
 *   3. window.location.href = checkout_url  (Stripe-Hosted-Page)
 *
 * Loading-State zeigt waehrend der API-Calls. Error-State falls etwas zickt.
 *
 * Guards:
 *   - Cart leer       → redirect /checkout/cart
 *   - Shipping unvollst. → redirect /checkout/shipping
 */

export default function ReviewPage() {
  const router = useRouter();
  const { items, subtotal, loaded: cartLoaded } = useCart();
  const { data, loaded: checkoutLoaded, shippingValid, billingValid } = useCheckout();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shipping =
    subtotal >= FREE_SHIPPING_THRESHOLD_CHF || subtotal === 0
      ? 0
      : STANDARD_SHIPPING_CHF;
  const total = subtotal + shipping;

  // Guards (erst nach Hydration — siehe useCart-Kommentar zum loaded-Flag).
  useEffect(() => {
    if (!cartLoaded || !checkoutLoaded) return;
    if (items.length === 0) {
      router.replace("/checkout/cart");
      return;
    }
    if (!shippingValid || !billingValid) {
      router.replace("/checkout/shipping");
    }
  }, [
    cartLoaded,
    checkoutLoaded,
    items.length,
    shippingValid,
    billingValid,
    router,
  ]);

  const handlePay = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      // 1) Order anlegen
      const orderRes = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((it) => ({
            coffee_id: it.coffee_id,
            quantity: it.quantity,
            weight_g: it.weight_g,
            grind_preference: it.grind_preference ?? null,
            is_subscription: it.is_subscription ?? false,
            interval_weeks: it.interval_weeks,
            discount_percent: it.discount_percent,
          })),
          customer: {
            email: data.customer.email,
            first_name: data.customer.first_name || null,
            last_name: data.customer.last_name || null,
            language: data.customer.language,
            marketing_opt_in: data.customer.marketing_opt_in,
          },
          shipping_address: {
            recipient_name: data.shipping_address.recipient_name,
            company: data.shipping_address.company || null,
            street: data.shipping_address.street,
            street_additional: data.shipping_address.street_additional || null,
            postal_code: data.shipping_address.postal_code,
            city: data.shipping_address.city,
            region: data.shipping_address.region || null,
            country: data.shipping_address.country,
            delivery_instructions:
              data.shipping_address.delivery_instructions || null,
          },
          billing_address_same_as_shipping:
            data.billing_address_same_as_shipping,
          billing_address: data.billing_address_same_as_shipping
            ? null
            : {
                recipient_name: data.billing_address.recipient_name,
                company: data.billing_address.company || null,
                street: data.billing_address.street,
                street_additional:
                  data.billing_address.street_additional || null,
                postal_code: data.billing_address.postal_code,
                city: data.billing_address.city,
                region: data.billing_address.region || null,
                country: data.billing_address.country,
                delivery_instructions:
                  data.billing_address.delivery_instructions || null,
              },
          customer_note: data.customer_note || null,
        }),
      }).then((r) => r.json());

      if (!orderRes.success || !orderRes.order_id) {
        const detail =
          typeof orderRes.details === "string"
            ? ` (${orderRes.details})`
            : "";
        throw new Error(
          `Bestellung konnte nicht angelegt werden: ${
            orderRes.error ?? "Unbekannter Fehler"
          }${detail}`
        );
      }

      // 2) Stripe Checkout Session
      const sessRes = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderRes.order_id }),
      }).then((r) => r.json());

      if (!sessRes.checkout_url) {
        const detail =
          typeof sessRes.details === "string" ? ` (${sessRes.details})` : "";
        throw new Error(
          `Zahlungs-Sitzung konnte nicht erstellt werden: ${
            sessRes.error ?? "Unbekannter Fehler"
          }${detail}`
        );
      }

      // 3) Redirect zur Stripe-Hosted-Page. Wir setzen window.location.href
      // (kein router.push) damit der Browser komplett zur fremden Domain wechselt.
      window.location.href = sessRes.checkout_url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[checkout/review] pay-flow error", err);
      setError(msg);
      setSubmitting(false);
    }
  };

  // Render-Guard: erst nach Hydration anwenden, sonst Flash-of-blank-page
  if (cartLoaded && items.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#F9F5F0] text-on-surface min-h-screen pb-32 md:pb-12">
      <header className="fixed top-0 w-full z-50 h-20 md:h-24 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5">
        <div className="flex justify-between items-center gap-3 h-full max-w-7xl mx-auto px-6 md:px-8 w-full">
          <Link href="/" className="flex items-center shrink-0 h-full overflow-hidden">
            <img
              alt="Coffee Selection"
              className="h-12 sm:h-16 md:h-28 lg:h-40 w-auto object-contain object-left"
              src={LOGO}
            />
          </Link>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-base text-tertiary">
              lock
            </span>
            <span className="font-headline text-[11px] uppercase tracking-[0.2em] font-bold">
              Sichere Zahlung
            </span>
          </div>
        </div>
      </header>

      <main className="pt-20 md:pt-24">
        <Stepper active={2} />

        <div className="max-w-3xl mx-auto px-6 md:px-8">
          <div className="mb-8">
            <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-3 block">
              Schritt 3 · Übersicht
            </span>
            <h1 className="text-3xl md:text-5xl text-primary mb-2 font-headline font-bold uppercase tracking-tight">
              Alles korrekt?
            </h1>
            <p className="text-on-surface-variant">
              Prüf deine Bestellung. Mit Klick auf "Bezahlen" wirst du zu Stripe weitergeleitet.
            </p>
          </div>

          {/* Items */}
          <Section title="Bestellung" editHref="/checkout/cart">
            <div className="space-y-4">
              {items.map((item) => {
                const isSub = item.is_subscription === true;
                const total = lineTotal(item);
                return (
                  <div
                    key={item.id}
                    className={`flex gap-4 items-start pb-4 last:pb-0 border-b last:border-b-0 border-surface-container ${
                      isSub ? "pl-2 border-l-2 border-l-tertiary" : ""
                    }`}
                  >
                    <div className="w-16 h-16 bg-surface-container-low overflow-hidden shrink-0">
                      <img
                        src={item.image_url || COFFEE_FALLBACK_IMG}
                        alt={item.coffee_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      {isSub && (
                        <span className="inline-block bg-tertiary text-primary font-headline font-bold text-[9px] uppercase tracking-widest px-1.5 py-0.5 mb-1">
                          Abo · −{item.discount_percent ?? 0}%
                        </span>
                      )}
                      <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-sm">
                        {item.coffee_name}
                      </h3>
                      <p className="text-xs text-on-surface-variant">
                        {item.roaster_name} · {item.weight_g}g · {item.quantity}×
                      </p>
                      {isSub && item.interval_weeks && (
                        <p className="text-[11px] text-tertiary mt-1">
                          {INTERVAL_LABELS[item.interval_weeks].long} ·
                          röstfrisch bei nächster Röstung
                        </p>
                      )}
                    </div>
                    <span className="font-headline font-bold text-sm">
                      CHF {total.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Lieferung */}
          <Section title="Lieferadresse" editHref="/checkout/shipping">
            <AddressDisplay address={data.shipping_address} />
            {data.shipping_address.delivery_instructions && (
              <p className="text-xs text-on-surface-variant mt-2 italic">
                Hinweis: {data.shipping_address.delivery_instructions}
              </p>
            )}
          </Section>

          {/* Rechnung */}
          <Section title="Rechnungsadresse" editHref="/checkout/shipping">
            {data.billing_address_same_as_shipping ? (
              <p className="text-sm text-on-surface-variant">
                Identisch mit Lieferadresse
              </p>
            ) : (
              <AddressDisplay address={data.billing_address} />
            )}
          </Section>

          {/* Kontakt */}
          <Section title="Kontakt" editHref="/checkout/shipping">
            <p className="text-sm">{data.customer.email}</p>
            {(data.customer.first_name || data.customer.last_name) && (
              <p className="text-sm text-on-surface-variant">
                {[data.customer.first_name, data.customer.last_name]
                  .filter(Boolean)
                  .join(" ")}
              </p>
            )}
          </Section>

          {/* Notiz */}
          {data.customer_note && (
            <Section title="Anmerkung" editHref="/checkout/shipping">
              <p className="text-sm whitespace-pre-wrap">{data.customer_note}</p>
            </Section>
          )}

          {/* Total */}
          <div className="bg-primary text-on-primary p-6 md:p-8 mb-6">
            <h2 className="font-headline font-bold text-base uppercase tracking-tight mb-4">
              Zahlungsübersicht
            </h2>
            <div className="space-y-2 text-sm mb-4">
              <SummaryRow
                label="Zwischensumme"
                value={`CHF ${subtotal.toFixed(2)}`}
              />
              <SummaryRow
                label="Versand"
                value={shipping === 0 ? "Gratis" : `CHF ${shipping.toFixed(2)}`}
              />
              <p className="text-xs text-on-primary/60 pt-1">
                MWST ist im Preis enthalten (Brutto).
              </p>
            </div>
            <div className="border-t border-on-primary/20 pt-4">
              <SummaryRow
                label="Total"
                value={`CHF ${total.toFixed(2)}`}
                bold
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 p-4 mb-6 text-sm text-red-800">
              <strong>Fehler:</strong> {error}
            </div>
          )}

          {/* CTA Desktop */}
          <div className="hidden md:flex justify-between items-center">
            <Link
              href="/checkout/shipping"
              className="font-headline text-xs uppercase tracking-widest text-on-surface-variant hover:text-primary"
            >
              ← Zurück zur Adresse
            </Link>
            <button
              type="button"
              onClick={handlePay}
              disabled={submitting}
              className="bg-tertiary text-primary px-8 py-4 font-headline font-bold text-xs uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all disabled:opacity-50 disabled:cursor-wait"
            >
              {submitting
                ? "Weiterleitung zu Stripe …"
                : `Bezahlen · CHF ${total.toFixed(2)}`}
            </button>
          </div>
        </div>
      </main>

      {/* Mobile sticky CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-primary text-on-primary p-4 shadow-2xl z-40">
        <div className="flex justify-between items-center mb-3">
          <span className="font-headline text-[10px] uppercase tracking-widest text-on-primary/60">
            Total
          </span>
          <span className="font-headline font-bold text-xl">
            CHF {total.toFixed(2)}
          </span>
        </div>
        <button
          type="button"
          onClick={handlePay}
          disabled={submitting}
          className="block w-full text-center bg-tertiary text-primary py-3 font-headline font-bold text-xs uppercase tracking-widest disabled:opacity-50"
        >
          {submitting ? "…" : "Bezahlen"}
        </button>
      </div>
    </div>
  );
}

function AddressDisplay({ address }: { address: CheckoutAddress }) {
  return (
    <div className="text-sm space-y-0.5">
      <p className="font-bold">{address.recipient_name}</p>
      {address.company && <p>{address.company}</p>}
      <p>{address.street}</p>
      {address.street_additional && <p>{address.street_additional}</p>}
      <p>
        {address.postal_code} {address.city}
        {address.region && `, ${address.region}`}
      </p>
      <p>{address.country === "CH" ? "Schweiz" : address.country}</p>
    </div>
  );
}

function Section({
  title,
  editHref,
  children,
}: {
  title: string;
  editHref?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white p-6 md:p-8 shadow-sm mb-4">
      <div className="flex justify-between items-baseline mb-4">
        <h2 className="font-headline font-bold text-base text-primary uppercase tracking-tight">
          {title}
        </h2>
        {editHref && (
          <Link
            href={editHref}
            className="font-headline text-[11px] uppercase tracking-widest text-tertiary hover:text-primary font-bold"
          >
            Ändern
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex justify-between items-baseline ${
        bold ? "font-headline font-bold text-lg" : ""
      }`}
    >
      <span className={bold ? "" : "text-on-primary/80"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Stepper({ active }: { active: number }) {
  const steps = [
    { label: "Warenkorb" },
    { label: "Adresse" },
    { label: "Zahlung" },
    { label: "Bestätigung" },
  ];
  return (
    <div className="max-w-3xl mx-auto px-6 md:px-8 mb-10">
      <div className="flex items-center gap-2">
        {steps.map((s, i, arr) => (
          <div key={s.label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 flex items-center justify-center font-headline font-bold text-xs ${
                  i === active
                    ? "bg-primary text-on-primary"
                    : i < active
                    ? "bg-tertiary text-on-primary"
                    : "bg-surface-container text-on-surface-variant"
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`mt-2 font-headline text-[10px] uppercase tracking-widest font-bold ${
                  i === active
                    ? "text-primary"
                    : i < active
                    ? "text-tertiary"
                    : "text-on-surface-variant"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < arr.length - 1 && (
              <div className="flex-1 h-px mx-2 bg-surface-container" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
