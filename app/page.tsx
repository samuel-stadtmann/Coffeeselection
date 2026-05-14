"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AdminFooterLink from "@/components/AdminFooterLink";
import { createClient } from "@/lib/supabase/client";
import { articles } from "@/lib/articles";

type FeaturedRoaster = {
  slug: string;
  name: string;
  city: string | null;
  short_description: string | null;
  hero_image_url: string | null;
  logo_url: string | null;
};

const LOGO = "/logo.png";
const HERO =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBvySg3Uf4lIr5-6yDourpO1iHmSl4aNwlTw2vUqWLLsXTR2owxYQPnvYY_fGQw_8MJ9gOoVJhPLdSiywoMPlVXb7ydqT4-EEd-jaiFKi-e6hih5dYFPY2wSZ2XMGoSz2v_4EtSVrvraFIhMMMZzbDxXU9oJz1R1q56fSmCRpqUcuecTpmR7u1k7iIxHHSsZG1oRzB_ABrePOMz1akMTgJjZDheHKafFnhGYLfXzk4J4-0t1M3WMYJhXqzL6gGeg_YgCV3AVKxNlw";
// Fallback wenn ein Roaster (noch) kein hero_image_url + logo_url hat —
// vermeidet leere/kaputte Bild-Box in der Roaster-Sektion.
const ROASTER_FALLBACK_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDsi0Cm5pc68_wHYzSlE9JU3hSFfItOBscVq7fRgSVQF2O2c1qq3Lur8RIyfH1J56Xmysu8_-LJxl3wpeTypHOshuMB_3c8-5Z-yuccHxOvjlh1rBBx9aJ_L6xn0ES5e12zVKtvjtl1pI1K-J8kdzYr-ifacUyJTZrRDt5L4C7tyBQLYyKcpkoNC0Go4fagorT6mBPJdkR5u6AGDLnIFfYxzAiKDRRtiCr6pss5eRNI3-kBz3TRwC3MXJQNVV9oH7rHgXvPfiZieg";
const SUB_PACKAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBXoR-PUcwRpX90ByFqkCWcjPpcEEETiXPBMbk9Ld5nFgt_nXaBFZfZTNyGSjhQkrjnDsBLTRQWeqt4VN0TQr1WBNwzsDTrU4qNgxTCRay6sxsmu84CDRLYUJZ8E9OXI202fZi_4TK2PkJih6zW9aWQEE3-_H2kLTo_k5vxlyFi0W2sByzZGpxt3nNJu3LCXtXefZc-swkmbe-4Qe58IpA_bHC2apoj08Zr5EoaGLS0GQmM9UsAWA_g4kfazuRjohGU84KSnT7UoQ";

const navLinks = [
  { href: "/coffee", label: "Coffees" },
  { href: "/taste-types", label: "Geschmackstypen" },
  { href: "/roasters", label: "Röster" },
  { href: "/compare", label: "Vergleiche" },
  { href: "/learn", label: "Magazine" },
];

const tasteTypes = [
  { slug: "der-klassiker", name: "Der Klassiker", tagline: "Ausgewogen, nussig, schokoladig", icon: "coffee" },
  { slug: "der-fruchtfreund", name: "Der Fruchtfreund", tagline: "Beerig, lebendig, hell", icon: "nutrition" },
  { slug: "der-espresso-enthusiast", name: "Der Espresso-Enthusiast", tagline: "Intensiv, kräftig, italienisch", icon: "local_fire_department" },
  { slug: "der-entdecker", name: "Der Entdecker", tagline: "Experimentell, vielseitig, neugierig", icon: "explore" },
  { slug: "der-sanfte", name: "Der Sanfte", tagline: "Mild, niedrige Säure, weich", icon: "spa" },
  { slug: "der-florale", name: "Der Florale", tagline: "Jasmin, Bergamotte, Tee-artig", icon: "local_florist" },
  { slug: "der-erdige", name: "Der Erdige", tagline: "Würzig, holzig, dunkel", icon: "park" },
  { slug: "der-suesse", name: "Der Süße", tagline: "Karamell, Honig, Schokolade", icon: "cake" },
];

