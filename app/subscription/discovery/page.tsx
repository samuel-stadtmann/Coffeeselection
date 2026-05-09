import Link from "next/link";
import type { Metadata } from "next";

const LOGO = "/logo.png";
const HERO =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBXoR-PUcwRpX90ByFqkCWcjPpcEEETiXPBMbk9Ld5nFgt_nXaBFZfZTNyGSjhQkrjnDsBLTRQWeqt4VN0TQr1WBNwzsDTrU4qNgxTCRay6sxsmu84CDRLYUJZ8E9OXI202fZi_4TK2PkJih6zW9aWQEE3-_H2kLTo_k5vxlyFi0W2sByzZGpxt3nNJu3LCXtXefZc-swkmbe-4Qe58IpA_bHC2apoj08Zr5EoaGLS0GQmM9UsAWA_g4kfazuRjohGU84KSnT7UoQ";
const COFFEE_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC-mgzdszeDV-ADPnt08LksEtq5jHo_pZiXrnzVNy7faF7CAvNwCIqw0tZ2ylgRbHNuI-cdksgJ49bjfH36AYZerX9qRPq7kE2svCJ2KsLCMhI2k4Dc50D2D5FEGms1FJKDbeS75aSghLNY7Dop_dxhV5e-766gOscbYVVzn4qpX1rtPcumcDu7hr6OQeoiBzbRrze7HIkmFAM9YOYzQFzRF1wR3U1Ec53bS5Aj9xRlWvn7KxLIHJL79Wy6T8BFR47-ulGO1PjIJKEL";

export const metadata: Metadata = {
  title: "Discovery Abo — Specialty Coffee monatlich entdecken | Coffee Selection",
  description: "Das Discovery Abo: Jeden Monat 2 neue Schweizer Specialty Coffees, perfekt zu deinem Geschmackstyp. Pausieren oder kündigen jederzeit.",
  keywords: ["coffee abo schweiz", "specialty coffee subscription", "discovery box", "kaffee abonnement", "monatliches kaffee abo"],
};

const navLinks = [
  { href: "/quiz/question-1-brewing-method", label: "Quiz" },
  { href: "/taste-types", label: "Geschmackstypen" },
  { href: "/learn/best-coffee-switzerland", label: "Magazine" },
  { href: "/subscription/discovery", label: "Subscription" },
];

const benefits = [
  { icon: "auto_awesome", title: "Kuratiert für deinen Geschmackstyp", desc: "Unser Algorithmus wählt jeden Monat zwei Kaffees, die exakt zu deinem Profil passen — von 16 Schweizer Top-Röstereien." },
  { icon: "explore", title: "Echte Entdeckungen", desc: "Du bekommst Kaffees, die du sonst nie gefunden hättest. Rare Lots, neue Aufbereitungen, saisonale Highlights." },
  { icon: "schedule", title: "Volle Flexibilität", desc: "Pausieren, Intervall ändern oder kündigen — alles mit einem Klick. Keine Mindestlaufzeit." },
  { icon: "loyalty", title: "Abonnenten-Preise", desc: "15% Rabatt gegenüber Einzelbestellung. Plus Zugang zu limitierten 'Rare Batches' nur für Mitglieder." },
  { icon: "local_shipping", title: "Versand ab CHF 100 kostenlos", desc: "Schweizweit liefern wir röstfrisch in 2–4 Werktagen. Ab einem Bestellwert von CHF 100 ist der Versand inklusive — sonst CHF 6.90." },
  { icon: "favorite", title: "Profil lernt mit", desc: "Bewerte jede Lieferung — der Algorithmus wird mit jeder Bewertung präziser. Deine zehnte Lieferung trifft besser als deine erste." },
];

const bestsellers = [
  { slug: "ethiopia-yirgacheffe", name: "Ethiopia Yirgacheffe", roaster: "Miro Coffee", origin: "Äthiopien", tagline: "Jasmin · Limette · Beeren", price: "CHF 23.80", originalPrice: "CHF 28", badge: "Bestseller" },
  { slug: "brasil-cerrado", name: "Brasil Cerrado", roaster: "Miro Coffee", origin: "Brasilien", tagline: "Schokolade · Nuss · Karamell", price: "CHF 18.70", originalPrice: "CHF 22", badge: "Klassiker" },
  { slug: "kenya-aa-nyeri", name: "Kenya AA Nyeri", roaster: "Vertical Coffee", origin: "Kenia", tagline: "Schwarze Johannisbeere · Tomate", price: "CHF 27.20", originalPrice: "CHF 32", badge: null },
  { slug: "espresso-tradizionale", name: "Espresso Tradizionale", roaster: "Stoll Kaffee", origin: "Blend", tagline: "Kakao · Karamell · Tabak", price: "CHF 20.40", originalPrice: "CHF 24", badge: null },
  { slug: "costa-rica-honey", name: "Costa Rica Honey", roaster: "Vertical Coffee", origin: "Costa Rica", tagline: "Honig · Mandarine · Honigmelone", price: "CHF 23.80", originalPrice: "CHF 28", badge: null },
  { slug: "panama-geisha", name: "Panama Geisha", roaster: "Sweven Coffee", origin: "Panama", tagline: "Bergamotte · Pfirsich · Tee", price: "CHF 40.80", originalPrice: "CHF 48", badge: "Rare Lot" },
];

