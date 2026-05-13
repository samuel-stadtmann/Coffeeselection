"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getTasteTypeById, type TasteType } from "@/lib/db/taste-types";
import { getLocalAnswers, clearLocalAnswers, type LocalQuizAnswer } from "@/lib/quiz-storage";
import { getCoffeesForTasteType, type RecommendedCoffee } from "@/lib/db/recommendations";

const LOGO = "/logo.png";
const IMG_BEANS_FALLBACK =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC-mgzdszeDV-ADPnt08LksEtq5jHo_pZiXrnzVNy7faF7CAvNwCIqw0tZ2ylgRbHNuI-cdksgJ49bjfH36AYZerX9qRPq7kE2svCJ2KsLCMhI2k4Dc50D2D5FEGms1FJKDbeS75aSghLNY7Dop_dxhV5e-766gOscbYVVzn4qpX1rtPcumcDu7hr6OQeoiBzbRrze7HIkmFAM9YOYzQFzRF1wR3U1Ec53bS5Aj9xRlWvn7KxLIHJL79Wy6T8BFR47-ulGO1PjIJKEL";

const PRICE_PER_250G = 28;
const intervals = [
  { id: "weekly", label: "Wöchentlich", note: "Für Vieltrinker" },
  { id: "biweekly", label: "Alle 2 Wochen", note: "Beliebteste Wahl", popular: true },
  { id: "monthly", label: "Monatlich", note: "Standard" },
  { id: "6weeks", label: "Alle 6 Wochen", note: "Für Genießer" },
];
const sizes = [
  { id: "250g", label: "250g", multiplier: 1, note: "1 Packung" },
  { id: "500g", label: "500g", multiplier: 1.9, note: "2 Packungen" },
  { id: "1kg", label: "1 kg", multiplier: 3.6, note: "4 Packungen · -10%" },
];

/**
 * Persistiert Quiz-Antworten in DB und berechnet Geschmackstyp-Score.
 * Nutzt anon Browser-Client (RLS sorgt dafür dass User nur seine eigenen
 * Daten schreibt). Returns the resulting taste_type_id (1–8) or null.
 */
