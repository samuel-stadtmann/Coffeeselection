import { createServiceClient } from "@/lib/supabase/service";

/**
 * Lädt KPIs pro Rösterei: Bestellungen + Umsatz + Marge.
 *
 * Definition:
 *   - Umsatz   = SUM(order_items.line_total_chf) für orders mit status
 *                in (paid, processing, shipped, delivered)
 *   - Wareneinsatz = SUM(order_items.wholesale_price_chf * quantity)
 *                    falls wholesale gesetzt; sonst 0
 *   - Marge    = Umsatz - Wareneinsatz (in CHF)
 *   - Marge_pct = Marge / Umsatz × 100 (gerundet auf 1 Dezimalstelle)
 *   - Bestellungen = COUNT(DISTINCT order_id) mit mind. einer Position
 *                    aus dieser Rösterei
 *
 * Performance: 1 Roundtrip — wir holen alle relevanten order_items mit JOIN
 * auf coffees(roaster_id) und aggregieren clientseitig (JS). Bei wenigen
 * tausend orders ist das auf Supabase Free unbedenklich; ab 50k+ würde
 * man's in eine DB-Funktion verschieben.
 */

export type RoasterKPI = {
  orders: number;
  revenue_chf: number;
  cogs_chf: number;
  margin_chf: number;
  margin_pct: number | null; // null wenn kein Umsatz
};

const COUNTING_STATUSES = ["paid", "processing", "shipped", "delivered"];

export async function loadRoasterKPIs(): Promise<Map<string, RoasterKPI>> {
  const sb = createServiceClient();

  // 1) order_items joined mit orders.status + coffees.roaster_id holen
  const { data, error } = await sb
    .from("order_items")
    .select(
      "order_id, quantity, line_total_chf, wholesale_price_chf, coffee:coffees!inner(roaster_id), order:orders!inner(status)"
    );

  if (error || !data) return new Map();

  // 2) Filter auf zählende Status + aggregieren
  type Row = {
    order_id: string;
    quantity: number;
    line_total_chf: number | null;
    wholesale_price_chf: number | null;
    coffee: { roaster_id: string } | { roaster_id: string }[] | null;
    order: { status: string } | { status: string }[] | null;
  };

  const acc = new Map<string, { orderIds: Set<string>; revenue: number; cogs: number }>();

  for (const r of data as Row[]) {
    const o = Array.isArray(r.order) ? r.order[0] : r.order;
    if (!o || !COUNTING_STATUSES.includes(o.status)) continue;
    const c = Array.isArray(r.coffee) ? r.coffee[0] : r.coffee;
    if (!c?.roaster_id) continue;
    const roasterId = c.roaster_id;

    let cur = acc.get(roasterId);
    if (!cur) {
      cur = { orderIds: new Set(), revenue: 0, cogs: 0 };
      acc.set(roasterId, cur);
    }
    cur.orderIds.add(r.order_id);
    cur.revenue += Number(r.line_total_chf ?? 0);
    if (r.wholesale_price_chf != null) {
      cur.cogs += Number(r.wholesale_price_chf) * (r.quantity ?? 1);
    }
  }

  // 3) Map nach RoasterKPI konvertieren
  const out = new Map<string, RoasterKPI>();
  for (const [roasterId, agg] of acc.entries()) {
    const margin = agg.revenue - agg.cogs;
    out.set(roasterId, {
      orders: agg.orderIds.size,
      revenue_chf: round2(agg.revenue),
      cogs_chf: round2(agg.cogs),
      margin_chf: round2(margin),
      margin_pct: agg.revenue > 0 ? round1((margin / agg.revenue) * 100) : null,
    });
  }
  return out;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export const EMPTY_KPI: RoasterKPI = {
  orders: 0,
  revenue_chf: 0,
  cogs_chf: 0,
  margin_chf: 0,
  margin_pct: null,
};

export function formatCHF(amount: number): string {
  return new Intl.NumberFormat("de-CH", {
    style: "currency",
    currency: "CHF",
    maximumFractionDigits: 0,
  }).format(amount);
}
