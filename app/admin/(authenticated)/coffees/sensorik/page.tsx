import type { Metadata } from "next";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import SensorikRow from "./SensorikRow";

export const metadata: Metadata = {
  title: "Admin · Sensorik nachpflegen — Coffee Selection",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Coffee = {
  id: string;
  slug: string;
  name: string;
  acidity: number | null;
  body: number | null;
  sweetness: number | null;
  bitterness: number | null;
  complexity: number | null;
  roaster: { name: string } | { name: string }[] | null;
};

export default async function MissingSensorikPage() {
  const svc = createServiceClient();
  const { data } = await svc
    .from("coffees")
    .select(
      "id, slug, name, acidity, body, sweetness, bitterness, complexity, roaster:roasters(name)"
    )
    .or(
      "acidity.is.null,body.is.null,sweetness.is.null,bitterness.is.null,complexity.is.null"
    )
    .order("name");
  const coffees = (data ?? []) as unknown as Coffee[];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-headline font-bold text-3xl md:text-4xl text-primary uppercase tracking-tight">
          Sensorik nachpflegen
        </h1>
        <p className="text-on-surface-variant mt-2">
          Coffees ohne vollständiges Sensorik-Profil. Eingabe in der Cupping-Skala 1–10 — wird intern auf SCA 1–5 normalisiert. Pflicht für das Matching: ohne Sensorik kann der Algorithmus den Coffee nicht sauber empfehlen.
        </p>
        <p className="text-sm text-on-surface-variant mt-2">
          {coffees.length} Coffees offen
        </p>
      </header>

      {coffees.length === 0 ? (
        <div className="bg-white p-8 shadow-sm">
          <p className="text-sm text-on-surface-variant">
            ✓ Alle aktiven Coffees haben Sensorik-Daten.
          </p>
        </div>
      ) : (
        <div className="bg-white p-6 md:p-8 shadow-sm divide-y divide-surface-container">
          {coffees.map((c) => {
            const roaster = Array.isArray(c.roaster) ? c.roaster[0] : c.roaster;
            return (
              <SensorikRow
                key={c.id}
                id={c.id}
                name={c.name}
                roasterName={roaster?.name ?? ""}
                slug={c.slug}
                initial={{
                  acidity: c.acidity,
                  body: c.body,
                  sweetness: c.sweetness,
                  bitterness: c.bitterness,
                  complexity: c.complexity,
                }}
              />
            );
          })}
        </div>
      )}

      <Link
        href="/admin/coffees"
        className="font-headline text-[11px] uppercase tracking-[0.2em] text-tertiary hover:text-primary transition-colors border-b-2 border-tertiary pb-1 inline-block"
      >
        ← Zur Coffee-Liste
      </Link>
    </div>
  );
}
