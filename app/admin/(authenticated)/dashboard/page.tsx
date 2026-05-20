import Link from "next/link";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import PeriodFilter from "./PeriodFilter";
import SparkBars from "./SparkBars";

export const metadata: Metadata = {
  title: "Admin · Dashboard — Coffee Selection",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Period = "day" | "week" | "month" | "year";
const VALID_PERIODS: Period[] = ["day", "week", "month", "year"];

// Wie viele Buckets zeigen wir pro Period?
const BUCKET_COUNT = 12;

type Bucket = { label: string; value: number };

function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function bucketDates(period: Period): { start: Date; end: Date; label: string }[] {
  const now = new Date();
  const result: { start: Date; end: Date; label: string }[] = [];
  if (period === "day") {
    // Letzte 12 Tage
    for (let i = BUCKET_COUNT - 1; i >= 0; i--) {
      const start = startOfDayUTC(new Date(now.getTime() - i * 86400000));
      const end = new Date(start.getTime() + 86400000);
      result.push({
        start, end,
        label: String(start.getUTCDate()).padStart(2, "0") + "." + String(start.getUTCMonth() + 1).padStart(2, "0"),
      });
    }
  } else if (period === "week") {
    // Letzte 12 Wochen (mo-so)
    const today = startOfDayUTC(now);
    const dow = (today.getUTCDay() + 6) % 7; // 0=Mo
    const thisMo = new Date(today.getTime() - dow * 86400000);
    for (let i = BUCKET_COUNT - 1; i >= 0; i--) {
      const start = new Date(thisMo.getTime() - i * 7 * 86400000);
      const end = new Date(start.getTime() + 7 * 86400000);
      result.push({
        start, end,
        label: "KW" + getISOWeek(start),
      });
    }
  } else if (period === "month") {
    // Letzte 12 Monate
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth();
    for (let i = BUCKET_COUNT - 1; i >= 0; i--) {
      const start = new Date(Date.UTC(y, m - i, 1));
      const end = new Date(Date.UTC(y, m - i + 1, 1));
      result.push({
        start, end,
        label: ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"][start.getUTCMonth()],
      });
    }
  } else {
    // Letzte 6 Jahre (BUCKET_COUNT/2)
    const y = now.getUTCFullYear();
    const N = 6;
    for (let i = N - 1; i >= 0; i--) {
      const start = new Date(Date.UTC(y - i, 0, 1));
      const end = new Date(Date.UTC(y - i + 1, 0, 1));
      result.push({ start, end, label: String(start.getUTCFullYear()) });
    }
  }
  return result;
}

function getISOWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThu = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const diff = (date.getTime() - firstThu.getTime()) / 86400000;
  return 1 + Math.round((diff - 3 + ((firstThu.getUTCDay() + 6) % 7)) / 7);
}

function aggregateByBucket<T>(
  rows: T[],
  getDate: (r: T) => string | Date,
  getValue: (r: T) => number,
  buckets: { start: Date; end: Date; label: string }[]
): Bucket[] {
  const counts = buckets.map((b) => ({ label: b.label, value: 0 }));
  for (const r of rows) {
    const t = new Date(getDate(r)).getTime();
    for (let i = 0; i < buckets.length; i++) {
      if (t >= buckets[i].start.getTime() && t < buckets[i].end.getTime()) {
        counts[i].value += getValue(r);
        break;
      }
    }
  }
  return counts;
}

