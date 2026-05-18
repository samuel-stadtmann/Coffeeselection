"use client";

import { useEffect, useState } from "react";
import { useCheckout, type CheckoutAddress } from "@/lib/checkout";
import { createClient } from "@/lib/supabase/client";

/**
 * Konsolidierter Shipping-Form fuer den neuen Single-Page-Checkout
 * (eingebettet in /checkout/review). Frueher war das die eigene
 * /checkout/shipping-Page — die ist jetzt nur noch ein Redirect.
 *
 * Funktionen:
 *   - Kontakt (Email + Name + Marketing-Opt-In)
 *   - Lieferadresse (CH-only)
 *   - Rechnungsadresse-Toggle + Form
 *   - Customer-Note
 *   - SavedAddresses-Picker fuer eingeloggte User (lower-Friction Re-Buy):
 *     Auto-Load aus customer_addresses, ein Klick fuellt die Form, "Neue
 *     Adresse" raeumt sie wieder leer
 *
 * Layout: vertikale Sections, gleicher Stil wie bisherige Cards.
 */
export default function ShippingForm() {
  const {
    data,
    setCustomer,
    setShippingAddress,
    setBillingAddress,
    setBillingSameAsShipping,
    setCustomerNote,
  } = useCheckout();

  return (
    <div className="space-y-4 mb-6">
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
            onChange={(e) => setCustomer({ marketing_opt_in: e.target.checked })}
            className="mt-1"
          />
          <span className="text-sm text-on-surface-variant">
            Ja, schickt mir gelegentlich News zu neuen Kaffees & Aktionen
            (max. 1×/Monat, jederzeit abbestellbar).
          </span>
        </label>
      </Section>

      <SavedAddressesPicker />

      <Section title="Lieferadresse">
        <Field label="Empfänger*in *">
          <input
            required
            autoComplete="name"
            value={data.shipping_address.recipient_name}
            onChange={(e) => setShippingAddress({ recipient_name: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Firma (optional)">
          <input
            autoComplete="organization"
            value={data.shipping_address.company}
            onChange={(e) => setShippingAddress({ company: e.target.value })}
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
            onChange={(e) => setShippingAddress({ street_additional: e.target.value })}
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
                setShippingAddress({ postal_code: e.target.value.trim() })
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
              onChange={(e) => setShippingAddress({ region: e.target.value })}
              placeholder="ZH, BE, …"
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Land *">
          <select
            required
            value={data.shipping_address.country}
            onChange={(e) => setShippingAddress({ country: e.target.value })}
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
              setShippingAddress({ delivery_instructions: e.target.value })
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
                onChange={(e) => setBillingAddress({ street: e.target.value })}
                className={inputClass}
              />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="PLZ *">
                <input
                  required
                  value={data.billing_address.postal_code}
                  onChange={(e) =>
                    setBillingAddress({ postal_code: e.target.value.trim() })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Stadt *">
                <input
                  required
                  value={data.billing_address.city}
                  onChange={(e) => setBillingAddress({ city: e.target.value })}
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
    </div>
  );
}

/**
 * SavedAddresses — laed customer_addresses fuer eingeloggte User und
 * bietet einen Picker an. Beim Klick wird die ShippingAddress im
 * useCheckout-State befuellt — Customer kann dann trotzdem noch felder
 * bearbeiten. "Neue Adresse" macht die Form leer.
 *
 * Anonyme User sehen die Component gar nicht (return null).
 */
type SavedAddrRow = {
  id: string;
  type: string;
  recipient_name: string;
  company: string | null;
  street: string;
  street_additional: string | null;
  postal_code: string;
  city: string;
  region: string | null;
  country: string;
  delivery_instructions: string | null;
  is_default: boolean | null;
};

function SavedAddressesPicker() {
  const { setShippingAddress } = useCheckout();
  const [addresses, setAddresses] = useState<SavedAddrRow[]>([]);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setLoading(false);
        return;
      }
      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("auth_user_id", auth.user.id)
        .maybeSingle();
      if (!customer) {
        setLoading(false);
        return;
      }
      const { data: rows } = await supabase
        .from("customer_addresses")
        .select(
          "id, type, recipient_name, company, street, street_additional, postal_code, city, region, country, delivery_instructions, is_default"
        )
        .eq("customer_id", customer.id)
        .in("type", ["shipping", "both"])
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5);
      if (!cancelled) {
        const list = (rows ?? []) as SavedAddrRow[];
        // Dedupe via Hash (recipient+street+plz+city) — bei Gast-Checkout
        // kann customer_addresses doppelte Eintraege haben.
        const seen = new Set<string>();
        const deduped: SavedAddrRow[] = [];
        for (const a of list) {
          const key = `${a.recipient_name}|${a.street}|${a.postal_code}|${a.city}`;
          if (seen.has(key)) continue;
          seen.add(key);
          deduped.push(a);
        }
        setAddresses(deduped);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || addresses.length === 0) return null;

  const handlePick = (id: string) => {
    setPickedId(id);
    const a = addresses.find((x) => x.id === id);
    if (!a) return;
    const next: CheckoutAddress = {
      recipient_name: a.recipient_name,
      company: a.company ?? "",
      street: a.street,
      street_additional: a.street_additional ?? "",
      postal_code: a.postal_code,
      city: a.city,
      region: a.region ?? "",
      country: a.country,
      delivery_instructions: a.delivery_instructions ?? "",
    };
    setShippingAddress(next);
  };

  const handleNew = () => {
    setPickedId(null);
    setShippingAddress({
      recipient_name: "",
      company: "",
      street: "",
      street_additional: "",
      postal_code: "",
      city: "",
      region: "",
      country: "CH",
      delivery_instructions: "",
    });
  };

  return (
    <div className="bg-tertiary/10 border-l-4 border-tertiary p-5">
      <p className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold mb-3">
        Gespeicherte Lieferadresse
      </p>
      <div className="space-y-2">
        {addresses.map((a) => {
          const active = pickedId === a.id;
          return (
            <button
              type="button"
              key={a.id}
              onClick={() => handlePick(a.id)}
              className={`w-full text-left p-3 border-2 transition-all ${
                active
                  ? "border-tertiary bg-white"
                  : "border-surface-container bg-white hover:border-tertiary/40"
              }`}
            >
              <p className="font-bold text-sm">{a.recipient_name}</p>
              <p className="text-xs text-on-surface-variant">
                {a.street}
                {a.street_additional ? `, ${a.street_additional}` : ""}
              </p>
              <p className="text-xs text-on-surface-variant">
                {a.postal_code} {a.city}
              </p>
              {a.is_default && (
                <span className="inline-block mt-2 font-headline text-[9px] uppercase tracking-widest font-bold text-tertiary">
                  Standard
                </span>
              )}
            </button>
          );
        })}
        <button
          type="button"
          onClick={handleNew}
          className="w-full text-left p-3 border-2 border-dashed border-surface-container bg-transparent hover:border-tertiary/40 transition-all text-sm text-on-surface-variant"
        >
          + Neue Adresse eingeben
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
      {hint && <p className="text-xs text-on-surface-variant mt-1.5">{hint}</p>}
    </div>
  );
}
