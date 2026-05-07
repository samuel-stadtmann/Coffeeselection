"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const LOGO = "/logo.png";

// TODO: replace with your real Shopify config — set in Vercel env vars:
//   NEXT_PUBLIC_SHOPIFY_DOMAIN (e.g. coffee-selection.myshopify.com)
//   NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN (Storefront API access token)
const SHOPIFY_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN || "";
const SHOPIFY_TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN || "";

export default function PaymentPage() {
  const [shopifyReady, setShopifyReady] = useState(false);
  const [country, setCountry] = useState("CH");

  useEffect(() => {
    if (!SHOPIFY_DOMAIN || !SHOPIFY_TOKEN) return;
    if (typeof window === "undefined") return;
    const win = window as unknown as { ShopifyBuy?: unknown };
    if (win.ShopifyBuy) {
      setShopifyReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js";
    script.async = true;
    script.onload = () => setShopifyReady(true);
    document.body.appendChild(script);
  }, []);

  return (
    <div className="bg-[#F9F5F0] text-on-surface min-h-screen pb-20 md:pb-0">
      <header className="fixed top-0 w-full z-50 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-6 md:px-8 w-full">
          <Link href="/" className="flex items-center">
            <img alt="Coffee Selection" className="h-[80px] md:h-[100px] w-auto object-contain -my-2 md:-my-3" src={LOGO} />
          </Link>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-base text-tertiary">lock</span>
            <span className="font-headline text-[11px] uppercase tracking-[0.2em] font-bold">Sichere Zahlung</span>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12">
        <div className="max-w-3xl mx-auto px-6 md:px-8 mb-10">
          <div className="flex items-center gap-2">
            {[
              { label: "Match", done: true },
              { label: "Konto", done: true },
              { label: "Zahlung", active: true, done: false },
              { label: "Bestätigung", done: false },
            ].map((s, i, arr) => (
              <div key={s.label} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 flex items-center justify-center font-headline font-bold text-xs ${
                      s.active ? "bg-primary text-on-primary" : s.done ? "bg-tertiary text-white" : "bg-surface-container text-on-surface-variant"
                    }`}
                  >
                    {s.done ? <span className="material-symbols-outlined text-base">check</span> : i + 1}
                  </div>
                  <span className={`mt-2 font-headline text-[10px] uppercase tracking-widest font-bold ${s.active || s.done ? "text-primary" : "text-on-surface-variant"}`}>
                    {s.label}
                  </span>
                </div>
                {i < arr.length - 1 && <div className={`flex-1 h-px mx-2 ${s.done ? "bg-tertiary" : "bg-surface-container"}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div>
                <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-3 block">
                  Sicher zahlen mit Shopify
                </span>
                <h1 className="text-3xl md:text-4xl text-primary mb-2 uppercase tracking-tight font-headline font-bold">
                  Zahlung
                </h1>
                <p className="text-on-surface-variant">
                  Deine Zahlung wird über Shopify Payments abgewickelt — DSGVO-konform, mit Schweizer Datenhoheit.
                </p>
              </div>

              <div className="bg-white p-6 md:p-8 shadow-sm">
                <h2 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-6">Lieferadresse</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Vorname" placeholder="Maria" />
                  <Field label="Nachname" placeholder="Müller" />
                  <Field label="Strasse + Nr." placeholder="Bahnhofstrasse 12" full />
                  <Field label="PLZ" placeholder="8001" />
                  <Field label="Ort" placeholder="Zürich" />
                  <div className="md:col-span-2">
                    <label className="font-headline text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold block mb-2">Land</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base"
                    >
                      <option value="CH">Schweiz</option>
                      <option value="DE">Deutschland</option>
                      <option value="AT">Österreich</option>
                      <option value="LI">Liechtenstein</option>
                    </select>
                  </div>
                  <Field label="Telefon (optional)" placeholder="+41 79 ..." full />
                </div>
              </div>

              <div className="bg-white p-6 md:p-8 shadow-sm">
                <h2 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-2">Zahlungsmethode</h2>
                <p className="text-sm text-on-surface-variant mb-6">Über Shopify Payments akzeptieren wir folgende Zahlungsarten:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { name: "Kreditkarte", icon: "credit_card" },
                    { name: "TWINT", icon: "smartphone" },
                    { name: "Apple Pay", icon: "apple" },
                    { name: "Google Pay", icon: "android" },
                    { name: "PayPal", icon: "account_balance_wallet" },
                    { name: "Klarna", icon: "schedule" },
                    { name: "Rechnung", icon: "receipt_long" },
                    { name: "Postfinance", icon: "account_balance" },
                  ].map((m) => (
                    <div key={m.name} className="border-2 border-surface-container p-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-tertiary text-lg">{m.icon}</span>
                      <span className="font-headline text-[10px] uppercase tracking-widest font-bold text-primary">{m.name}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-on-surface-variant mt-4 italic">
                  Die exakten Zahlungsarten werden im nächsten Schritt durch Shopify Checkout angezeigt.
                </p>
              </div>

              <div className="bg-primary text-on-primary p-6 md:p-8">
                <div className="flex items-start gap-4 mb-6">
                  <span className="material-symbols-outlined text-tertiary text-3xl">verified_user</span>
                  <div>
                    <h2 className="font-headline font-bold uppercase tracking-tight text-lg mb-1">Weiter zu Shopify Checkout</h2>
                    <p className="text-sm text-on-primary/70">
                      Du wirst auf den sicheren Shopify-Checkout weitergeleitet. Deine Zahlungsdaten verlassen niemals Shopifys PCI-zertifizierte Server.
                    </p>
                  </div>
                </div>

                {SHOPIFY_DOMAIN && SHOPIFY_TOKEN ? (
                  shopifyReady ? (
                    <div id="shopify-buy-container">
                      <p className="text-xs text-on-primary/60 italic">
                        Shopify Buy SDK geladen. Initialisierung erfolgt mit Produkt-ID aus der DB.
                      </p>
                    </div>
                  ) : (
                    <div className="text-xs text-on-primary/60 italic">Shopify SDK wird geladen…</div>
                  )
                ) : (
                  <button
                    onClick={() => alert("Shopify-Konfiguration fehlt. Bitte NEXT_PUBLIC_SHOPIFY_DOMAIN und NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN in Vercel setzen.")}
                    className="w-full bg-tertiary text-primary py-5 font-headline font-bold text-xs uppercase tracking-widest hover:bg-white transition-all"
                  >
                    Zur sicheren Zahlung — Shopify Checkout
                  </button>
                )}
              </div>

              <p className="text-xs text-on-surface-variant text-center">
                Mit dem Klick auf &ldquo;Zahlung abschließen&rdquo; akzeptierst du unsere{" "}
                <Link href="#" className="text-tertiary hover:text-primary underline">AGB</Link> und{" "}
                <Link href="/privacy" className="text-tertiary hover:text-primary underline">Datenschutzerklärung</Link>.
              </p>
            </div>

            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="bg-white p-6 md:p-8 shadow-md">
                <h2 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-6">Bestellung</h2>
                <div className="flex gap-4 pb-6 mb-6 border-b border-surface-container">
                  <div className="w-20 h-20 bg-surface-container-low overflow-hidden shrink-0">
                    <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-mgzdszeDV-ADPnt08LksEtq5jHo_pZiXrnzVNy7faF7CAvNwCIqw0tZ2ylgRbHNuI-cdksgJ49bjfH36AYZerX9qRPq7kE2svCJ2KsLCMhI2k4Dc50D2D5FEGms1FJKDbeS75aSghLNY7Dop_dxhV5e-766gOscbYVVzn4qpX1rtPcumcDu7hr6OQeoiBzbRrze7HIkmFAM9YOYzQFzRF1wR3U1Ec53bS5Aj9xRlWvn7KxLIHJL79Wy6T8BFR47-ulGO1PjIJKEL" alt="Coffee" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-headline font-bold text-primary uppercase tracking-tight text-sm mb-1">Ethiopia Yirgacheffe</h4>
                    <p className="text-xs text-on-surface-variant mb-1">Miro Coffee Roasters</p>
                    <p className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold">Abo · Alle 2 Wochen · 500g</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm pb-6 mb-6 border-b border-surface-container">
                  <Row label="Zwischensumme" value="CHF 53.20" />
                  <Row label="Versand" value="Inklusive" highlight />
                  <Row label="Erstbestellung-Rabatt" value="− CHF 8.00" highlight />
                </div>
                <div className="flex justify-between items-end mb-6">
                  <span className="font-headline font-bold text-primary uppercase tracking-tight">Total</span>
                  <span className="font-headline font-bold text-2xl text-tertiary">CHF 45.20</span>
                </div>
                <div className="space-y-2 text-xs text-on-surface-variant">
                  {[
                    { i: "local_shipping", t: "Lieferung in 2–4 Werktagen" },
                    { i: "autorenew", t: "Abo jederzeit pausierbar" },
                    { i: "lock", t: "SSL-verschlüsselt via Shopify" },
                  ].map((x) => (
                    <div key={x.t} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-tertiary text-sm">{x.i}</span>
                      {x.t}
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Link
        href="#"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-tertiary text-primary py-5 text-center font-headline font-bold uppercase tracking-widest text-xs shadow-2xl"
      >
        Zur Zahlung · CHF 45.20
      </Link>
    </div>
  );
}

function Field({ label, placeholder, full }: { label: string; placeholder: string; full?: boolean }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="font-headline text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold block mb-2">{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        className="w-full bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base"
      />
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={highlight ? "text-tertiary font-headline text-xs uppercase tracking-widest font-bold" : "text-on-surface-variant"}>{label}</span>
      <span className={highlight ? "text-tertiary font-headline text-xs font-bold" : "text-primary font-headline font-bold"}>{value}</span>
    </div>
  );
}