// USP-Bullets statt erfundener Reviews/Publikationen. Alles verifizierbar,
// nichts Fake. Wird spaeter durch echte Reviews ersetzt sobald welche da sind.
const uspBullets = [
  { icon: "handshake", text: "Direct Trade aus der Schweiz" },
  { icon: "schedule", text: "Röstfrisch — geliefert in 48h nach Röstung" },
  { icon: "tune", text: "8 Geschmackstypen, persönlich gematcht" },
  { icon: "event_available", text: "Abo jederzeit kündbar — keine Verpflichtung" },
];

const faqItems = [
  { q: "Wie funktioniert das 12-Fragen-Quiz?", a: "Du beantwortest 12 kurze Fragen zu deinen Vorlieben — Brühmethode, Säure, Aromen, Routine. Unser Algorithmus klassifiziert dich in einen von 8 Geschmackstypen und matcht dich mit dem perfekten Kaffee. Das dauert rund 60 Sekunden und ist kostenlos, ohne Anmeldung." },
  { q: "Welche Röstereien sind dabei?", a: "Wir arbeiten ausschliesslich mit Schweizer Specialty-Röstern zusammen — alle Direct Trade, viele Bio-zertifiziert. Jeder Kaffee in unserem Sortiment hat mindestens 84 Punkte im SCA-Cupping." },
  { q: "Wie frisch ist der Kaffee?", a: "Röstfrisch. Deine Bohnen werden erst nach deiner Bestellung geröstet und innerhalb von 48 Stunden nach der Röstung geliefert. Schweizweiter Versand in 2–4 Werktagen." },
  { q: "Liefert ihr in die ganze Schweiz?", a: "Ja, wir versenden schweizweit. Ab einem Bestellwert von CHF 100 ist der Versand kostenlos, darunter beträgt der Versand CHF 6.90. Lieferung in 2–4 Werktagen." },
  { q: "Kann ich mein Abo jederzeit pausieren?", a: "Ja. Du hast volle Kontrolle: pausieren, Intervall ändern, Sorte wechseln oder kündigen — alles mit einem Klick in deinem Konto. Es gibt keine Mindestlaufzeit und keine Verpflichtung." },
  { q: "Kann ich Kaffee auch einmalig ohne Abo bestellen?", a: "Ja. Jeden Kaffee aus unserem Sortiment kannst du als Einzelbestellung kaufen — ohne Abo, ohne Bindung. Im Abo sparst du allerdings 10% gegenüber der Einzelbestellung." },
  { q: "Was ist Specialty Coffee?", a: "Specialty Coffee bezeichnet Kaffee, der im SCA-Cupping mindestens 80 von 100 Punkten erreicht. Unser Standard liegt bei mindestens 84 Punkten. Es geht um Rückverfolgbarkeit bis zur Farm, sortenreine Aufbereitung und handwerkliche Röstung — das Gegenteil von anonymem Industriekaffee." },
  { q: "Was bedeutet Direct Trade?", a: "Direct Trade heisst, dass unsere Röster direkt mit den Kaffeeproduzenten handeln — ohne Zwischenhändler. Das bedeutet faire Preise für die Farmen, volle Transparenz über die Herkunft und meist deutlich höhere Qualität als bei konventionellem Handel." },
];


