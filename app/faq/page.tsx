"use client";
import { useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import MobileNav from "@/components/MobileNav";
import Footer from "@/components/Footer";

const categories = [
  {
    id: "abo",
    label: "Abonnement",
    items: [
      { q: "Wie funktioniert das Abonnement?", a: "Du erhältst regelmässig deinen perfekt passenden Specialty Coffee direkt nach Hause. Das Intervall bestimmst du selbst." },
      { q: "Kann ich jederzeit kündigen?", a: "Ja, du kannst jederzeit pausieren oder kündigen — ohne Mindestlaufzeit." },
      { q: "Wie wähle ich meinen Kaffee aus?", a: "Über unser 2-Minuten-Quiz. Unser Sommelier-Algorithmus matcht dich mit den besten passenden Röstungen." },
    ],
  },
  {
    id: "lieferung",
    label: "Lieferung & Versand",
    items: [
      { q: "Wie lange dauert die Lieferung?", a: "2–4 Werktage Schweiz Standard, 1–2 Tage Express." },
      { q: "In welche Länder liefern wir?", a: "Schweiz, Deutschland und Österreich." },
      { q: "Kostet der Versand extra?", a: "Standard CHF 4.90, ab CHF 50 Bestellwert kostenlos. Express CHF 9.90." },
    ],
  },
  {
    id: "kaffee",
    label: "Kaffee & Qualität",
    items: [
      { q: "Woher kommen die Kaffees?", a: "Ausschliesslich von handverlesenen Schweizer Specialty-Röstereien — Direct Trade, höchste Qualitätsstandards." },
      { q: "Sind die Kaffees bio-zertifiziert?", a: "Viele Röstungen ja — erkennbar am Bio-Siegel auf dem Produkt." },
      { q: "Wie frisch ist der Kaffee?", a: "Röstfrisch — die Bohnen werden erst nach Bestellung geröstet und direkt versendet." },
    ],
  },
];

export default function FAQPage() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="bg-background min-h-screen">
      <Nav />
      <main className="pt-32 pb-32 max-w-7xl mx-auto px-6">
        <div className="mb-20">
          <span className="font-label text-xs uppercase tracking-[0.2em] text-secondary font-semibold block mb-4">Support</span>
          <h1 className="text-5xl md:text-6xl font-headline text-primary tracking-tighter">Häufig gestellte Fragen</h1>
        </div>

        <div className="grid md:grid-cols-12 gap-12">
          <aside className="md:col-span-3 hidden md:block">
            <div className="sticky top-32 space-y-2">
              {categories.map((c) => (
                <a key={c.id} href={`#${c.id}`} className="block py-2 font-label text-xs uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">
                  {c.label}
                </a>
              ))}
            </div>
          </aside>

          <div className="md:col-span-9 space-y-16">
            {categories.map((c) => (
              <section key={c.id} id={c.id}>
                <h2 className="font-headline text-2xl text-primary mb-6">{c.label}</h2>
                <div className="space-y-2">
                  {c.items.map((item, i) => {
                    const id = `${c.id}-${i}`;
                    const isOpen = open === id;
                    return (
                      <div key={id} className="bg-surface-container-lowest rounded-xl overflow-hidden">
                        <button
                          onClick={() => setOpen(isOpen ? null : id)}
                          className="w-full flex justify-between items-center p-6 text-left"
                        >
                          <span className="font-headline text-base text-primary pr-4">{item.q}</span>
                          <span className={`material-symbols-outlined text-on-surface-variant transition-transform ${isOpen ? "rotate-180" : ""}`}>expand_more</span>
                        </button>
                        {isOpen && (
                          <div className="px-6 pb-6 text-on-surface-variant font-light leading-relaxed">
                            {item.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>

        <section className="mt-32 bg-primary text-on-primary p-12 rounded-2xl text-center">
          <h2 className="font-headline text-3xl mb-4">Frage nicht beantwortet?</h2>
          <p className="text-on-primary/70 mb-8 font-light">Unser Concierge-Team hilft dir gerne weiter.</p>
          <Link href="/contact" className="inline-block bg-secondary-container text-on-background px-8 py-3 rounded-lg font-label text-xs uppercase tracking-widest hover:opacity-90 transition-all">
            Kontakt aufnehmen
          </Link>
        </section>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}
