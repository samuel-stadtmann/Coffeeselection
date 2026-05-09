"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

const steps = ["Lieferung", "Zahlung", "Überprüfung"];

export default function ReviewPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-outline-variant h-16 flex items-center px-4 gap-4">
        <Link href="/checkout/payment" className="w-10 h-10 flex items-center justify-center">
          <span className="material-symbols-outlined text-on-surface">arrow_back</span>
        </Link>
        <p className="flex-1 text-center font-headline font-serif italic text-on-surface text-lg">
          Review Order
        </p>
        <div className="w-10" />
      </header>

      {/* Progress Steps */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-background px-4 py-3 flex items-center justify-center gap-4 border-b border-outline-variant">
        {steps.map((step, i) => (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-label font-semibold transition-colors ${
                i === 2
                  ? "bg-primary text-white"
                  : i < 2
                  ? "bg-secondary text-white"
                  : "bg-surface-container-high text-on-surface-variant"
              }`}
            >
              {i < 2 ? (
                <span className="material-symbols-outlined text-xs">check</span>
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`text-sm font-label ${
                i === 2 ? "text-on-surface font-semibold" : "text-on-surface-variant"
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

      <main className="pt-36 pb-36 px-4 max-w-lg mx-auto">
        {/* Product */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-xl bg-surface-container-high flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-secondary text-4xl">coffee</span>
          </div>
          <div className="flex-1">
            <p className="font-headline font-serif text-on-surface text-lg">
              Ethiopia Yirgacheffe
            </p>
            <p className="font-sans text-on-surface-variant text-sm mb-1">250g · Qty: 1</p>
            <p className="font-sans font-semibold text-on-surface text-base">CHF 24.90</p>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Shipping Address */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-secondary text-lg">local_shipping</span>
              <p className="font-label font-semibold text-on-surface text-xs uppercase tracking-wider">
                Lieferadresse
              </p>
            </div>
            <p className="font-sans text-on-surface text-sm leading-relaxed">
              Marco Müller<br />
              Bahnhofstrasse 12<br />
              8001 Zürich<br />
              Schweiz
            </p>
            <p className="font-sans text-on-surface-variant text-xs mt-2">Standard (3–5 Tage)</p>
          </div>

          {/* Payment Method */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-secondary text-lg">credit_card</span>
              <p className="font-label font-semibold text-on-surface text-xs uppercase tracking-wider">
                Zahlungsart
              </p>
            </div>
            <p className="font-sans text-on-surface text-sm leading-relaxed">
              Kreditkarte
            </p>
            <p className="font-sans text-on-surface-variant text-xs mt-1">•••• •••• •••• 3456</p>
            <p className="font-sans text-on-surface-variant text-xs">Marco Müller</p>
          </div>
        </div>

        {/* Price Summary */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 mb-8">
          <div className="space-y-2 mb-3 pb-3 border-b border-outline-variant">
            <div className="flex justify-between font-sans text-on-surface-variant text-sm">
              <span>Ethiopia Yirgacheffe 250g</span>
              <span>CHF 24.90</span>
            </div>
            <div className="flex justify-between font-sans text-on-surface-variant text-sm">
              <span>Versand (Standard)</span>
              <span>CHF 4.90</span>
            </div>
          </div>
          <div className="flex justify-between font-sans font-bold text-on-surface text-base">
            <span>Total</span>
            <span>CHF 29.80</span>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-6">
          <div className="flex items-center gap-1.5 text-on-surface-variant text-xs font-label">
            <span className="material-symbols-outlined text-base">lock</span>
            SSL Gesichert
          </div>
          <div className="flex items-center gap-1.5 text-on-surface-variant text-xs font-label">
            <span className="material-symbols-outlined text-base">flag</span>
            Swiss Made
          </div>
          <div className="flex items-center gap-1.5 text-on-surface-variant text-xs font-label">
            <span className="material-symbols-outlined text-base">undo</span>
            Kostenlose Retoure
          </div>
        </div>
      </main>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-outline-variant p-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => router.push("/thank-you")}
            className="w-full py-5 bg-primary text-white font-label font-semibold rounded-xl uppercase tracking-widest text-sm"
          >
            Jetzt kaufen — CHF 29.80
          </button>
        </div>
      </div>
    </div>
  );
}
