import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import MobileNav from "@/components/MobileNav";

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      <Nav />

      <main className="flex-1 pt-20 pb-32 px-4">
        {/* Hero */}
        <div className="max-w-lg mx-auto text-center pt-16 pb-12">
          <span className="material-symbols-outlined text-secondary mb-6 block" style={{ fontSize: 80 }}>
            task_alt
          </span>
          <h1 className="font-headline font-serif text-4xl text-on-surface mb-3">
            Bestellung bestätigt!
          </h1>
          <p className="font-sans text-on-surface-variant text-base mb-6">
            Danke für deine Bestellung.
          </p>

          {/* Order Number Chip */}
          <div className="inline-flex items-center gap-2 bg-surface-container-low border border-outline-variant rounded-full px-5 py-2 mb-12">
            <span className="material-symbols-outlined text-secondary text-sm">tag</span>
            <span className="font-label font-semibold text-on-surface text-sm tracking-wider">
              CS-2024-000042
            </span>
          </div>

          {/* Details Bento */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            {/* Delivery */}
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 text-left">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-secondary text-lg">local_shipping</span>
                <p className="font-label font-semibold text-on-surface-variant text-xs uppercase tracking-wider">
                  Lieferung
                </p>
              </div>
              <p className="font-sans text-on-surface text-sm leading-relaxed">
                Marco Müller<br />
                Bahnhofstrasse 12<br />
                8001 Zürich
              </p>
              <p className="font-sans text-on-surface-variant text-xs mt-2">
                Standard (3–5 Tage)
              </p>
            </div>

            {/* Order */}
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 text-left">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-secondary text-lg">shopping_bag</span>
                <p className="font-label font-semibold text-on-surface-variant text-xs uppercase tracking-wider">
                  Bestellung
                </p>
              </div>
              <p className="font-headline font-serif text-on-surface text-sm font-semibold mb-0.5">
                Ethiopia Yirgacheffe
              </p>
              <p className="font-sans text-on-surface-variant text-xs mb-2">250g · Qty: 1</p>
              <p className="font-sans font-bold text-on-surface text-base">CHF 29.80</p>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/login?next=/account/dashboard"
              className="flex-1 py-4 bg-primary text-white font-label font-semibold rounded-xl uppercase tracking-widest text-sm text-center"
            >
              Mein Konto
            </Link>
            <Link
              href="/"
              className="flex-1 py-4 bg-surface-container-low border border-outline-variant text-on-surface font-label font-semibold rounded-xl uppercase tracking-widest text-sm text-center hover:border-secondary/30 transition-colors"
            >
              Weiter einkaufen
            </Link>
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
