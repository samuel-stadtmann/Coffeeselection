"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AccountSidebar from "@/components/AccountSidebar";
import { createClient } from "@/lib/supabase/client";

const LOGO = "/logo.png";

// 30+ Aromen-Pool — vorerst Freitext-Tags, später per flavor_notes_catalog (siehe GO-LIVE.md)
const AROMA_TAGS = [
  "Schokolade", "Karamell", "Honig", "Vanille", "Nuss", "Mandel", "Haselnuss",
  "Beeren", "Erdbeere", "Brombeere", "Kirsche", "Zitrus", "Orange", "Bergamotte",
  "Aprikose", "Pfirsich", "Tropische Frucht", "Mango",
  "Jasmin", "Floral", "Schwarzer Tee",
  "Kakao", "Dunkle Schokolade", "Tabak", "Holz", "Gewürze",
  "Säure", "Bitterkeit", "Süße", "Körper", "Crema",
];

const STAR_LABELS = ["", "Enttäuschend", "Nicht für mich", "Okay", "Sehr gut", "Liebe es"];

type CoffeeForRating = {
  id: string;
  slug: string;
  name: string;
  image_url: string | null;
  roaster_name: string | null;
  origin_name: string | null;
};

export default function RateOrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  // Der URL-Param heisst historisch "orderId", wird hier als coffee_slug interpretiert.
  // Sobald `orders`-Table befüllt ist, wandelt sich das zu echtem orderId → coffee_id Lookup.
  const { orderId: slug } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mail-Deep-Link-Params (PA-Loop3 Bewertungs-Email):
  //   ?stars=N       Pre-fill der Stern-Auswahl + Auto-Submit nach Login/Load
  //   ?order=uuid    setzt order_id im coffee_ratings-Insert (fuer Idempotenz
  //                  + Verknuepfung mit Bestellung)
  const initialStars = Number(searchParams.get("stars") ?? 0);
  const orderIdParam = searchParams.get("order");
  const autoSubmit = initialStars >= 1 && initialStars <= 5;

  const [coffee, setCoffee] = useState<CoffeeForRating | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [stars, setStars] = useState(autoSubmit ? initialStars : 0);
  const [hoverStars, setHoverStars] = useState(0);
  const [positiveTags, setPositiveTags] = useState<string[]>([]);
  const [negativeTags, setNegativeTags] = useState<string[]>([]);
  const [wouldDrinkAgain, setWouldDrinkAgain] = useState<"yes" | "no" | "maybe" | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const signal = useMemo(() => (stars === 0 ? null : (stars - 3) / 2), [stars]);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.push(`/login?next=/account/rate/${slug}`);
        return;
      }
      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("auth_user_id", auth.user.id)
        .single();
      if (customer) setCustomerId(customer.id);

      const { data: c } = await supabase
        .from("coffees")
        .select(
          `id, slug, name, image_url,
           roaster:roasters(name),
           origin:origins_catalog(name_de)`
        )
        .eq("slug", slug)
        .eq("status", "active")
        .is("deleted_at", null)
        .maybeSingle();

      if (!c) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const roaster = c.roaster as Array<{ name: string }> | { name: string } | null;
      const origin = c.origin as Array<{ name_de: string }> | { name_de: string } | null;
      setCoffee({
        id: c.id as string,
        slug: c.slug as string,
        name: c.name as string,
        image_url: (c.image_url as string | null) ?? null,
        roaster_name: Array.isArray(roaster) ? roaster[0]?.name ?? null : roaster?.name ?? null,
        origin_name: Array.isArray(origin) ? origin[0]?.name_de ?? null : origin?.name_de ?? null,
      });
      setLoading(false);
    })();
  }, [slug, router]);

  const togglePositive = (tag: string) => {
    setPositiveTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
    setNegativeTags((prev) => prev.filter((t) => t !== tag));
  };
  const toggleNegative = (tag: string) => {
    setNegativeTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
    setPositiveTags((prev) => prev.filter((t) => t !== tag));
  };

  // Auto-Submit nach Coffee-Load wenn URL-Param ?stars=N gesetzt war.
  // Klick aus Bewertungs-Email → User landet hier → 1 Klick = fertig.
  // Triggert nur einmal: nach submit oder error wird's nicht nochmal versucht.
  const [autoSubmitTriggered, setAutoSubmitTriggered] = useState(false);
  useEffect(() => {
    if (
      autoSubmit &&
      !autoSubmitTriggered &&
      coffee &&
      customerId &&
      !submitting &&
      !submitted
    ) {
      setAutoSubmitTriggered(true);
      void submitRating();
    }
  }, [autoSubmit, autoSubmitTriggered, coffee, customerId, submitting, submitted]);

  async function submitRating() {
    setSubmitError(null);
    if (stars === 0 || !coffee || !customerId) return;
    setSubmitting(true);

    const supabase = createClient();
    const { error } = await supabase.from("coffee_ratings").insert({
      customer_id: customerId,
      coffee_id: coffee.id,
      order_id: orderIdParam ?? null,
      rating: stars,
      would_drink_again: wouldDrinkAgain,
      positive_tags: positiveTags,
      negative_tags: negativeTags,
      comment: comment.trim() || null,
      source: "web",
      is_public: false,
    });
    setSubmitting(false);

    if (error) {
      console.error("[rating] insert failed", error);
      setSubmitError(error.message);
      return;
    }
    setSubmitted(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submitRating();
  }

  if (loading) {
    return (
      <div className="bg-[#F9F5F0] min-h-screen flex items-center justify-center">
        <p className="font-headline text-on-surface-variant">Lade Coffee…</p>
      </div>
    );
  }

  if (notFound || !coffee) {
    return (
      <div className="bg-[#F9F5F0] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="font-headline text-primary uppercase tracking-tight mb-4">Coffee nicht gefunden</p>
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
            <img alt="Coffee Selection" className="h-56 md:h-72 w-auto object-contain -my-10 md:-my-16 mr-8 shrink-0" src={LOGO} />
          </Link>
          <Link
            href="/account/dashboard"
            className="font-headline text-[11px] uppercase tracking-[0.2em] text-on-surface-variant hover:text-tertiary transition-colors font-bold"
          >
            ← Dashboard
          </Link>
        </nav>
      </header>

      <main className="pt-36 md:pt-40 pb-20">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
            <div className="lg:col-span-3">
              <AccountSidebar />
            </div>

            <div className="lg:col-span-9 space-y-6 md:space-y-8">
              <nav className="font-headline text-[10px] uppercase tracking-[0.3em] text-on-surface-variant flex items-center gap-2 flex-wrap">
                <Link href="/account/dashboard" className="hover:text-tertiary transition-colors">Mein Konto</Link>
                <span>/</span>
                <Link href="/account/recommendation-history" className="hover:text-tertiary transition-colors">Empfehlungen</Link>
                <span>/</span>
                <span className="text-primary">Bewerten</span>
              </nav>

              {!submitted ? (
                <>
                  <div>
                    <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-3 block">
                      Bewertung · Coffee-Selection
                    </span>
                    <h1 className="text-3xl md:text-4xl text-primary font-headline font-bold uppercase tracking-tight mb-3">
                      Wie war dein {coffee.name}?
                    </h1>
                    <p className="text-on-surface-variant max-w-2xl">
                      Dein Feedback fliesst direkt in unseren Empfehlungs-Algorithmus. Je präziser du bewertest, desto besser werden deine nächsten Matches.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
                    {/* Coffee Card */}
                    <div className="bg-white p-6 md:p-8 shadow-sm border-l-4 border-tertiary flex gap-4 items-center">
                      {coffee.image_url && (
                        <img src={coffee.image_url} alt={coffee.name} className="w-20 h-20 object-cover" />
                      )}
                      <div className="flex-1 min-w-0">
                        {(coffee.origin_name || coffee.roaster_name) && (
                          <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold block mb-2">
                            {coffee.origin_name ? `${coffee.origin_name}` : ""}
                            {coffee.origin_name && coffee.roaster_name ? " · " : ""}
                            {coffee.roaster_name ?? ""}
                          </span>
                        )}
                        <h2 className="font-headline font-bold text-primary uppercase tracking-tight text-2xl mb-1">
                          {coffee.name}
                        </h2>
                      </div>
                    </div>

                    {/* 1. Sterne */}
                    <fieldset className="bg-white p-6 md:p-8 shadow-sm">
                      <legend className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-2 block">
                        1. Wie hat er geschmeckt?
                      </legend>
                      <p className="text-sm text-on-surface-variant mb-6">
                        Eine Stern-Bewertung verschiebt dein Profil — 5 Sterne stark in Richtung dieses Kaffees, 1 Stern stark weg davon.
                      </p>
                      <div className="flex gap-2 mb-3">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setStars(n)}
                            onMouseEnter={() => setHoverStars(n)}
                            onMouseLeave={() => setHoverStars(0)}
                            className="text-3xl md:text-4xl transition-transform hover:scale-110"
                          >
                            <span className={(hoverStars || stars) >= n ? "text-tertiary" : "text-on-surface-variant/20"}>★</span>
                          </button>
                        ))}
                      </div>
                      {(hoverStars || stars) > 0 && (
                        <p className="font-headline text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">
                          {STAR_LABELS[hoverStars || stars]}
                          {signal !== null && stars > 0 && ` · Signal ${signal.toFixed(2)}`}
                        </p>
                      )}
                    </fieldset>

                    {/* 2. Würdest du wieder kaufen */}
                    <fieldset className="bg-white p-6 md:p-8 shadow-sm">
                      <legend className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-4 block">
                        2. Würdest du diesen Kaffee nochmal trinken?
                      </legend>
                      <div className="grid grid-cols-3 gap-3">
                        {([
                          { key: "yes", label: "Ja, gerne" },
                          { key: "maybe", label: "Vielleicht" },
                          { key: "no", label: "Nein" },
                        ] as const).map((opt) => (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => setWouldDrinkAgain(opt.key)}
                            className={`p-4 text-center transition-all border-2 ${
                              wouldDrinkAgain === opt.key
                                ? "border-tertiary bg-tertiary/10"
                                : "border-surface-container bg-white hover:border-tertiary/40"
                            }`}
                          >
                            <span className="font-headline font-bold text-primary uppercase tracking-tight text-sm">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </fieldset>

                    {/* 3. Aroma-Tags */}
                    <fieldset className="bg-white p-6 md:p-8 shadow-sm">
                      <legend className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-2 block">
                        3. Welche Aromen hast du wahrgenommen?
                      </legend>
                      <p className="text-sm text-on-surface-variant mb-6">
                        Klick <span className="text-tertiary font-bold">+</span> wenn du das Aroma <span className="font-bold">mochtest</span>, oder <span className="text-error font-bold">−</span> wenn es <span className="font-bold">zu viel davon war</span>. Nochmal klicken hebt die Wahl auf.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {AROMA_TAGS.map((tag) => {
                          const isPositive = positiveTags.includes(tag);
                          const isNegative = negativeTags.includes(tag);
                          return (
                            <div
                              key={tag}
                              className={`flex items-center justify-between gap-2 px-3 py-2 border transition-all ${
                                isPositive
                                  ? "border-tertiary bg-tertiary/5"
                                  : isNegative
                                  ? "border-error bg-error/5"
                                  : "border-surface-container bg-white"
                              }`}
                            >
                              <span className="font-headline text-sm font-bold text-primary truncate">{tag}</span>
                              <div className="flex gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => togglePositive(tag)}
                                  aria-label={`${tag} mochte ich`}
                                  title="Mochte ich"
                                  className={`w-7 h-7 flex items-center justify-center font-bold text-sm border transition-all ${
                                    isPositive
                                      ? "bg-tertiary text-white border-tertiary"
                                      : "bg-white text-on-surface-variant border-surface-container hover:border-tertiary hover:text-tertiary"
                                  }`}
                                >
                                  +
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleNegative(tag)}
                                  aria-label={`${tag} war zu viel`}
                                  title="Zu viel davon"
                                  className={`w-7 h-7 flex items-center justify-center font-bold text-sm border transition-all ${
                                    isNegative
                                      ? "bg-error text-white border-error"
                                      : "bg-white text-on-surface-variant border-surface-container hover:border-error hover:text-error"
                                  }`}
                                >
                                  −
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </fieldset>

                    {/* 4. Kommentar */}
                    <fieldset className="bg-white p-6 md:p-8 shadow-sm">
                      <legend className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-4 block">
                        4. Möchtest du etwas hinzufügen? <span className="font-normal text-on-surface-variant text-sm">(optional)</span>
                      </legend>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={4}
                        placeholder="Was war besonders? Wie hast du ihn zubereitet? Etwas, das wir wissen sollten?"
                        className="w-full bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base resize-none"
                      />
                    </fieldset>

                    {submitError && (
                      <div className="bg-error/10 border-l-4 border-error px-4 py-3 text-sm text-primary">
                        {submitError}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                      <button
                        type="submit"
                        disabled={stars === 0 || submitting}
                        className="flex-1 bg-primary text-on-primary px-8 py-4 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
                      >
                        {submitting ? "Wird gespeichert…" : "Bewertung absenden"}
                      </button>
                      <Link
                        href="/account/dashboard"
                        className="text-center font-headline text-[11px] uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors px-8 py-4"
                      >
                        Abbrechen
                      </Link>
                    </div>
                  </form>
                </>
              ) : (
                <div className="bg-white p-8 md:p-12 shadow-sm text-center">
                  <span className="material-symbols-outlined text-tertiary text-6xl mb-6 block">check_circle</span>
                  <h2 className="text-2xl md:text-3xl text-primary font-headline font-bold uppercase tracking-tight mb-4">
                    Danke für deine Bewertung
                  </h2>
                  <p className="text-on-surface-variant mb-8 max-w-xl mx-auto">
                    Deine Rückmeldung fliesst in den Empfehlungs-Algorithmus. Beim nächsten Login siehst du die Bewertung in deiner Match-Historie.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      href="/account/recommendation-history"
                      className="bg-primary text-on-primary px-6 py-3 font-headline font-bold text-[11px] uppercase tracking-widest hover:bg-black transition-all"
                    >
                      Match-Historie ansehen
                    </Link>
                    <Link
                      href="/account/dashboard"
                      className="border border-primary text-primary px-6 py-3 font-headline font-bold text-[11px] uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all"
                    >
                      Zurück zum Dashboard
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