async function persistAndScoreQuiz(
  supabase: ReturnType<typeof createClient>,
  customerId: string,
  answers: LocalQuizAnswer[]
): Promise<{ tasteTypeId: number | null; error: string | null }> {
  // 0) Bestehende aktive Responses deaktivieren (Unique-Constraint:
  //    one active per customer)
  await supabase
    .from("quiz_responses")
    .update({ is_active: false })
    .eq("customer_id", customerId)
    .eq("is_active", true);

  // 1) Response-Row anlegen
  const { data: response, error: respErr } = await supabase
    .from("quiz_responses")
    .insert({ customer_id: customerId, version: "v1.0", is_active: true })
    .select("id")
    .single();
  if (respErr || !response) {
    console.error("[quiz] insert quiz_responses failed", respErr);
    return { tasteTypeId: null, error: respErr?.message ?? "quiz_responses insert blocked" };
  }

  // 2) Antworten als Zeilen
  const { error: ansErr } = await supabase.from("quiz_answers").insert(
    answers.map((a) => ({
      response_id: response.id,
      question_code: a.question_code,
      answer_code: a.answer_code,
      is_imputed: false,
    }))
  );
  if (ansErr) {
    console.error("[quiz] insert quiz_answers failed", ansErr);
    return { tasteTypeId: null, error: ansErr.message };
  }

  // 3) Scoring-Regeln laden, lokal aggregieren
  const { data: scoringRules } = await supabase
    .from("quiz_scoring")
    .select("question_code, answer_code, taste_type_id, points");
  const codeSet = new Set(answers.map((a) => `${a.question_code}::${a.answer_code}`));
  const sumByType = new Map<number, number>();
  (scoringRules ?? []).forEach((r) => {
    if (!codeSet.has(`${r.question_code}::${r.answer_code}`)) return;
    sumByType.set(r.taste_type_id, (sumByType.get(r.taste_type_id) ?? 0) + r.points);
  });

  const { data: maxScores } = await supabase
    .from("taste_type_max_scores")
    .select("taste_type_id, max_score, quiz_version");
  // Falls mehrere Versionen existieren: höchste max_score pro Typ nehmen (defensiv)
  const maxByType = new Map<number, number>();
  (maxScores ?? []).forEach((m) => {
    const cur = maxByType.get(m.taste_type_id) ?? 0;
    if (m.max_score > cur) maxByType.set(m.taste_type_id, m.max_score);
  });

  const ranked = Array.from(sumByType.entries())
    .map(([type, score]) => {
      const max = maxByType.get(type);
      // Wenn max fehlt: dynamisch über alle Typen den höchsten Score als Referenz nehmen
      const fallbackMax = Math.max(...Array.from(sumByType.values()), 1);
      const denom = Math.max(max ?? fallbackMax, 1);
      // normalized auf [0, 1] klemmen — defensiv gegen ungültige max_scores
      const normalized = Math.min(1, score / denom);
      return { type, score, normalized };
    })
    .sort((a, b) => b.normalized - a.normalized);

  if (ranked.length === 0) {
    console.error("[quiz] no scoring matches found");
    return { tasteTypeId: null, error: "Keine Scoring-Regeln getroffen — bitte Quiz neu starten." };
  }

  const primary = ranked[0];
  const secondary = ranked[1];
  // confidence als 0–1 Fraktion mit 3 Nachkommastellen (Spalte ist NUMERIC(4,3), max 9.999).
  // Hartes Cap auf 0.999 als Sicherheitsnetz gegen Edge-Cases.
  const confidence = Math.min(0.999, Math.max(0, Number(primary.normalized.toFixed(3))));
  console.log("[quiz] writing", { type: primary.type, score: primary.score, secondary_score: secondary?.score, confidence });

  // 4) Response Resultat-Felder
  await supabase
    .from("quiz_responses")
    .update({
      completed_at: new Date().toISOString(),
      taste_type_id: primary.type,
      secondary_type: secondary?.type ?? null,
      primary_score: primary.score,
      secondary_score: secondary?.score ?? null,
      confidence,
    })
    .eq("id", response.id);

  // 5) Customer updaten
  const { error: custErr } = await supabase
    .from("customers")
    .update({
      taste_type_id: primary.type,
      secondary_type: secondary?.type ?? null,
      confidence,
    })
    .eq("id", customerId);
  if (custErr) {
    console.error("[quiz] update customers failed", custErr);
    return { tasteTypeId: null, error: custErr.message };
  }

  return { tasteTypeId: primary.type, error: null };
}

// Coffee-Match wird über lib/db/recommendations.ts geholt — zentrale Logik

type LoadState = "loading" | "no-quiz" | "error" | "ready";

