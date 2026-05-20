import { NextResponse, type NextRequest } from "next/server";
import { getAdminUser } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * GET /api/admin/roasters/payouts.csv?month=YYYY-MM
 *
 * Monatlicher Röster-Auszahlungs-Report als CSV (Reseller-Modell).
 * Pro Röster: Stückzahl, Wholesale-Total (auszuzahlen), Retail-Total,
 * Marge + Bankdaten für die Überweisung.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvCell(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function monthWindow(monthParam: string | null) {
  const now = new Date();
  let year = now.getUTCFullYear();
  let month = now.getUTCMonth();
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    year = y;
    month = m - 1;
  }
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 1));
  const ym = `${year}-${String(month + 1).padStart(2, "0")}`;
  return { ym, startIso: start.toISOString(), endIso: end.toISOString() };
}

export async function GET(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const win = monthWindow(new URL(req.url).searchParams.get("month"));
  const svc = createServiceClient();

  const { data: itemsRaw, error } = await svc
    .from("order_items")
    .select(
      `quantity, unit_price_chf, wholesale_price_chf,
       coffee:coffees(id, roaster:roasters(id, name)),
       order:orders!inner(status, paid_at)`
    )
    .gte("order.paid_at", win.startIso)
    .lt("order.paid_at", win.endIso)
    .in("order.status", ["paid", "processing", "shipped", "delivered"]);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type ItemRow = {
    quantity: number;
    unit_price_chf: number;
    wholesale_price_chf: number | null;
    coffee:
      | { id: string; roaster: { id: string; name: string } | { id: string; name: string }[] | null }
      | { id: string; roaster: { id: string; name: string } | { id: string; name: string }[] | null }[]
      | null;
  };
  const items = (itemsRaw ?? []) as unknown as ItemRow[];

  const agg = new Map<
    string,
    { name: string; items: number; wholesale: number; retail: number }
  >();
  for (const it of items) {
    const coffee = Array.isArray(it.coffee) ? it.coffee[0] : it.coffee;
    const roaster = coffee
      ? Array.isArray(coffee.roaster)
        ? coffee.roaster[0]
        : coffee.roaster
      : null;
    if (!roaster) continue;
    const cur = agg.get(roaster.id) ?? {
      name: roaster.name,
      items: 0,
      wholesale: 0,
      retail: 0,
    };
    const qty = Number(it.quantity);
    cur.items += qty;
    cur.wholesale +=
      (it.wholesale_price_chf == null ? 0 : Number(it.wholesale_price_chf)) * qty;
    cur.retail += Number(it.unit_price_chf) * qty;
    agg.set(roaster.id, cur);
  }

  const roasterIds = Array.from(agg.keys());
  const payoutById = new Map<
    string,
    { iban: string; holder: string; bic: string; vat: string }
  >();
  if (roasterIds.length > 0) {
    const [{ data: payouts }, { data: roasters }] = await Promise.all([
      svc
        .from("roasters_payout")
        .select("roaster_id, iban, bank_account_holder, bic")
        .in("roaster_id", roasterIds),
      svc.from("roasters").select("id, vat_number, legal_name").in("id", roasterIds),
    ]);
    const vatById = new Map(
      (roasters ?? []).map((r) => [
        r.id as string,
        { vat: (r.vat_number as string | null) ?? "", legal: (r.legal_name as string | null) ?? "" },
      ])
    );
    for (const p of payouts ?? []) {
      const extra = vatById.get(p.roaster_id as string);
      payoutById.set(p.roaster_id as string, {
        iban: (p.iban as string | null) ?? "",
        holder: (p.bank_account_holder as string | null) ?? "",
        bic: (p.bic as string | null) ?? "",
        vat: extra?.vat ?? "",
      });
    }
  }

  const headers = [
    "month",
    "roaster_name",
    "items_sold",
    "wholesale_total_chf",
    "retail_total_chf",
    "margin_chf",
    "iban",
    "account_holder",
    "bic",
    "vat_number",
  ];
  const lines = [headers.join(",")];
  const sorted = Array.from(agg.entries()).sort(
    (a, b) => b[1].wholesale - a[1].wholesale
  );
  for (const [roasterId, v] of sorted) {
    const p = payoutById.get(roasterId);
    lines.push(
      [
        win.ym,
        v.name,
        v.items,
        v.wholesale.toFixed(2),
        v.retail.toFixed(2),
        (v.retail - v.wholesale).toFixed(2),
        p?.iban ?? "",
        p?.holder ?? "",
        p?.bic ?? "",
        p?.vat ?? "",
      ]
        .map(csvCell)
        .join(",")
    );
  }

  const body = lines.join("\n");
  const filename = `roaster-payouts-${win.ym}.csv`;
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