function fmtChf(n: number): string {
  return n.toLocaleString("de-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type SearchParams = Promise<{ period?: string }>;

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const period: Period = VALID_PERIODS.includes(params.period as Period)
    ? (params.period as Period)
    : "month";

  const svc = createServiceClient();
  const buckets = bucketDates(period);
  const since = buckets[0].start.toISOString();

  // Alles in parallel laden.
  const [
    { count: totalCustomers },
    { data: customersRows },
    { count: activeSubs },
    { data: subsRows },
    { count: churnedSubs },
    { data: churnedRows },
    { data: orderRows },
    { count: roasterCount },
    { count: coffeeCount },
    { count: newsletterSubscribers },
    { data: newsletterRows },
    { data: marketingSpendRows },
  ] = await Promise.all([
    svc.from("customers").select("id", { count: "exact", head: true }).is("deleted_at", null),
    svc.from("customers").select("created_at").is("deleted_at", null).gte("created_at", since),
    svc.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
    svc.from("subscriptions").select("created_at").gte("created_at", since),
    svc.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "cancelled"),
    svc.from("subscriptions").select("cancelled_at").not("cancelled_at", "is", null).gte("cancelled_at", since),
    svc
      .from("orders")
      .select(
        `placed_at, status, subscription_id, total_chf,
         items:order_items(quantity, weight_g, unit_price_chf, wholesale_price_chf)`
      )
      .in("status", ["paid", "processing", "shipped", "delivered"])
      .gte("placed_at", since),
    svc.from("roasters").select("id", { count: "exact", head: true }),
    svc.from("coffees").select("id", { count: "exact", head: true }).eq("status", "active"),
    svc.from("customers").select("id", { count: "exact", head: true }).eq("marketing_opt_in", true).is("deleted_at", null),
    svc.from("customers").select("created_at").eq("marketing_opt_in", true).is("deleted_at", null).gte("created_at", since),
    // Marketing-Spend in der Periode — Aktivitaeten die im Zeitfenster
    // gestartet sind. Fuer CAC/CPO summieren wir spent_chf.
    svc
      .from("marketing_spend")
      .select("spent_chf, starts_at, ends_at")
      .is("deleted_at", null)
      .gte("starts_at", since.slice(0, 10)),
  ]);

  type OrderRow = {
    placed_at: string;
    status: string;
    subscription_id: string | null;
    total_chf: number;
    items: Array<{
      quantity: number;
      weight_g: number;
      unit_price_chf: number;
      wholesale_price_chf: number | null;
    }>;
  };
  const ordersTyped = ((orderRows ?? []) as unknown as OrderRow[]);
  const oneTimeOrders = ordersTyped.filter((o) => !o.subscription_id);

  // Bucket-Aggregates
  const customersTrend = aggregateByBucket(
    (customersRows ?? []) as { created_at: string }[],
    (r) => r.created_at, () => 1, buckets
  );
  const newSubsTrend = aggregateByBucket(
    (subsRows ?? []) as { created_at: string }[],
    (r) => r.created_at, () => 1, buckets
  );
  const churnTrend = aggregateByBucket(
    (churnedRows ?? []) as { cancelled_at: string }[],
    (r) => r.cancelled_at, () => 1, buckets
  );
  const newsletterTrend = aggregateByBucket(
    (newsletterRows ?? []) as { created_at: string }[],
    (r) => r.created_at, () => 1, buckets
  );
  const oneTimeOrdersTrend = aggregateByBucket(
    oneTimeOrders, (r) => r.placed_at, () => 1, buckets
  );
  const revenueTrend = aggregateByBucket(
    ordersTyped, (r) => r.placed_at, (r) => Number(r.total_chf), buckets
  );
  const marginTrend = aggregateByBucket(
    ordersTyped, (r) => r.placed_at,
    (r) =>
      r.items.reduce((sum, it) => {
        const wholesale = it.wholesale_price_chf == null ? 0 : Number(it.wholesale_price_chf);
        // wholesale_price_chf ist pro 250g normiert? In commerce.sql ist
        // wholesale_price_chf unkommentiert — wir nehmen an: gleicher
        // Massstab wie unit_price_chf (pro Bag-Item).
        const marginPerItem = Number(it.unit_price_chf) - wholesale;
        return sum + marginPerItem * it.quantity;
      }, 0),
    buckets
  );

  const totalRevenue = ordersTyped.reduce((s, o) => s + Number(o.total_chf), 0);
  const totalMargin = ordersTyped.reduce(
    (s, o) => s + o.items.reduce((ms, it) => {
      const w = it.wholesale_price_chf == null ? 0 : Number(it.wholesale_price_chf);
      return ms + (Number(it.unit_price_chf) - w) * it.quantity;
    }, 0),
    0
  );

  // CLV-Approximation: Total-Revenue ueber Periode / Anzahl distinct
  // Kunden mit mindestens einer paid Order. Reichts fuer den Anfang —
  // echte CLV braucht Cohort + Time-Series-Analyse.
  // Hier vereinfacht: Gesamt-Revenue aller Zeit / Gesamt-Customers.
  const { data: allOrdersRevenue } = await svc
    .from("orders")
    .select("customer_id, total_chf")
    .in("status", ["paid", "processing", "shipped", "delivered"]);
  const allRevSum = (allOrdersRevenue ?? []).reduce((s, o) => s + Number(o.total_chf), 0);
  const distinctCustomersWithOrder = new Set(
    (allOrdersRevenue ?? []).map((o) => o.customer_id)
  ).size;
  const clv = distinctCustomersWithOrder > 0
    ? allRevSum / distinctCustomersWithOrder
    : 0;

  // CAC + CPO aus marketing_spend (in der Periode):
  //   CAC = Sum(spent_chf) / Anzahl Neukunden in Periode
  //   CPO = Sum(spent_chf) / Anzahl Orders in Periode
  // Wenn Marketing-Spend oder Numerator 0 ist, lassen wir "—" stehen.
  const marketingSpentInPeriod = ((marketingSpendRows ?? []) as Array<{
    spent_chf: number;
  }>).reduce((s, r) => s + Number(r.spent_chf), 0);
  const newCustomersInPeriod = (customersRows ?? []).length;
  const ordersInPeriod = ordersTyped.length;
  const cac =
    marketingSpentInPeriod > 0 && newCustomersInPeriod > 0
      ? marketingSpentInPeriod / newCustomersInPeriod
      : null;
  const cpo =
    marketingSpentInPeriod > 0 && ordersInPeriod > 0
      ? marketingSpentInPeriod / ordersInPeriod
      : null;

  // Lifecycle: zaehle Customers nach Stage
  const { data: lifecycleRows } = await svc.rpc("customer_lifecycle_buckets" as never);
  // Wenn RPC noch nicht existiert: leise weiter mit Fallback-Berechnung.
  // Wir berechnen es hier inline, damit kein DB-Function-Dep entsteht.
  const { data: allCustomersForLC } = await svc
    .from("customers")
    .select("id, taste_type_id")
    .is("deleted_at", null);
  const allCustIds = ((allCustomersForLC ?? []) as { id: string; taste_type_id: number | null }[]).map((c) => c.id);
  const { data: ordersPerCust } = await svc
    .from("orders")
    .select("customer_id")
    .in("status", ["paid", "processing", "shipped", "delivered"]);
  const orderCountByCust = new Map<string, number>();
  ((ordersPerCust ?? []) as { customer_id: string }[]).forEach((o) => {
    orderCountByCust.set(o.customer_id, (orderCountByCust.get(o.customer_id) ?? 0) + 1);
  });
  const { data: aboCustomers } = await svc
    .from("subscriptions")
    .select("customer_id, status");
  const activeAboCustomers = new Set(
    ((aboCustomers ?? []) as { customer_id: string; status: string }[])
      .filter((s) => s.status === "active")
      .map((s) => s.customer_id)
  );
  const cancelledAboCustomers = new Set(
    ((aboCustomers ?? []) as { customer_id: string; status: string }[])
      .filter((s) => s.status === "cancelled")
      .map((s) => s.customer_id)
  );
  const lifecycle = {
    lead: allCustIds.filter((id) => !orderCountByCust.has(id)).length,
    first_order: allCustIds.filter((id) => orderCountByCust.get(id) === 1).length,
    repeat: allCustIds.filter((id) => (orderCountByCust.get(id) ?? 0) >= 2 && !activeAboCustomers.has(id)).length,
    abo: activeAboCustomers.size,
    churned: cancelledAboCustomers.size,
  };

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-headline font-bold text-3xl md:text-4xl text-primary uppercase tracking-tight">
          Dashboard
        </h1>
        <p className="text-on-surface-variant mt-2">
          Überblick über Kunden, Bestellungen, Umsatz und Sortiment.
        </p>
        <div className="mt-4">
          <PeriodFilter current={period} />
        </div>
      </header>

      {/* KPI-Kacheln */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Kpi label="Kunden total" value={String(totalCustomers ?? 0)} />
        <Kpi label="Aktive Abos" value={String(activeSubs ?? 0)} />
        <Kpi label="Gekündigte Abos (Churn)" value={String(churnedSubs ?? 0)} />
        <Kpi label="Newsletter-Abonnenten" value={String(newsletterSubscribers ?? 0)} />
        <Kpi label="Ø CLV" value={`CHF ${fmtChf(clv)}`} />
        <Kpi label="Umsatz (Periode)" value={`CHF ${fmtChf(totalRevenue)}`} />
        <Kpi label="Marge (Periode)" value={`CHF ${fmtChf(totalMargin)}`} />
        <Kpi label="Röster" value={String(roasterCount ?? 0)} />
        <Kpi label="Aktive Kaffees" value={String(coffeeCount ?? 0)} />
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title="Neue Kunden">
          <SparkBars data={customersTrend} />
        </ChartCard>
        <ChartCard title="Neue Abos">
          <SparkBars data={newSubsTrend} />
        </ChartCard>
        <ChartCard title="Einzelkäufe">
          <SparkBars data={oneTimeOrdersTrend} />
        </ChartCard>
        <ChartCard title="Churn (gekündigte Abos)">
          <SparkBars data={churnTrend} />
        </ChartCard>
        <ChartCard title="Newsletter Opt-Ins">
          <SparkBars data={newsletterTrend} />
        </ChartCard>
        <ChartCard title="Umsatz (CHF)" valueFmt={fmtChf}>
          <SparkBars data={revenueTrend} valueFmt={fmtChf} />
        </ChartCard>
        <ChartCard title="Marge (CHF)" valueFmt={fmtChf}>
          <SparkBars data={marginTrend} valueFmt={fmtChf} />
        </ChartCard>
      </section>

      {/* Customer-Lifecycle */}
      <section className="bg-white p-6 md:p-8 shadow-sm">
        <h2 className="font-headline font-bold text-lg text-primary uppercase tracking-tight mb-2">
          Customer-Lifecycle
        </h2>
        <p className="text-sm text-on-surface-variant mb-6">
          Wo stehen unsere Kunden? Jede Stage zählt unique Kunden (überlappungsfrei).
        </p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stage label="Lead" desc="Account, keine Bestellung" value={lifecycle.lead} />
          <Stage label="Erstkauf" desc="Genau 1 Bestellung" value={lifecycle.first_order} />
          <Stage label="Wiederkäufer" desc="2+ Bestellungen, kein Abo" value={lifecycle.repeat} />
          <Stage label="Abo aktiv" desc="Status active" value={lifecycle.abo} highlight />
          <Stage label="Churned" desc="Abo gekündigt" value={lifecycle.churned} />
        </div>
      </section>

      {/* K1 Marketing-KPIs — manuelle Pflege */}
      <section className="bg-white p-6 md:p-8 shadow-sm">
        <h2 className="font-headline font-bold text-lg text-primary uppercase tracking-tight mb-2">
          Marketing-KPIs
        </h2>
        <p className="text-sm text-on-surface-variant mb-6">
          CAC + CPO werden aus <code className="bg-surface-container px-1">marketing_spend</code>{" "}
          (Tab „Marketing") berechnet. Sum der ausgegebenen CHF in der gewählten
          Periode geteilt durch Neukunden bzw. Bestellungen im gleichen Fenster.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Kpi label="CLV (Ø)" value={`CHF ${fmtChf(clv)}`} tooltip="Total Revenue (paid Orders) / Distinct Customers mit Bestellung" />
          <Kpi
            label="Marketing-Spend"
            value={`CHF ${fmtChf(marketingSpentInPeriod)}`}
            tooltip="Summe spent_chf der Marketing-Aktivitäten in der Periode"
          />
          <Kpi
            label="CAC"
            value={cac != null ? `CHF ${fmtChf(cac)}` : "—"}
            tooltip="Marketing-Spend / Neukunden in Periode"
          />
          <Kpi
            label="CPO"
            value={cpo != null ? `CHF ${fmtChf(cpo)}` : "—"}
            tooltip="Marketing-Spend / Orders in Periode"
          />
        </div>
      </section>

      <Link
        href="/admin/metrics"
        className="font-headline text-[11px] uppercase tracking-[0.2em] text-tertiary hover:text-primary transition-colors border-b-2 border-tertiary pb-1 inline-block"
      >
        → Algorithmus-Metriken
      </Link>
    </div>
  );
}

function Kpi({ label, value, tooltip }: { label: string; value: string; tooltip?: string }) {
  return (
    <div className="bg-white p-5 shadow-sm" title={tooltip}>
      <p className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">
        {label}
      </p>
      <p className="font-headline font-bold text-2xl md:text-3xl text-primary">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode; valueFmt?: (n: number) => string }) {
  return (
    <div className="bg-white p-5 md:p-6 shadow-sm">
      <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-sm mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Stage({ label, desc, value, highlight = false }: { label: string; desc: string; value: number; highlight?: boolean }) {
  return (
    <div className={`p-4 ${highlight ? "bg-tertiary/10 border-l-4 border-tertiary" : "bg-surface-container-low"}`}>
      <p className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
        {label}
      </p>
      <p className="font-headline font-bold text-2xl text-primary mt-1">{value}</p>
      <p className="text-xs text-on-surface-variant mt-1">{desc}</p>
    </div>
  );
}
