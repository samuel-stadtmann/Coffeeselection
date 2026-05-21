import Link from "next/link";
import { redirect } from "next/navigation";
import AccountLayout, { PageHeader } from "@/components/AccountLayout";
import { createClient } from "@/lib/supabase/server";
import { getCoffeesForTasteType } from "@/lib/db/recommendations";

type RatingRow = {
  id: string;
  rating: number | null;
  created_at: string;
  coffee: {
    id: string;
    slug: string;
    name: string;
    acidity: number | null;
    body: number | null;
    sweetness: number | null;
    bitterness: number | null;
    complexity: number | null;
    roaster: { name: string } | { name: string }[] | null;
  } | null;
};

function manhattanFromTaste(coffee: NonNullable<RatingRow["coffee"]>, target: { acidity: number | null; body: number | null; sweetness: number | null; bitterness: number | null; complexity: number | null }) {
  return (
    Math.abs((coffee.acidity ?? 3) - (target.acidity ?? 3)) +
    Math.abs((coffee.body ?? 3) - (target.body ?? 3)) +
    Math.abs((coffee.sweetness ?? 3) - (target.sweetness ?? 3)) +
    Math.abs((coffee.bitterness ?? 3) - (target.bitterness ?? 3)) +
    Math.abs((coffee.complexity ?? 3) - (target.complexity ?? 3))
  );
}

