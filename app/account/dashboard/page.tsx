"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import AccountSidebar from "@/components/AccountSidebar";
import { createClient } from "@/lib/supabase/client";
import { tasteTypeById } from "@/lib/taste-types-map";
import type { TasteType } from "@/lib/taste-types";
import { getCoffeesForTasteType, type RecommendedCoffee } from "@/lib/db/recommendations";

const LOGO = "/logo.png";

type CustomerRow = {
  first_name: string | null;
  taste_type_id: number | null;
  created_at: string;
};

type TasteProfile = {
  acidity: number | null;
  body: number | null;
  sweetness: number | null;
  bitterness: number | null;
  complexity: number | null;
};

const subscription = {
  active: true,
  product: "Discovery Abo · 500g",
  interval: "Alle 2 Wochen",
  nextDelivery: "15. Mai 2025",
  daysUntilNext: 8,
  pricePerDelivery: "CHF 45.20",
  totalSpent: "CHF 224.40",
  deliveriesReceived: 5,
};

const recentOrders = [
  { id: "CS-2024-000142", date: "01.05.2025", coffee: "Ethiopia Yirgacheffe", roaster: "Miro Coffee", price: "CHF 45.20", status: "Geliefert", rated: false },
  { id: "CS-2024-000131", date: "17.04.2025", coffee: "Kenya AA Nyeri", roaster: "Vertical Coffee", price: "CHF 45.20", status: "Geliefert", rated: true },
  { id: "CS-2024-000118", date: "03.04.2025", coffee: "Rwanda Anaerobic", roaster: "La Cabra", price: "CHF 45.20", status: "Geliefert", rated: true },
  { id: "CS-2024-000109", date: "20.03.2025", coffee: "Ethiopia Gedeb Washed", roaster: "Miro Coffee", price: "CHF 45.20", status: "Geliefert", rated: true },
];