export default function MatchResultPage() {
  const [orderType, setOrderType] = useState<"once" | "subscription">("subscription");
  const [interval, setInterval] = useState("biweekly");
  const [size, setSize] = useState("500g");
  const [tasteType, setTasteType] = useState<TasteType | undefined>();
  const [coffee, setCoffee] = useState<RecommendedCoffee | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setState("error");
        setErrMsg("Bitte einloggen.");
        return;
      }
      const { data: customer } = await supabase
        .from("customers")
        .select("id, taste_type_id")
        .eq("auth_user_id", auth.user.id)
        .single();
      if (!customer) {
        setState("error");
        setErrMsg("Customer-Datensatz nicht gefunden.");
        return;
      }

      let id: number | null = customer.taste_type_id ?? null;

      // Wenn noch kein Resultat: localStorage prüfen, persistieren
      if (id == null) {
        const localAnswers: LocalQuizAnswer[] = getLocalAnswers();
        if (localAnswers.length === 0) {
          setState("no-quiz");
          return;
        }
        const result = await persistAndScoreQuiz(supabase, customer.id, localAnswers);
        if (result.error || result.tasteTypeId == null) {
          setState("error");
          setErrMsg(result.error ?? "Persistierung fehlgeschlagen.");
          return;
        }
        clearLocalAnswers();
        id = result.tasteTypeId;
      }

      const type = await getTasteTypeById(supabase, id);
      if (!type) {
        setState("error");
        setErrMsg(`Unbekannter Geschmackstyp ${id}.`);
        return;
      }
      setTasteType(type);

      // Coffee-Match aus DB via zentraler Funktion
      const matches = await getCoffeesForTasteType(supabase, id, { limit: 1 });
      setCoffee(matches[0] ?? null);
      setState("ready");
    })();
  }, []);

  const sizeMultiplier = sizes.find((s) => s.id === size)?.multiplier ?? 1;
  const basePrice = PRICE_PER_250G * sizeMultiplier;
  const discount = orderType === "subscription" ? 0.85 : 1;
  const totalPrice = (basePrice * discount).toFixed(2);
  const savings = orderType === "subscription" ? (basePrice * 0.15).toFixed(2) : null;

  return (
    <div className="bg-[#F9F5F0] text-on-surface min-h-screen pb-20 md:pb-0">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-6 md:px-8 w-full">
          <Link href="/" className="flex items-center">
            <img alt="Coffee Selection" className="h-56 md:h-72 w-auto object-contain -my-10 md:-my-16" src={LOGO} />
          </Link>
          <Link href="/login?next=/account/dashboard" className="font-headline text-[11px] uppercase tracking-[0.3em] text-primary hover:text-tertiary transition-colors">
            Mein Konto
          </Link>
        </div>
      </header>

      <main className="pt-36 md:pt-40">
        {/* Hero — Geschmackstyp */}
        <section className="bg-primary text-on-primary py-12 md:py-16 border-b border-tertiary/20">
          <div className="max-w-5xl mx-auto px-6 md:px-8 text-center">
            <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
              Dein Geschmackstyp
            </span>
            {state === "loading" && (
              <>
                <h1 className="text-4xl md:text-6xl mb-4 font-headline font-bold uppercase tracking-tight leading-tight">
                  Wir berechnen dein Match…
                </h1>
                <p className="text-base md:text-lg text-on-primary/80 max-w-2xl mx-auto leading-relaxed">
                  Score-Aggregation läuft.
                </p>
              </>
            )}
            {state === "error" && (
              <>
                <h1 className="text-3xl md:text-4xl mb-4 font-headline font-bold uppercase tracking-tight leading-tight">
                  Etwas ist schief gelaufen
                </h1>
                <p className="text-base md:text-lg text-on-primary/80 max-w-2xl mx-auto leading-relaxed mb-6">
                  {errMsg ?? "Unbekannter Fehler."}
                </p>
                <Link
                  href="/quiz/question-1-brewing-method"
                  className="inline-block bg-tertiary text-primary px-8 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-white transition-all"
                >
                  Quiz neu starten
                </Link>
              </>
            )}
            {state === "no-quiz" && (
              <>
                <h1 className="text-3xl md:text-4xl mb-4 font-headline font-bold uppercase tracking-tight leading-tight">
                  Kein Quiz-Resultat gefunden
                </h1>
                <p className="text-base md:text-lg text-on-primary/80 max-w-2xl mx-auto leading-relaxed mb-6">
                  Bitte mach das Quiz, dann finden wir deinen Geschmackstyp.
                </p>
                <Link
                  href="/quiz/question-1-brewing-method"
                  className="inline-block bg-tertiary text-primary px-8 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-white transition-all"
                >
                  Quiz starten
                </Link>
              </>
            )}
            {state === "ready" && tasteType && (
              <>
                <h1 className="text-4xl md:text-6xl mb-4 font-headline font-bold uppercase tracking-tight leading-tight">
                  {tasteType.name}
                </h1>
                <p className="font-headline text-tertiary uppercase tracking-widest text-sm mb-6">
                  {tasteType.tagline}
                </p>
                <p className="text-base md:text-lg text-on-primary/80 max-w-2xl mx-auto leading-relaxed">
                  {tasteType.heroDesc}
                </p>
              </>
            )}
          </div>
        </section>

        {/* Match Coffee + Configurator — nur wenn ready */}
        {state === "ready" && coffee && tasteType && (
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Coffee Image + Profile */}
            <div className="space-y-6">
              <div className="aspect-[4/5] overflow-hidden bg-surface-container-low">
                <img src={coffee.image_url || IMG_BEANS_FALLBACK} alt={coffee.name} className="w-full h-full object-cover" />
              </div>
              <div className="bg-white p-8 shadow-md">
                <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-2">
                  Profil dieses Coffees
                </h3>
                <p className="text-xs text-on-surface-variant mb-6">
                  Sensorische Werte aus dem Cupping — direkt vom Röster.
                </p>
                <div className="space-y-4">
                  {[
                    { label: "Säure", value: coffee.acidity },
                    { label: "Süße", value: coffee.sweetness },
                    { label: "Körper", value: coffee.body },
                    { label: "Bitterkeit", value: coffee.bitterness },
                    { label: "Komplexität", value: coffee.complexity },
                  ]
                    .filter((p) => p.value != null)
                    .map((p) => {
                      // DB-Werte sind 1–5 Skala
                      const pct = Math.max(0, Math.min(100, (p.value as number) * 20));
                      return (
                        <div key={p.label}>
                          <div className="flex justify-between mb-2">
                            <span className="font-headline text-[11px] uppercase tracking-widest text-on-surface-variant">{p.label}</span>
                            <span className="font-headline text-[11px] uppercase tracking-widest text-tertiary font-bold">{p.value} / 5</span>
                          </div>
                          <div className="h-1 bg-surface-container relative overflow-hidden">
                            <div className="h-full bg-tertiary transition-all duration-1000" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
              {coffee.roaster && (
                <Link href={`/roasters/${coffee.roaster.slug}`} className="bg-white p-6 shadow-md flex items-center gap-4 hover:shadow-xl transition-shadow">
                  {coffee.roaster.logo_url && (
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-surface-variant shrink-0">
                      <img src={coffee.roaster.logo_url} alt={coffee.roaster.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div>
                    <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold">{coffee.roaster.city ?? "Direct Trade"}</span>
                    <h4 className="font-headline font-bold text-primary uppercase tracking-tight">{coffee.roaster.name}</h4>
                  </div>
                </Link>
              )}
            </div>

            {/* Configurator */}
            <div className="lg:sticky lg:top-28 lg:self-start space-y-8">
              <div>
                <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-3 block">
                  Dein Match
                </span>
                <h2 className="text-3xl md:text-5xl text-primary leading-tight mb-4 font-headline font-bold uppercase tracking-tight">
                  {coffee.name}
                </h2>
                {coffee.tasting_summary && (
                  <p className="font-serif italic text-base md:text-lg text-on-surface-variant leading-relaxed mb-2">
                    &ldquo;{coffee.tasting_summary}&rdquo;
                  </p>
                )}
                {coffee.aroma_families && coffee.aroma_families.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-6">
                    {coffee.aroma_families.slice(0, 6).map((a) => (
                      <span key={a} className="bg-surface-container px-3 py-1 font-headline text-[10px] uppercase tracking-widest font-bold text-primary">{a}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Order Type Toggle */}
              <div>
                <h3 className="font-headline text-[11px] uppercase tracking-[0.2em] text-on-surface-variant font-bold mb-3">Bestelltyp</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setOrderType("subscription")}
                    className={`relative p-5 text-left transition-all border-2 ${
                      orderType === "subscription"
                        ? "border-tertiary bg-tertiary/5"
                        : "border-surface-container bg-white hover:border-tertiary/40"
                    }`}
                  >
                    <span className="absolute -top-3 left-3 bg-tertiary text-white px-2 py-0.5 font-headline text-[9px] uppercase tracking-widest font-bold">
                      -10% Sparen
                    </span>
                    <h4 className="font-headline font-bold text-primary uppercase tracking-tight text-base mb-1">Abo</h4>
                    <p className="text-xs text-on-surface-variant">Regelmäßig liefern, jederzeit pausieren</p>
                  </button>
                  <button
                    onClick={() => setOrderType("once")}
                    className={`p-5 text-left transition-all border-2 ${
                      orderType === "once"
                        ? "border-tertiary bg-tertiary/5"
                        : "border-surface-container bg-white hover:border-tertiary/40"
                    }`}
                  >
                    <h4 className="font-headline font-bold text-primary uppercase tracking-tight text-base mb-1">Einmal</h4>
                    <p className="text-xs text-on-surface-variant">Nur diese Lieferung, kein Abo</p>
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <h3 className="font-headline text-[11px] uppercase tracking-[0.2em] text-on-surface-variant font-bold mb-3">Menge pro Lieferung</h3>
                <div className="grid grid-cols-3 gap-3">
                  {sizes.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSize(s.id)}
                      className={`p-4 text-center transition-all border-2 ${
                        size === s.id
                          ? "border-tertiary bg-tertiary/5"
                          : "border-surface-container bg-white hover:border-tertiary/40"
                      }`}
                    >
                      <h4 className="font-headline font-bold text-primary uppercase tracking-tight text-base">{s.label}</h4>
                      <p className="text-[10px] text-on-surface-variant mt-1 font-headline uppercase tracking-widest">{s.note}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Interval — only if subscription */}
              {orderType === "subscription" && (
                <div>
                  <h3 className="font-headline text-[11px] uppercase tracking-[0.2em] text-on-surface-variant font-bold mb-3">Lieferintervall</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {intervals.map((iv) => (
                      <button
                        key={iv.id}
                        onClick={() => setInterval(iv.id)}
                        className={`relative p-4 text-left transition-all border-2 ${
                          interval === iv.id
                            ? "border-tertiary bg-tertiary/5"
                            : "border-surface-container bg-white hover:border-tertiary/40"
                        }`}
                      >
                        {iv.popular && (
                          <span className="absolute -top-2 right-2 bg-primary text-white px-2 py-0.5 font-headline text-[9px] uppercase tracking-widest font-bold">
                            Top
                          </span>
                        )}
                        <h4 className="font-headline font-bold text-primary uppercase tracking-tight text-sm">{iv.label}</h4>
                        <p className="text-[10px] text-on-surface-variant mt-1">{iv.note}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Summary + CTA */}
              <div className="bg-primary text-on-primary p-6 md:p-8">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <span className="font-headline text-[10px] uppercase tracking-widest text-on-primary/60 block">
                      {orderType === "subscription" ? "Pro Lieferung" : "Einmaliger Preis"}
                    </span>
                    <span className="font-headline font-bold text-3xl md:text-4xl text-tertiary">
                      CHF {totalPrice}
                    </span>
                  </div>
                  {savings && (
                    <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold">
                      Du sparst CHF {savings}
                    </span>
                  )}
                </div>
                <p className="text-xs text-on-primary/60 mb-5">
                  inkl. Versand · {orderType === "subscription" ? "jederzeit pausieren oder kündigen" : "keine Bindung"}
                </p>
                <Link
                  href="/checkout/cart"
                  className="block w-full text-center bg-tertiary text-primary py-4 font-headline font-bold text-xs uppercase tracking-widest hover:bg-white transition-all"
                >
                  {orderType === "subscription" ? "Abo starten" : "Jetzt bestellen"}
                </Link>
                <Link
                  href="/quiz/question-1-brewing-method"
                  className="block w-full text-center mt-3 py-3 font-headline text-[10px] uppercase tracking-widest text-on-primary/60 hover:text-tertiary transition-colors"
                >
                  Quiz wiederholen
                </Link>
              </div>

              {/* Trust */}
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { icon: "local_shipping", label: "Versand inkl." },
                  { icon: "verified", label: "Direct Trade" },
                  { icon: "autorenew", label: "Pause jederzeit" },
                ].map((t) => (
                  <div key={t.label} className="bg-white p-3">
                    <span className="material-symbols-outlined text-tertiary text-xl block mb-1">{t.icon}</span>
                    <span className="font-headline text-[9px] uppercase tracking-widest text-on-surface-variant font-bold">{t.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        )}
      </main>

      {/* Sticky Mobile CTA */}
      <Link
        href="/checkout/cart"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-tertiary text-primary py-5 text-center font-headline font-bold uppercase tracking-widest text-xs shadow-2xl"
      >
        {orderType === "subscription" ? `Abo starten · CHF ${totalPrice}` : `Bestellen · CHF ${totalPrice}`}
      </Link>
    </div>
  );
}