export default async function Page() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/account/recommendation-history");

  const { data: customer } = await supabase
    .from("customers")
    .select("id, taste_type_id")
    .eq("auth_user_id", auth.user.id)
    .single();
  if (!customer) redirect("/login");

  // 1) Bewertungen lesen mit Coffee + Roaster Join
  const { data: ratingsRaw } = await supabase
    .from("coffee_ratings")
    .select(
      `id, rating, created_at,
       coffee:coffees(id, slug, name, acidity, body, sweetness, bitterness, complexity,
         roaster:roasters(name))`
    )
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false });

  const ratings = (ratingsRaw ?? []) as unknown as RatingRow[];

  // 2) Empfohlene-aber-nicht-bewertete Coffees: Top-Match minus bereits bewertete
  const ratedCoffeeIds = new Set(ratings.map((r) => r.coffee?.id).filter(Boolean) as string[]);
  const upcomingRecs = customer.taste_type_id
    ? await getCoffeesForTasteType(supabase, customer.taste_type_id, {
        limit: 3,
        excludeIds: Array.from(ratedCoffeeIds),
        customerId: customer.id,
      })
    : [];

  // 3) Match-% pro bewertetem Coffee (live berechnet, basierend auf aktuellem Geschmackstyp)
  let target: { acidity: number | null; body: number | null; sweetness: number | null; bitterness: number | null; complexity: number | null } | null = null;
  if (customer.taste_type_id) {
    const { data } = await supabase
      .from("taste_types")
      .select("acidity, body, sweetness, bitterness, complexity")
      .eq("id", customer.taste_type_id)
      .maybeSingle();
    target = data;
  }

  const enriched = ratings.map((r) => {
    const matchPct = target && r.coffee
      ? Math.max(0, Math.min(100, Math.round((1 - manhattanFromTaste(r.coffee, target) / 20) * 100)))
      : null;
    const roaster = r.coffee?.roaster;
    const roasterName = Array.isArray(roaster) ? roaster[0]?.name ?? "" : roaster?.name ?? "";
    return {
      id: r.id,
      date: new Date(r.created_at).toLocaleDateString("de-CH"),
      coffeeName: r.coffee?.name ?? "Unbekannt",
      coffeeSlug: r.coffee?.slug ?? "",
      roasterName,
      match: matchPct,
      rating: r.rating,
    };
  });

  const totalRecs = enriched.length;
  const matchValues = enriched.map((e) => e.match).filter((m): m is number => m != null);
  const avgMatch = matchValues.length > 0
    ? Math.round(matchValues.reduce((s, m) => s + m, 0) / matchValues.length)
    : null;
  const ratedItems = enriched.filter((e) => e.rating != null);
  const avgRating = ratedItems.length > 0
    ? (ratedItems.reduce((s, e) => s + (e.rating ?? 0), 0) / ratedItems.length).toFixed(1)
    : null;

  return (
    <AccountLayout>
      <PageHeader
        subtitle="Empfehlungen"
        title="Match-Historie"
        description="Alle Bewertungen die du abgegeben hast. Je mehr du bewertest, desto besser werden deine Matches."
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Bewertungen total", value: totalRecs, icon: "auto_awesome", tooltip: "Anzahl Kaffees, die du bereits bewertet hast." },
          {
            label: "Ø Match-Score",
            value: avgMatch != null ? `${avgMatch}%` : "—",
            icon: "psychology",
            tooltip:
              "Profilnähe zwischen Coffee-Sensorik (Säure · Süße · Körper · Bitterkeit · Komplexität) und deinem Geschmackstyp. 100% = identisches Sensorik-Profil.",
          },
          { label: "Ø Bewertung", value: avgRating != null ? `${avgRating} / 5` : "—", icon: "star", tooltip: "Durchschnitt deiner Sterne-Bewertungen." },
        ].map((s) => (
          <div key={s.label} className="bg-white p-6 shadow-sm" title={s.tooltip}>
            <span className="material-symbols-outlined text-tertiary text-2xl mb-3 block">{s.icon}</span>
            <p className="font-headline font-bold text-primary text-2xl uppercase tracking-tight">{s.value}</p>
            <p className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Verlauf */}
      <div className="bg-white p-6 md:p-8 shadow-sm">
        <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-6">Verlauf</h3>
        {enriched.length === 0 ? (
          <p className="text-sm text-on-surface-variant py-4">
            {customer.taste_type_id
              ? "Du hast noch keine Kaffees bewertet. Sobald du deine erste Bestellung bewertet hast, erscheint sie hier."
              : "Mach erst das Quiz und bewerte deine ersten Kaffees, dann siehst du hier deine Match-Historie."}
          </p>
        ) : (
          <div className="divide-y divide-surface-container">
            {enriched.map((h) => (
              <div key={h.id} className="py-4 grid grid-cols-1 md:grid-cols-[auto_1fr_auto_auto] gap-3 md:gap-6 items-center">
                <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold">{h.date}</span>
                <div>
                  <Link href={`/coffee/${h.coffeeSlug}`} className="font-headline font-bold text-primary uppercase tracking-tight hover:text-tertiary transition-colors">
                    {h.coffeeName}
                  </Link>
                  <p className="text-xs text-on-surface-variant">{h.roasterName}</p>
                </div>
                <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                  {h.match != null ? `${h.match}% Match` : "—"}
                </span>
                <span className="font-headline text-[11px] uppercase tracking-widest font-bold">
                  {h.rating ? (
                    <span className="text-tertiary">{"★".repeat(h.rating)}{"☆".repeat(5 - h.rating)}</span>
                  ) : (
                    <span className="text-on-surface-variant/60">— Bewerten</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Aktuelle offene Empfehlungen */}
      {upcomingRecs.length > 0 && (
        <div className="bg-surface-variant p-6 md:p-8">
          <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-4">
            Aktuelle Top-Empfehlungen für dich
          </h3>
          <p className="text-sm text-on-surface-variant mb-6">
            Diese Kaffees passen zu deinem Geschmackstyp und du hast sie noch nicht bewertet.
          </p>
          <div className="divide-y divide-primary/10">
            {upcomingRecs.map((c) => (
              <div key={c.id} className="py-3 flex items-center justify-between gap-4">
                <Link href={`/coffee/${c.slug}`} className="flex-1 hover:text-tertiary transition-colors">
                  <p className="font-headline font-bold text-primary uppercase tracking-tight text-sm">{c.name}</p>
                  <p className="text-xs text-on-surface-variant">{c.roaster?.name ?? ""}</p>
                </Link>
                <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold">
                  {Math.round(c.matchScore * 100)}% Match
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alternativen-CTA — nur hier im Profil sichtbar */}
      <div className="bg-white border-l-4 border-tertiary p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="font-headline text-[10px] uppercase tracking-[0.3em] text-tertiary font-bold block mb-2">
              Persönlich für dich
            </span>
            <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-1">
              Alternativen zu deinem Match
            </h3>
            <p className="text-sm text-on-surface-variant">
              Kaffees, die knapp neben deinem Geschmackstyp liegen — mit Begründung, warum sie zu dir passen könnten.
            </p>
          </div>
          <Link
            href="/recommendation/alternatives"
            className="bg-primary text-on-primary px-6 py-3 font-headline font-bold text-[11px] uppercase tracking-widest hover:bg-black transition-all whitespace-nowrap"
          >
            Alternativen ansehen →
          </Link>
        </div>
      </div>

      <Link href="/account/dashboard" className="font-headline text-[11px] uppercase tracking-[0.2em] text-tertiary hover:text-primary transition-colors border-b-2 border-tertiary pb-1 inline-block">
        ← Zurück zum Dashboard
      </Link>
    </AccountLayout>
  );
}
