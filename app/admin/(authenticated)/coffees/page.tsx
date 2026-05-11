import Link from "next/link";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import CoffeeActions from "./CoffeeActions";

export const metadata: Metadata = {
  title: "Admin · Coffees — Coffee Selection",
  robots: { index: false, follow: false },
};

type CoffeeRow = {
  id: string;
  slug: string;
  name: string;
  status: string;
  roast_level: number | null;
  price_chf: number | null;
  weight_g: number | null;
  data_quality_score: number | null;
  data_verified_at: string | null;
  data_verified_by: string | null;
  roaster: { name: string } | { name: string }[] | null;
};

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  draft: { label: "Entwurf", cls: "bg-amber-100 text-amber-900" },
  active: { label: "Live", cls: "bg-emerald-100 text-emerald-800" },
  paused: { label: "Pausiert", cls: "bg-stone-100 text-stone-700" },
  discontinued: { label: "Auslauf", cls: "bg-rose-100 text-rose-900" },
};

export default async function AdminCoffeesPage() {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("coffees")
    .select(
      "id, slug, name, status, roast_level, price_chf, weight_g, data_quality_score, data_verified_at, data_verified_by, roaster:roasters(name)"
    )
    .is("deleted_at", null)
    .order("status", { ascending: true })          // drafts zuerst
    .order("name");

  if (error) {
    return (
      <div className="bg-rose-50 border-l-4 border-rose-400 p-4 text-sm text-rose-900">
        Konnte Coffees nicht laden: {error.message}
      </div>
    );
  }

  const rows = (data ?? []) as CoffeeRow[];
  const drafts = rows.filter((r) => r.status === "draft");
  const others = rows.filter((r) => r.status !== "draft");

  return (
    <>
      <div className="flex justify-between items-end mb-8 gap-4 flex-wrap">
        <div>
          <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
            Sortiment · Freigabe & Verifikation
          </span>
          <h1 className="text-4xl md:text-5xl text-primary uppercase tracking-tight font-headline font-bold mb-2">
            Coffees verwalten
          </h1>
          <p className="text-on-surface-variant text-sm max-w-2xl">
            {rows.length} Coffees insgesamt · {drafts.length} im Entwurf ·
            {" "}{rows.filter((r) => r.status === "active").length} live.
          </p>
        </div>
        <Link
          href="/admin/coffees/new"
          className="bg-primary text-on-primary px-6 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all"
        >
          + Neuer Coffee
        </Link>
      </div>

      {drafts.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-8">
          <p className="text-sm text-amber-900">
            <strong>{drafts.length} Coffee{drafts.length === 1 ? "" : "s"} im Entwurf</strong> —
            review die Daten und gib sie frei (status → active), sobald die
            Qualität stimmt.
          </p>
        </div>
      )}

      <div className="bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left font-headline text-[10px] uppercase tracking-widest text-tertiary border-b border-primary/10 bg-surface-container-low">
            <tr>
              <th className="px-4 py-3 font-bold">Coffee</th>
              <th className="px-4 py-3 font-bold">Röster</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3 font-bold">Qualität</th>
              <th className="px-4 py-3 font-bold">Verifiziert</th>
              <th className="px-4 py-3 font-bold text-right">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {[...drafts, ...others].map((c) => {
              const roaster = Array.isArray(c.roaster) ? c.roaster[0] : c.roaster;
              const verified = Boolean(c.data_verified_at);
              const verifiedDate = c.data_verified_at
                ? new Date(c.data_verified_at).toLocaleDateString("de-CH")
                : null;
              const statusInfo = STATUS_LABEL[c.status] ?? { label: c.status, cls: "bg-stone-100" };
              return (
                <tr key={c.id} className={"border-b border-primary/5 " + (c.status === "draft" ? "bg-amber-50/30" : "")}>
                  <td className="px-4 py-3 font-bold">
                    <Link href={`/coffee/${c.slug}`} className="hover:text-tertiary" target="_blank">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">{roaster?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={"font-headline text-[10px] uppercase tracking-widest font-bold px-2 py-1 " + statusInfo.cls}>
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {c.data_quality_score != null ? c.data_quality_score : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {verified ? (
                      <span className="inline-flex items-center gap-1.5 font-headline text-[10px] uppercase tracking-widest font-bold text-emerald-800 bg-emerald-100 px-2 py-1">
                        ✓ {verifiedDate}
                      </span>
                    ) : (
                      <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant/60">
                        offen
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <CoffeeActions
                      coffeeId={c.id}
                      status={c.status as "draft" | "active" | "paused" | "discontinued"}
                      verified={verified}
                    />
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant italic">
                  Noch keine Coffees. Click „Neuer Coffee" oben.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-on-surface-variant mt-8">
        Workflow: Entwurf → review → Freigeben (status → active) → optional verifizieren (+2 quality).
      </p>
    </>
  );
}
