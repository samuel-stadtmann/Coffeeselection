import Link from "next/link";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import {
  loadRoasterKPIs,
  EMPTY_KPI,
  formatCHF,
  type RoasterKPI,
} from "@/lib/admin/roaster-kpis";

export const metadata: Metadata = {
  title: "Admin · Röster — Coffee Selection",
  robots: { index: false, follow: false },
};

type Roaster = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  status: string;
  user_count?: number;
  coffee_count?: number;
  kpi?: RoasterKPI;
};

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  onboarding: { label: "Onboarding", cls: "bg-amber-100 text-amber-900" },
  active: { label: "Aktiv", cls: "bg-emerald-100 text-emerald-800" },
  paused: { label: "Pausiert", cls: "bg-stone-100 text-stone-700" },
  inactive: { label: "Inaktiv", cls: "bg-rose-100 text-rose-900" },
};

export default async function AdminRoastersPage() {
  const sb = createServiceClient();
  const [{ data: roasters }, { data: users }, { data: coffees }, kpis] = await Promise.all([
    sb
      .from("roasters")
      .select("id, slug, name, city, status")
      .is("deleted_at", null)
      .order("name"),
    sb.from("roaster_users").select("roaster_id"),
    sb.from("coffees").select("roaster_id").is("deleted_at", null),
    loadRoasterKPIs(),
  ]);

  const userCount = new Map<string, number>();
  (users ?? []).forEach((u: { roaster_id: string }) => {
    userCount.set(u.roaster_id, (userCount.get(u.roaster_id) ?? 0) + 1);
  });

  const coffeeCount = new Map<string, number>();
  (coffees ?? []).forEach((c: { roaster_id: string }) => {
    coffeeCount.set(c.roaster_id, (coffeeCount.get(c.roaster_id) ?? 0) + 1);
  });

  const rows = ((roasters ?? []) as Roaster[]).map((r) => ({
    ...r,
    user_count: userCount.get(r.id) ?? 0,
    coffee_count: coffeeCount.get(r.id) ?? 0,
    kpi: kpis.get(r.id) ?? EMPTY_KPI,
  }));

  // Totale für Header-Stats
  const totalRevenue = rows.reduce((s, r) => s + (r.kpi?.revenue_chf ?? 0), 0);
  const totalOrders = rows.reduce((s, r) => s + (r.kpi?.orders ?? 0), 0);
  const totalMargin = rows.reduce((s, r) => s + (r.kpi?.margin_chf ?? 0), 0);

  return (
    <>
      <div className="flex justify-between items-end mb-8 gap-4 flex-wrap">
        <div>
          <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
            Partner · Verwaltung
          </span>
          <h1 className="text-4xl md:text-5xl text-primary uppercase tracking-tight font-headline font-bold mb-2">
            Röster
          </h1>
          <p className="text-on-surface-variant text-sm max-w-2xl">
            {rows.length} Röster im System ·{" "}
            {rows.filter((r) => (r.user_count ?? 0) > 0).length} mit Portal-Zugang ·{" "}
            {totalOrders} Bestellungen insgesamt.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/admin/roasters/payouts"
            className="border border-primary text-primary px-6 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all"
          >
            Auszahlungs-Report
          </Link>
          <Link
            href="/admin/roasters/new"
            className="bg-primary text-on-primary px-6 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all"
          >
            + Neue Rösterei
          </Link>
        </div>
      </div>

      {/* KPI-Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white shadow-sm p-6">
          <div className="font-headline text-[10px] uppercase tracking-widest font-bold text-tertiary mb-2">
            Umsatz total
          </div>
          <div className="text-3xl font-headline font-bold text-primary">
            {formatCHF(totalRevenue)}
          </div>
          <div className="text-xs text-on-surface-variant mt-1">
            Alle Röster, alle Zeiten (bezahlte Bestellungen)
          </div>
        </div>
        <div className="bg-white shadow-sm p-6">
          <div className="font-headline text-[10px] uppercase tracking-widest font-bold text-tertiary mb-2">
            Marge total
          </div>
          <div className="text-3xl font-headline font-bold text-emerald-700">
            {formatCHF(totalMargin)}
          </div>
          <div className="text-xs text-on-surface-variant mt-1">
            Umsatz − Wareneinsatz (wo wholesale_price_chf gesetzt)
          </div>
        </div>
        <div className="bg-white shadow-sm p-6">
          <div className="font-headline text-[10px] uppercase tracking-widest font-bold text-tertiary mb-2">
            Bestellungen
          </div>
          <div className="text-3xl font-headline font-bold text-primary">{totalOrders}</div>
          <div className="text-xs text-on-surface-variant mt-1">
            Status: paid/processing/shipped/delivered
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left font-headline text-[10px] uppercase tracking-widest text-tertiary border-b border-primary/10 bg-surface-container-low">
            <tr>
              <th className="px-4 py-3 font-bold">Rösterei</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3 font-bold text-right">Coffees</th>
              <th className="px-4 py-3 font-bold text-right">Bestellungen</th>
              <th className="px-4 py-3 font-bold text-right">Umsatz</th>
              <th className="px-4 py-3 font-bold text-right">Marge</th>
              <th className="px-4 py-3 font-bold text-right">Portal-User</th>
              <th className="px-4 py-3 font-bold text-right">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const statusInfo = STATUS_LABEL[r.status] ?? {
                label: r.status,
                cls: "bg-stone-100",
              };
              const kpi = r.kpi ?? EMPTY_KPI;
              return (
                <tr key={r.id} className="border-b border-primary/5 align-middle">
                  <td className="px-4 py-3 font-bold">
                    {r.name}
                    {r.city && (
                      <div className="text-[10px] text-on-surface-variant font-normal">
                        {r.city}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "font-headline text-[10px] uppercase tracking-widest font-bold px-2 py-1 " +
                        statusInfo.cls
                      }
                    >
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-on-surface-variant">
                    {r.coffee_count}
                  </td>
                  <td className="px-4 py-3 text-right">{kpi.orders}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {kpi.revenue_chf > 0 ? formatCHF(kpi.revenue_chf) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {kpi.margin_chf > 0 ? (
                      <>
                        <div className="text-emerald-700">{formatCHF(kpi.margin_chf)}</div>
                        {kpi.margin_pct != null && (
                          <div className="text-[10px] text-on-surface-variant">
                            {kpi.margin_pct}%
                          </div>
                        )}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={
                        "font-headline text-[10px] uppercase tracking-widest font-bold px-2 py-1 " +
                        ((r.user_count ?? 0) === 0
                          ? "bg-stone-100 text-stone-700"
                          : "bg-emerald-100 text-emerald-800")
                      }
                    >
                      {r.user_count}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link
                      href={`/admin/roasters/${r.id}/edit`}
                      className="font-headline text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 bg-stone-100 text-stone-700 hover:bg-stone-200 inline-block mr-2"
                    >
                      Bearbeiten
                    </Link>
                    <Link
                      href={`/admin/roasters/${r.id}/users`}
                      className="font-headline text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 bg-primary text-on-primary hover:bg-black inline-block"
                    >
                      User verwalten
                    </Link>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-on-surface-variant italic"
                >
                  Noch keine Röster im System. Klick „+ Neue Rösterei" oben.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-on-surface-variant mt-8">
        <strong>Hinweis:</strong> Marge wird nur dort berechnet, wo der
        <code> wholesale_price_chf</code> beim Coffee erfasst ist. Wenn ein
        Coffee ohne Einkaufspreis verkauft wird, fließt der Umsatz in „Umsatz"
        ein, aber nicht in „Marge".
      </p>
    </>
  );
}
