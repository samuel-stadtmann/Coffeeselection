import Link from "next/link";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import VerifyToggle from "./VerifyToggle";

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

export default async function AdminCoffeesPage() {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("coffees")
    .select(
      "id, slug, name, status, roast_level, price_chf, weight_g, data_quality_score, data_verified_at, data_verified_by, roaster:roasters(name)"
    )
    .is("deleted_at", null)
    .order("name");

  if (error) {
    return (
      <div className="bg-rose-50 border-l-4 border-rose-400 p-4 text-sm text-rose-900">
        Konnte Coffees nicht laden: {error.message}
      </div>
    );
  }

  const rows = (data ?? []) as CoffeeRow[];

  return (
    <>
      <div className="mb-8">
        <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
          Sortiment · Verifikation
        </span>
        <h1 className="text-4xl md:text-5xl text-primary uppercase tracking-tight font-headline font-bold mb-4">
          Coffees verwalten
        </h1>
        <p className="text-on-surface-variant max-w-2xl text-sm">
          {rows.length} Coffees im Sortiment. Verifiziere einen Coffee nach
          eigener Verkostung — verifizierte Coffees bekommen +2 auf
          data_quality_score (Playbook 8.4).
        </p>
      </div>

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
            {rows.map((c) => {
              const roaster = Array.isArray(c.roaster) ? c.roaster[0] : c.roaster;
              const verified = Boolean(c.data_verified_at);
              const verifiedDate = c.data_verified_at
                ? new Date(c.data_verified_at).toLocaleDateString("de-CH")
                : null;
              return (
                <tr key={c.id} className="border-b border-primary/5">
                  <td className="px-4 py-3 font-bold">
                    <Link href={`/coffee/${c.slug}`} className="hover:text-tertiary">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {roaster?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-headline text-[10px] uppercase tracking-widest">
                      {c.status}
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
                    <VerifyToggle coffeeId={c.id} verified={verified} />
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant italic">
                  Keine Coffees im Sortiment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-on-surface-variant mt-8">
        Verifikation: +2 auf data_quality_score (Trigger
        <code className="bg-white px-1.5 py-0.5">trg_coffees_verification_bonus</code>).
        Entzug der Verifikation bringt -2.
      </p>
    </>
  );
}
