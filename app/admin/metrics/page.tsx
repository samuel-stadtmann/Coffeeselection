import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getAdminUser } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/service";

const LOGO = "/logo.png";

export const metadata: Metadata = {
  title: "Admin · Algorithmus-Metriken — Coffee Selection",
  robots: { index: false, follow: false },
};

type SummaryRow = {
  avg_rating_overall_90d: number | null;
  num_ratings_30d: number | null;
  avg_confidence_30d: number | null;
  num_quiz_30d: number | null;
  customers_with_profile: number | null;
  reclass_suggested_30d: number | null;
  active_coffees: number | null;
  coffees_with_embedding: number | null;
  recommendations_30d: number | null;
};

type RatingPerTypeRow = {
  taste_type_id: number;
  taste_type_name: string;
  num_ratings: number;
  avg_rating: number | null;
  pct_positive: number | null;
};

type ConfidenceRow = {
  band: string;
  band_label: string;
  num_customers: number;
  pct: number;
};

type ReclassRow = {
  window: string;
  customers_with_profile: number;
  suggested_recently: number;
  rate_pct: number | null;
};

type TopCoffeeRow = {
  coffee_id: string;
  coffee_name: string;
  coffee_slug: string;
  roaster_name: string;
  times_recommended: number;
  avg_recommendation_score: number | null;
  distinct_customers: number;
  avg_rating_when_recommended: number | null;
  num_ratings_after_recommendation: number;
};

