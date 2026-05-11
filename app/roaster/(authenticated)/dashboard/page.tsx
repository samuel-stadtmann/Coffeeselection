import Link from "next/link";
import type { Metadata } from "next";
import { getRoasterUser } from "@/lib/roaster/auth";
import { createServiceClient } from "@/lib/supabase/service";

export const metadata: Metadata = {
  title: "Röster · Übersicht — Coffee Selection",
  robots: { index: false, follow: false },
};

export default async function RoasterDashboardPage() {
  const u = await getRoasterUser();
  if (!u) return null; // Layout hat schon redirected, defensive Pruefung

  const sb = createServiceClient();
  const roasterIds = u.memberships.map((m) => m.roaster_id);
  const { data: coffees } = await sb
    .from("coffees")
    .select("id, status, data_quality_score")
    .in("roaster_id", roasterIds)
    .is("deleted_at", null);

  const rows = coffees ?? [];
  const drafts = rows.filter((r) => r.status === "draft").length;
  const active = rows.filter((r) => r.status === "active").length;
  const needsAttention = rows.filter(
    (r) => (r.data_quality_score ?? 0) < 75
  ).length;

  return (
    <>
      <div className="mb-8">
        <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
          Röster-Portal · Übersicht
        </span>
        <h1 className="text-4xl md:text-5xl text-primary uppercase tracking-tight font-headline font-bold mb-2">
          Willkommen
        </h1>
        <p className="text-on-surface-variant text-sm max-w-2xl">
          Pflege hier dein Sortiment. Neue Coffees gehen erst als Entwurf rein
          und werden vom Coffee-Selection-Team freigegeben.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <div className="bg-white shadow-sm p-6">
          <div className="font-headline text-[10px] uppercase tracking-widest font-bold text-tertiary mb-2">
            Live im Shop
          </div>
          <div className="text-4xl font-headline font-bold text-primary">
            {active}
          </div>
          <div className="text-xs text-on-surface-variant mt-1">
            von {rows.length} Coffees insgesamt
          </div>
        </div>

        <div className="bg-white shadow-sm p-6">
          <div className="font-headline text-[10px] uppercase tracking-widest font-bold text-tertiary mb-2">
            In Review
          </div>
          <div className="text-4xl font-headline font-bold text-amber-700">
            {drafts}
          </div>
          <div className="text-xs text-on-surface-variant mt-1">
            warten auf Freigabe durch Coffee Selection
          </div>
        </div>

        <div className="bg-white shadow-sm p-6">
          <div className="font-headline text-[10px] uppercase tracking-widest font-bold text-tertiary mb-2">
            Score &lt; 75
          </div>
          <div
            className={
              "text-4xl font-headline font-bold " +
              (needsAttention > 0 ? "text-rose-700" : "text-emerald-700")
            }
          >
            {needsAttention}
          </div>
          <div className="text-xs text-on-surface-variant mt-1">
            Daten unvollständig — bitte ergänzen
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-8">
        <h2 className="font-headline font-bold text-blue-900 uppercase tracking-widest text-[11px] mb-3">
          So funktioniert das Einreichen
        </h2>
        <ol className="text-sm text-blue-900 space-y-2 list-decimal ml-5">
          <li>
            Klick „Meine Coffees" oben → Liste deines Sortiments + „+ Neuer Coffee".
          </li>
          <li>
            Felder ausfüllen. Während du tippst, zeigt dir die Seite live einen
            <strong> Daten-Vollständigkeits-Score</strong>. Ziel: ≥ 75.
          </li>
          <li>
            Speichern → status=Entwurf. Wir prüfen die Daten und veröffentlichen
            den Coffee. Du kriegst Bescheid sobald er live ist.
          </li>
        </ol>
      </div>

      <Link
        href="/roaster/coffees"
        className="inline-block bg-primary text-on-primary px-6 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all"
      >
        Zu meinen Coffees →
      </Link>
    </>
  );
}
