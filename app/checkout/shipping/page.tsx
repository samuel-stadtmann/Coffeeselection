"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useCart } from "@/lib/cart";
import { useCheckout } from "@/lib/checkout";

const LOGO = "/logo.png";

export default function ShippingPage() {
  const router = useRouter();
  const { items, subtotal, loaded: cartLoaded } = useCart();
  const {
    data,
    setCustomer,
    setShippingAddress,
    setBillingAddress,
    setBillingSameAsShipping,
    setCustomerNote,
    shippingValid,
    billingValid,
  } = useCheckout();

  // Cart leer → zurueck zum Cart, sonst kauft Kunde "Luft" ueber die naechsten Steps.
  // WICHTIG: erst nach cartLoaded checken — sonst feuert der Guard waehrend
  // Hydration bei initial-leerem State und schickt den User zurueck obwohl
  // SessionStorage Items enthaelt.
  useEffect(() => {
    if (cartLoaded && items.length === 0) {
      router.replace("/checkout/cart");
    }
  }, [cartLoaded, items.length, router]);

  const canContinue = shippingValid && billingValid;

  return (
    <div className="bg-[#F9F5F0] text-on-surface min-h-screen pb-32 md:pb-12">
      <header className="fixed top-0 w-full z-50 h-20 md:h-24 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5">
        <div className="flex justify-between items-center gap-3 h-full max-w-7xl mx-auto px-6 md:px-8 w-full">
          <Link href="/" className="flex items-center shrink-0 h-full overflow-hidden">
            <img
              alt="Coffee Selection"
              className="h-24 sm:h-32 md:h-40 lg:h-44 w-auto object-contain object-left"
              src={LOGO}
            />
          </Link>
          <Link
            href="/checkout/cart"
            className="font-headline text-[11px] uppercase tracking-[0.3em] text-primary hover:text-tertiary transition-colors"
          >
            Zurück zum Warenkorb
          </Link>
        </div>
      </header>

      <main className="pt-20 md:pt-24">
        <Stepper active={1} />

        <div className="max-w-3xl mx-auto px-6 md:px-8">
          <div className="mb-8">
            <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-3 block">
              Schritt 2 · Versand
            </span>
            <h1 className="text-3xl md:text-5xl text-primary mb-2 font-headline font-bold uppercase tracking-tight">
              Wohin liefern wir?
            </h1>
            <p className="text-on-surface-variant">
              Adresse + Kontakt. Du kannst diese Daten später in deinem Konto ändern.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (canContinue) router.push("/checkout/review");
            }}
            className="space-y-6"
          >
            <Section title="Kontakt">
              <Field label="E-Mail-Adresse *" hint="Für Bestellbestätigung + Versand-Updates">
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={data.customer.email}
                  onChange={(e) => setCustomer({ email: e.target.value.trim() })}
                  placeholder="dein@email.ch"
                  className={inputClass}
                />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Vorname">
                  <input
                    autoComplete="given-name"
                    value={data.customer.first_name}
                    onChange={(e) => setCustomer({ first_name: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Nachname">
                  <input
                    autoComplete="family-name"
                    value={data.customer.last_name}
                    onChange={(e) => setCustomer({ last_name: e.target.value })}
                    className={inputClass}
                  />
                </Field>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.customer.marketing_opt_in}
                  onChange={(e) =>
                    setCustomer({ marketing_opt_in: e.target.checked })
                  }
                  className="mt-1"
                />
                <span className="text-sm text-on-surface-variant">
                  Ja, schickt mir gelegentlich News zu neuen Kaffees & Aktionen (max. 1×/Monat, jederzeit abbestellbar).
                </span>
              </label>
            </Section>

            <Section title="Lieferadresse">
              <Field label="Empfänger*in *">
                <input
                  required
                  autoComplete="name"
                  value={data.shipping_address.recipient_name}
                  onChange={(e) =>
                    setShippingAddress({ recipient_name: e.target.value })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Firma (optional)">
                <input
                  autoComplete="organization"
                  value={data.shipping_address.company}
                  onChange={(e) =>
                    setShippingAddress({ company: e.target.value })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Strasse + Nr. *">
                <input
                  required
                  autoComplete="address-line1"
                  value={data.shipping_address.street}
                  onChange={(e) => setShippingAddress({ street: e.target.value })}
                  placeholder="Bahnhofstrasse 1"
                  className={inputClass}
                />
              </Field>
              <Field label="Adresszusatz (optional)">
                <input
                  autoComplete="address-line2"
                  value={data.shipping_address.street_additional}
                  onChange={(e) =>
                    setShippingAddress({ street_additional: e.target.value })
                  }
                  placeholder="c/o, Stock, etc."
                  className={inputClass}
                />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="PLZ *">
                  <input
                    required
                    autoComplete="postal-code"
                    value={data.shipping_address.postal_code}
                    onChange={(e) =>
                      setShippingAddress({
                        postal_code: e.target.value.trim(),
                      })
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="Stadt *">
                  <input
                    required
                    autoComplete="address-level2"
                    value={data.shipping_address.city}
                    onChange={(e) => setShippingAddress({ city: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Kanton (optional)">
                  <input
                    autoComplete="address-level1"
                    value={data.shipping_address.region}
                    onChange={(e) =>
                      setShippingAddress({ region: e.target.value })
                    }
                    placeholder="ZH, BE, …"
                    className={inputClass}
                  />
                </Field>
              </div>
              <Field label="Land *">
                <select
                  required
                  value={data.shipping_address.country}
                  onChange={(e) =>
                    setShippingAddress({ country: e.target.value })
                  }
                  className={inputClass}
                >
                  <option value="CH">Schweiz</option>
                  <option value="LI">Liechtenstein</option>
                </select>
              </Field>
              <Field
                label="Lieferhinweis (optional)"
                hint="z.B. 'Bei Nachbar abgeben', '2. Stock links'"
              >
                <input
                  value={data.shipping_address.delivery_instructions}
                  onChange={(e) =>
                    setShippingAddress({
                      delivery_instructions: e.target.value,
                    })
                  }
                  className={inputClass}
                />
              </Field>
            </Section>

            <Section title="Rechnungsadresse">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.billing_address_same_as_shipping}
                  onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm">
                  Rechnungsadresse ist identisch mit Lieferadresse
                </span>
              </label>

              {!data.billing_address_same_as_shipping && (
                <div className="space-y-4 mt-4 pt-4 border-t border-surface-container">
                  <Field label="Empfänger*in *">
                    <input
                      required
                      value={data.billing_address.recipient_name}
                      onChange={(e) =>
                        setBillingAddress({ recipient_name: e.target.value })
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Strasse + Nr. *">
                    <input
                      required
                      value={data.billing_address.street}
                      onChange={(e) =>
                        setBillingAddress({ street: e.target.value })
                      }
                      className={inputClass}
                    />
                  </Field>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="PLZ *">
                      <input
                        required
                        value={data.billing_address.postal_code}
                        onChange={(e) =>
                          setBillingAddress({
                            postal_code: e.target.value.trim(),
                          })
                        }
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Stadt *">
                      <input
                        required
                        value={data.billing_address.city}
                        onChange={(e) =>
                          setBillingAddress({ city: e.target.value })
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>
                </div>
              )}
            </Section>

            <Section title="Anmerkung (optional)">
              <Field label="Nachricht an uns">
                <textarea
                  rows={3}
                  value={data.customer_note}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder="Geschenk? Spezielle Wünsche?"
                  className={`${inputClass} resize-none`}
                />
              </Field>
            </Section>

            <div className="hidden md:flex justify-between items-center pt-4">
              <Link
                href="/checkout/cart"
                className="font-headline text-xs uppercase tracking-widest text-on-surface-variant hover:text-primary"
              >
                ← Zurück zum Warenkorb
              </Link>
              <button
                type="submit"
                disabled={!canContinue}
                className="bg-primary text-on-primary px-8 py-4 font-headline font-bold text-xs uppercase tracking-widest hover:bg-tertiary hover:text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Weiter zur Übersicht →
              </button>
            </div>
          </form>
        </div>
      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-primary text-on-primary p-4 shadow-2xl z-40">
        <div className="flex justify-between items-center mb-3">
          <span className="font-headline text-[10px] uppercase tracking-widest text-on-primary/60">
            {items.length} {items.length === 1 ? "Artikel" : "Artikel"}
          </span>
          <span className="font-headline font-bold text-xl">
            CHF {subtotal.toFixed(2)}
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            if (canContinue) router.push("/checkout/review");
          }}
          disabled={!canContinue}
          className="block w-full text-center bg-tertiary text-primary py-3 font-headline font-bold text-xs uppercase tracking-widest disabled:opacity-40"
        >
          Weiter zur Übersicht
        </button>
      </div>
    </div>
  );
}

const inputClass =
  "w-full px-4 py-3 bg-white border border-surface-container focus:border-primary focus:outline-none text-on-surface text-sm transition-colors";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white p-6 md:p-8 shadow-sm space-y-4">
      <h2 className="font-headline font-bold text-base text-primary uppercase tracking-tight mb-2">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block">
        <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-2">
          {label}
        </span>
        {children}
      </label>
      {hint && (
        <p className="text-xs text-on-surface-variant mt-1.5">{hint}</p>
      )}
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
          <div
            key={s.label}
            className="flex items-center flex-1 last:flex-none"
          >
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
