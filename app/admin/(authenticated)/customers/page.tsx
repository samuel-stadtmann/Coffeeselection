import Link from "next/link";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import CustomersTable, { type CustomerRow } from "./CustomersTable";

export const metadata: Metadata = {
  title: "Admin · Kunden — Coffee Selection",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function fmtChf(n: number): string {
  return n.toLocaleString("de-CH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default async function AdminCustomersPage() {
  const svc = createServiceClient();

  const { data: customersRaw } = await svc
    .from("customers")
    .select(
      "id, first_name, last_name, email, created_at, taste_type_id, marketing_opt_in, deleted_at"
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  type CustRaw = {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    created_at: string;
    taste_type_id: number | null;
    marketing_opt_in: boolean;
  };
  const customers = (customersRaw ?? []) as CustRaw[];

  const { data: ordersRaw } = await svc
    .from("orders")
    .select(
      `customer_id, status, subscription_id, total_chf, placed_at,
       items:order_items(quantity, unit_price_chf, wholesale_price_chf)`
    )
    .in("status", ["paid", "processing", "shipped", "delivered"]);

  type OrderRaw = {
    customer_id: string;
    status: string;
    subscription_id: string | null;
    total_chf: number;
    placed_at: string;
    items: Array<{
      quantity: number;
      unit_price_chf: number;
      wholesale_price_chf: number | null;
    }>;
  };
  const orders = (ordersRaw ?? []) as OrderRaw[];

  const { data: subsRaw } = await svc
    .from("subscriptions")
    .select("customer_id, status");
  type SubRaw = { customer_id: string; status: string };
  const activeSubsByCustomer = new Set(
    ((subsRaw ?? []) as SubRaw[])
      .filter((s) => s.status === "active")
      .map((s) => s.customer_id)
  );

  const { data: typesRaw } = await svc
    .from("taste_types")
    .select("id, name_de");
  type TypeRaw = { id: number; name_de: string };
  const typeName = new Map(
    ((typesRaw ?? []) as TypeRaw[]).map((t) => [t.id, t.name_de])
  );

  type Agg = {
    revenue: number;
    margin: number;
    orderCount: number;
    lastOrderAt: string | null;
  };
  const aggBy = new Map<string, Agg>();
  for (const o of orders) {
    const cur = aggBy.get(o.customer_id) ?? {
      revenue: 0,
      margin: 0,
      orderCount: 0,
      lastOrderAt: null,
    };
    cur.revenue += Number(o.total_chf);
    cur.margin += o.items.reduce((s, it) => {
      const w =
        it.wholesale_price_chf == null ? 0 : Number(it.wholesale_price_chf);
      return s + (Number(it.unit_price_chf) - w) * it.quantity;
    }, 0);
    cur.orderCount += 1;
    if (!cur.lastOrderAt || o.placed_at > cur.lastOrderAt) {
      cur.lastOrderAt = o.placed_at;
    }
    aggBy.set(o.customer_id, cur);
  }

  const rows: CustomerRow[] = customers.map((c) => {
    const agg = aggBy.get(c.id);
    const fullName =
      `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || "—";
    return {
      id: c.id,
      first_name: c.first_name ?? "",
      last_name: c.last_name ?? "",
      full_name: fullName,
      email: c.email,
      created_at: new Date(c.created_at).toLocaleDateString("de-CH"),
      taste_type_id: c.taste_type_id,
      taste_type_name: c.taste_type_id
        ? typeName.get(c.taste_type_id) ?? "—"
        : null,
      marketing_opt_in: c.marketing_opt_in,
      has_abo: activeSubsByCustomer.has(c.id),
      order_count: agg?.orderCount ?? 0,
      revenue_chf: agg?.revenue ?? 0,
      margin_chf: agg?.margin ?? 0,
      clv_chf: agg?.revenue ?? 0,
      last_order_at: agg?.lastOrderAt
        ? new Date(agg.lastOrderAt).toLocaleDateString("de-CH")
        : null,
    };
  });

  const totalRevenue = rows.reduce((s, r) => s + r.revenue_chf, 0);
  const totalMargin = rows.reduce((s, r) => s + r.margin_chf, 0);
  const totalActiveAbos = rows.filter((r) => r.has_abo).length;
  const buyers = rows.filter((r) => r.order_count > 0).length;
  const avgClv = buyers > 0 ? totalRevenue / buyers : 0;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-headline font-bold text-3xl md:text-4xl text-primary uppercase tracking-tight">
          Kunden
        </h1>
        <p className="text-on-surface-variant mt-2">
          {rows.length} Kunden · {buyers} mit Bestellung · {totalActiveAbos} mit
          aktivem Abo · Ø CLV CHF {fmtChf(avgClv)}
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Kunden total" value={String(rows.length)} />
        <Kpi label="Mit Bestellung" value={String(buyers)} />
        <Kpi label="Total Umsatz" value={`CHF ${fmtChf(totalRevenue)}`} />
        <Kpi label="Total Marge" value={`CHF ${fmtChf(totalMargin)}`} />
      </section>

      <CustomersTable rows={rows} />

      <Link
        href="/admin/dashboard"
        className="font-headline text-[11px] uppercase tracking-[0.2em] text-tertiary hover:text-primary transition-colors border-b-2 border-tertiary pb-1 inline-block"
      >
        ← Dashboard
      </Link>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-5 shadow-sm">
      <p className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">
        {label}
      </p>
      <p className="font-headline font-bold text-xl md:text-2xl text-primary">
        {value}
      </p>
    </div>
  );
}
