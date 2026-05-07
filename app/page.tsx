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
  { n: "02", title: "Expertise", desc: "Unser Sommelier-System vergleicht dein Profil mit hunderten Schweizer Röstungen." },
  { n: "03", title: "Geliefert", desc: "Erhalte deinen perfekten Kaffee direkt von der Rösterei in deinen Briefkasten." },
];

const benefits = [
  { icon: "auto_awesome", title: "Kuratierte Vielfalt", desc: "Jeden Monat neue Röster entdecken, die perfekt zu deinem Profil passen." },
  { icon: "schedule", title: "Flexibilität", desc: "Pausieren, Intervall anpassen oder jederzeit kündigen. Du hast die volle Kontrolle." },
  { icon: "loyalty", title: "Exklusive Vorteile", desc: "Spezialpreise für Abonnenten und Zugang zu limitierten \"Rare Batches\"." },
];

export default function HomePage() {
  return (
    <div className="bg-[#F9F5F0] text-on-surface selection:bg-tertiary selection:text-white">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5 transition-all duration-300">
        <nav className="flex justify-between items-center max-w-7xl mx-auto px-8 w-full py-1">
          <Link href="/" className="flex items-center">
            <img
              alt="Coffee Selection Logo"
              className="h-[160px] md:h-[190px] w-auto object-contain -my-6 md:-my-8 mr-8"
              src={LOGO}
            />
          </Link>
          <div className="hidden md:flex items-center space-x-10">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-[#4D2C19] hover:text-[#D4A017] transition-colors font-headline font-bold tracking-widest uppercase text-[16px]"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              <Link href="/checkout/review">
                <span className="material-symbols-outlined text-primary text-2xl cursor-pointer hover:text-tertiary transition-colors">shopping_bag</span>
              </Link>
              <Link href="/dashboard">
                <span className="material-symbols-outlined text-primary text-2xl cursor-pointer hover:text-tertiary transition-colors">person</span>
              </Link>
            </div>
            <Link
              href="/quiz"
              className="bg-primary text-white px-6 py-3 text-[12px] uppercase tracking-[0.2em] font-headline font-bold hover:bg-black transition-all"
            >
              Start Quiz
            </Link>
          </div>
        </nav>
      </header>

      <main className="pt-24">
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-8 editorial-grid items-center gap-16 py-20">
          <div className="col-span-12 lg:col-span-5">
            <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-6 block">
              Premium Swiss Curation
            </span>
            <h1 className="text-4xl md:text-5xl text-primary leading-[1.15] mb-8">
              Finde deinen perfekten Specialty Coffee in 60 Sekunden
            </h1>
            <p className="text-lg text-on-surface-variant leading-relaxed mb-10 max-w-lg">
              Personalisierte Kaffee-Auswahl von den besten Schweizer Röstern – abgestimmt auf deinen Geschmack.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/quiz"
                className="bg-primary text-on-primary px-10 py-5 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all text-center"
              >
                Jetzt Kaffee-Match starten
              </Link>
              <Link
                href="/about"
                className="flex items-center gap-3 font-headline font-bold text-primary px-6 py-5 hover:bg-surface-container-low transition-colors uppercase tracking-widest text-[11px]"
              >
                <span className="material-symbols-outlined text-2xl">play_circle</span>
                Wie es funktioniert
              </Link>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-7 relative">
            <div className="aspect-square overflow-hidden shadow-2xl relative z-10">
              <img alt="Premium coffee brewing experience" className="w-full h-full object-cover" src={HERO} />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-tertiary text-white p-8 z-20 shadow-2xl">
              <p className="font-headline font-bold text-5xl mb-1">100+</p>
              <p className="font-headline text-[10px] uppercase tracking-widest leading-tight">Kuratierte Röstungen</p>
            </div>
            <div className="absolute -top-12 -right-8 w-64 h-64 bg-surface-container-low -z-0" />
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-surface-container-low py-20 border-y border-primary/5">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl text-primary mb-4 uppercase tracking-tight">Der Weg zu Deinem Match</h2>
              <p className="text-lg text-on-surface-variant italic">Präzision in jedem Schritt, Leidenschaft in jeder Bohne.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              {steps.map((s) => (
                <div key={s.n} className="relative group">
                  <span className="text-9xl font-headline font-bold text-primary/5 absolute -top-12 -left-4 -z-0 select-none">
                    {s.n}
                  </span>
                  <div className="relative z-10">
                    <h3 className="text-lg mb-4 text-primary uppercase tracking-widest">{s.title}</h3>
                    <p className="text-on-surface-variant leading-relaxed text-[15px]">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Roasters */}
        <section className="max-w-7xl mx-auto px-8 py-20">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
            <div className="max-w-xl">
              <h2 className="text-3xl text-primary mb-4 uppercase tracking-tight">Unsere Meister-Röster</h2>
              <p className="text-lg text-on-surface-variant">
                Wir arbeiten nur mit den renommiertesten Micro-Roasteries der Schweiz zusammen.
              </p>
            </div>
            <Link
              href="/brewing-guides"
              className="font-headline text-[11px] font-bold uppercase tracking-[0.3em] text-tertiary hover:text-primary transition-colors border-b-2 border-tertiary pb-2"
            >
              Alle Entdecken
            </Link>
          </div>
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 md:col-span-7 bg-surface-container relative overflow-hidden group shadow-lg min-h-[500px]">
              <img
                src={ROASTERY}
                alt="Roastery Interior"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-transparent to-transparent" />
              <div className="absolute bottom-10 left-10 text-on-primary">
                <span className="font-headline text-[10px] uppercase tracking-[0.5em] mb-4 block text-tertiary font-bold">
                  Zürich, CH
                </span>
                <h3 className="text-3xl mb-3">Miro Coffee Roasters</h3>
                <p className="text-on-primary/80 max-w-sm text-sm leading-relaxed">
                  Pioniere in Sachen Direct Trade und nordischem Röststil.
                </p>
              </div>
            </div>
            <div className="col-span-12 md:col-span-5 flex flex-col gap-8">
              <div className="flex-1 bg-white p-10 flex flex-col justify-between border-l-8 border-tertiary shadow-md">
                <div>
                  <h3 className="text-xl text-primary mb-4 uppercase tracking-tight">Vertical Coffee</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">
                    Präzision aus den Alpen. Spezialisiert auf Single Origins mit klarem Charakter.
                  </p>
                </div>
                <div className="flex gap-4 mt-6">
                  <span className="px-3 py-1 bg-surface-container text-primary font-headline text-[9px] font-bold uppercase tracking-widest">
                    Bern
                  </span>
                  <span className="px-3 py-1 bg-surface-container text-primary font-headline text-[9px] font-bold uppercase tracking-widest">
                    Bio
                  </span>
                </div>
              </div>
              <div className="flex-1 bg-primary text-on-primary p-10 flex flex-col justify-between shadow-md">
                <div>
                  <h3 className="text-xl mb-3 text-tertiary uppercase tracking-tight">Sommelier Tipp</h3>
                  <p className="italic text-sm leading-relaxed">
                    &ldquo;Diese Saison empfehlen wir den &lsquo;Sidamo&rsquo; von Stoll für seine unvergleichlichen Zitrusnoten.&rdquo;
                  </p>
                </div>
                <button className="text-tertiary font-headline font-bold uppercase text-[10px] tracking-[0.3em] flex items-center gap-2 hover:translate-x-2 transition-transform mt-6">
                  Jetzt probieren <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Subscription Benefits */}
        <section className="max-w-7xl mx-auto px-8 py-20">
          <div className="bg-surface-container-highest p-16 editorial-grid gap-16 items-center">
            <div className="col-span-12 lg:col-span-6">
              <h2 className="text-4xl text-primary mb-12 uppercase tracking-tight">Das ultimative Abo-Erlebnis</h2>
              <ul className="space-y-10">
                {benefits.map((b) => (
                  <li key={b.title} className="flex gap-6">
                    <div className="w-12 h-12 bg-primary flex items-center justify-center text-on-primary shrink-0">
                      <span className="material-symbols-outlined text-xl">{b.icon}</span>
                    </div>
                    <div>
                      <h4 className="text-lg text-primary uppercase tracking-wider mb-1">{b.title}</h4>
                      <p className="text-on-surface-variant text-sm leading-relaxed">{b.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-span-12 lg:col-span-6">
              <div className="bg-background p-10 border border-primary/5 shadow-2xl relative">
                <img src={SUB_PACKAGE} alt="Coffee package" className="w-full aspect-[4/3] object-cover mb-8" />
                <div className="flex justify-between items-center mb-6">
                  <span className="font-headline font-bold text-primary tracking-widest uppercase text-xs">Explorer Abo</span>
                  <span className="font-headline font-bold text-2xl text-primary">CHF 24.00</span>
                </div>
                <Link
                  href="/quiz"
                  className="block text-center w-full bg-primary text-on-primary py-4 font-headline font-bold uppercase tracking-widest text-[10px] hover:bg-black transition-all"
                >
                  Abo konfigurieren
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="bg-[#F9F5F0] py-20 border-t border-primary/5">
          <div className="max-w-7xl mx-auto px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 items-center opacity-30 grayscale mb-20">
              {["NZZ", "VOGUE", "MONOCLE", "ANNABELLE"].map((p) => (
                <div key={p} className="text-center font-headline font-bold text-2xl tracking-tighter text-primary">
                  {p}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
              <div className="relative">
                <div className="text-9xl text-tertiary/10 font-serif absolute -top-20 -left-10 pointer-events-none">&ldquo;</div>
                <blockquote className="relative z-10">
                  <p className="text-2xl italic text-primary leading-tight mb-8">
                    &ldquo;Der Algorithmus hat meinen Geschmack besser getroffen als ich selbst. Seit dem ersten Paket bin ich begeistert von der Qualität der Schweizer Röstungen.&rdquo;
                  </p>
                  <cite className="not-italic flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-surface-container">
                      <img src={AVATAR} alt="Marc B." />
                    </div>
                    <div>
                      <span className="block font-headline font-bold text-primary text-sm uppercase tracking-wide">Marc B.</span>
                      <span className="block font-headline text-[9px] uppercase text-on-surface-variant tracking-widest">
                        Kaffee-Liebhaber aus Genf
                      </span>
                    </div>
                  </cite>
                </blockquote>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="aspect-square bg-white p-8 flex flex-col justify-center text-center shadow-sm">
                  <span className="font-headline font-bold text-4xl text-primary mb-2">4.9/5</span>
                  <span className="font-headline text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Google Reviews</span>
                </div>
                <div className="aspect-square bg-tertiary p-8 flex flex-col justify-center text-center shadow-xl">
                  <span className="font-headline font-bold text-4xl text-white mb-2">12k+</span>
                  <span className="font-headline text-[10px] font-bold uppercase tracking-widest text-white/90">Abonnenten</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full px-8 bg-[#F9F5F0] border-t border-primary/5 py-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
          <div>
            <img alt="Coffee Selection Logo" className="h-48 w-auto object-contain mb-10" src={LOGO} />
            <p className="text-sm text-on-surface-variant leading-relaxed mb-8">
              Wir kuratieren den besten Schweizer Specialty Coffee für Genießer und Entdecker.
            </p>
            <div className="flex gap-4">
              <span className="material-symbols-outlined text-primary hover:text-tertiary transition-colors cursor-pointer">local_cafe</span>
              <span className="material-symbols-outlined text-primary hover:text-tertiary transition-colors cursor-pointer">filter_drama</span>
            </div>
          </div>
          <div>
            <h4 className="text-[11px] uppercase tracking-[0.3em] mb-8 text-primary">Shop</h4>
            <ul className="space-y-4 font-headline text-[11px] font-bold uppercase tracking-widest">
              <li><Link href="/about" className="text-on-surface-variant hover:text-tertiary transition-colors">How it works</Link></li>
              <li><Link href="/brewing-guides" className="text-on-surface-variant hover:text-tertiary transition-colors">Roasters</Link></li>
              <li><Link href="/faq" className="text-on-surface-variant hover:text-tertiary transition-colors">Shipping</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] uppercase tracking-[0.3em] mb-8 text-primary">Legal</h4>
            <ul className="space-y-4 font-headline text-[11px] font-bold uppercase tracking-widest">
              <li><Link href="#" className="text-on-surface-variant hover:text-tertiary transition-colors">Privacy</Link></li>
              <li><Link href="#" className="text-on-surface-variant hover:text-tertiary transition-colors">Terms</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] uppercase tracking-[0.3em] mb-8 text-primary">Newsletter</h4>
            <div className="flex border-b border-primary/20 pb-2">
              <input
                type="email"
                placeholder="Deine E-Mail"
                className="bg-transparent border-none focus:ring-0 text-xs w-full px-0 font-headline placeholder:text-on-surface-variant/40 outline-none"
              />
              <button className="text-primary hover:text-tertiary transition-colors">
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-12 mt-12 border-t border-primary/5">
          <p className="text-[10px] text-on-surface-variant/50 font-headline font-bold uppercase tracking-[0.3em] text-center">
            © 2024 Coffee Selection. Alpine Crema Edition.
          </p>
        </div>
      </footer>
    </div>
  );
}