export default function AccountDashboardPage() {
  const [paused, setPaused] = useState(false);
  const [customer, setCustomer] = useState<CustomerRow | null>(null);
  const [profile, setProfile] = useState<TasteProfile | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendedCoffee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("customers")
        .select("first_name, taste_type_id, created_at")
        .eq("auth_user_id", auth.user.id)
        .single();
      setCustomer(data);
      // Wenn taste_type_id gesetzt: Archetyp-Profil + Top-Coffee-Match aus DB laden
      if (data?.taste_type_id != null) {
        const [{ data: tt }, recs] = await Promise.all([
          supabase
            .from("taste_types")
            .select("acidity, body, sweetness, bitterness, complexity")
            .eq("id", data.taste_type_id)
            .maybeSingle(),
          getCoffeesForTasteType(supabase, data.taste_type_id, { limit: 1 }),
        ]);
        setProfile(tt as TasteProfile | null);
        setRecommendation(recs[0] ?? null);
      }
      setLoading(false);
    })();
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 11) return "Guten Morgen";
    if (h < 18) return "Hallo";
    return "Guten Abend";
  })();

  const tasteType: TasteType | undefined = tasteTypeById(customer?.taste_type_id);
  const hasTasteType = tasteType != null;
  const firstName = customer?.first_name ?? "";
  const joinedDate = customer
    ? new Date(customer.created_at).toLocaleDateString("de-CH", { month: "long", year: "numeric" })
    : "";

  return (
    <div className="bg-[#F9F5F0] text-on-surface min-h-screen pb-20 md:pb-0">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5">
        <nav className="flex justify-between items-center max-w-7xl mx-auto px-6 md:px-8 w-full">
          <Link href="/" className="flex items-center">
            <img alt="Coffee Selection" className="h-56 md:h-72 w-auto object-contain -my-10 md:-my-16 mr-8 shrink-0" src={LOGO} />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/checkout/cart">
              <span className="material-symbols-outlined text-primary text-2xl hover:text-tertiary transition-colors">shopping_bag</span>
            </Link>
            <Link
              href="/quiz/question-1-brewing-method"
              className="bg-primary text-white px-5 md:px-6 py-3 text-[11px] md:text-[12px] uppercase tracking-[0.2em] font-headline font-bold hover:bg-black transition-all"
            >
              Quiz wiederholen
            </Link>
          </div>
        </nav>
      </header>

      <main className="pt-36 md:pt-40 pb-20">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-3">
              <AccountSidebar />
            </div>

            {/* Main */}
            <div className="lg:col-span-9 space-y-6 md:space-y-8">
              {/* Greeting */}
              <div>
                <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-3 block">
                  {joinedDate ? `Mitglied seit ${joinedDate}` : "Willkommen"}
                </span>
                <h1 className="text-3xl md:text-5xl text-primary font-headline font-bold uppercase tracking-tight">
                  {greeting}{firstName ? `, ${firstName}` : ""}.
                </h1>
                <p className="text-on-surface-variant mt-3">
                  {hasTasteType && tasteType ? (
                    <>
                      Du bist{" "}
                      <Link href={`/taste-types/${tasteType.slug}`} className="text-tertiary font-bold hover:text-primary transition-colors">
                        {tasteType.name}
                      </Link>{" "}
                      — wir kuratieren weiter für dich.
                    </>
                  ) : (
                    "Mach das Quiz, dann kennen wir deinen Geschmackstyp und können dir die passenden Kaffees empfehlen."
                  )}
                </p>
              </div>

              {/* Empty-State: Quiz noch nicht gemacht */}
              {!loading && !hasTasteType && (
                <div className="bg-tertiary text-primary p-8 md:p-10 shadow-xl">
                  <span className="font-headline font-bold uppercase tracking-[0.4em] text-[11px] mb-3 block">
                    Erster Schritt
                  </span>
                  <h2 className="text-2xl md:text-3xl font-headline font-bold uppercase tracking-tight mb-3">
                    Finde deinen Geschmackstyp
                  </h2>
                  <p className="text-base mb-8 max-w-2xl">
                    Damit wir dir die richtigen Kaffees empfehlen können, brauchen wir 60 Sekunden deiner Zeit.
                    12 Fragen — und wir wissen, was zu dir passt.
                  </p>
                  <Link
                    href="/quiz/question-1-brewing-method"
                    className="inline-block bg-primary text-on-primary px-10 py-5 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all"
                  >
                    Quiz starten
                  </Link>
                </div>
              )}

              {/* Subscription Status — wide top card */}
              <div className="bg-primary text-on-primary p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`w-2 h-2 rounded-full ${paused ? "bg-on-primary/40" : "bg-tertiary"}`} />
                    <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold">
                      {paused ? "Abo pausiert" : "Abo aktiv"}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-headline font-bold uppercase tracking-tight mb-2">
                    {subscription.product}
                  </h2>
                  <p className="text-on-primary/70 mb-4">
                    {subscription.interval} · {subscription.pricePerDelivery} pro Lieferung
                  </p>
                  {!paused && (
                    <p className="font-headline text-[11px] uppercase tracking-widest text-on-primary/60">
                      Nächste Lieferung in <span className="text-tertiary font-bold">{subscription.daysUntilNext} Tagen</span> · {subscription.nextDelivery}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-3 justify-center">
                  <Link
                    href="/account/subscription"
                    className="text-center bg-tertiary text-primary py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-white transition-all"
                  >
                    Abo verwalten
                  </Link>
                  <button
                    onClick={() => setPaused(!paused)}
                    className="text-center border border-on-primary/30 text-on-primary py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-on-primary/10 transition-all"
                  >
                    {paused ? "Abo fortsetzen" : "Pausieren"}
                  </button>
                </div>
              </div>

              {/* Bento: Taste Profile + KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 md:p-8 shadow-sm">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold block mb-1">Geschmackstyp</span>
                      <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-xl">{tasteType?.name ?? "Noch unbekannt"}</h3>
                    </div>
                    <Link href="/account/taste-profile" className="font-headline text-[10px] uppercase tracking-widest text-tertiary hover:text-primary transition-colors">
                      Mehr →
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {hasTasteType && profile ? (
                      [
                        { label: "Säure", value: profile.acidity },
                        { label: "Süße", value: profile.sweetness },
                        { label: "Körper", value: profile.body },
                        { label: "Bitterkeit", value: profile.bitterness },
                        { label: "Komplexität", value: profile.complexity },
                      ]
                        .filter((p) => p.value != null)
                        .map((p) => {
                          // DB-Werte sind 1–5 Skala → in % umrechnen für Anzeige + Bar
                          const pct = Math.max(0, Math.min(100, (p.value as number) * 20));
                          return (
                            <div key={p.label}>
                              <div className="flex justify-between mb-1">
                                <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant">{p.label}</span>
                                <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold">{p.value} / 5</span>
                              </div>
                              <div className="h-1 bg-surface-container relative overflow-hidden">
                                <div className="h-full bg-tertiary" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      <p className="text-sm text-on-surface-variant">Profil sichtbar nach dem Quiz.</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {[
                    { label: "Lieferungen", value: subscription.deliveriesReceived, icon: "inventory_2" },
                    { label: "Gesamt", value: subscription.totalSpent, icon: "payments" },
                    { label: "Bewertet", value: "3 / 4", icon: "star" },
                    { label: "Geschmackstyp", value: "Stabil", icon: "trending_flat" },
                  ].map((s) => (
                    <div key={s.label} className="bg-white p-5 shadow-sm">
                      <span className="material-symbols-outlined text-tertiary text-2xl mb-3 block">{s.icon}</span>
                      <p className="font-headline font-bold text-primary text-xl uppercase tracking-tight mb-1">{s.value}</p>
                      <p className="font-headline text-[9px] uppercase tracking-widest text-on-surface-variant font-bold">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rate Coffee CTA — only shown if any unrated orders */}
              {(() => {
                const next = recentOrders.find((o) => !o.rated);
                if (!next) return null;
                return (
                  <div className="bg-tertiary/10 border-l-4 border-tertiary p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
                    <span className="material-symbols-outlined text-tertiary text-4xl">star</span>
                    <div className="flex-1">
                      <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-1">
                        Wie war dein letzter Kaffee?
                      </h3>
                      <p className="text-sm text-on-surface-variant">
                        Bewerte &ldquo;{next.coffee}&rdquo; — dein Profil lernt mit jedem Feedback.
                      </p>
                    </div>
                    <Link
                      href={`/account/rate/${next.id}`}
                      className="bg-primary text-on-primary px-8 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all whitespace-nowrap"
                    >
                      Jetzt bewerten
                    </Link>
                  </div>
                );
              })()}

              {/* Recent Orders */}
              <div className="bg-white p-6 md:p-8 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-xl">
                    Letzte Bestellungen
                  </h3>
                  <Link href="/account/order-history" className="font-headline text-[10px] uppercase tracking-widest text-tertiary hover:text-primary transition-colors">
                    Alle ansehen →
                  </Link>
                </div>
                <div className="divide-y divide-surface-container">
                  {recentOrders.map((o) => (
                    <div key={o.id} className="py-4 flex flex-wrap md:flex-nowrap items-center gap-3 md:gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold">{o.date}</p>
                        <h4 className="font-headline font-bold text-primary uppercase tracking-tight truncate">{o.coffee}</h4>
                        <p className="text-xs text-on-surface-variant">{o.roaster} · {o.id}</p>
                      </div>
                      <span className="font-headline font-bold text-primary text-sm">{o.price}</span>
                      {o.rated ? (
                        <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant px-3 py-1 bg-surface-container">
                          ★ Bewertet
                        </span>
                      ) : (
                        <Link
                          href={`/account/rate/${o.id}`}
                          className="font-headline text-[10px] uppercase tracking-widest text-tertiary hover:text-primary transition-colors px-3 py-1 border border-tertiary"
                        >
                          Bewerten
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendation + Referral */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recommendation ? (
                  <Link
                    href={`/coffee/${recommendation.slug}`}
                    className="md:col-span-2 bg-surface-variant p-6 md:p-8 group hover:shadow-md transition-shadow"
                  >
                    <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold block mb-2">
                      Neue Empfehlung für dich · {Math.round(recommendation.matchScore * 100)}% Match
                    </span>
                    <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-2xl mb-2 group-hover:text-tertiary transition-colors">
                      {recommendation.name}
                    </h3>
                    <p className="text-sm text-on-surface-variant mb-4">
                      {recommendation.roaster?.name ?? ""}
                      {recommendation.origin_name ? ` · ${recommendation.origin_name}` : ""}
                    </p>
                    <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary group-hover:text-primary transition-colors flex items-center gap-1">
                      Entdecken <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </span>
                  </Link>
                ) : (
                  <div className="md:col-span-2 bg-surface-variant p-6 md:p-8">
                    <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold block mb-2">
                      Empfehlung
                    </span>
                    <p className="text-sm text-on-surface-variant">
                      {hasTasteType ? "Aktuell kein passender Coffee im Sortiment." : "Mach erst das Quiz, dann empfehlen wir dir Kaffees."}
                    </p>
                  </div>
                )}

                <div className="bg-primary text-on-primary p-6 md:p-8 flex flex-col">
                  <span className="material-symbols-outlined text-tertiary text-3xl mb-3">share</span>
                  <h3 className="font-headline font-bold uppercase tracking-tight text-lg mb-2">
                    Empfehle Coffee Selection
                  </h3>
                  <p className="text-sm text-on-primary/70 mb-6 flex-1">
                    Erhalte CHF 10 Guthaben für jeden geworbenen Freund.
                  </p>
                  <Link
                    href="/account/referrals"
                    className="text-center bg-tertiary text-primary py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-white transition-all"
                  >
                    Code teilen
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Mobile CTA */}
      <Link
        href="/account/subscription"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-primary text-on-primary py-5 text-center font-headline font-bold uppercase tracking-widest text-xs shadow-2xl border-t-2 border-tertiary"
      >
        Abo verwalten
      </Link>
    </div>
  );
}
