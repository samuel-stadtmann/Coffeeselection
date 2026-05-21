import Link from "next/link";
import type { Metadata } from "next";
import { getRoasterUser } from "@/lib/roaster/auth";
import { createServiceClient } from "@/lib/supabase/service";
import {
  computeQualityScoreFromCoffeeRow,
  topMissingItems,
  type CoffeeRowForScore,
} from "@/lib/coffee/form-helpers";

export const metadata: Metadata = {
  title: "Röster · Meine Coffees — Coffee Selection",
  robots: { index: false, follow: false },
};

type Row = CoffeeRowForScore & {
  id: string;
  slug: string;
  name: string;
  status: string;
  data_quality_score: number | null;
  data_verified_at: string | null;
};

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  draft: { label: "In Review", cls: "bg-amber-100 text-amber-900" },
  active: { label: "Live", cls: "bg-emerald-100 text-emerald-800" },
  paused: { label: "Pausiert", cls: "bg-stone-100 text-stone-700" },
  discontinued: { label: "Auslauf", cls: "bg-rose-100 text-rose-900" },
};

function scoreBadgeClass(score: number | null): string {
  if (score == null) return "bg-stone-100 text-stone-700";
  if (score >= 75) return "bg-emerald-100 text-emerald-800";
  if (score >= 50) return "bg-amber-100 text-amber-900";
  return "bg-rose-100 text-rose-900";
}

export default async function RoasterCoffeesPage() {
  const u = await getRoasterUser();
  if (!u) return null;

  const sb = createServiceClient();
  const roasterIds = u.memberships.map((m) => m.roaster_id);
  const { data, error } = await sb
    .from("coffees")
    .select(
      "id, slug, name, status, roast_level, data_quality_score, data_verified_at, acidity, body, sweetness, bitterness, complexity, aroma_families, flavor_description, origin_id, region, processing_method_id, variety_id, altitude_m_min, harvest_year, sca_score, is_decaf, flavor_embedding"
    )
    .in("roaster_id", roasterIds)
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

  const rows = (data ?? []) as Row[];

  return (
    <>
      <div className="flex justify-between items-end mb-8 gap-4 flex-wrap">
        <div>
          <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
            Sortiment · Meine Coffees
          </span>
          <h1 className="text-4xl md:text-5xl text-primary uppercase tracking-tight font-headline font-bold mb-2">
            Meine Coffees
          </h1>
          <p className="text-on-surface-variant text-sm max-w-2xl">
            {rows.length} Coffee{rows.length === 1 ? "" : "s"} insgesamt. Neue
            Eintraege gehen als Entwurf rein und werden vom Coffee-Selection-Team
            freigegeben.
          </p>
        </div>
        <Link
          href="/roaster/coffees/new"
          className="bg-primary text-on-primary px-6 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all"
        >
          + Neuer Coffee
        </Link>
      </div>

      <div className="bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left font-headline text-[10px] uppercase tracking-widest text-tertiary border-b border-primary/10 bg-surface-container-low">
            <tr>
              <th className="px-4 py-3 font-bold">Coffee</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3 font-bold">Datenscore</th>
              <th className="px-4 py-3 font-bold">Was fehlt?</th>
              <th className="px-4 py-3 font-bold text-right">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const statusInfo = STATUS_LABEL[c.status] ?? {
                label: c.status,
                cls: "bg-stone-100",
              };
              const breakdown = computeQualityScoreFromCoffeeRow(c);
              const missing = topMissingItems(breakdown, 3);
              const score = c.data_quality_score;
              return (
                <tr key={c.id} className="border-b border-primary/5 align-top">
                  <td className="px-4 py-3 font-bold">
                    {c.name}
                    <div className="text-[10px] text-on-surface-variant font-normal">
                      /{c.slug}
                    </div>
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
                  <td className="px-4 py-3">
                    <span
                      className={
                        "font-headline text-[11px] uppercase tracking-widest font-bold px-2 py-1 " +
                        scoreBadgeClass(score)
                      }
                    >
                      {score != null ? score : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {missing.length === 0 ? (
                      <span className="text-emerald-700">— vollständig —</span>
                    ) : (
                      <ul className="space-y-0.5 text-on-surface-variant">
                        {missing.map((m) => (
                          <li key={m.label}>
                            ✗ {m.label}
                            {m.reason && (
                              <span className="italic"> ({m.reason})</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/roaster/coffees/${c.id}/edit`}
                      className="font-headline text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 bg-stone-100 text-stone-700 hover:bg-stone-200 inline-block"
                    >
                      Bearbeiten
                    </Link>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-on-surface-variant italic"
                >
                  Noch keine Coffees. Click „Neuer Coffee“ oben um den ersten
                  Eintrag anzulegen.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-on-surface-variant mt-8">
        <strong>Status-Bedeutung:</strong> „In Review" = wir prüfen die Daten ·
        „Live" = im Shop · „Pausiert" = vorübergehend offline · „Auslauf" = nicht
        mehr bestellbar.
      </p>
    </>
  );
}
