import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import MarketingForm from "./MarketingForm";
import MarketingRow from "./MarketingRow";

export const metadata: Metadata = {
  title: "Admin · Marketing — Coffee Selection",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SpendRow = {
  id: string;
  category: string;
  name: string;
  description: string | null;
  budget_chf: number;
  spent_chf: number;
  starts_at: string;
  ends_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  social_media: "Social Media",
  paid_ads: "Paid Ads",
  influencer: "Influencer",
  pr_editorial: "PR & Editorial",
  event_sponsoring: "Event/Sponsoring",
  print: "Print",
  seo_content: "SEO & Content",
  email_marketing: "Email-Marketing",
  other: "Andere",
};

function fmtChf(n: number): string {
  return n.toLocaleString("de-CH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default async function AdminMarketingPage() {
  const svc = createServiceClient();
  const { data } = await svc
    .from("marketing_spend")
    .select(
      "id, category, name, description, budget_chf, spent_chf, starts_at, ends_at, metadata, created_at"
    )
    .is("deleted_at", null)
    .order("starts_at", { ascending: false });
  const rows = (data ?? []) as SpendRow[];

  const totalBudget = rows.reduce((s, r) => s + Number(r.budget_chf), 0);
  const totalSpent = rows.reduce((s, r) => s + Number(r.spent_chf), 0);
  const overBudget = rows.filter(
    (r) => Number(r.spent_chf) > Number(r.budget_chf)
  ).length;

  // Per-Kategorie-Aggregat fuer KPI-Cards
  const byCategory = new Map<string, { budget: number; spent: number }>();
  for (const r of rows) {
    const cur = byCategory.get(r.category) ?? { budget: 0, spent: 0 };
    cur.budget += Number(r.budget_chf);
    cur.spent += Number(r.spent_chf);
    byCategory.set(r.category, cur);
  }
  const categoryRows = Array.from(byCategory.entries())
    .map(([cat, v]) => ({
      cat,
      label: CATEGORY_LABELS[cat] ?? cat,
      budget: Number(v.budget.toFixed(2)),
      spent: Number(v.spent.toFixed(2)),
    }))
    .sort((a, b) => b.spent - a.spent);

  return (
    <div className="space-y-12">
      <header>
        <h1 className="font-headline font-bold text-3xl md:text-4xl text-primary uppercase tracking-tight">
          Marketing
        </h1>
        <p className="text-on-surface-variant mt-2">
          Eigene Marketing-Aktivitäten + Budgets. Fliesst in CAC-Berechnung
          im Dashboard.
        </p>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 shadow-sm">
          <p className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">
            Aktivitäten
          </p>
          <p className="font-headline font-bold text-xl text-primary">
            {rows.length}
          </p>
        </div>
        <div className="bg-white p-5 shadow-sm">
          <p className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">
            Budget Total
          </p>
          <p className="font-headline font-bold text-xl text-primary">
            CHF {fmtChf(totalBudget)}
          </p>
        </div>
        <div className="bg-white p-5 shadow-sm">
          <p className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">
            Effektiv ausgegeben
          </p>
          <p className="font-headline font-bold text-xl text-primary">
            CHF {fmtChf(totalSpent)}
          </p>
        </div>
        <div className="bg-white p-5 shadow-sm">
          <p className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">
            Über Budget
          </p>
          <p className="font-headline font-bold text-xl text-primary">
            {overBudget}
          </p>
        </div>
      </section>

      {/* Form + List */}
      <section className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        <div className="bg-white p-6 md:p-8 shadow-sm">
          <h2 className="font-headline font-bold text-lg text-primary uppercase tracking-tight mb-6">
            Aktivitäten ({rows.length})
          </h2>
          {rows.length === 0 ? (
            <p className="text-sm text-on-surface-variant">
              Noch keine Marketing-Aktivitäten erfasst. Lege rechts eine an.
            </p>
          ) : (
            <div className="divide-y divide-surface-container">
              {rows.map((r) => (
                <MarketingRow
                  key={r.id}
                  spend={{
                    id: r.id,
                    category: r.category,
                    categoryLabel: CATEGORY_LABELS[r.category] ?? r.category,
                    name: r.name,
                    description: r.description,
                    budget_chf: Number(r.budget_chf),
                    spent_chf: Number(r.spent_chf),
                    starts_at: r.starts_at,
                    ends_at: r.ends_at,
                  }}
                />
              ))}
            </div>
          )}
        </div>
        <div className="bg-white p-6 md:p-8 shadow-sm h-fit">
          <h2 className="font-headline font-bold text-lg text-primary uppercase tracking-tight mb-6">
            Neue Aktivität
          </h2>
          <MarketingForm categories={CATEGORY_LABELS} />
        </div>
      </section>

      {/* Per-Kategorie */}
      <section className="bg-white p-6 md:p-8 shadow-sm">
        <h2 className="font-headline font-bold text-lg text-primary uppercase tracking-tight mb-6">
          Aufteilung nach Kanal
        </h2>
        {categoryRows.length === 0 ? (
          <p className="text-sm text-on-surface-variant">
            Noch keine Aktivitäten.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                <tr>
                  <th className="text-left py-2">Kanal</th>
                  <th className="text-right py-2">Budget</th>
                  <th className="text-right py-2">Ausgegeben</th>
                  <th className="text-right py-2">Anteil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {categoryRows.map((r) => (
                  <tr key={r.cat}>
                    <td className="py-2 font-headline text-primary uppercase tracking-tight text-xs">
                      {r.label}
                    </td>
                    <td className="py-2 text-right">{fmtChf(r.budget)}</td>
                    <td className="py-2 text-right font-headline font-bold text-primary">
                      {fmtChf(r.spent)}
                    </td>
                    <td className="py-2 text-right text-tertiary font-headline font-bold">
                      {totalSpent > 0
                        ? Math.round((r.spent / totalSpent) * 100)
                        : 0}{" "}
                      %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
