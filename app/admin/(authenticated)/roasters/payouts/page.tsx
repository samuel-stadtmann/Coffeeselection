import Link from "next/link";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";

export const metadata: Metadata = {
  title: "Admin · Röster-Auszahlungen — Coffee Selection",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function fmtChf(n: number): string {
  return n.toLocaleString("de-CH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Monats-Fenster aus ?month=YYYY-MM ableiten (default: laufender Monat).
function monthWindow(monthParam: string | undefined): {
  label: string;
  ym: string;
  startIso: string;
  endIso: string;
} {
  const now = new Date();
  let year = now.getUTCFullYear();
  let month = now.getUTCMonth(); // 0-based
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    year = y;
    month = m - 1;
  }
  const start = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0));
  const ym = `${year}-${String(month + 1).padStart(2, "0")}`;
  const label = start.toLocaleDateString("de-CH", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return { label, ym, startIso: start.toISOString(), endIso: end.toISOString() };
}

// Vorige/naechste Monats-Strings fuer Navigation.
function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

type PayoutRow = {
  roaster_id: string;
  roaster_name: string;
  items_sold: number;
  wholesale_total: number; // an Roester auszuzahlen
  retail_total: number; // unser Umsatz mit dessen Coffees
  margin_total: number;
  iban: string | null;
  bank_account_holder: string | null;
  payout_threshold_chf: number;
  ready: boolean; // IBAN vorhanden + ueber Threshold
};

export default async function RoasterPayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const win = monthWindow(month);
  const svc = createServiceClient();

  // Alle bezahlten Order-Items im Monat, mit Coffee→Roaster-Join.
  // Wir filtern auf orders.paid_at im Monatsfenster + Status bezahlt.
  const { data: itemsRaw } = await svc
    .from("order_items")
    .select(
      `quantity, weight_g, unit_price_chf, wholesale_price_chf,
       coffee:coffees(id, roaster:roasters(id, name)),
       order:orders!inner(status, paid_at)`
    )
    .gte("order.paid_at", win.startIso)
    .lt("order.paid_at", win.endIso)
    .in("order.status", ["paid", "processing", "shipped", "delivered"]);

  type ItemRow = {
    quantity: number;
    weight_g: number;
    unit_price_chf: number;
    wholesale_price_chf: number | null;
    coffee:
      | { id: string; roaster: { id: string; name: string } | { id: string; name: string }[] | null }
      | { id: string; roaster: { id: string; name: string } | { id: string; name: string }[] | null }[]
      | null;
  };
  const items = (itemsRaw ?? []) as unknown as ItemRow[];

  // Pro Roester aggregieren.
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
    const wholesale = it.wholesale_price_chf == null ? 0 : Number(it.wholesale_price_chf);
    const retail = Number(it.unit_price_chf);
    cur.items += qty;
    cur.wholesale += wholesale * qty;
    cur.retail += retail * qty;
    agg.set(roaster.id, cur);
  }

  // Payout-Stammdaten (IBAN, Threshold) der betroffenen Roester nachladen.
  const roasterIds = Array.from(agg.keys());
  const payoutById = new Map<
    string,
    { iban: string | null; holder: string | null; threshold: number }
  >();
  if (roasterIds.length > 0) {
    const { data: payouts } = await svc
      .from("roasters_payout")
      .select("roaster_id, iban, bank_account_holder, payout_threshold_chf")
      .in("roaster_id", roasterIds);
    for (const p of payouts ?? []) {
      payoutById.set(p.roaster_id as string, {
        iban: (p.iban as string | null) ?? null,
        holder: (p.bank_account_holder as string | null) ?? null,
        threshold: Number(p.payout_threshold_chf ?? 0),
      });
    }
  }

  const rows: PayoutRow[] = Array.from(agg.entries())
    .map(([roaster_id, v]) => {
      const payout = payoutById.get(roaster_id);
      const wholesale = Number(v.wholesale.toFixed(2));
      const threshold = payout?.threshold ?? 0;
      return {
        roaster_id,
        roaster_name: v.name,
        items_sold: v.items,
        wholesale_total: wholesale,
        retail_total: Number(v.retail.toFixed(2)),
        margin_total: Number((v.retail - v.wholesale).toFixed(2)),
        iban: payout?.iban ?? null,
        bank_account_holder: payout?.holder ?? null,
        payout_threshold_chf: threshold,
        ready: !!payout?.iban && wholesale >= threshold,
      };
    })
    .sort((a, b) => b.wholesale_total - a.wholesale_total);

  const totalWholesale = rows.reduce((s, r) => s + r.wholesale_total, 0);
  const totalRetail = rows.reduce((s, r) => s + r.retail_total, 0);
  const totalMargin = rows.reduce((s, r) => s + r.margin_total, 0);
  const missingIban = rows.filter((r) => !r.iban).length;

  return (
    <div className="space-y-8">
      <header>
        <Link
          href="/admin/roasters"
          className="font-headline text-[11px] uppercase tracking-widest text-tertiary hover:text-primary inline-block mb-3"
        >
          ← Zurück zu Röster
        </Link>
        <h1 className="font-headline font-bold text-3xl md:text-4xl text-primary uppercase tracking-tight">
          Röster-Auszahlungen
        </h1>
        <p className="text-on-surface-variant mt-2">
          Reseller-Modell: pro Röster der fällige Wholesale-Betrag aus
          bezahlten Bestellungen des Monats. Das ist der Betrag, den ihr dem
          Röster gegen seine Lieferanten-Rechnung überweist.
        </p>
      </header>

      {/* Monats-Navigation */}
      <div className="flex items-center gap-4 flex-wrap">
        <Link
          href={`/admin/roasters/payouts?month=${shiftMonth(win.ym, -1)}`}
          className="font-headline text-[11px] uppercase tracking-widest text-tertiary hover:text-primary"
        >
          ← Vormonat
        </Link>
        <span className="font-headline font-bold text-primary uppercase tracking-tight">
          {win.label}
        </span>
        <Link
          href={`/admin/roasters/payouts?month=${shiftMonth(win.ym, 1)}`}
          className="font-headline text-[11px] uppercase tracking-widest text-tertiary hover:text-primary"
        >
          Folgemonat →
        </Link>
        <a
          href={`/api/admin/roasters/payouts.csv?month=${win.ym}`}
          className="ml-auto bg-primary text-on-primary px-4 py-2 font-headline font-bold text-[11px] uppercase tracking-widest hover:bg-black transition-all"
        >
          CSV-Export
        </a>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Auszuzahlen (Wholesale)" value={`CHF ${fmtChf(totalWholesale)}`} />
        <Kpi label="Umsatz (Retail)" value={`CHF ${fmtChf(totalRetail)}`} />
        <Kpi label="Eure Marge" value={`CHF ${fmtChf(totalMargin)}`} />
        <Kpi label="Ohne IBAN" value={String(missingIban)} alert={missingIban > 0} />
      </section>

      {/* Tabelle */}
      <section className="bg-white p-6 md:p-8 shadow-sm">
        {rows.length === 0 ? (
          <p className="text-sm text-on-surface-variant">
            Keine bezahlten Bestellungen in diesem Monat.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold border-b border-surface-container">
                <tr>
                  <th className="text-left py-3">Röster</th>
                  <th className="text-right py-3">Stück</th>
                  <th className="text-right py-3">Wholesale</th>
                  <th className="text-right py-3">Retail</th>
                  <th className="text-right py-3">Marge</th>
                  <th className="text-left py-3 pl-4">IBAN</th>
                  <th className="text-center py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {rows.map((r) => (
                  <tr key={r.roaster_id} className="hover:bg-surface-container-low/50">
                    <td className="py-3">
                      <Link
                        href={`/admin/roasters/${r.roaster_id}/edit`}
                        className="font-headline font-bold text-primary uppercase tracking-tight text-xs hover:text-tertiary"
                      >
                        {r.roaster_name}
                      </Link>
                    </td>
                    <td className="py-3 text-right">{r.items_sold}</td>
                    <td className="py-3 text-right font-headline font-bold text-primary">
                      {fmtChf(r.wholesale_total)}
                    </td>
                    <td className="py-3 text-right text-on-surface-variant">
                      {fmtChf(r.retail_total)}
                    </td>
                    <td className="py-3 text-right text-tertiary">
                      {fmtChf(r.margin_total)}
                    </td>
                    <td className="py-3 pl-4 font-mono text-[11px]">
                      {r.iban ?? (
                        <span className="text-rose-600 font-headline uppercase tracking-widest text-[10px] font-bold">
                          fehlt
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 text-[9px] font-headline font-bold uppercase tracking-widest ${
                          r.ready
                            ? "bg-tertiary/20 text-tertiary"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {r.ready ? "Bereit" : r.iban ? "< Schwelle" : "IBAN fehlt"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-primary/20 font-headline font-bold">
                  <td className="py-3 uppercase tracking-tight text-xs">Total</td>
                  <td className="py-3 text-right">
                    {rows.reduce((s, r) => s + r.items_sold, 0)}
                  </td>
                  <td className="py-3 text-right text-primary">
                    {fmtChf(totalWholesale)}
                  </td>
                  <td className="py-3 text-right">{fmtChf(totalRetail)}</td>
                  <td className="py-3 text-right text-tertiary">
                    {fmtChf(totalMargin)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs text-on-surface-variant">
        Hinweis: Wholesale-Betrag basiert auf <code className="bg-surface-container px-1">order_items.wholesale_price_chf</code> (Snapshot
        zum Bestellzeitpunkt). Coffees ohne erfassten Einkaufspreis zählen mit
        0 — pflege fehlende Preise unter <Link href="/admin/coffees/wholesale" className="text-tertiary underline">Einkaufspreise</Link>.
      </p>
    </div>
  );
}

function Kpi({
  label,
  value,
  alert = false,
}: {
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div className="bg-white p-5 shadow-sm">
      <p className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">
        {label}
      </p>
      <p
        className={`font-headline font-bold text-xl md:text-2xl ${
          alert ? "text-rose-600" : "text-primary"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
