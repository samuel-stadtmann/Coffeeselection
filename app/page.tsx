import Link from "next/link";

const LOGO = "/logo.png";
const HERO =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBvySg3Uf4lIr5-6yDourpO1iHmSl4aNwlTw2vUqWLLsXTR2owxYQPnvYY_fGQw_8MJ9gOoVJhPLdSiywoMPlVXb7ydqT4-EEd-jaiFKi-e6hih5dYFPY2wSZ2XMGoSz2v_4EtSVrvraFIhMMMZzbDxXU9oJz1R1q56fSmCRpqUcuecTpmR7u1k7iIxHHSsZG1oRzB_ABrePOMz1akMTgJjZDheHKafFnhGYLfXzk4J4-0t1M3WMYJhXqzL6gGeg_YgCV3AVKxNlw";
const ROASTERY =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDsi0Cm5pc68_wHYzSlE9JU3hSFfItOBscVq7fRgSVQF2O2c1qq3Lur8RIyfH1J56Xmysu8_-LJxl3wpeTypHOshuMB_3c8-5Z-yuccHxOvjlh1rBBx9aJ_L6xn0ES5e12zVKtvjtl1pI1K-J8kdzYr-ifacUyJTZrRDt5L4C7tyBQLYyKcpkoNC0Go4fagorT6mBPJdkR5u6AGDLnIFfYxzAiKDRRtiCr6pss5eRNI3-kBz3TRwC3MXJQNVV9oH7rHgXvPfiZieg";
const SUB_PACKAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBXoR-PUcwRpX90ByFqkCWcjPpcEEETiXPBMbk9Ld5nFgt_nXaBFZfZTNyGSjhQkrjnDsBLTRQWeqt4VN0TQr1WBNwzsDTrU4qNgxTCRay6sxsmu84CDRLYUJZ8E9OXI202fZi_4TK2PkJih6zW9aWQEE3-_H2kLTo_k5vxlyFi0W2sByzZGpxt3nNJu3LCXtXefZc-swkmbe-4Qe58IpA_bHC2apoj08Zr5EoaGLS0GQmM9UsAWA_g4kfazuRjohGU84KSnT7UoQ";
const AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCJlUN1xK0KJwNNVENRQno7wc5FvaY7oL5iwXuVxIW_IdVsV4FIw9gYU3bt2mJUxvPhxZ0u8MfB6cqbUEJWCcBOMhkgiTTC6_Jorsm3TErptYJxI-yCHNIeJy_vYhY22JV3LDvXyKPMcm4iQdl_6pARd4kL7W5CdY-HUArpP57CQQUjuEtq1mpmyl-1gvLEtg7HTBuEtprPOPp-DkKEyJuSHz6qG94cU5jS64NZyjFk97kQZX-WkmpqFNeq4-3rCDRPvrBGQ6KuJA";

const navLinks = [
  { href: "/about", label: "How it works" },
  { href: "/brewing-guides", label: "Roasters" },
  { href: "/atelier", label: "Learn" },
  { href: "/insights", label: "Reviews" },
];

const steps = [
  { n: "01", title: "Geschmacks-Profil", desc: "Beantworte kurze Fragen zu deinen Vorlieben: von fruchtig-hell bis schokoladig-dunkel." },
  { n: "02", title: "Algorithmus & Expertise", desc: "Unser Sommelier-System vergleicht dein Profil mit hunderten Schweizer Röstungen." },
  { n: "03", title: "Frisch geliefert", desc: "Erhalte deinen perfekten Kaffee direkt von der Rösterei in deinen Briefkasten." },
];

const benefits = [
  { icon: "auto_awesome", title: "Kuratierte Vielfalt", desc: "Jeden Monat neue Röster entdecken, die perfekt zu deinem Profil passen." },
  { icon: "schedule", title: "Maximale Flexibilität", desc: "Pausieren, Intervall anpassen oder jederzeit kündigen. Du hast die volle Kontrolle." },
  { icon: "loyalty", title: "Exklusive Vorteile", desc: "Spezialpreise für Abonnenten und Zugang zu limitierten \"Rare Batches\"." },
];