function formatNumber(n: number | null | undefined, fractionDigits = 0): string {
  if (n == null) return "—";
  return n.toLocaleString("de-CH", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

function ratingHealth(avg: number | null): "ok" | "warn" | "alert" {
  if (avg == null) return "ok";
  if (avg < 3.3) return "alert";
  if (avg < 3.8) return "warn";
  return "ok";
}

function confidenceHealth(avg: number | null): "ok" | "warn" | "alert" {
  if (avg == null) return "ok";
  if (avg < 0.5) return "alert";
  if (avg < 0.65) return "warn";
  return "ok";
}

function reclassHealth(rate: number | null): "ok" | "warn" | "alert" {
  if (rate == null) return "ok";
  if (rate > 15) return "alert";
  if (rate > 5) return "warn";
  return "ok";
}

const HEALTH_BADGE: Record<"ok" | "warn" | "alert", string> = {
  ok: "bg-emerald-100 text-emerald-800",
  warn: "bg-amber-100 text-amber-900",
  alert: "bg-rose-100 text-rose-900",
};

const HEALTH_LABEL: Record<"ok" | "warn" | "alert", string> = {
  ok: "OK",
  warn: "Beobachten",
  alert: "Kritisch",
};

export default async function AdminMetricsPage() {
  const user = await getAdminUser();
  if (!user) redirect("/login?next=/admin/metrics");

  const sb = createServiceClient();
  const [summaryRes, ratingsRes, confidenceRes, reclassRes, topCoffeesRes] = await Promise.all([
    sb.from("metrics_summary").select("*").maybeSingle(),
    sb.from("metrics_avg_rating_per_type").select("*"),
    sb.from("metrics_confidence_distribution").select("*"),
    sb.from("metrics_reclassification_rate").select("*").order("window"),
    sb.from("metrics_top_recommended_coffees").select("*"),
  ]);

  const summary = (summaryRes.data ?? null) as SummaryRow | null;
  const ratingsPerType = (ratingsRes.data ?? []) as RatingPerTypeRow[];
  const confidence = (confidenceRes.data ?? []) as ConfidenceRow[];
  const reclass = (reclassRes.data ?? []) as ReclassRow[];
  const topCoffees = (topCoffeesRes.data ?? []) as TopCoffeeRow[];

  const reclass30d = reclass.find((r) => r.window === "30d");
  const reclassRatePct = reclass30d?.rate_pct ?? null;

  const ratingHealthState = ratingHealth(summary?.avg_rating_overall_90d ?? null);
  const confidenceHealthState = confidenceHealth(summary?.avg_confidence_30d ?? null);
  const reclassHealthState = reclassHealth(reclassRatePct);

  return (
    <div className="bg-[#F9F5F0] text-on-surface min-h-screen pb-20">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5">
        <nav className="flex justify-between items-center max-w-7xl mx-auto px-6 md:px-8 w-full">
          <Link href="/" className="flex items-center">
            <img alt="Coffee Selection" className="h-56 md:h-72 w-auto object-contain -my-10 md:-my-16" src={LOGO} />
          </Link>
          <span className="font-headline text-[10px] uppercase tracking-[0.3em] text-tertiary font-bold">
            Admin · {user.email}
          </span>
        </nav>
      </header>

      <main className="pt-36 md:pt-40 max-w-7xl mx-auto px-6 md:px-8">
        <div className="mb-12">
          <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
            Algorithmus · Monitoring
          </span>
          <h1 className="text-4xl md:text-5xl text-primary uppercase tracking-tight font-headline font-bold mb-4">
            Metriken-Dashboard
          </h1>
          <p className="text-on-surface-variant max-w-2xl">
            Die fünf Kennzahlen aus Playbook Kapitel 10. Grenzwerte folgen den
            Empfehlungen für gesunde Algorithmus-Performance.
          </p>
        </div>

        {/* Hero-KPIs */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <KPICard
            label="Ø Bewertung (90d)"
            value={formatNumber(summary?.avg_rating_overall_90d, 2)}
            sub={`${formatNumber(summary?.num_ratings_30d)} Bewertungen in 30d`}
            health={ratingHealthState}
            healthHint="Ziel ≥ 3.8 · kritisch < 3.3"
          />
          <KPICard
            label="Ø Confidence (30d)"
            value={formatNumber(summary?.avg_confidence_30d, 3)}
            sub={`${formatNumber(summary?.num_quiz_30d)} Quiz-Submissions`}
            health={confidenceHealthState}
            healthHint="Ziel ≥ 0.65 · kritisch < 0.50"
          />
          <KPICard
            label="Reklassifikation (30d)"
            value={reclassRatePct != null ? `${formatNumber(reclassRatePct, 1)}%` : "—"}
            sub={`${formatNumber(summary?.reclass_suggested_30d)} von ${formatNumber(
              summary?.customers_with_profile
            )} Kunden`}
            health={reclassHealthState}
            healthHint="Ziel < 5% · kritisch > 15%"
          />
        </section>

        {/* Sortiment + Aktivitaet */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          <SmallStat label="Aktive Coffees" value={formatNumber(summary?.active_coffees)} />
          <SmallStat
            label="Mit Embedding"
            value={`${formatNumber(summary?.coffees_with_embedding)} / ${formatNumber(
              summary?.active_coffees
            )}`}
          />
          <SmallStat
            label="Customers (Profil)"
            value={formatNumber(summary?.customers_with_profile)}
          />
          <SmallStat
            label="Empfehlungen (30d)"
            value={formatNumber(summary?.recommendations_30d)}
          />
        </section>

        {/* Bewertungen pro Typ */}
        <Section title="Bewertung pro Geschmackstyp · 90 Tage">
          <table className="w-full text-sm">
            <thead className="text-left font-headline text-[10px] uppercase tracking-widest text-tertiary border-b border-primary/10">
              <tr>
                <th className="pb-3 pr-4 font-bold">Typ</th>
                <th className="pb-3 pr-4 font-bold">Ø Sterne</th>
                <th className="pb-3 pr-4 font-bold"># Bewertungen</th>
                <th className="pb-3 pr-4 font-bold">% positiv (≥4★)</th>
              </tr>
            </thead>
            <tbody>
              {ratingsPerType.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-on-surface-variant italic">
                    Noch keine Bewertungen in den letzten 90 Tagen.
                  </td>
                </tr>
              ) : (
                ratingsPerType.map((r) => (
                  <tr key={r.taste_type_id} className="border-b border-primary/5">
                    <td className="py-3 pr-4 font-bold">{r.taste_type_name}</td>
                    <td className="py-3 pr-4">{formatNumber(r.avg_rating, 2)}</td>
                    <td className="py-3 pr-4">{formatNumber(r.num_ratings)}</td>
                    <td className="py-3 pr-4">
                      {r.pct_positive != null ? `${formatNumber(r.pct_positive, 1)}%` : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Section>

        {/* Confidence-Verteilung */}
        <Section title="Quiz-Confidence-Verteilung · 30 Tage">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {confidence.length === 0 ? (
              <p className="col-span-full text-on-surface-variant italic">
                Keine Quiz-Submissions in den letzten 30 Tagen.
              </p>
            ) : (
              confidence.map((b) => (
                <div key={b.band} className="bg-white p-4 border-l-2 border-tertiary/30">
                  <div className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold mb-1">
                    {b.band_label}
                  </div>
                  <div className="text-2xl font-headline font-bold text-primary">
                    {formatNumber(b.pct, 1)}%
                  </div>
                  <div className="text-xs text-on-surface-variant mt-1">
                    {formatNumber(b.num_customers)} Kunden
                  </div>
                </div>
              ))
            )}
          </div>
        </Section>

        {/* Top empfohlene Coffees */}
        <Section title="Top empfohlene Coffees · 90 Tage">
          <table className="w-full text-sm">
            <thead className="text-left font-headline text-[10px] uppercase tracking-widest text-tertiary border-b border-primary/10">
              <tr>
                <th className="pb-3 pr-4 font-bold">Coffee</th>
                <th className="pb-3 pr-4 font-bold">Röster</th>
                <th className="pb-3 pr-4 font-bold"># Empfehlungen</th>
                <th className="pb-3 pr-4 font-bold">Ø Score</th>
                <th className="pb-3 pr-4 font-bold">Distinct Cust.</th>
                <th className="pb-3 pr-4 font-bold">Ø Bewertung</th>
              </tr>
            </thead>
            <tbody>
              {topCoffees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-on-surface-variant italic">
                    Noch keine recommendation_history-Einträge.
                  </td>
                </tr>
              ) : (
                topCoffees.map((c) => (
                  <tr key={c.coffee_id} className="border-b border-primary/5">
                    <td className="py-3 pr-4 font-bold">
                      <Link href={`/coffee/${c.coffee_slug}`} className="hover:text-tertiary">
                        {c.coffee_name}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">{c.roaster_name}</td>
                    <td className="py-3 pr-4">{formatNumber(c.times_recommended)}</td>
                    <td className="py-3 pr-4">{formatNumber(c.avg_recommendation_score, 3)}</td>
                    <td className="py-3 pr-4">{formatNumber(c.distinct_customers)}</td>
                    <td className="py-3 pr-4">
                      {c.avg_rating_when_recommended != null
                        ? formatNumber(c.avg_rating_when_recommended, 2)
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Section>

        <p className="text-xs text-on-surface-variant mt-12 mb-4">
          Quelle: <code className="bg-white px-2 py-0.5">public.metrics_*</code> Views (Migration
          20260510260000). Refresh durch Page-Reload — keine Caching-Layer dazwischen.
        </p>
      </main>
    </div>
  );
}

function KPICard({
  label,
  value,
  sub,
  health,
  healthHint,
}: {
  label: string;
  value: string;
  sub: string;
  health: "ok" | "warn" | "alert";
  healthHint: string;
}) {
  return (
    <div className="bg-white p-6 border-l-4 border-tertiary shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold">
          {label}
        </span>
        <span
          className={`font-headline text-[9px] uppercase tracking-widest font-bold px-2 py-1 ${HEALTH_BADGE[health]}`}
        >
          {HEALTH_LABEL[health]}
        </span>
      </div>
      <div className="text-4xl font-headline font-bold text-primary mb-2">{value}</div>
      <div className="text-xs text-on-surface-variant">{sub}</div>
      <div className="text-[10px] text-on-surface-variant/60 mt-2">{healthHint}</div>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-4 shadow-sm">
      <div className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold mb-1">
        {label}
      </div>
      <div className="text-xl font-headline font-bold text-primary">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-16">
      <h2 className="text-2xl text-primary uppercase tracking-tight font-headline font-bold mb-6">
        {title}
      </h2>
      <div className="bg-white p-6 md:p-8 shadow-sm">{children}</div>
    </section>
  );
}