const steps = [
  { n: "01", title: "Quiz machen", desc: "12 Fragen in 60 Sekunden. Du erhältst deinen Geschmackstyp aus 8 Archetypen." },
  { n: "02", title: "Abo starten", desc: "Wähle Menge (250g – 1kg) und Intervall (wöchentlich bis 6 Wochen)." },
  { n: "03", title: "Genießen & bewerten", desc: "Jede Lieferung neue Kaffees. Bewerte sie — wir lernen, du genießt." },
];

const faq = [
  { q: "Was ist im Discovery Abo enthalten?", a: "Pro Lieferung erhältst du 2 verschiedene Specialty Coffees (250g oder 500g je Sorte, je nach gewählter Menge), perfekt auf deinen Geschmackstyp abgestimmt. Plus eine Karte mit Brüh-Tipps und Aromen-Beschreibung." },
  { q: "Kann ich das Abo jederzeit pausieren?", a: "Ja. In deinem Konto kannst du jederzeit pausieren (z. B. während Ferien), das Intervall ändern oder komplett kündigen. Es gibt keine Mindestlaufzeit." },
  { q: "Was kostet das Abo?", a: "Discovery Abo startet bei CHF 24.00 pro Lieferung (250g + 250g). Ab einem Bestellwert von CHF 100 ist der Versand kostenlos, sonst CHF 6.90. Alle Abo-Preise enthalten 15% Mitglieder-Rabatt." },
  { q: "Kann ich auch nur einmal bestellen?", a: "Ja. Du kannst jeden Match-Kaffee auch einmalig bestellen — ohne Abo, ohne Bindung. Im Abo sparst du allerdings 15%." },
  { q: "Was passiert bei der ersten Lieferung?", a: "Sofort nach Bestellung wird dein erstes Set geröstet und versendet. Folgelieferungen kommen automatisch im gewählten Intervall — du siehst alle Termine in deinem Konto." },
  { q: "Kann ich Geschmackstyp wechseln?", a: "Ja, jederzeit. Wenn sich dein Geschmack entwickelt, machst du das Quiz neu — die nächste Lieferung passt sich an." },
];

