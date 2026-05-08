"use client";

import Link from "next/link";
import { useMemo, useState, use } from "react";
import { useRouter } from "next/navigation";
import AccountSidebar from "@/components/AccountSidebar";

const LOGO = "/logo.png";

// Mock order lookup — später über Supabase Query auf orders + coffees
const ORDERS: Record<string, { coffee: string; roaster: string; origin: string; date: string; coffeeSlug: string }> = {
  "CS-2024-000142": { coffee: "Ethiopia Yirgacheffe", roaster: "Miro Coffee", origin: "Äthiopien", date: "01.05.2025", coffeeSlug: "ethiopia-yirgacheffe" },
  "CS-2024-000131": { coffee: "Kenya AA Nyeri", roaster: "Vertical Coffee", origin: "Kenia", date: "17.04.2025", coffeeSlug: "kenya-aa-nyeri" },
  "CS-2024-000118": { coffee: "Rwanda Anaerobic", roaster: "La Cabra", origin: "Ruanda", date: "03.04.2025", coffeeSlug: "rwanda-anaerobic" },
  "CS-2024-000109": { coffee: "Ethiopia Gedeb Washed", roaster: "Miro Coffee", origin: "Äthiopien", date: "20.03.2025", coffeeSlug: "ethiopia-gedeb-washed" },
};

// 30+ Aromen-Pool für positive & negative Tags (gemäss Playbook 6.1.1)
const AROMA_TAGS = [
  "Schokolade", "Karamell", "Honig", "Vanille", "Nuss", "Mandel", "Haselnuss",
  "Beeren", "Erdbeere", "Brombeere", "Kirsche", "Zitrus", "Orange", "Bergamotte",
  "Aprikose", "Pfirsich", "Tropische Frucht", "Mango",
  "Jasmin", "Floral", "Schwarzer Tee",
  "Kakao", "Dunkle Schokolade", "Tabak", "Holz", "Gewürze",
  "Säure", "Bitterkeit", "Süße", "Körper", "Crema",
];

const STAR_LABELS = ["", "Enttäuschend", "Nicht für mich", "Okay", "Sehr gut", "Liebe es"];