export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Random 3 roasters per page load — fetched from DB
  const [featured, setFeatured] = useState<FeaturedRoaster[]>([]);
  // Echte Zahlen fuer die Metrik-Sektion — dynamisch aus der DB statt Fake.
  const [roasterCount, setRoasterCount] = useState<number | null>(null);
  const [coffeeCount, setCoffeeCount] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      // Aktive Roaster fuer Featured-Sektion + Gesamtzahl
      const { data } = await supabase
        .from("roasters")
        .select("slug, name, city, short_description, hero_image_url, logo_url")
        .eq("status", "active")
        .is("deleted_at", null);
      const list = (data ?? []) as FeaturedRoaster[];
      setRoasterCount(list.length);
      const shuffled = [...list].sort(() => Math.random() - 0.5);
      setFeatured(shuffled.slice(0, 3));

      // Aktive Coffees zaehlen (nur count, keine Daten noetig)
      const { count } = await supabase
        .from("coffees")
        .select("id", { count: "exact", head: true })
        .eq("status", "active")
        .is("deleted_at", null);
      setCoffeeCount(count ?? null);
    })();
  }, []);
  const [hero, side1, side2] = featured;

  // 4 zufaellige Artikel pro Page-Load — rotiert wie die Roaster-Sektion.
  // useMemo mit leerem Dep-Array → einmal pro Mount gewuerfelt.
  const rotatedArticles = useMemo(
    () => [...articles].sort(() => Math.random() - 0.5).slice(0, 4),
    []
  );

  return (
    <div className="bg-[#F9F5F0] text-on-surface selection:bg-tertiary selection:text-white pb-20 md:pb-0">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5">
        <nav className="flex justify-between items-center max-w-7xl mx-auto px-6 md:px-8 w-full">
          <Link href="/" className="flex items-center shrink-0">
            <img
              alt="Coffee Selection Logo"
              className="h-40 md:h-52 w-auto object-contain -my-6 md:-my-10 mr-4 lg:mr-6 shrink-0"
              src={LOGO}
            />
          </Link>
          <div className="hidden lg:flex items-center gap-x-8 xl:gap-x-10 mr-auto pl-8 xl:pl-12">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-primary hover:text-tertiary transition-colors font-headline font-bold tracking-widest uppercase text-[14px] whitespace-nowrap"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-x-5 md:gap-x-6 lg:pl-8 xl:pl-12">
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
        {/* SECTION 1 — HERO */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 editorial-grid items-center gap-10 md:gap-16 py-16 md:py-24">
          <div className="col-span-12 lg:col-span-5">
            <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-6 block">
              Premium Swiss Specialty Coffee
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl text-primary leading-[1.1] mb-8 font-headline font-bold">
              Finde deinen perfekten Specialty Coffee
            </h1>
            <p className="text-lg text-on-surface-variant leading-relaxed mb-10 max-w-lg">
              Personalisierte Empfehlungen von Schweizer Röstern, basierend auf deinem Geschmack. 12 Fragen, dein Geschmackstyp, dein perfekter Kaffee.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/quiz/question-1-brewing-method"
                className="bg-primary text-on-primary px-10 py-5 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all text-center"
              >
                Jetzt Geschmackstyp entdecken
              </Link>
              <a
                href="#wie-es-funktioniert"
                className="flex items-center justify-center gap-3 font-headline font-bold text-primary px-6 py-5 hover:bg-surface-container-low transition-colors uppercase tracking-widest text-[11px]"
              >
                <span className="material-symbols-outlined text-2xl">play_circle</span>
                Wie es funktioniert
              </a>
            </div>
            <div className="flex items-center gap-3 mt-8 text-on-surface-variant text-sm">
              <span className="material-symbols-outlined text-tertiary text-base">check_circle</span>
              Kostenlos · 60 Sek · Keine Anmeldung
            </div>
          </div>
          <div className="col-span-12 lg:col-span-7 relative">
            <div className="aspect-square overflow-hidden shadow-2xl relative z-10">
              <img alt="Premium coffee experience" className="w-full h-full object-cover" src={HERO} />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-tertiary text-white p-6 md:p-8 z-20 shadow-2xl">
              <p className="font-headline font-bold text-4xl md:text-5xl mb-1">8</p>
              <p className="font-headline text-[10px] uppercase tracking-widest leading-tight">Geschmackstypen<br />kuratiert für dich</p>
            </div>
            <div className="absolute -top-12 -right-8 w-64 h-64 bg-surface-container-low -z-0 hidden md:block" />
          </div>
        </section>

        {/* SECTION 2 — USP-BULLETS */}
        <section className="bg-primary text-on-primary py-10 md:py-12 border-y border-tertiary/20">
          <div className="max-w-7xl mx-auto px-6 md:px-8 grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-6">
            {uspBullets.map((u) => (
              <div key={u.text} className="flex items-center gap-3">
                <span className="material-symbols-outlined text-tertiary text-2xl shrink-0">
                  {u.icon}
                </span>
                <span className="font-headline font-bold text-[11px] md:text-xs uppercase tracking-wider leading-tight">
                  {u.text}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3 — HOW IT WORKS */}
        {/* scroll-mt-32: damit der fixed Header beim Anchor-Sprung nicht
            den Sektions-Titel ueberdeckt */}
        <section
          id="wie-es-funktioniert"
          className="bg-surface-container-low py-20 md:py-24 scroll-mt-32"
        >
          <div className="max-w-7xl mx-auto px-6 md:px-8">
            <div className="text-center mb-16">
              <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
                So funktioniert&apos;s
              </span>
              <h2 className="text-3xl md:text-4xl text-primary mb-4 uppercase tracking-tight font-headline font-bold">
                In 3 Schritten zu deinem perfekten Kaffee
              </h2>
              <p className="text-lg text-on-surface-variant italic max-w-2xl mx-auto">
                Präzision in jedem Schritt, Leidenschaft in jeder Bohne.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
              {[
                { n: "01", title: "12 Fragen beantworten", desc: "60 Sekunden über Brühmethode, Aromen-Vorlieben und deine Kaffee-Routine. Keine Anmeldung nötig." },
                { n: "02", title: "Geschmackstyp erkennen", desc: "Unser Algorithmus klassifiziert dich in einen von 8 Geschmackstypen — vom Klassiker bis zum Entdecker." },
                { n: "03", title: "Perfekten Kaffee erhalten", desc: "Direct Trade Bohnen aus Schweizer Röstereien, röstfrisch in deinen Briefkasten geliefert." },
              ].map((s) => (
                <div key={s.n} className="relative group">
                  <span className="text-9xl font-headline font-bold text-primary/5 absolute -top-12 -left-4 -z-0 select-none">
                    {s.n}
                  </span>
                  <div className="relative z-10">
                    <h3 className="text-lg mb-4 text-primary uppercase tracking-widest font-headline font-bold">{s.title}</h3>
                    <p className="text-on-surface-variant leading-relaxed text-[15px]">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-16">
              <Link
                href="/quiz/question-1-brewing-method"
                className="inline-flex items-center gap-3 bg-primary text-on-primary px-10 py-5 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all"
              >
                Quiz starten <span className="material-symbols-outlined text-base">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        {/* SECTION 4 — DIE 8 GESCHMACKSTYPEN */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-24">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-16 gap-6">
            <div className="max-w-xl">
              <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
                Welcher Typ bist du?
              </span>
              <h2 className="text-3xl md:text-4xl text-primary mb-4 uppercase tracking-tight font-headline font-bold">
                Die 8 Geschmackstypen
              </h2>
              <p className="text-lg text-on-surface-variant">
                Jeder Mensch hat ein einzigartiges Aromen-Profil. Wir haben 8 archetypische Typen identifiziert — finde deinen.
              </p>
            </div>
            <Link
              href="/quiz/question-1-brewing-method"
              className="font-headline text-[11px] font-bold uppercase tracking-[0.3em] text-tertiary hover:text-primary transition-colors border-b-2 border-tertiary pb-2"
            >
              Quiz starten →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {tasteTypes.map((t) => (
              <Link
                key={t.slug}
                href={`/taste-types/${t.slug}`}
                className="group bg-white border-l-4 border-tertiary/0 hover:border-tertiary p-8 shadow-sm hover:shadow-xl transition-all"
              >
                <span className="material-symbols-outlined text-tertiary text-3xl mb-4 block">{t.icon}</span>
                <h3 className="text-lg text-primary mb-2 uppercase tracking-tight font-headline font-bold">{t.name}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-4">{t.tagline}</p>
                <span className="font-headline text-[10px] uppercase tracking-[0.3em] text-tertiary opacity-0 group-hover:opacity-100 transition-opacity">
                  Mehr erfahren →
                </span>
              </Link>
            ))}
          </div>
          <div className="text-center">
            <Link
              href="/quiz/question-1-brewing-method"
              className="inline-flex items-center gap-3 bg-primary text-on-primary px-10 py-5 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all"
            >
              Deinen Geschmackstyp jetzt entdecken
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>
        </section>

        {/* SECTION 5 — FEATURED ROASTERS */}
        <section className="bg-surface-container-low py-20 md:py-24">
          <div className="max-w-7xl mx-auto px-6 md:px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-16 gap-6">
              <div className="max-w-xl">
                <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
                  Direct Trade · Handwerk
                </span>
                <h2 className="text-3xl md:text-4xl text-primary mb-4 uppercase tracking-tight font-headline font-bold">
                  Unsere Meister-Röster
                </h2>
                <p className="text-lg text-on-surface-variant">
                  Wir arbeiten nur mit den renommiertesten Röstern der Schweiz zusammen.
                </p>
              </div>
              <Link
                href="/roasters"
                className="font-headline text-[11px] font-bold uppercase tracking-[0.3em] text-tertiary hover:text-primary transition-colors border-b-2 border-tertiary pb-2"
              >
                Alle Röster
              </Link>
            </div>
            {hero && side1 && side2 && (
              <div className="grid grid-cols-12 gap-6 md:gap-8">
                {/* Featured large — random hero roaster */}
                <Link
                  href={`/roasters/${hero.slug}`}
                  className="col-span-12 md:col-span-7 bg-surface-container relative overflow-hidden group shadow-lg min-h-[360px] md:min-h-[500px]"
                >
                  <img
                    src={hero.hero_image_url || hero.logo_url || ROASTER_FALLBACK_IMG}
                    alt={hero.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-transparent to-transparent" />
                  <div className="absolute bottom-10 left-10 right-10 text-on-primary">
                    {hero.city && (
                      <span className="font-headline text-[10px] uppercase tracking-[0.5em] mb-4 block text-tertiary font-bold">
                        {hero.city}
                      </span>
                    )}
                    <h3 className="text-3xl mb-3 font-headline font-bold">{hero.name}</h3>
                    {hero.short_description && (
                      <p className="text-on-primary/80 max-w-sm text-sm leading-relaxed">
                        {hero.short_description}
                      </p>
                    )}
                    <span className="font-headline text-[10px] uppercase tracking-[0.3em] text-tertiary font-bold mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Profil ansehen <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </span>
                  </div>
                </Link>

                {/* Right column — 2 random side roasters */}
                <div className="col-span-12 md:col-span-5 flex flex-col gap-6 md:gap-8">
                  <Link
                    href={`/roasters/${side1.slug}`}
                    className="flex-1 bg-white p-8 md:p-10 flex flex-col justify-between border-l-8 border-tertiary shadow-md group hover:shadow-xl transition-all"
                  >
                    <div>
                      <h3 className="text-xl text-primary mb-4 uppercase tracking-tight font-headline font-bold group-hover:text-tertiary transition-colors">{side1.name}</h3>
                      {side1.short_description && (
                        <p className="text-on-surface-variant text-sm leading-relaxed">
                          {side1.short_description}
                        </p>
                      )}
                    </div>
                    {side1.city && (
                      <div className="flex gap-3 mt-6">
                        <span className="px-3 py-1 bg-surface-container text-primary font-headline text-[9px] font-bold uppercase tracking-widest">{side1.city}</span>
                      </div>
                    )}
                  </Link>
                  <Link
                    href={`/roasters/${side2.slug}`}
                    className="flex-1 bg-primary text-on-primary p-8 md:p-10 flex flex-col justify-between shadow-md group hover:bg-black transition-colors"
                  >
                    <div>
                      {side2.city && (
                        <span className="font-headline text-[10px] uppercase tracking-[0.3em] text-tertiary font-bold block mb-2">{side2.city}</span>
                      )}
                      <h3 className="text-xl mb-3 text-tertiary uppercase tracking-tight font-headline font-bold">{side2.name}</h3>
                      {side2.short_description && (
                        <p className="italic text-sm leading-relaxed text-on-primary/80">
                          &ldquo;{side2.short_description}&rdquo;
                        </p>
                      )}
                    </div>
                    <span className="text-tertiary font-headline font-bold uppercase text-[10px] tracking-[0.3em] flex items-center gap-2 group-hover:translate-x-2 transition-transform mt-6">
                      Mehr erfahren <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 6 — DISCOVERY SUBSCRIPTION */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-24">
          <div className="bg-surface-variant p-8 md:p-16 editorial-grid gap-10 md:gap-16 items-center">
            <div className="col-span-12 lg:col-span-6">
              <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
                Discovery Box
              </span>
              <h2 className="text-3xl md:text-4xl text-primary mb-8 md:mb-12 uppercase tracking-tight font-headline font-bold">
                Mit jeder Lieferung eine neue Welt
              </h2>
              <ul className="space-y-8">
                {[
                  { icon: "auto_awesome", title: "Kuratierte Vielfalt", desc: "Bei jeder Lieferung 2 neue Kaffees, perfekt zu deinem Geschmackstyp passend." },
                  { icon: "schedule", title: "Volle Flexibilität", desc: "Pausieren, anpassen oder kündigen — jederzeit, ohne Mindestlaufzeit." },
                  { icon: "loyalty", title: "Exklusive Vorteile", desc: "Abonnenten-Preise und Zugang zu limitierten «Rare Batches» — kleinen Sondermengen aussergewöhnlicher Lots." },
                ].map((b) => (
                  <li key={b.title} className="flex gap-6">
                    <div className="w-12 h-12 bg-primary flex items-center justify-center text-on-primary shrink-0">
                      <span className="material-symbols-outlined text-xl">{b.icon}</span>
                    </div>
                    <div>
                      <h4 className="text-lg text-primary uppercase tracking-wider mb-1 font-headline font-bold">{b.title}</h4>
                      <p className="text-on-surface-variant text-sm leading-relaxed">{b.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-span-12 lg:col-span-6">
              <div className="bg-background p-8 md:p-10 border border-primary/5 shadow-2xl relative">
                <div className="absolute -top-4 left-8 bg-tertiary text-white px-4 py-1.5 font-headline text-[10px] uppercase tracking-widest font-bold">
                  Flexibel &amp; persönlich
                </div>
                <img src={SUB_PACKAGE} alt="Discovery Box" className="w-full aspect-[4/3] object-cover mb-8" />
                <div className="flex justify-between items-center mb-2">
                  <span className="font-headline font-bold text-primary tracking-widest uppercase text-xs">Discovery Abo</span>
                  <span className="font-headline font-bold text-xl text-primary">Ab CHF 22 / Lieferung</span>
                </div>
                <p className="text-sm text-on-surface-variant mb-6">Menge &amp; Intervall frei wählbar · inkl. Versand · jederzeit kündbar</p>
                <Link
                  href="/quiz/question-1-brewing-method"
                  className="block text-center w-full bg-primary text-on-primary py-4 font-headline font-bold uppercase tracking-widest text-[10px] hover:bg-black transition-all"
                >
                  Geschmackstyp finden &amp; bestellen
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 7 — COFFEE SELECTION IN ZAHLEN */}
        <section className="bg-[#F9F5F0] py-20 md:py-24 border-t border-primary/5">
          <div className="max-w-7xl mx-auto px-6 md:px-8">
            <div className="text-center mb-12 md:mb-16">
              <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
                Schweizer Specialty Coffee
              </span>
              <h2 className="text-3xl md:text-4xl text-primary mb-4 uppercase tracking-tight font-headline font-bold">
                Coffee Selection in Zahlen
              </h2>
              <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">
                Kein anonymer Industriekaffee — handwerkliche Röstung, Direct
                Trade, persönlich auf deinen Geschmack gematcht.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                {
                  v: roasterCount != null ? String(roasterCount) : "—",
                  l: "Schweizer Röster",
                },
                {
                  v: coffeeCount != null ? String(coffeeCount) : "—",
                  l: "Specialty Coffees",
                  highlight: true,
                },
                { v: "8", l: "Geschmackstypen" },
                { v: "48h", l: "Röstfrisch geliefert" },
              ].map((s, i) => (
                <div
                  key={i}
                  className={`p-6 md:p-8 text-center ${
                    s.highlight ? "bg-tertiary text-white" : "bg-white shadow-sm"
                  }`}
                >
                  <span
                    className={`font-headline font-bold text-3xl md:text-4xl mb-2 block ${
                      s.highlight ? "text-white" : "text-primary"
                    }`}
                  >
                    {s.v}
                  </span>
                  <span
                    className={`font-headline text-[10px] font-bold uppercase tracking-widest ${
                      s.highlight ? "text-white/90" : "text-on-surface-variant"
                    }`}
                  >
                    {s.l}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 8 — SEO CONTENT ENTRY */}
        <section className="bg-surface-container-low py-20 md:py-24">
          <div className="max-w-7xl mx-auto px-6 md:px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-16 gap-6">
              <div className="max-w-xl">
                <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
                  Coffee Magazine
                </span>
                <h2 className="text-3xl md:text-4xl text-primary mb-4 uppercase tracking-tight font-headline font-bold">
                  Werde zum Kaffee-Sommelier
                </h2>
                <p className="text-lg text-on-surface-variant">
                  Wissen, das deinen nächsten Schluck verändert. Kuratiert von unseren Röst-Experten.
                </p>
              </div>
              <Link
                href="/learn"
                className="font-headline text-[11px] font-bold uppercase tracking-[0.3em] text-tertiary hover:text-primary transition-colors border-b-2 border-tertiary pb-2"
              >
                Alle Artikel
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {rotatedArticles.map((a) => (
                <Link
                  key={a.slug}
                  href={`/learn/${a.slug}`}
                  className="group bg-white p-8 hover:shadow-xl transition-all border-b-2 border-transparent hover:border-tertiary flex flex-col"
                >
                  <span className="font-headline text-[10px] uppercase tracking-[0.3em] text-tertiary font-bold block mb-3">
                    {a.readingTime} Lesezeit
                  </span>
                  <h3 className="text-lg text-primary leading-snug mb-3 font-headline font-bold uppercase tracking-tight group-hover:text-tertiary transition-colors">
                    {a.title}
                  </h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed mb-6 flex-1">
                    {a.excerpt}
                  </p>
                  <span className="font-headline text-[10px] uppercase tracking-[0.3em] text-on-surface-variant flex items-center gap-1 group-hover:text-tertiary group-hover:translate-x-1 transition-all">
                    Lesen <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 9 — FAQ */}
        <section className="max-w-4xl mx-auto px-6 md:px-8 py-20 md:py-24">
          <div className="text-center mb-12">
            <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
              FAQ
            </span>
            <h2 className="text-3xl md:text-4xl text-primary mb-4 uppercase tracking-tight font-headline font-bold">
              Häufige Fragen
            </h2>
          </div>
          <div className="space-y-3">
            {faqItems.map((f, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i} className="bg-white shadow-sm">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex justify-between items-center text-left p-6 md:p-8"
                  >
                    <span className="font-headline font-bold text-primary text-base md:text-lg uppercase tracking-tight pr-4">{f.q}</span>
                    <span className={`material-symbols-outlined text-tertiary transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`}>
                      expand_more
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 md:px-8 pb-6 md:pb-8 text-on-surface-variant leading-relaxed">{f.a}</div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="text-center mt-12">
            <Link
              href="/faq"
              className="font-headline text-[11px] font-bold uppercase tracking-[0.3em] text-tertiary hover:text-primary transition-colors border-b-2 border-tertiary pb-2"
            >
              Alle FAQ anzeigen
            </Link>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-primary text-on-primary py-20 md:py-24">
          <div className="max-w-3xl mx-auto px-6 md:px-8 text-center">
            <h2 className="text-3xl md:text-5xl mb-6 uppercase tracking-tight font-headline font-bold leading-tight">
              Bereit für deinen <span className="text-tertiary">perfekten Kaffee?</span>
            </h2>
            <p className="text-lg text-on-primary/70 mb-10 max-w-xl mx-auto">
              60 Sekunden. 12 Fragen. Dein Geschmackstyp und der Kaffee, der zu dir gehört.
            </p>
            <Link
              href="/quiz/question-1-brewing-method"
              className="inline-block bg-tertiary text-primary px-10 py-5 font-headline font-bold text-xs uppercase tracking-widest hover:bg-white transition-all"
            >
              Quiz jetzt starten
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full px-6 md:px-8 bg-[#F9F5F0] border-t border-primary/5 py-16 md:py-20">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-6 gap-8 md:gap-10">
          <div className="col-span-2">
            <img alt="Coffee Selection Logo" className="h-56 md:h-72 w-auto object-contain mb-4" src={LOGO} />
            <p className="text-sm text-on-surface-variant leading-relaxed mb-6 max-w-xs">
              Handverlesen. Direkt zu dir. Premium Specialty Coffee von den besten Schweizer Röstereien.
            </p>
            <div className="flex gap-4">
              <Link href="#"><span className="material-symbols-outlined text-primary hover:text-tertiary transition-colors">local_cafe</span></Link>
              <Link href="#"><span className="material-symbols-outlined text-primary hover:text-tertiary transition-colors">filter_drama</span></Link>
            </div>
          </div>
          <div>
            <h4 className="text-[11px] uppercase tracking-[0.3em] mb-6 text-primary font-headline font-bold">Discover</h4>
            <ul className="space-y-3 font-headline text-[11px] font-bold uppercase tracking-widest">
              <li><Link href="/quiz/question-1-brewing-method" className="text-on-surface-variant hover:text-tertiary transition-colors">Quiz</Link></li>
              <li><Link href="/coffee" className="text-on-surface-variant hover:text-tertiary transition-colors">Alle Coffees</Link></li>
              <li><Link href="/taste-types" className="text-on-surface-variant hover:text-tertiary transition-colors">Geschmackstypen</Link></li>
              <li><Link href="/roasters" className="text-on-surface-variant hover:text-tertiary transition-colors">Röster</Link></li>
              <li><Link href="/coffee/discovery-box" className="text-on-surface-variant hover:text-tertiary transition-colors">Discovery Box</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] uppercase tracking-[0.3em] mb-6 text-primary font-headline font-bold">Learn</h4>
            <ul className="space-y-3 font-headline text-[11px] font-bold uppercase tracking-widest">
              <li><Link href="/learn" className="text-on-surface-variant hover:text-tertiary transition-colors">Magazine</Link></li>
              <li><Link href="/compare" className="text-on-surface-variant hover:text-tertiary transition-colors">Vergleiche</Link></li>
              <li><Link href="/learn/coffee-flavor-wheel" className="text-on-surface-variant hover:text-tertiary transition-colors">Flavor Wheel</Link></li>
              <li><Link href="/faq" className="text-on-surface-variant hover:text-tertiary transition-colors">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] uppercase tracking-[0.3em] mb-6 text-primary font-headline font-bold">Kaffee aus deiner Stadt</h4>
            <ul className="space-y-3 font-headline text-[11px] font-bold uppercase tracking-widest">
              <li><Link href="/seo-city/coffee-subscription-zurich" className="text-on-surface-variant hover:text-tertiary transition-colors">Zürich</Link></li>
              <li><Link href="/seo-city/coffee-subscription-bern" className="text-on-surface-variant hover:text-tertiary transition-colors">Bern</Link></li>
              <li><Link href="/seo-city/coffee-subscription-basel" className="text-on-surface-variant hover:text-tertiary transition-colors">Basel</Link></li>
              <li><Link href="/seo-city/coffee-subscription-geneva" className="text-on-surface-variant hover:text-tertiary transition-colors">Genève</Link></li>
              <li><Link href="/seo-city/coffee-subscription-lucerne" className="text-on-surface-variant hover:text-tertiary transition-colors">Luzern</Link></li>
              <li><Link href="/seo-city/coffee-subscription-zug" className="text-on-surface-variant hover:text-tertiary transition-colors">Zug</Link></li>
              <li><Link href="/seo-city" className="text-tertiary hover:text-primary transition-colors">Alle Städte →</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] uppercase tracking-[0.3em] mb-6 text-primary font-headline font-bold">Newsletter</h4>
            <p className="text-xs text-on-surface-variant mb-4">10% Rabatt auf erste Bestellung.</p>
            <div className="flex border-b border-primary/30 pb-2">
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
        <div className="max-w-7xl mx-auto pt-12 mt-12 border-t border-primary/5 flex flex-col md:flex-row justify-between gap-4 text-[10px] text-on-surface-variant/50 font-headline font-bold uppercase tracking-[0.3em]">
          <span>© 2024 Coffee Selection · Handverlesen aus der Schweiz</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-tertiary transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-tertiary transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-tertiary transition-colors">Kontakt</Link>
            <Link href="/roaster/login" className="hover:text-tertiary transition-colors">Röster-Portal</Link>
            <AdminFooterLink />
          </div>
        </div>
      </footer>

      {/* Sticky Mobile CTA */}
      <Link
        href="/quiz/question-1-brewing-method"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-primary text-on-primary py-5 text-center font-headline font-bold uppercase tracking-widest text-xs shadow-2xl border-t-2 border-tertiary"
      >
        Quiz starten · 60 Sek
      </Link>
    </div>
  );
}
