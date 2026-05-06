"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const steps = ["Lieferung", "Zahlung", "Überprüfung"];

export default function ShippingPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    street: "",
    streetNumber: "",
    zip: "",
    city: "",
    country: "Schweiz",
  });
  const [shipping, setShipping] = useState<"standard" | "express">("standard");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const inputClass =
    "w-full bg-surface-container-lowest border-b border-outline-variant focus:border-secondary outline-none px-0 py-3 text-on-surface font-sans text-base placeholder:text-on-surface-variant/50 transition-colors";

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-outline-variant h-16 flex items-center px-4">
        <Link href="/match-result" className="w-10 h-10 flex items-center justify-center">
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
                i === 0
                  ? "bg-primary text-white"
                  : "bg-surface-container-high text-on-surface-variant"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`text-sm font-label ${
                i === 0 ? "text-on-surface font-semibold" : "text-on-surface-variant"
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

      <main className="pt-36 pb-32 px-4 max-w-lg mx-auto">
        <h1 className="font-headline font-serif text-2xl text-on-surface mb-8">
          Lieferadresse
        </h1>

        <div className="space-y-6 mb-10">
          {/* Name Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-label text-on-surface-variant uppercase tracking-wider block mb-1">
                Vorname
              </label>
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="Marco"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-label text-on-surface-variant uppercase tracking-wider block mb-1">
                Nachname
              </label>
              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Müller"
                className={inputClass}
              />
            </div>
          </div>

          {/* Street Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-label text-on-surface-variant uppercase tracking-wider block mb-1">
                Strasse
              </label>
              <input
                name="street"
                value={form.street}
                onChange={handleChange}
                placeholder="Bahnhofstrasse"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-label text-on-surface-variant uppercase tracking-wider block mb-1">
                Nr.
              </label>
              <input
                name="streetNumber"
                value={form.streetNumber}
                onChange={handleChange}
                placeholder="12"
                className={inputClass}
              />
            </div>
          </div>

          {/* ZIP + City */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-label text-on-surface-variant uppercase tracking-wider block mb-1">
                PLZ
              </label>
              <input
                name="zip"
                value={form.zip}
                onChange={handleChange}
                placeholder="8001"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-label text-on-surface-variant uppercase tracking-wider block mb-1">
                Stadt
              </label>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Zürich"
                className={inputClass}
              />
            </div>
          </div>

          {/* Country */}
          <div>
            <label className="text-xs font-label text-on-surface-variant uppercase tracking-wider block mb-1">
              Land
            </label>
            <select
              name="country"
              value={form.country}
              onChange={handleChange}
              className={`${inputClass} cursor-pointer`}
            >
              <option>Schweiz</option>
              <option>Deutschland</option>
              <option>Österreich</option>
              <option>Liechtenstein</option>
            </select>
          </div>
        </div>

        {/* Shipping Methods */}
        <div className="mb-8">
          <h2 className="font-label font-semibold text-on-surface text-sm uppercase tracking-widest mb-4">
            Versandart
          </h2>
          <div className="space-y-3">
            {/* Standard */}
            <button
              onClick={() => setShipping("standard")}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                shipping === "standard"
                  ? "border-secondary bg-surface-container-lowest shadow-sm"
                  : "border-outline-variant bg-surface-container-lowest hover:border-secondary/30"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  shipping === "standard" ? "border-secondary" : "border-outline-variant"
                }`}
              >
                {shipping === "standard" && (
                  <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="font-sans font-semibold text-on-surface text-sm">Standard</p>
                <p className="font-sans text-on-surface-variant text-xs">3–5 Tage</p>
              </div>
              <span className="font-sans font-semibold text-on-surface text-sm">CHF 4.90</span>
            </button>

            {/* Express */}
            <button
              onClick={() => setShipping("express")}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all relative ${
                shipping === "express"
                  ? "border-secondary bg-surface-container-lowest shadow-sm"
                  : "border-outline-variant bg-surface-container-lowest hover:border-secondary/30"
              }`}
            >
              <span className="absolute -top-3 left-4 bg-secondary-container text-on-surface text-xs font-label font-semibold px-3 py-1 rounded-full">
                Empfohlen
              </span>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  shipping === "express" ? "border-secondary" : "border-outline-variant"
                }`}
              >
                {shipping === "express" && (
                  <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="font-sans font-semibold text-on-surface text-sm">Express</p>
                <p className="font-sans text-on-surface-variant text-xs">1–2 Tage</p>
              </div>
              <span className="font-sans font-semibold text-on-surface text-sm">CHF 9.90</span>
            </button>
          </div>
        </div>
      </main>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-outline-variant p-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => router.push("/checkout/payment")}
            className="w-full py-5 bg-primary text-white font-label font-semibold rounded-xl uppercase tracking-widest text-sm"
          >
            Weiter zur Zahlung
          </button>
        </div>
      </div>
    </div>
  );
}
