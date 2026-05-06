"use client";

import { useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import MobileNav from "@/components/MobileNav";
import Footer from "@/components/Footer";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    betreff: "",
    nachricht: "",
  });
  const [submitted, setSubmitted] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-[#fdf9f4]">
      <Nav />
      <MobileNav />

      {/* Hero */}
      <section className="pt-24 pb-0 max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <div className="flex flex-col justify-center">
            <p className="font-sans text-[#795900] font-semibold uppercase tracking-widest text-sm mb-3">
              Wir sind für Sie da
            </p>
            <h1 className="font-serif text-4xl md:text-5xl text-[#341706] leading-tight mb-6">
              Kontaktiere unseren Concierge
            </h1>
            <p className="font-sans text-[#51443e] text-lg leading-relaxed">
              Unser persönlicher Kaffee-Concierge beantwortet alle Ihre Fragen — von der
              Bestellung bis zur perfekten Zubereitung.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl overflow-hidden aspect-[4/3]">
              <img
                src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&q=80"
                alt="Coffee concierge"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="rounded-2xl overflow-hidden aspect-[4/2]">
              <img
                src="https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=800&q=80"
                alt="Coffee preparation"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact info */}
          <div>
            <h2 className="font-serif text-2xl text-[#341706] mb-8">
              So erreichen Sie uns
            </h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#341706]/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[#341706] text-xl">
                    location_on
                  </span>
                </div>
                <div>
                  <p className="font-sans font-semibold text-[#341706] mb-1">Zürich</p>
                  <p className="font-sans text-[#51443e]">Bahnhofstrasse 12</p>
                  <p className="font-sans text-[#51443e]">8001 Zürich, Schweiz</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#341706]/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[#341706] text-xl">
                    email
                  </span>
                </div>
                <div>
                  <p className="font-sans font-semibold text-[#341706] mb-1">E-Mail</p>
                  <a
                    href="mailto:concierge@digital-sommelier.com"
                    className="font-sans text-[#795900] hover:underline"
                  >
                    concierge@digital-sommelier.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#341706]/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[#341706] text-xl">
                    phone
                  </span>
                </div>
                <div>
                  <p className="font-sans font-semibold text-[#341706] mb-1">Telefon</p>
                  <a
                    href="tel:+41441234567"
                    className="font-sans text-[#795900] hover:underline"
                  >
                    +41 44 123 45 67
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div>
            <h2 className="font-serif text-2xl text-[#341706] mb-8">
              Nachricht senden
            </h2>
            {submitted ? (
              <div className="bg-white rounded-2xl border border-[#d5c3bb]/40 p-10 text-center">
                <span className="material-symbols-outlined text-[#795900] text-5xl mb-4 block">
                  check_circle
                </span>
                <h3 className="font-serif text-xl text-[#341706] mb-2">
                  Nachricht erhalten!
                </h3>
                <p className="font-sans text-[#51443e]">
                  Wir melden uns innerhalb von 24 Stunden bei Ihnen.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block font-sans text-sm font-semibold text-[#341706] mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Ihr vollständiger Name"
                    className="w-full border border-[#d5c3bb] rounded-xl px-4 py-3 font-sans text-[#341706] bg-white placeholder:text-[#51443e]/50 focus:outline-none focus:border-[#795900] transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-sans text-sm font-semibold text-[#341706] mb-2">
                    E-Mail
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="ihre@email.com"
                    className="w-full border border-[#d5c3bb] rounded-xl px-4 py-3 font-sans text-[#341706] bg-white placeholder:text-[#51443e]/50 focus:outline-none focus:border-[#795900] transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-sans text-sm font-semibold text-[#341706] mb-2">
                    Betreff
                  </label>
                  <input
                    type="text"
                    name="betreff"
                    value={form.betreff}
                    onChange={handleChange}
                    required
                    placeholder="Worum geht es?"
                    className="w-full border border-[#d5c3bb] rounded-xl px-4 py-3 font-sans text-[#341706] bg-white placeholder:text-[#51443e]/50 focus:outline-none focus:border-[#795900] transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-sans text-sm font-semibold text-[#341706] mb-2">
                    Nachricht
                  </label>
                  <textarea
                    name="nachricht"
                    value={form.nachricht}
                    onChange={handleChange}
                    required
                    rows={5}
                    placeholder="Ihre Nachricht an uns..."
                    className="w-full border border-[#d5c3bb] rounded-xl px-4 py-3 font-sans text-[#341706] bg-white placeholder:text-[#51443e]/50 focus:outline-none focus:border-[#795900] transition-colors resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#341706] text-white font-sans font-semibold py-4 rounded-xl hover:bg-[#795900] transition-colors text-base"
                >
                  Nachricht senden
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