export default function HomePage() {
  return (
    <div className="bg-[#F9F5F0] text-on-surface font-body selection:bg-tertiary selection:text-white">
      {/* TopNavBar */}
      <header className="fixed top-0 w-full z-50 bg-[#F9F5F0]/85 backdrop-blur-xl transition-all duration-300">
        <nav className="flex justify-between items-center max-w-7xl mx-auto px-8 py-5 w-full">
          <Link href="/" className="flex items-center">
            <img alt="Coffee Selection Logo" className="h-20 w-auto object-contain" src={LOGO} />
          </Link>
          <div className="hidden md:flex items-center space-x-12">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-[#4D2C19] hover:text-[#D4A017] transition-colors font-label text-sm tracking-[0.18em] uppercase font-semibold"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center space-x-7">
            <Link href="/checkout/review">
              <span className="material-symbols-outlined text-primary text-3xl cursor-pointer hover:text-tertiary-fixed-dim transition-colors">shopping_bag</span>
            </Link>
            <Link href="/dashboard">
              <span className="material-symbols-outlined text-primary text-3xl cursor-pointer hover:text-tertiary-fixed-dim transition-colors">person</span>
            </Link>
            <Link
              href="/quiz"
              className="bg-primary text-white px-8 py-3 text-sm uppercase tracking-[0.18em] font-label font-bold rounded-lg shadow-sm hover:opacity-90 transition-all"
            >
              Start Quiz
            </Link>
          </div>
        </nav>
      </header>

      <main className="pt-24 bg-[#F9F5F0]">
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-8 editorial-grid items-center gap-12 bg-[#F9F5F0] mb-16">
          <div className="col-span-12 lg:col-span-5 pt-12">
            <span className="font-headline font-bold text-tertiary uppercase tracking-[0.3em] text-[10px] mb-6 block">
              Premium Swiss Curation
            </span>
            <h1 className="font-headline font-black text-5xl md:text-6xl text-primary leading-[1.1] tracking-tight mb-8">
              Finde deinen perfekten Specialty Coffee in 60 Sekunden
            </h1>
            <p className="font-body text-lg text-on-surface-variant leading-relaxed mb-12 max-w-lg">
              Personalisierte Kaffee-Auswahl von den besten Schweizer Röstern – abgestimmt auf deinen Geschmack.
            </p>
            <div className="flex flex-col sm:flex-row gap-6">
              <Link
                href="/quiz"
                className="bg-primary text-on-primary px-10 py-5 rounded-sm font-headline font-bold text-sm uppercase tracking-widest shadow-xl hover:bg-primary-container transition-all text-center"
              >
                Jetzt Kaffee-Match starten
              </Link>
              <Link
                href="/about"
                className="flex items-center gap-3 font-headline font-bold text-primary px-6 py-5 hover:bg-surface-container-low transition-colors rounded-sm"
              >
                <span className="material-symbols-outlined">play_circle</span>
                Wie es funktioniert
              </Link>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-7 relative">
            <div className="aspect-[4/5] md:aspect-square overflow-hidden rounded-sm shadow-2xl relative z-10 border border-primary/5">
              <img alt="Premium coffee brewing experience" className="w-full h-full object-cover" src={HERO} />
            </div>
            <div className="absolute -bottom-8 -left-8 bg-tertiary text-white p-8 z-20 max-w-[200px] shadow-xl">
              <p className="font-headline font-black text-4xl mb-1">100+</p>
              <p className="font-headline text-[10px] font-bold uppercase tracking-widest leading-tight">Kuratierte Röstungen</p>
            </div>
            <div className="absolute -top-12 -right-4 w-64 h-64 bg-surface-container-low -z-0" />
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-[#F9F5F0] border-y border-primary/5 py-16">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-16">
              <h2 className="font-headline font-extrabold text-4xl text-primary mb-4 uppercase tracking-tight">
                Der Weg zu Deinem Match
              </h2>
              <p className="font-body text-lg text-on-surface-variant italic">
                Präzision in jedem Schritt, Leidenschaft in jeder Bohne.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              {steps.map((s) => (
                <div key={s.n} className="relative group">
                  <span className="text-9xl font-headline font-black text-surface-container absolute -top-12 -left-4 -z-0 opacity-80">
                    {s.n}
                  </span>
                  <div className="relative z-10">
                    <h3 className="font-headline font-bold text-lg mb-4 text-primary uppercase tracking-widest">
                      {s.title}
                    </h3>
                    <p className="font-body text-on-surface-variant leading-relaxed text-sm">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Roasters */}
        <section className="max-w-7xl mx-auto px-8 bg-[#F9F5F0] py-16">
          <div className="flex justify-between items-end mb-16">
            <div className="max-w-xl">
              <h2 className="font-headline font-extrabold text-4xl text-primary mb-4 uppercase tracking-tighter">
                Unsere Meister-Röster
              </h2>
              <p className="font-body text-lg text-on-surface-variant">
                Wir arbeiten nur mit den renommiertesten Micro-Roasteries der Schweiz zusammen.
              </p>
            </div>
            <Link
              href="/brewing-guides"
              className="font-headline text-[10px] font-bold uppercase tracking-[0.25em] text-tertiary hover:text-primary transition-colors border-b-2 border-tertiary pb-1"
            >
              Alle Entdecken
            </Link>
          </div>
          <div className="grid grid-cols-12 gap-8 h-[550px]">
            <div className="col-span-12 md:col-span-7 bg-surface-container relative overflow-hidden group">
              <img
                src={ROASTERY}
                alt="Roastery Interior"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent" />
              <div className="absolute bottom-10 left-10 text-on-primary">
                <span className="font-headline text-[10px] uppercase tracking-[0.4em] mb-4 block text-tertiary font-bold">
                  Zürich, CH
                </span>
                <h3 className="font-headline font-extrabold text-3xl mb-2">Miro Coffee Roasters</h3>
                <p className="font-body text-on-primary/80 max-w-xs text-sm">
                  Pioniere in Sachen Direct Trade und nordischem Röststil.
                </p>
              </div>
            </div>
            <div className="col-span-12 md:col-span-5 flex flex-col gap-8">
              <div className="flex-1 bg-surface-container-low p-10 flex flex-col justify-between border-l-4 border-tertiary">
                <div>
                  <h3 className="font-headline font-bold text-2xl text-primary mb-2">Vertical Coffee</h3>
                  <p className="font-body text-on-surface-variant text-sm">
                    Präzision aus den Alpen. Spezialisiert auf Single Origins mit klarem Charakter.
                  </p>
                </div>
                <div className="flex gap-4">
                  <span className="px-3 py-1 bg-surface-container text-primary font-headline text-[9px] font-bold uppercase tracking-widest">
                    Bern
                  </span>
                  <span className="px-3 py-1 bg-surface-container text-primary font-headline text-[9px] font-bold uppercase tracking-widest">
                    Bio-Zertifiziert
                  </span>
                </div>
              </div>
              <div className="flex-1 bg-primary text-on-primary p-10 flex flex-col justify-between">
                <div>
                  <h3 className="font-headline font-bold text-2xl mb-2 text-tertiary">Kaffee-Sommelier Tipp</h3>
                  <p className="font-body text-on-primary/70 italic text-sm">
                    &ldquo;Diese Saison empfehlen wir den &lsquo;Sidamo&rsquo; von Stoll für seine unvergleichlichen Zitrusnoten.&rdquo;
                  </p>
                </div>
                <button className="text-tertiary font-headline font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform">
                  Jetzt probieren <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Subscription Benefits */}
        <section className="max-w-7xl mx-auto px-8 bg-[#F9F5F0] mb-16">
          <div className="bg-surface-container-highest p-16 editorial-grid gap-12 items-center rounded-sm">
            <div className="col-span-12 lg:col-span-6">
              <h2 className="font-headline font-black text-4xl text-primary mb-8 uppercase tracking-tight">
                Das ultimative Abo-Erlebnis
              </h2>
              <ul className="space-y-8">
                {benefits.map((b) => (
                  <li key={b.title} className="flex gap-6">
                    <div className="w-12 h-12 bg-primary flex items-center justify-center text-on-primary shrink-0 rounded-sm">
                      <span className="material-symbols-outlined">{b.icon}</span>
                    </div>
                    <div>
                      <h4 className="font-headline font-bold text-base text-primary uppercase tracking-widest">{b.title}</h4>
                      <p className="font-body text-on-surface-variant text-sm mt-1">{b.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-span-12 lg:col-span-6">
              <div className="relative p-8 bg-background border border-primary/10 shadow-xl">
                <div className="mb-8">
                  <img src={SUB_PACKAGE} alt="Coffee package" className="w-full aspect-video object-cover mb-8 rounded-sm" />
                  <div className="flex justify-between items-center pb-4 border-b border-primary/10">
                    <span className="font-headline font-bold text-primary tracking-widest uppercase text-sm">
                      Explorer Abo
                    </span>
                    <span className="font-headline font-black text-2xl text-primary">CHF 24.00</span>
                  </div>
                  <p className="font-body text-[13px] text-on-surface-variant mt-4 italic">
                    Pro Lieferung inkl. Versand. 2 x 250g Kaffee.
                  </p>
                </div>
                <Link
                  href="/quiz"
                  className="block text-center w-full bg-primary text-on-primary py-4 font-headline font-bold uppercase tracking-[0.2em] text-xs hover:bg-primary-container transition-all"
                >
                  Abo konfigurieren
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="border-t border-primary/5 bg-[#F9F5F0] py-12">
          <div className="max-w-7xl mx-auto px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 items-center opacity-50 grayscale hover:grayscale-0 transition-all duration-700 mb-24">
              {["NZZ", "VOGUE", "MONOCLE", "ANNABELLE"].map((p) => (
                <div key={p} className="text-center font-headline font-black text-2xl tracking-tighter text-primary">
                  {p}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
              <div className="relative">
                <div className="text-9xl text-tertiary/10 font-serif absolute -top-16 -left-8">&ldquo;</div>
                <blockquote className="relative z-10">
                  <p className="font-body text-3xl italic text-primary leading-snug mb-8">
                    &ldquo;Der Algorithmus hat meinen Geschmack besser getroffen als ich selbst. Seit dem ersten Paket bin ich begeistert von der Qualität der Schweizer Röstungen.&rdquo;
                  </p>
                  <cite className="not-italic flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container border border-primary/10">
                      <img src={AVATAR} alt="User avatar" />
                    </div>
                    <div>
                      <span className="block font-headline font-bold text-primary text-sm">Marc B.</span>
                      <span className="block font-headline text-[10px] uppercase text-on-surface-variant tracking-[0.2em] font-semibold">
                        Kaffee-Liebhaber aus Genf
                      </span>
                    </div>
                  </cite>
                </blockquote>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="aspect-square bg-surface-container p-8 flex flex-col justify-center text-center rounded-sm">
                  <span className="font-headline font-black text-4xl text-primary mb-2">4.9/5</span>
                  <span className="font-headline text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Google Reviews
                  </span>
                </div>
                <div className="aspect-square bg-tertiary p-8 flex flex-col justify-center text-center rounded-sm">
                  <span className="font-headline font-black text-4xl text-white mb-2">12k+</span>
                  <span className="font-headline text-[10px] font-bold uppercase tracking-widest text-white/90">
                    Aktive Abonnenten
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full px-8 bg-[#F9F5F0] border-t border-primary/5 py-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <div className="flex flex-col gap-4 mb-6">
              <img src={LOGO} alt="Coffee Selection Logo" className="h-16 w-auto object-contain self-start" />
            </div>
            <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-6">
              Wir kuratieren den besten Schweizer Specialty Coffee für Genießer und Entdecker.
            </p>
            <div className="flex gap-4">
              <span className="material-symbols-outlined text-primary hover:text-tertiary transition-colors cursor-pointer">local_cafe</span>
              <span className="material-symbols-outlined text-primary hover:text-tertiary transition-colors cursor-pointer">filter_drama</span>
            </div>
          </div>
          <div>
            <h4 className="font-headline font-bold text-[11px] uppercase tracking-[0.3em] mb-8 text-primary">Shop</h4>
            <ul className="space-y-4 font-headline text-[11px] font-semibold uppercase tracking-widest">
              <li><Link href="/about" className="text-on-surface-variant hover:text-tertiary transition-colors">How it works</Link></li>
              <li><Link href="/brewing-guides" className="text-on-surface-variant hover:text-tertiary transition-colors">Roasters</Link></li>
              <li><Link href="/faq" className="text-on-surface-variant hover:text-tertiary transition-colors">Shipping</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-headline font-bold text-[11px] uppercase tracking-[0.3em] mb-8 text-primary">Legal</h4>
            <ul className="space-y-4 font-headline text-[11px] font-semibold uppercase tracking-widest">
              <li><Link href="#" className="text-on-surface-variant hover:text-tertiary transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="text-on-surface-variant hover:text-tertiary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-headline font-bold text-[11px] uppercase tracking-[0.3em] mb-8 text-primary">Newsletter</h4>
            <p className="font-body text-xs text-on-surface-variant mb-6 italic">Exklusive Angebote und Kaffee-Wissen.</p>
            <div className="flex border border-primary/10 bg-background overflow-hidden rounded-sm">
              <input
                type="email"
                placeholder="Deine E-Mail"
                className="bg-transparent border-none focus:ring-0 text-sm w-full px-4 font-headline outline-none"
              />
              <button className="bg-primary text-on-primary px-5 py-3 hover:bg-primary-container transition-colors">
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-primary/5 mt-8">
          <p className="text-[10px] text-on-surface-variant/60 font-headline font-bold uppercase tracking-[0.2em] text-center">
            © 2024 Coffee Selection. Crafted for the Editorial Sommelier.
          </p>
        </div>
      </footer>
    </div>
  );
}
