import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * K3: Marketing-Aufwand-Report als CSV.
 *
 * Liefert alle Redemption-Buchungen (negative customer_credits) mit Datum,
 * Customer, Grund, Kampagne und Betrag — damit Buchhaltung den Aufwand
 * direkt verbuchen kann (Marketing-Spend = Sum der eingeloesten Credits).
 *
 * Keine Datumsfilter im Query-String fuer den ersten Wurf — alles seit
 * Programm-Start. Bei Bedarf spaeter ?since=YYYY-MM-DD ergaenzen.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvCell(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("customer_credits")
    .select(
      `created_at, amount_chf, reason, description, order_id, campaign_id,
       customer:customers(email, first_name, last_name),
       campaign:marketing_campaigns(code, name)`
    )
    .lt("amount_chf", 0)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type Row = {
    created_at: string;
    amount_chf: number;
    reason: string;
    description: string | null;
    order_id: string | null;
    campaign_id: string | null;
    customer:
      | { email: string; first_name: string | null; last_name: string | null }
      | { email: string; first_name: string | null; last_name: string | null }[]
      | null;
    campaign:
      | { code: string; name: string }
      | { code: string; name: string }[]
      | null;
  };
  const rows = (data ?? []) as Row[];

  const headers = [
    "date",
    "customer_email",
    "customer_name",
    "amount_chf_redeemed",
    "reason",
    "campaign_code",
    "campaign_name",
    "order_id",
    "description",
  ];
  const lines = [headers.join(",")];

  for (const r of rows) {
    const cust = Array.isArray(r.customer) ? r.customer[0] : r.customer;
    const camp = Array.isArray(r.campaign) ? r.campaign[0] : r.campaign;
    const name =
      `${cust?.first_name ?? ""} ${cust?.last_name ?? ""}`.trim() || "";
    lines.push(
      [
        new Date(r.created_at).toISOString(),
        cust?.email ?? "",
        name,
        Math.abs(Number(r.amount_chf)).toFixed(2),
        r.reason,
        camp?.code ?? "",
        camp?.name ?? "",
        r.order_id ?? "",
        r.description ?? "",
      ]
        .map(csvCell)
        .join(",")
    );
  }

  const body = lines.join("\n");
  const filename = `redemptions-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