export default function DiscoverySubscriptionPage() {
  return (
    <div className="bg-[#F9F5F0] text-on-surface pb-20 md:pb-0">
      {/* Header — full nav like home */}
      <header className="fixed top-0 w-full z-50 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5">
        <nav className="flex justify-between items-center max-w-7xl mx-auto px-6 md:px-8 w-full">
          <Link href="/" className="flex items-center">
            <img alt="Coffee Selection Logo" className="h-56 md:h-72 w-auto object-contain -my-10 md:-my-16 mr-8 shrink-0" src={LOGO} />
          </Link>
          <div className="hidden lg:flex items-center space-x-10">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-primary hover:text-tertiary transition-colors font-headline font-bold tracking-widest uppercase text-[14px]"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center space-x-4 md:space-x-6">
            <Link href="/login?next=/account/dashboard" className="hidden md:block">
              <span className="material-symbols-outlined text-primary text-2xl hover:text-tertiary transition-colors">person</span>
            </Link>
            <Link href="/checkout/cart">
              <span className="material-symbols-outlined text-primary text-2xl hover:text-tertiary transition-colors">shopping_bag</span>
            </Link>
            <Link
              href="/quiz/question-1-brewing-method"
              className="bg-primary text-white px-5 md:px-6 py-3 text-[11px] md:text-[12px] uppercase tracking-[0.2em] font-headline font-bold hover:bg-black transition-all whitespace-nowrap"
            >
              Quiz starten
            </Link>
          </div>
        </nav>
      </header>

      <main className="pt-36 md:pt-40">
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-6 block">
              Discovery Abo
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl text-primary leading-[1.1] mb-6 font-headline font-bold uppercase tracking-tight">
              Jeden Monat<br />ein neues<br />Geschmacks-Erlebnis
            </h1>
            <p className="text-lg text-on-surface-variant leading-relaxed mb-8 max-w-lg">
              Das Discovery Abo bringt dir kuratierte Specialty Coffees, perfekt auf deinen Geschmackstyp abgestimmt — direkt von 16 Schweizer Top-Röstern.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/quiz/question-1-brewing-method"
                className="bg-primary text-on-primary px-10 py-5 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all text-center"
              >
                Geschmackstyp finden
              </Link>
              <Link
                href="#how"
                className="flex items-center justify-center gap-3 font-headline font-bold text-primary px-6 py-5 hover:bg-surface-container-low transition-colors uppercase tracking-widest text-[11px]"
              >
                <span className="material-symbols-outlined text-2xl">arrow_downward</span>
                Wie es funktioniert
              </Link>
            </div>
            <div className="flex items-center gap-6 mt-8 text-sm text-on-surface-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-base">check_circle</span>
                Ab CHF 24/Monat
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-base">check_circle</span>
                Pausierbar
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-base">check_circle</span>
                Keine Bindung
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] overflow-hidden shadow-2xl">
              <img src={HERO} alt="Discovery Box" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-tertiary text-primary p-6 md:p-8 z-20 shadow-2xl max-w-[260px]">
              <p className="font-headline font-bold text-3xl md:text-4xl mb-1">-15%</p>
              <p className="font-headline text-[10px] uppercase tracking-widest leading-tight">
                Abo-Rabatt<br />gegenüber Einzelbestellung
              </p>
            </div>
          </div>
        </section>

        {/* How */}
        <section id="how" className="bg-surface-container-low py-20 md:py-24">
          <div className="max-w-7xl mx-auto px-6 md:px-8">
            <div className="text-center mb-16">
              <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
                So funktioniert&apos;s
              </span>
              <h2 className="text-3xl md:text-4xl text-primary mb-4 uppercase tracking-tight font-headline font-bold">
                In 3 Schritten zum Abo
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
              {steps.map((s) => (
                <div key={s.n} className="relative">
                  <span className="text-9xl font-headline font-bold text-primary/5 absolute -top-12 -left-4 -z-0 select-none">{s.n}</span>
                  <div className="relative z-10">
                    <h3 className="text-lg mb-4 text-primary uppercase tracking-widest font-headline font-bold">{s.title}</h3>
                    <p className="text-on-surface-variant leading-relaxed text-[15px]">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-24">
          <div className="text-center mb-12 md:mb-16">
            <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
              Warum Abo?
            </span>
            <h2 className="text-3xl md:text-4xl text-primary mb-4 uppercase tracking-tight font-headline font-bold">
              Sechs gute Gründe
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="bg-white p-8 shadow-sm border-l-4 border-tertiary">
                <span className="material-symbols-outlined text-tertiary text-3xl mb-4 block">{b.icon}</span>
                <h3 className="text-lg text-primary mb-3 uppercase tracking-tight font-headline font-bold">{b.title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-surface-variant py-20 md:py-24">
          <div className="max-w-5xl mx-auto px-6 md:px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
              <div className="max-w-xl">
                <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
                  Bestsellers
                </span>
                <h2 className="text-3xl md:text-4xl text-primary mb-4 uppercase tracking-tight font-headline font-bold">
                  Direkt zum Abo — ohne Quiz
                </h2>
                <p className="text-on-surface-variant">
                  Du weißt, was du willst? Wähle direkt einen unserer beliebtesten Specialty Coffees als Abo. Mit 15% Mitglieder-Rabatt.
                </p>
              </div>
              <Link
                href="/quiz/question-1-brewing-method"
                className="font-headline text-[11px] font-bold uppercase tracking-[0.3em] text-tertiary hover:text-primary transition-colors border-b-2 border-tertiary pb-2 whitespace-nowrap"
              >
                Lieber Quiz machen →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bestsellers.map((c) => (
                <div key={c.slug} className="bg-white shadow-sm hover:shadow-xl transition-all flex flex-col group">
                  <Link href={`/coffee/${c.slug}`} className="block relative aspect-[4/3] overflow-hidden bg-surface-container-low">
                    <img src={COFFEE_IMG} alt={c.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    {c.badge && (
                      <span className="absolute top-4 left-4 bg-tertiary text-primary px-3 py-1 font-headline text-[10px] uppercase tracking-widest font-bold">
                        {c.badge}
                      </span>
                    )}
                    <span className="absolute top-4 right-4 bg-primary text-on-primary px-3 py-1 font-headline text-[10px] uppercase tracking-widest font-bold">
                      -15% Abo
                    </span>
                  </Link>
                  <div className="p-6 flex-1 flex flex-col">
                    <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold mb-1">{c.origin}</span>
                    <Link href={`/coffee/${c.slug}`}>
                      <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg group-hover:text-tertiary transition-colors">
                        {c.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-on-surface-variant mb-1">{c.roaster}</p>
                    <p className="text-sm text-on-surface-variant italic mb-6 flex-1">{c.tagline}</p>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="font-headline font-bold text-2xl text-primary">{c.price}</span>
                      <span className="font-headline text-sm text-on-surface-variant line-through">{c.originalPrice}</span>
                      <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant ml-auto">/ 250g</span>
                    </div>
                    <Link
                      href="/checkout/payment"
                      className="block text-center w-full bg-primary text-on-primary py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all"
                    >
                      Abo starten · Direkt zum Shop
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-white p-5">
                <span className="material-symbols-outlined text-tertiary text-2xl mb-2 block">autorenew</span>
                <p className="font-headline text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">Lieferintervall frei wählbar</p>
                <p className="text-xs text-on-surface-variant mt-1">Wöchentlich bis alle 6 Wochen</p>
              </div>
              <div className="bg-white p-5">
                <span className="material-symbols-outlined text-tertiary text-2xl mb-2 block">local_shipping</span>
                <p className="font-headline text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">Versand ab CHF 100 gratis</p>
                <p className="text-xs text-on-surface-variant mt-1">Sonst CHF 6.90, schweizweit</p>
              </div>
              <div className="bg-white p-5">
                <span className="material-symbols-outlined text-tertiary text-2xl mb-2 block">pause_circle</span>
                <p className="font-headline text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">Pausieren jederzeit</p>
                <p className="text-xs text-on-surface-variant mt-1">Keine Mindestlaufzeit, kein Risiko</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-6 md:px-8 py-20 md:py-24">
          <div className="text-center mb-12">
            <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
              FAQ
            </span>
            <h2 className="text-3xl md:text-4xl text-primary mb-4 uppercase tracking-tight font-headline font-bold">
              Häufige Fragen
            </h2>
          </div>
          <div className="space-y-3">
            {faq.map((f) => (
              <details key={f.q} className="bg-white shadow-sm group">
                <summary className="flex justify-between items-center cursor-pointer p-6 md:p-8 list-none">
                  <span className="font-headline font-bold text-primary uppercase tracking-tight pr-4">{f.q}</span>
                  <span className="material-symbols-outlined text-tertiary group-open:rotate-180 transition-transform shrink-0">expand_more</span>
                </summary>
                <div className="px-6 md:px-8 pb-6 md:pb-8 text-on-surface-variant leading-relaxed">{f.a}</div>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-primary text-on-primary py-20">
          <div className="max-w-3xl mx-auto px-6 md:px-8 text-center">
            <h2 className="text-3xl md:text-5xl mb-6 uppercase tracking-tight font-headline font-bold">
              Bereit für dein <span className="text-tertiary">Discovery Abo?</span>
            </h2>
            <p className="text-lg text-on-primary/70 mb-10">
              Quiz machen, Geschmackstyp finden, Abo starten — alles in unter 5 Minuten.
            </p>
            <Link
              href="/quiz/question-1-brewing-method"
              className="inline-block bg-tertiary text-primary px-12 py-5 font-headline font-bold text-xs uppercase tracking-widest hover:bg-white transition-all"
            >
              Quiz starten
            </Link>
          </div>
        </section>
      </main>

      <footer className="w-full px-6 md:px-8 bg-[#F9F5F0] border-t border-primary/5 py-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] text-on-surface-variant/60 font-headline font-bold uppercase tracking-[0.3em]">
          <Link href="/" className="flex items-center">
            <img alt="Coffee Selection" className="h-40 md:h-56 w-auto object-contain" src={LOGO} />
          </Link>
          <span>© 2024 Coffee Selection · Handverlesen aus der Schweiz</span>
        </div>
      </footer>

      <Link
        href="/quiz/question-1-brewing-method"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-primary text-on-primary py-5 text-center font-headline font-bold uppercase tracking-widest text-xs shadow-2xl border-t-2 border-tertiary"
      >
        Abo starten · Quiz machen
      </Link>
    </div>
  );
}
