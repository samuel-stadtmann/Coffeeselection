import Link from "next/link";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import {
  computeQualityScoreFromCoffeeRow,
  topMissingItems,
  type CoffeeRowForScore,
} from "@/lib/coffee/form-helpers";
import CoffeeActions from "./CoffeeActions";
import ScoreFilter from "./ScoreFilter";

export const metadata: Metadata = {
  title: "Admin · Coffees — Coffee Selection",
  robots: { index: false, follow: false },
};

type CoffeeRow = CoffeeRowForScore & {
  id: string;
  slug: string;
  name: string;
  status: string;
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

// Score-Badges visuell konsistent mit Daten-Vollständigkeit im Form.
// 75 ist die Schwelle in get_eligible_coffees → drüber gilt's als "ok",
// 50-74 = nachschauen, < 50 = wahrscheinlich Eingabefehler / unvollständig.
function scoreBadgeClass(score: number | null): string {
  if (score == null) return "bg-stone-100 text-stone-700";
  if (score >= 75) return "bg-emerald-100 text-emerald-800";
  if (score >= 50) return "bg-amber-100 text-amber-900";
  return "bg-rose-100 text-rose-900";
}

function scoreBadgeLabel(score: number | null): string {
  if (score == null) return "—";
  if (score >= 75) return "ok";
  if (score >= 50) return "prüfen";
  return "fehlt";
}

export default async function AdminCoffeesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const onlyBelowThreshold = filter === "below";

  const sb = createServiceClient();
  const { data, error } = await sb
    .from("coffees")
    .select(
      "id, slug, name, status, roast_level, price_chf, weight_g, data_quality_score, data_verified_at, data_verified_by, acidity, body, sweetness, bitterness, complexity, aroma_families, flavor_description, origin_id, region, processing_method_id, variety_id, altitude_m_min, harvest_year, sca_score, is_decaf, flavor_embedding, roaster:roasters(name)"
    )
    .is("deleted_at", null)
    .order("status", { ascending: true })
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
  const needsAttention = rows.filter(
    (r) => (r.data_quality_score ?? 0) < 75 && !r.data_verified_at
  );
  const filtered = onlyBelowThreshold
    ? rows.filter((r) => (r.data_quality_score ?? 0) < 75 && !r.data_verified_at)
    : rows;
  const draftsToShow = filtered.filter((r) => r.status === "draft");
  const othersToShow = filtered.filter((r) => r.status !== "draft");

  return (
    <>
      <div className="flex justify-between items-end mb-8 gap-4 flex-wrap">
        <div>
          <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
            Sortiment · Score-driven Freigabe
          </span>
          <h1 className="text-4xl md:text-5xl text-primary uppercase tracking-tight font-headline font-bold mb-2">
            Coffees verwalten
          </h1>
          <p className="text-on-surface-variant text-sm max-w-2xl">
            {rows.length} Coffees insgesamt · {drafts.length} Entwürfe ·{" "}
            {rows.filter((r) => r.status === "active").length} live ·{" "}
            {needsAttention.length} unter Score 75.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/admin/coffees/sensorik"
            className="border border-primary text-primary px-6 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all"
          >
            Sensorik nachpflegen
          </Link>
          <Link
            href="/admin/coffees/wholesale"
            className="border border-primary text-primary px-6 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all"
          >
            Einkaufspreise
          </Link>
          <Link
            href="/admin/coffees/new"
            className="bg-primary text-on-primary px-6 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all"
          >
            + Neuer Coffee
          </Link>
        </div>
      </div>

      <ScoreFilter active={onlyBelowThreshold} belowCount={needsAttention.length} />

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8 text-sm text-blue-900">
        <p className="font-bold mb-1">So funktioniert der Workflow (Score-driven)</p>
        <p>
          Coffees mit <strong>Score ≥ 75</strong> sind datenseitig komplett genug und werden vom
          Algorithmus uneingeschränkt empfohlen. <strong>Score 50–74</strong>: fehlende Felder
          ergänzen (Klick auf den Score-Badge zeigt was fehlt). Falls ein Coffee trotz niedrigem
          Score live gehen soll: „Manuell freigeben" — das setzt einen Override-Flag und +2
          Score-Bonus.
        </p>
      </div>

      {drafts.length > 0 && !onlyBelowThreshold && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-8">
          <p className="text-sm text-amber-900">
            <strong>{drafts.length} Coffee{drafts.length === 1 ? "" : "s"} im Entwurf</strong> —
            Score prüfen, ergänzen wo nötig, dann „Im Shop veröffentlichen".
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
              <th className="px-4 py-3 font-bold">Score</th>
              <th className="px-4 py-3 font-bold">Was fehlt?</th>
              <th className="px-4 py-3 font-bold text-right">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {[...draftsToShow, ...othersToShow].map((c) => {
              const roaster = Array.isArray(c.roaster) ? c.roaster[0] : c.roaster;
              const verified = Boolean(c.data_verified_at);
              const verifiedDate = c.data_verified_at
                ? new Date(c.data_verified_at).toLocaleDateString("de-CH")
                : null;
              const statusInfo = STATUS_LABEL[c.status] ?? { label: c.status, cls: "bg-stone-100" };
              const breakdown = computeQualityScoreFromCoffeeRow(c);
              const missing = topMissingItems(breakdown, 3);
              const score = c.data_quality_score;
              return (
                <tr
                  key={c.id}
                  className={
                    "border-b border-primary/5 align-top " +
                    (c.status === "draft" ? "bg-amber-50/30 " : "") +
                    ((score ?? 0) < 50 && !verified ? "bg-rose-50/40" : "")
                  }
                >
                  <td className="px-4 py-3 font-bold">
                    <Link href={`/coffee/${c.slug}`} className="hover:text-tertiary" target="_blank">
                      {c.name}
                    </Link>
                    {verified && (
                      <div className="font-headline text-[9px] uppercase tracking-widest font-bold text-emerald-800 mt-1">
                        Manuell freigegeben · {verifiedDate}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">{roaster?.name ?? "—"}</td>
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
                  <td className="px-4 py-3">
                    <details className="cursor-pointer">
                      <summary
                        className={
                          "inline-flex items-baseline gap-2 font-headline text-[11px] uppercase tracking-widest font-bold px-2 py-1 " +
                          scoreBadgeClass(score)
                        }
                      >
                        <span>{score != null ? score : "—"}</span>
                        <span className="text-[9px] opacity-80">· {scoreBadgeLabel(score)}</span>
                      </summary>
                      <div className="mt-3 bg-stone-50 p-3 text-xs space-y-2 min-w-[280px]">
                        {breakdown.groups.map((g) => (
                          <div key={g.label}>
                            <div className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold flex justify-between">
                              <span>{g.label}</span>
                              <span>
                                {g.earned}/{g.max}
                              </span>
                            </div>
                            <ul className="ml-3 mt-1 space-y-0.5">
                              {g.items.map((i) => (
                                <li
                                  key={i.label}
                                  className={i.earned === i.max ? "text-emerald-700" : "text-rose-700"}
                                >
                                  {i.earned === i.max ? "✓" : "✗"} {i.label}
                                  {i.reason && i.earned < i.max && (
                                    <span className="text-on-surface-variant italic"> — {i.reason}</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </details>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {missing.length === 0 ? (
                      <span className="text-emerald-700">— vollständig —</span>
                    ) : (
                      <ul className="space-y-0.5 text-on-surface-variant">
                        {missing.map((m) => (
                          <li key={m.label}>
                            ✗ {m.label}
                            {m.reason && <span className="italic"> ({m.reason})</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <CoffeeActions
                      coffeeId={c.id}
                      status={c.status as "draft" | "active" | "paused" | "discontinued"}
                      verified={verified}
                      score={score}
                    />
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant italic">
                  {onlyBelowThreshold
                    ? "Keine Coffees unter Score 75. Alles sauber."
                    : "Noch keine Coffees. Click „Neuer Coffee“ oben."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-on-surface-variant mt-8">
        <strong>Score-Schwelle:</strong> Der Hartfilter <code>quality_threshold_active</code>{" "}
        liegt bei 75. Coffees darunter werden vom Algorithmus nur empfohlen, wenn sie manuell
        freigegeben wurden (Override = +2 Score-Bonus über DB-Trigger).
      </p>
    </>
  );
}
