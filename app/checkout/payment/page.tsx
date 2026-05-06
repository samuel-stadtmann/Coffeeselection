"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const steps = ["Lieferung", "Zahlung", "Überprüfung"];

export default function PaymentPage() {
  const router = useRouter();
  const [method, setMethod] = useState<"card" | "twint" | "invoice">("card");
  const [cardForm, setCardForm] = useState({
    number: "",
    holder: "",
    expiry: "",
    cvv: "",
  });

  const handleCard = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const inputClass =
    "w-full bg-surface-container-lowest border-b border-outline-variant focus:border-secondary outline-none px-0 py-3 text-on-surface font-sans text-base placeholder:text-on-surface-variant/50 transition-colors";

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-outline-variant h-16 flex items-center px-4">
        <Link href="/checkout/shipping" className="w-10 h-10 flex items-center justify-center">
          <span className="material-symbols-outlined text-on-surface">arrow_back</span>
        </Link>
        <p className="flex-1 text-center font-label font-semibold text-on-surface uppercase tracking-widest text-sm">
          The Digital Sommelier
        </p>
        <button className="w-10 h-10 flex items-center justify-center">
          <span className="material-symbols-outlined text-on-surface">shopping_bag</span>
        </button>
      </header>

      {/* Progress Steps */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-background px-4 py-3 flex items-center justify-center gap-4 border-b border-outline-variant">
        {steps.map((step, i) => (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-label font-semibold transition-colors ${
                i === 1
                  ? "bg-primary text-white"
                  : i < 1
                  ? "bg-secondary text-white"
                  : "bg-surface-container-high text-on-surface-variant"
              }`}
            >
              {i < 1 ? (
                <span className="material-symbols-outlined text-xs">check</span>
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`text-sm font-label ${
                i === 1 ? "text-on-surface font-semibold" : "text-on-surface-variant"
              }`}
            >
              {step}
            </span>
            {i < steps.length - 1 && (
              <span className="material-symbols-outlined text-outline-variant text-base ml-2">
                chevron_right
              </span>
            )}
          </div>
        ))}
      </div>

      <main className="pt-36 pb-32 px-4 max-w-5xl mx-auto">
        <h1 className="font-headline font-serif text-2xl text-on-surface mb-8">
          Zahlungsart
        </h1>

        <div className="flex gap-8">
          {/* Payment Methods — left column */}
          <div className="flex-1 space-y-4">
            {/* Credit Card */}
            <div
              className={`rounded-xl border transition-all overflow-hidden ${
                method === "card"
                  ? "border-secondary"
                  : "border-outline-variant"
              }`}
            >
              <button
                onClick={() => setMethod("card")}
                className="w-full flex items-center gap-4 p-4 bg-surface-container-lowest"
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    method === "card" ? "border-secondary" : "border-outline-variant"
                  }`}
                >
                  {method === "card" && (
                    <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
                  )}
                </div>
                <span className="material-symbols-outlined text-on-surface text-xl">credit_card</span>
                <span className="font-sans font-semibold text-on-surface text-sm flex-1 text-left">
                  Kreditkarte
                </span>
                <div className="flex gap-2">
                  <span className="text-xs font-label font-bold text-on-surface-variant border border-outline-variant px-2 py-0.5 rounded">
                    VISA
                  </span>
                  <span className="text-xs font-label font-bold text-on-surface-variant border border-outline-variant px-2 py-0.5 rounded">
                    MC
                  </span>
                </div>
              </button>

              {method === "card" && (
                <div className="px-4 pb-5 bg-surface-container-lowest border-t border-outline-variant space-y-4 pt-4">
                  <div>
                    <label className="text-xs font-label text-on-surface-variant uppercase tracking-wider block mb-1">
                      Kartennummer
                    </label>
                    <input
                      name="number"
                      value={cardForm.number}
                      onChange={handleCard}
                      placeholder="1234 5678 9012 3456"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-label text-on-surface-variant uppercase tracking-wider block mb-1">
                      Karteninhaber
                    </label>
                    <input
                      name="holder"
                      value={cardForm.holder}
                      onChange={handleCard}
                      placeholder="Marco Müller"
                      className={inputClass}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-label text-on-surface-variant uppercase tracking-wider block mb-1">
                        Ablaufdatum
                      </label>
                      <input
                        name="expiry"
                        value={cardForm.expiry}
                        onChange={handleCard}
                        placeholder="MM/JJ"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-label text-on-surface-variant uppercase tracking-wider block mb-1">
                        CVV
                      </label>
                      <input
                        name="cvv"
                        value={cardForm.cvv}
                        onChange={handleCard}
                        placeholder="123"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* TWINT */}
            <button
              onClick={() => setMethod("twint")}
              className={`w-full flex items-center gap-4 p-4 bg-surface-container-lowest rounded-xl border transition-all ${
                method === "twint"
                  ? "border-secondary"
                  : "border-outline-variant hover:border-secondary/30"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  method === "twint" ? "border-secondary" : "border-outline-variant"
                }`}
              >
                {method === "twint" && (
                  <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
                )}
              </div>
              <span className="material-symbols-outlined text-on-surface text-xl">phone_iphone</span>
              <span className="font-sans font-semibold text-on-surface text-sm">TWINT</span>
            </button>

            {/* Invoice */}
            <button
              onClick={() => setMethod("invoice")}
              className={`w-full flex items-center gap-4 p-4 bg-surface-container-lowest rounded-xl border transition-all ${
                method === "invoice"
                  ? "border-secondary"
                  : "border-outline-variant hover:border-secondary/30"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  method === "invoice" ? "border-secondary" : "border-outline-variant"
                }`}
              >
                {method === "invoice" && (
                  <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
                )}
              </div>
              <span className="material-symbols-outlined text-on-surface text-xl">receipt_long</span>
              <div className="text-left">
                <span className="font-sans font-semibold text-on-surface text-sm block">
                  Rechnung
                </span>
                <span className="font-sans text-on-surface-variant text-xs">
                  + 2 Wochen Zahlungsziel
                </span>
              </div>
            </button>
          </div>

          {/* Order Summary — right column (desktop) */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 sticky top-36">
              <h2 className="font-label font-semibold text-on-surface text-sm uppercase tracking-widest mb-4">
                Bestellübersicht
              </h2>
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-outline-variant">
                <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-secondary">coffee</span>
                </div>
                <div>
                  <p className="font-sans font-semibold text-on-surface text-sm">
                    Ethiopia Yirgacheffe
                  </p>
                  <p className="font-sans text-on-surface-variant text-xs">250g</p>
                </div>
                <span className="ml-auto font-sans font-semibold text-on-surface text-sm">
                  CHF 24.90
                </span>
              </div>
              <div className="space-y-2 mb-4 pb-4 border-b border-outline-variant">
                <div className="flex justify-between text-sm font-sans text-on-surface-variant">
                  <span>Versand (Standard)</span>
                  <span>CHF 4.90</span>
                </div>
              </div>
              <div className="flex justify-between font-sans font-bold text-on-surface text-base">
                <span>Total</span>
                <span>CHF 29.80</span>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-outline-variant p-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => router.push("/checkout/review")}
            className="w-full py-5 bg-primary text-white font-label font-semibold rounded-xl uppercase tracking-widest text-sm"
          >
            Weiter zur Überprüfung
          </button>
        </div>
      </div>
    </div>
  );
}
