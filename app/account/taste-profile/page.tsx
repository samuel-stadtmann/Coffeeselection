import Link from "next/link";
import { redirect } from "next/navigation";
import AccountLayout, { PageHeader } from "@/components/AccountLayout";
import { createClient } from "@/lib/supabase/server";
import { getTasteTypeById } from "@/lib/db/taste-types";

type AnswerRow = {
  question_code: string;
  answer_code: string;
};

export default async function TasteProfilePage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/account/taste-profile");

  const { data: customer } = await supabase
    .from("customers")
    .select("id, taste_type_id, num_ratings_given")
    .eq("auth_user_id", auth.user.id)
    .single();
  if (!customer) redirect("/login");

  const tasteType = customer.taste_type_id
    ? await getTasteTypeById(supabase, customer.taste_type_id)
    : null;

  // Profil-Reife (MVP-Formel ohne Snapshot-Tabelle):
  //   reife % = min(100, num_ratings_given * 10 + profile_confidence * 50)
  //   - 5 Ratings + 100% Confidence = 100% Reife
  //   - 0 Ratings + 80% Confidence = 40% Reife
  //   - 10 Ratings + 0% Confidence = 100% Reife (genug Daten ueber Ratings)
  // profile_confidence kommt aus dem aktivsten quiz_responses-Eintrag, sonst 0.
  const { data: confidenceRow } = await supabase
    .from("quiz_responses")
    .select("confidence")
    .eq("customer_id", customer.id)
    .eq("is_active", true)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const ratingsCount = Number(customer.num_ratings_given ?? 0);
  const confidence = Number((confidenceRow?.confidence as number | null) ?? 0);
  const maturityPct = Math.min(
    100,
    Math.round(ratingsCount * 10 + confidence * 50)
  );
  const maturityLabel =
    maturityPct >= 80
      ? "Sehr ausgereift"
      : maturityPct >= 50
        ? "Solide"
        : maturityPct >= 25
          ? "Aufbau-Phase"
          : "Frisch";

  // Letzte aktive Quiz-Response + zugehoerige Antworten + Frage-/Optionen-Texte
  // fuer die "Deine Quiz-Antworten"-Box.
  const { data: latestResponse } = await supabase
    .from("quiz_responses")
    .select("id, completed_at")
    .eq("customer_id", customer.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let answersDisplay: { position: number; question: string; answer: string }[] = [];
  if (latestResponse) {
    const [{ data: answers }, { data: questions }, { data: options }] = await Promise.all([
      supabase
        .from("quiz_answers")
        .select("question_code, answer_code")
        .eq("response_id", latestResponse.id),
      supabase
        .from("quiz_questions")
        .select("question_code, position, text_de")
        .eq("is_active", true),
      supabase
        .from("quiz_options")
        .select("question_code, answer_code, text_de")
        .eq("is_active", true),
    ]);
    const qMap = new Map((questions ?? []).map((q) => [q.question_code, q]));
    const oMap = new Map(
      (options ?? []).map((o) => [`${o.question_code}::${o.answer_code}`, o.text_de as string])
    );
    answersDisplay = ((answers ?? []) as AnswerRow[])
      .map((a) => {
        const q = qMap.get(a.question_code);
        return {
          position: (q?.position as number) ?? 99,
          question: (q?.text_de as string) ?? a.question_code,
          answer: oMap.get(`${a.question_code}::${a.answer_code}`) ?? a.answer_code,
        };
      })
      .sort((a, b) => a.position - b.position);
  }

  return (
    <AccountLayout>
      <PageHeader
        subtitle="Geschmacksprofil"
        title="Dein Profil"
        description="Dein Geschmackstyp und wie du im Quiz geantwortet hast."
      />

      {/* Type Banner — dynamisch aus taste_types */}
      {tasteType ? (
        <div className="bg-tertiary text-primary p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
          <span className="material-symbols-outlined text-5xl">{tasteType.icon}</span>
          <div className="flex-1">
            <span className="font-headline text-[10px] uppercase tracking-widest font-bold block mb-1">
              Dein Geschmackstyp
            </span>
            <h2 className="font-headline font-bold uppercase tracking-tight text-2xl md:text-3xl">
              {tasteType.name}
            </h2>
            {tasteType.tagline && <p className="text-sm mt-2">{tasteType.tagline}</p>}
          </div>
          <Link
            href={`/taste-types/${tasteType.slug}`}
            className="bg-primary text-on-primary px-6 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all"
          >
            Mehr lesen
          </Link>
        </div>
      ) : (
        <div className="bg-surface-variant p-6 md:p-8">
          <p className="text-on-surface-variant mb-4">
            Du hast noch keinen Geschmackstyp — mach das Quiz, dann analysieren wir dein Profil.
          </p>
          <Link
            href="/quiz/question-1-brewing-method"
            className="inline-block bg-primary text-on-primary px-6 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all"
          >
            Quiz starten
          </Link>
        </div>
      )}

      {/* Profil-Reife — MVP ohne Snapshot-Tabelle. Berechnet aus
          num_ratings_given + Quiz-Confidence. Detailwerte aufgedeckt
          fuer Transparenz. */}
      {tasteType && (
        <div className="bg-white p-6 md:p-8 shadow-sm">
          <div className="flex items-baseline justify-between mb-3 flex-wrap gap-3">
            <div>
              <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold block mb-1">
                Profil-Reife
              </span>
              <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg">
                {maturityLabel}
              </h3>
            </div>
            <span className="font-headline font-bold text-3xl text-primary">
              {maturityPct} %
            </span>
          </div>
          <div className="h-2 bg-surface-container relative overflow-hidden mb-3">
            <div
              className="h-full bg-tertiary transition-all"
              style={{ width: `${maturityPct}%` }}
            />
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Quiz-Confidence: <strong>{Math.round(confidence * 100)} %</strong> ·{" "}
            Bewertungen abgegeben: <strong>{ratingsCount}</strong>
            {maturityPct < 50 && (
              <>
                {" "}— bewerte ein paar Kaffees, dann lernt der Algorithmus
                deinen Geschmack präziser kennen.
              </>
            )}
          </p>
        </div>
      )}

      {/* Aromen-Achsen — aus dem taste_type-Profil (Skala 1-5 -> 0-100) */}
      {tasteType && (
        <div className="bg-white p-6 md:p-8 shadow-sm">
          <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-2">
            Aromen-Achsen
          </h3>
          <p className="text-xs text-on-surface-variant mb-6">
            Sensorik-Profil deines Geschmackstyps auf den 5 SCA-Achsen.
          </p>
          <div className="space-y-4">
            {tasteType.profile.map((p) => (
              <div key={p.label}>
                <div className="flex justify-between mb-2">
                  <span className="font-headline text-[11px] uppercase tracking-widest text-on-surface-variant">
                    {p.label}
                  </span>
                  <span className="font-headline text-[11px] uppercase tracking-widest text-tertiary font-bold">
                    {Math.round(p.value)}%
                  </span>
                </div>
                <div className="h-1 bg-surface-container relative overflow-hidden">
                  <div className="h-full bg-tertiary" style={{ width: `${p.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sensorik-Profil — Aromen deines Typs */}
      {tasteType && tasteType.aromas.length > 0 && (
        <div className="bg-white p-6 md:p-8 shadow-sm">
          <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-2">
            Sensorik-Profil
          </h3>
          <p className="text-xs text-on-surface-variant mb-6">
            Aromen, die für deinen Geschmackstyp typisch sind.
          </p>
          <div>
            <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold block mb-3">
              Du liebst
            </span>
            <div className="flex flex-wrap gap-2">
              {tasteType.aromas.map((a) => (
                <span
                  key={a}
                  className="bg-tertiary/15 text-primary px-4 py-2 font-headline text-[11px] uppercase tracking-widest font-bold"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Deine Quiz-Antworten — aus quiz_answers + Texten aus quiz_questions/options */}
      {answersDisplay.length > 0 && (
        <div className="bg-white p-6 md:p-8 shadow-sm">
          <div className="flex justify-between items-start mb-6 gap-3 flex-wrap">
            <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg">
              Deine Quiz-Antworten
            </h3>
            <Link
              href="/quiz/question-1-brewing-method"
              className="font-headline text-[10px] uppercase tracking-widest text-tertiary hover:text-primary transition-colors"
            >
              Quiz wiederholen →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
            {answersDisplay.map((qa) => (
              <div
                key={qa.position}
                className="py-3 border-b border-surface-container last:border-0"
              >
                <p className="text-xs text-on-surface-variant mb-1">
                  {qa.position}. {qa.question}
                </p>
                <p className="font-headline text-sm uppercase tracking-wider font-bold text-primary break-words">
                  {qa.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <Link
        href="/account/dashboard"
        className="font-headline text-[11px] uppercase tracking-[0.2em] text-tertiary hover:text-primary transition-colors border-b-2 border-tertiary pb-1 inline-block"
      >
        ← Zurück zum Dashboard
      </Link>
    </AccountLayout>
  );
}
