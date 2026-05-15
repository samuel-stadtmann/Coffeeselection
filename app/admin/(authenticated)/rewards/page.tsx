import Link from "next/link";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import CampaignForm from "./CampaignForm";
import CampaignRow from "./CampaignRow";

export const metadata: Metadata = {
  title: "Admin · Rewards — Coffee Selection",
  robots: { index: false, follow: false },
};

type Campaign = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  credit_chf: number;
  max_uses_per_customer: number;
  max_total_uses: number | null;
  current_uses: number;
  valid_from: string;
  valid_until: string | null;
  active: boolean;
  channel: string | null;
};

type CreditAggRow = {
  reason: string;
  total: number;
  count: number;
};

type TopCustomerRow = {
  customer_id: string;
  customer_name: string;
  email: string;
  total_credited: number;
  total_redeemed: number;
  balance: number;
};

export const dynamic = "force-dynamic";

export default async function AdminRewardsPage() {
  const svc = createServiceClient();

  // Kampagnen
  const { data: campaignsRaw } = await svc
    .from("marketing_campaigns")
    .select(
      "id, code, name, description, credit_chf, max_uses_per_customer, max_total_uses, current_uses, valid_from, valid_until, active, channel"
    )
    .order("created_at", { ascending: false });
  const campaigns = (campaignsRaw ?? []) as Campaign[];

  // Aggregat pro Reason
  const { data: allCredits } = await svc
    .from("customer_credits")
    .select("reason, amount_chf");
  const agg = new Map<string, { total: number; count: number }>();
  ((allCredits ?? []) as Array<{ reason: string; amount_chf: number }>).forEach((r) => {
    const cur = agg.get(r.reason) ?? { total: 0, count: 0 };
    cur.total += Number(r.amount_chf);
    cur.count += 1;
    agg.set(r.reason, cur);
  });
  const byReason: CreditAggRow[] = Array.from(agg.entries())
    .map(([reason, v]) => ({ reason, total: Number(v.total.toFixed(2)), count: v.count }))
    .sort((a, b) => Math.abs(b.total) - Math.abs(a.total));

  const totalPaid = byReason
    .filter((r) => r.total > 0)
    .reduce((s, r) => s + r.total, 0);
  const totalRedeemed = Math.abs(
    byReason.filter((r) => r.total < 0).reduce((s, r) => s + r.total, 0)
  );
  const outstanding = totalPaid - totalRedeemed;

  // Top-Kunden nach Brutto-Credits (ohne Verbrauch)
  const { data: topRaw } = await svc
    .from("customer_credits")
    .select("customer_id, amount_chf, customer:customers(first_name, last_name, email)")
    .gt("amount_chf", 0);
  const customerAgg = new Map<string, { name: string; email: string; credited: number; redeemed: number }>();
  type CreditRowRaw = {
    customer_id: string;
    amount_chf: number;
    customer:
      | { first_name: string | null; last_name: string | null; email: string }
      | { first_name: string | null; last_name: string | null; email: string }[]
      | null;
  };
  ((topRaw ?? []) as CreditRowRaw[]).forEach((r) => {
    const c = Array.isArray(r.customer) ? r.customer[0] : r.customer;
    const name = `${c?.first_name ?? ""} ${c?.last_name ?? ""}`.trim() || c?.email || "—";
    const cur = customerAgg.get(r.customer_id) ?? {
      name,
      email: c?.email ?? "",
      credited: 0,
      redeemed: 0,
    };
    cur.credited += Number(r.amount_chf);
    customerAgg.set(r.customer_id, cur);
  });
  // Verbrauch dazu (negativ)
  const { data: negRaw } = await svc
    .from("customer_credits")
    .select("customer_id, amount_chf")
    .lt("amount_chf", 0);
  ((negRaw ?? []) as Array<{ customer_id: string; amount_chf: number }>).forEach((r) => {
    const cur = customerAgg.get(r.customer_id);
    if (cur) cur.redeemed += Math.abs(Number(r.amount_chf));
  });
  const topCustomers: TopCustomerRow[] = Array.from(customerAgg.entries())
    .map(([customer_id, v]) => ({
      customer_id,
      customer_name: v.name,
      email: v.email,
      total_credited: Number(v.credited.toFixed(2)),
      total_redeemed: Number(v.redeemed.toFixed(2)),
      balance: Number((v.credited - v.redeemed).toFixed(2)),
    }))
    .sort((a, b) => b.total_credited - a.total_credited)
    .slice(0, 10);

  return (
    <div className="space-y-12">
      <header>
        <h1 className="font-headline font-bold text-3xl md:text-4xl text-primary uppercase tracking-tight">
          Rewards
        </h1>
        <p className="text-on-surface-variant mt-2">
          Marketing-Kampagnen, Guthaben-Auszahlungen und Top-Kunden.
        </p>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total gutgeschrieben", value: `CHF ${totalPaid.toFixed(2)}` },
          { label: "Davon eingelöst", value: `CHF ${totalRedeemed.toFixed(2)}` },
          { label: "Ausstehend (Verpflichtung)", value: `CHF ${outstanding.toFixed(2)}` },
        ].map((k) => (
          <div key={k.label} className="bg-white p-6 shadow-sm">
            <p className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">
              {k.label}
            </p>
            <p className="font-headline font-bold text-3xl text-primary">{k.value}</p>
          </div>
        ))}
      </section>

      {/* Kampagnen-Liste + Form */}
      <section className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        <div className="bg-white p-6 md:p-8 shadow-sm">
          <h2 className="font-headline font-bold text-lg text-primary uppercase tracking-tight mb-6">
            Marketing-Kampagnen ({campaigns.length})
          </h2>
          {campaigns.length === 0 ? (
            <p className="text-sm text-on-surface-variant">
              Noch keine Kampagnen. Lege rechts eine an.
            </p>
          ) : (
            <div className="divide-y divide-surface-container">
              {campaigns.map((c) => (
                <CampaignRow key={c.id} campaign={c} />
              ))}
            </div>
          )}
        </div>
        <div className="bg-white p-6 md:p-8 shadow-sm h-fit">
          <h2 className="font-headline font-bold text-lg text-primary uppercase tracking-tight mb-6">
            Neue Kampagne
          </h2>
          <CampaignForm />
        </div>
      </section>

      {/* Aggregat pro Reason */}
      <section className="bg-white p-6 md:p-8 shadow-sm">
        <h2 className="font-headline font-bold text-lg text-primary uppercase tracking-tight mb-6">
          Auszahlungen nach Grund
        </h2>
        {byReason.length === 0 ? (
          <p className="text-sm text-on-surface-variant">Noch keine Buchungen.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                <tr>
                  <th className="text-left py-2">Grund</th>
                  <th className="text-right py-2">Anzahl</th>
                  <th className="text-right py-2">Summe CHF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {byReason.map((r) => (
                  <tr key={r.reason}>
                    <td className="py-2 font-headline text-primary uppercase tracking-tight text-xs">
                      {r.reason}
                    </td>
                    <td className="py-2 text-right">{r.count}</td>
                    <td
                      className={`py-2 text-right font-headline font-bold ${
                        r.total >= 0 ? "text-tertiary" : "text-on-surface-variant"
                      }`}
                    >
                      {r.total >= 0 ? "+" : ""}
                      {r.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Top-Kunden */}
      <section className="bg-white p-6 md:p-8 shadow-sm">
        <h2 className="font-headline font-bold text-lg text-primary uppercase tracking-tight mb-6">
          Top-Kunden nach Credits
        </h2>
        {topCustomers.length === 0 ? (
          <p className="text-sm text-on-surface-variant">Noch keine Daten.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                <tr>
                  <th className="text-left py-2">Kunde</th>
                  <th className="text-right py-2">Gutgeschrieben</th>
                  <th className="text-right py-2">Eingelöst</th>
                  <th className="text-right py-2">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {topCustomers.map((c) => (
                  <tr key={c.customer_id}>
                    <td className="py-2">
                      <div className="font-headline font-bold text-primary uppercase tracking-tight text-xs">
                        {c.customer_name}
                      </div>
                      <div className="text-[10px] text-on-surface-variant">{c.email}</div>
                    </td>
                    <td className="py-2 text-right text-tertiary font-headline font-bold">
                      {c.total_credited.toFixed(2)}
                    </td>
                    <td className="py-2 text-right text-on-surface-variant">
                      {c.total_redeemed.toFixed(2)}
                    </td>
                    <td className="py-2 text-right font-headline font-bold text-primary">
                      {c.balance.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Link
        href="/admin/metrics"
        className="font-headline text-[11px] uppercase tracking-[0.2em] text-tertiary hover:text-primary transition-colors border-b-2 border-tertiary pb-1 inline-block"
      >
        ← Zu den Metriken
      </Link>
    </div>
  );
}
