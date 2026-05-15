import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getTasteTypeById } from "@/lib/db/taste-types";
import {
  getCoffeesForTasteType,
  getNeighborTasteTypes,
  reasoningForMatch,
} from "@/lib/db/recommendations";
import AlternativeCartButtons from "./AlternativeCartButtons";

const LOGO = "/logo.png";
const COFFEE_FALLBACK_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC-mgzdszeDV-ADPnt08LksEtq5jHo_pZiXrnzVNy7faF7CAvNwCIqw0tZ2ylgRbHNuI-cdksgJ49bjfH36AYZerX9qRPq7kE2svCJ2KsLCMhI2k4Dc50D2D5FEGms1FJKDbeS75aSghLNY7Dop_dxhV5e-766gOscbYVVzn4qpX1rtPcumcDu7hr6OQeoiBzbRrze7HIkmFAM9YOYzQFzRF1wR3U1Ec53bS5Aj9xRlWvn7KxLIHJL79Wy6T8BFR47-ulGO1PjIJKEL";

export const metadata: Metadata = {
  title: "Alternativen zu deinem Match — Coffee Selection",
  description:
    "Persönliche Alternativen zu deinem Geschmackstyp. Mit Begründung, warum dieser Kaffee zu dir passen könnte.",
  robots: { index: false, follow: false },
};