export default function RateOrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const router = useRouter();
  const order = ORDERS[orderId];

  const [stars, setStars] = useState(0);
  const [hoverStars, setHoverStars] = useState(0);
  const [positiveTags, setPositiveTags] = useState<string[]>([]);
  const [negativeTags, setNegativeTags] = useState<string[]>([]);
  const [wouldDrinkAgain, setWouldDrinkAgain] = useState<"yes" | "no" | "maybe" | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const signal = useMemo(() => (stars === 0 ? null : (stars - 3) / 2), [stars]);

  const togglePositive = (tag: string) => {
    setPositiveTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
    setNegativeTags((prev) => prev.filter((t) => t !== tag));
  };
  const toggleNegative = (tag: string) => {
    setNegativeTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
    setPositiveTags((prev) => prev.filter((t) => t !== tag));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (stars === 0) return;
    setSubmitting(true);
    // TODO: POST → /api/ratings, Supabase RLS-protected. Worker (alle 15 Min)
    // verarbeitet processed_at IS NULL und führt Profil-Vektor-Drift aus.
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    setSubmitted(true);
  }

  if (!order) {
    return (
      <div className="bg-[#F9F5F0] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="font-headline text-primary uppercase tracking-tight mb-4">Bestellung nicht gefunden</p>
          <Link href="/account/dashboard" className="font-headline text-[11px] uppercase tracking-widest text-tertiary border-b-2 border-tertiary pb-1">
            ← Zum Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F9F5F0] text-on-surface min-h-screen pb-20 md:pb-0">
      <header className="fixed top-0 w-full z-50 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5">
        <nav className="flex justify-between items-center max-w-7xl mx-auto px-6 md:px-8 w-full">
          <Link href="/" className="flex items-center">
            <img alt="Coffee Selection" className="h-40 md:h-52 w-auto object-contain -my-6 md:-my-10 mr-8" src={LOGO} />
          </Link>
          <Link
            href="/account/dashboard"
            className="font-headline text-[11px] uppercase tracking-[0.2em] text-on-surface-variant hover:text-tertiary transition-colors font-bold"
          >
            ← Dashboard
          </Link>
        </nav>
      </header>

      <main className="pt-28 md:pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
            <div className="lg:col-span-3">
              <AccountSidebar />
            </div>

            <div className="lg:col-span-9 space-y-6 md:space-y-8">
              {/* Breadcrumb */}
              <nav className="font-headline text-[10px] uppercase tracking-[0.3em] text-on-surface-variant flex items-center gap-2 flex-wrap">
                <Link href="/account/dashboard" className="hover:text-tertiary transition-colors">Mein Konto</Link>
                <span>/</span>
                <Link href="/account/order-history" className="hover:text-tertiary transition-colors">Bestellungen</Link>
                <span>/</span>
                <span className="text-primary">Bewerten</span>
              </nav>

              {!submitted ? (
                <>
                  {/* Header */}
                  <div>
                    <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-3 block">
                      Feedback · Lieferung vom {order.date}
                    </span>
                    <h1 className="text-3xl md:text-4xl text-primary font-headline font-bold uppercase tracking-tight mb-3">
                      Wie war dein {order.coffee}?
                    </h1>
                    <p className="text-on-surface-variant max-w-2xl">
                      Dein Feedback fliesst direkt in unseren Empfehlungs-Algorithmus. Je präziser du
                      bewertest, desto besser werden deine nächsten Matches.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
                    {/* Coffee Card */}
                    <div className="bg-white p-6 md:p-8 shadow-sm border-l-4 border-tertiary">
                      <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold block mb-2">
                        {order.origin} · {order.roaster}
                      </span>
                      <h2 className="font-headline font-bold text-primary uppercase tracking-tight text-2xl mb-1">
                        {order.coffee}
                      </h2>
                      <p className="text-xs text-on-surface-variant">Bestellung {orderId}</p>
                    </div>

                    {/* 1. Sterne */}
                    <fieldset className="bg-white p-6 md:p-8 shadow-sm">
                      <legend className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-2 block">
                        1. Wie hat er geschmeckt?
                      </legend>
                      <p className="text-sm text-on-surface-variant mb-6">
                        Eine Stern-Bewertung verschiebt dein Profil — 5 Sterne stark in Richtung dieses Kaffees, 1 Stern stark weg davon.
                      </p>
                      <div className="flex items-center gap-2 md:gap-3 mb-3">
                        {[1, 2, 3, 4, 5].map((n) => {
                          const filled = (hoverStars || stars) >= n;
                          return (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setStars(n)}
                              onMouseEnter={() => setHoverStars(n)}
                              onMouseLeave={() => setHoverStars(0)}
                              className="text-4xl md:text-5xl leading-none transition-colors"
                              aria-label={`${n} Sterne`}
                            >
                              <span className={filled ? "text-tertiary" : "text-surface-container"}>★</span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="min-h-[24px] font-headline text-[11px] uppercase tracking-widest font-bold text-tertiary">
                        {(hoverStars || stars) > 0 && (
                          <>
                            {STAR_LABELS[hoverStars || stars]}
                            {signal !== null && stars > 0 && !hoverStars && (
                              <span className="text-on-surface-variant/60 ml-2 normal-case tracking-normal font-normal">
                                · Signal-Wert für Algorithmus: {signal.toFixed(2)}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </fieldset>

                    {/* 2. Würde nochmal trinken */}
                    <fieldset className="bg-white p-6 md:p-8 shadow-sm">
                      <legend className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-2 block">
                        2. Würdest du ihn nochmal trinken?
                      </legend>
                      <p className="text-sm text-on-surface-variant mb-6">
                        Hilft uns einzuschätzen, ob es ein One-Time-Match war oder ein neuer Liebling.
                      </p>
                      <div className="grid grid-cols-3 gap-2 md:gap-3">
                        {[
                          { v: "yes" as const, label: "Ja, gerne", icon: "favorite" },
                          { v: "maybe" as const, label: "Vielleicht", icon: "help" },
                          { v: "no" as const, label: "Nein", icon: "close" },
                        ].map((o) => {
                          const active = wouldDrinkAgain === o.v;
                          return (
                            <button
                              key={o.v}
                              type="button"
                              onClick={() => setWouldDrinkAgain(o.v)}
                              className={`flex flex-col items-center gap-2 py-5 px-3 border-2 transition-all ${
                                active
                                  ? "border-tertiary bg-tertiary/10 text-primary"
                                  : "border-surface-container hover:border-tertiary/50 text-on-surface-variant"
                              }`}
                            >
                              <span className="material-symbols-outlined text-2xl">{o.icon}</span>
                              <span className="font-headline text-[11px] uppercase tracking-widest font-bold">{o.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>

                    {/* 3. Aroma-Tags */}
                    <fieldset className="bg-white p-6 md:p-8 shadow-sm">
                      <legend className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-2 block">
                        3. Aroma-Tags <span className="text-on-surface-variant/60 font-normal normal-case tracking-normal text-sm">(optional, aber sehr wertvoll)</span>
                      </legend>
                      <p className="text-sm text-on-surface-variant mb-6">
                        Tippe auf einen Tag um ihn als <span className="text-tertiary font-bold">positiv</span> zu markieren — nochmal tippen markiert ihn als <span className="text-primary font-bold">negativ</span>.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {AROMA_TAGS.map((tag) => {
                          const isPositive = positiveTags.includes(tag);
                          const isNegative = negativeTags.includes(tag);
                          const onClick = () => {
                            if (isPositive) toggleNegative(tag);
                            else if (isNegative) toggleNegative(tag);
                            else togglePositive(tag);
                          };
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={onClick}
                              className={`px-4 py-2 font-headline text-[11px] uppercase tracking-widest font-bold border-2 transition-all ${
                                isPositive
                                  ? "border-tertiary bg-tertiary text-white"
                                  : isNegative
                                  ? "border-primary bg-primary text-white line-through"
                                  : "border-surface-container text-on-surface-variant hover:border-tertiary/50"
                              }`}
                            >
                              {isPositive && "+ "}
                              {isNegative && "− "}
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                      {(positiveTags.length > 0 || negativeTags.length > 0) && (
                        <div className="mt-6 pt-6 border-t border-surface-container text-sm space-y-1">
                          {positiveTags.length > 0 && (
                            <p>
                              <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold mr-2">Mochtest du:</span>
                              {positiveTags.join(", ")}
                            </p>
                          )}
                          {negativeTags.length > 0 && (
                            <p>
                              <span className="font-headline text-[10px] uppercase tracking-widest text-primary font-bold mr-2">Hat dich gestört:</span>
                              {negativeTags.join(", ")}
                            </p>
                          )}
                        </div>
                      )}
                    </fieldset>

                    {/* 4. Freitext */}
                    <fieldset className="bg-white p-6 md:p-8 shadow-sm">
                      <legend className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-2 block">
                        4. Kommentar <span className="text-on-surface-variant/60 font-normal normal-case tracking-normal text-sm">(optional)</span>
                      </legend>
                      <p className="text-sm text-on-surface-variant mb-4">
                        Ein Satz, der unserem Algorithmus hilft.
                      </p>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={4}
                        placeholder="z.B. 'Im Filter perfekt — als Espresso zu hell für mich'"
                        className="w-full p-4 border-2 border-surface-container focus:border-tertiary focus:outline-none transition-colors text-sm bg-surface-container-low"
                      />
                    </fieldset>

                    {/* Submit */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        type="submit"
                        disabled={stars === 0 || submitting}
                        className="flex-1 bg-primary text-on-primary px-8 py-5 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {submitting ? "Wird gespeichert…" : "Bewertung absenden"}
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push("/account/dashboard")}
                        className="px-8 py-5 font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
                      >
                        Abbrechen
                      </button>
                    </div>
                    {stars === 0 && (
                      <p className="text-xs text-on-surface-variant text-center">
                        Mindestens eine Sterne-Bewertung wird benötigt.
                      </p>
                    )}
                  </form>
                </>
              ) : (
                <>
                  {/* Success State */}
                  <div className="bg-white shadow-sm p-8 md:p-12 text-center">
                    <span className="material-symbols-outlined text-tertiary text-6xl mb-6 block">check_circle</span>
                    <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-3 block">
                      Bewertung gespeichert
                    </span>
                    <h2 className="text-3xl md:text-4xl text-primary font-headline font-bold uppercase tracking-tight mb-4">
                      Danke für dein Feedback.
                    </h2>
                    <p className="text-on-surface-variant max-w-xl mx-auto mb-8">
                      Dein Profil wird in den nächsten 15 Minuten aktualisiert. Der Lern-Worker
                      verschiebt deinen Geschmacks-Vektor in Richtung der Aromen, die dir gefallen
                      haben — und weg von denen, die nicht.
                    </p>

                    <div className="bg-surface-variant p-6 md:p-8 mb-8 text-left max-w-xl mx-auto">
                      <span className="font-headline text-[10px] uppercase tracking-[0.3em] text-tertiary font-bold block mb-3">
                        So lernt dein Profil
                      </span>
                      <ul className="space-y-2 text-sm text-on-surface-variant">
                        <li className="flex gap-2">
                          <span className="text-tertiary">→</span>
                          <span><strong className="text-primary">{stars} Sterne</strong> = Signal-Wert {signal?.toFixed(2)} (Lernrate {(0.10 * 0.6 * Math.abs(signal ?? 0)).toFixed(3)})</span>
                        </li>
                        {positiveTags.length > 0 && (
                          <li className="flex gap-2">
                            <span className="text-tertiary">→</span>
                            <span><strong className="text-primary">{positiveTags.length}</strong> positive Aromen erhöhen dein Tag-Sentiment</span>
                          </li>
                        )}
                        {negativeTags.length > 0 && (
                          <li className="flex gap-2">
                            <span className="text-tertiary">→</span>
                            <span><strong className="text-primary">{negativeTags.length}</strong> negative Aromen reduzieren dein Tag-Sentiment</span>
                          </li>
                        )}
                        <li className="flex gap-2">
                          <span className="text-tertiary">→</span>
                          <span>Worker verarbeitet deinen Eintrag spätestens in <strong className="text-primary">15 Minuten</strong></span>
                        </li>
                      </ul>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Link
                        href="/account/dashboard"
                        className="bg-primary text-on-primary px-8 py-4 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all"
                      >
                        Zum Dashboard
                      </Link>
                      <Link
                        href="/recommendation/alternatives"
                        className="border border-primary text-primary px-8 py-4 font-headline font-bold text-xs uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all"
                      >
                        Alternativen ansehen
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