export default async function AlternativesPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/recommendation/alternatives");

  const { data: customer } = await supabase
    .from("customers")
    .select("taste_type_id")
    .eq("auth_user_id", auth.user.id)
    .single();

  const userTasteTypeId = customer?.taste_type_id;
  const userTasteType = userTasteTypeId
    ? await getTasteTypeById(supabase, userTasteTypeId)
    : null;

  // Roh-Sensorik-Profil des User-Typs (1-5 Skala) fuer reasoningForMatch.
  // getTasteTypeById liefert 0-100, reasoningForMatch braucht aber 1-5.
  let userProfile1to5: {
    acidity: number | null;
    body: number | null;
    sweetness: number | null;
    bitterness: number | null;
    complexity: number | null;
  } | null = null;
  if (userTasteTypeId) {
    const { data } = await supabase
      .from("taste_types")
      .select("acidity, body, sweetness, bitterness, complexity")
      .eq("id", userTasteTypeId)
      .maybeSingle();
    userProfile1to5 = data;
  }

  // Top-Match des Users (zum Ausschluss aus Alternatives)
  const topMatch = userTasteTypeId
    ? (await getCoffeesForTasteType(supabase, userTasteTypeId, { limit: 1 }))[0]
    : null;

  // Nachbar-Geschmackstypen über Profil-Distanz
  const neighbors = userTasteTypeId
    ? await getNeighborTasteTypes(supabase, userTasteTypeId, 3)
    : [];

  // Pro Nachbar 1 Top-Coffee → max 3 Alternativen
  const seen = new Set<string>(topMatch ? [topMatch.id] : []);
  const alternatives: Array<{
    coffee: Awaited<ReturnType<typeof getCoffeesForTasteType>>[number];
    neighborName: string;
  }> = [];
  for (const neighbor of neighbors) {
    const coffees = await getCoffeesForTasteType(supabase, neighbor.id, {
      limit: 1,
      excludeIds: Array.from(seen),
    });
    const c = coffees[0];
    if (!c) continue;
    seen.add(c.id);
    alternatives.push({ coffee: c, neighborName: neighbor.name_de });
  }

  return (
    <div className="bg-[#F9F5F0] text-on-surface min-h-screen">
      <header className="fixed top-0 w-full z-50 h-20 md:h-24 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5">
        <nav className="flex justify-between items-center gap-3 h-full max-w-7xl mx-auto px-6 md:px-8 w-full">
          <Link href="/" className="flex items-center shrink-0 h-full overflow-hidden">
            <img alt="Coffee Selection" className="h-12 sm:h-14 md:h-16 lg:h-20 w-auto object-contain object-left shrink-0" src={LOGO} />
          </Link>
          <Link
            href="/account/dashboard"
            className="font-headline text-[11px] uppercase tracking-[0.2em] text-on-surface-variant hover:text-tertiary transition-colors font-bold"
          >
            ← Zurück zum Profil
          </Link>
        </nav>
      </header>

      <main className="pt-20 md:pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          {/* Breadcrumb */}
          <nav className="font-headline text-[10px] uppercase tracking-[0.3em] text-on-surface-variant flex items-center gap-2 flex-wrap mb-8">
            <Link href="/account/dashboard" className="hover:text-tertiary transition-colors">Mein Konto</Link>
            <span>/</span>
            <Link href="/account/recommendation-history" className="hover:text-tertiary transition-colors">Empfehlungen</Link>
            <span>/</span>
            <span className="text-primary">Alternativen</span>
          </nav>

          {/* Hero */}
          <section className="max-w-3xl mb-12 md:mb-16">
            <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
              Persönlich · Nur für dich
            </span>
            <h1 className="text-3xl md:text-5xl text-primary leading-[1.05] font-headline font-bold uppercase tracking-tight mb-6">
              Alternativen zu deinem Match
            </h1>
            <p className="text-lg text-on-surface-variant leading-relaxed">
              {userTasteType ? (
                <>
                  Du bist <span className="text-primary font-headline font-bold">{userTasteType.name}</span> — diese Kaffees liegen knapp daneben
                  und könnten dich überraschen. Jeder kommt mit Begründung: was er mit deinem Profil teilt und wo er anders ist.
                </>
              ) : (
                "Mach erst das Quiz, dann finden wir Alternativen für deinen Geschmackstyp."
              )}
            </p>
          </section>

          {/* Grid */}
          {alternatives.length === 0 ? (
            <div className="bg-white p-8 text-center shadow-sm">
              <p className="text-on-surface-variant">
                {userTasteType
                  ? "Aktuell sind keine passenden Alternativen im Sortiment. Sobald die Röster neue Lots einpflegen, erscheinen sie hier."
                  : "Mach das Quiz, dann zeigen wir dir Alternativen."}
              </p>
            </div>
          ) : (
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {alternatives.map(({ coffee, neighborName }) => {
                const unit250 = (coffee.price_chf * 250) / coffee.weight_g;
                // Algorithmische Begruendung: laengste Profil-Differenz zwischen
                // User-Geschmackstyp und Coffee, dazu der Tasting-Summary als
                // sekundaere Beschreibung. Fallback auf aroma_families wenn kein
                // tasting_summary da ist.
                const reasoning = userProfile1to5
                  ? reasoningForMatch(userProfile1to5, coffee)
                  : null;
                const taste = coffee.tasting_summary || coffee.short_description;
                const aromas =
                  coffee.aroma_families && coffee.aroma_families.length > 0
                    ? coffee.aroma_families.slice(0, 3).join(" · ")
                    : null;
                return (
                  <article key={coffee.id} className="bg-white shadow-sm hover:shadow-xl transition-all flex flex-col">
                    <Link href={`/coffee/${coffee.slug}`} className="block">
                      <div className="aspect-[4/3] overflow-hidden bg-surface-container-low">
                        <img src={coffee.image_url || COFFEE_FALLBACK_IMG} alt={coffee.name} className="w-full h-full object-cover" />
                      </div>
                    </Link>
                    <div className="p-8 flex-1">
                      <div className="mb-5">
                        <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold block mb-1">
                          {coffee.origin_name ?? "Specialty"}
                        </span>
                        <Link href={`/coffee/${coffee.slug}`}>
                          <h2 className="font-headline font-bold text-primary uppercase tracking-tight text-xl mb-1 hover:text-tertiary transition-colors">
                            {coffee.name}
                          </h2>
                        </Link>
                        <p className="text-xs text-on-surface-variant">{coffee.roaster?.name ?? ""}</p>
                      </div>

                      {/* Begründung — dynamisch:
                          - Headline: groesste Profil-Diff aus reasoningForMatch
                            (z.B. "Mehr Säure", "Weniger Körper")
                          - Detail-Zeile aus dem Algorithmus
                          - Plus tasting_summary als Geschmacks-Beschreibung */}
                      <div className="bg-tertiary/5 border-l-4 border-tertiary p-5 mb-6">
                        <span className="font-headline text-[10px] uppercase tracking-[0.3em] text-tertiary font-bold block mb-2">
                          Warum für dich
                        </span>
                        {reasoning ? (
                          <p className="font-headline font-bold text-primary uppercase tracking-tight text-base mb-2">
                            {reasoning.headline}
                          </p>
                        ) : aromas ? (
                          <p className="font-headline font-bold text-primary uppercase tracking-tight text-base mb-2">
                            {aromas}
                          </p>
                        ) : null}
                        {reasoning && (
                          <p className="text-sm text-on-surface-variant leading-relaxed mb-2">
                            {reasoning.detail}
                          </p>
                        )}
                        {taste && (
                          <p className="text-sm text-on-surface-variant leading-relaxed italic">
                            „{taste}"
                          </p>
                        )}
                        {!reasoning && !taste && (
                          <p className="text-sm text-on-surface-variant leading-relaxed">
                            Angrenzend an „{neighborName}" — knapp neben deinem Geschmackstyp.
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-surface-container">
                        <span className="font-headline font-bold text-primary text-xl">CHF {coffee.price_chf.toFixed(2)}</span>
                      </div>
                    </div>

                    <AlternativeCartButtons
                      coffee_id={coffee.id}
                      coffee_name={coffee.name}
                      coffee_slug={coffee.slug}
                      image_url={coffee.image_url}
                      roaster_name={coffee.roaster?.name ?? ""}
                      unit_price_chf_250g={Number(unit250.toFixed(2))}
                    />
                  </article>
                );
              })}
            </section>
          )}

          <section className="bg-white shadow-sm p-8 md:p-12 mt-16 text-center">
            <h2 className="text-2xl md:text-3xl text-primary mb-4 uppercase tracking-tight font-headline font-bold">
              Diese Kaffees passen nicht?
            </h2>
            <p className="text-on-surface-variant mb-8 max-w-xl mx-auto">
              Dann mache erneut das Quiz oder filtere im Shop nach deinen Vorlieben.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/quiz/question-1-brewing-method"
                className="bg-primary text-on-primary px-8 py-4 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all"
              >
                Quiz wiederholen
              </Link>
              <Link
                href="/coffee"
                className="border border-primary text-primary px-8 py-4 font-headline font-bold text-xs uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all"
              >
                Im Shop stöbern
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
