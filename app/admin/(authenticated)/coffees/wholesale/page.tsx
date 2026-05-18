import type { Metadata } from "next";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import WholesaleRow from "./WholesaleRow";

export const metadata: Metadata = {
  title: "Admin · Einkaufspreise nachpflegen — Coffee Selection",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Coffee = {
  id: string;
  slug: string;
  name: string;
  price_chf: number;
  weight_g: number;
  wholesale_price_chf: number | null;
  roaster: { name: string } | { name: string }[] | null;
};

export default async function MissingWholesalePage() {
  const svc = createServiceClient();
  const { data } = await svc
    .from("coffees")
    .select(
      "id, slug, name, price_chf, weight_g, wholesale_price_chf, roaster:roasters(name)"
    )
    .is("wholesale_price_chf", null)
    .is("deleted_at", null)
    .order("name");
  const coffees = (data ?? []) as unknown as Coffee[];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-headline font-bold text-3xl md:text-4xl text-primary uppercase tracking-tight">
          Einkaufspreise nachpflegen
        </h1>
        <p className="text-on-surface-variant mt-2">
          Coffees ohne Wholesale-Preis. Eingabe in CHF pro Bag in der jeweiligen
          Standard-Groesse (250 g, 500 g oder 1 kg). Marge im Admin-Dashboard
          wird erst korrekt berechnet, sobald der Einkaufspreis erfasst ist —
          ohne Wholesale rechnen wir die Order als Vollumsatz (Marge = 0).
        </p>
        <p className="text-sm text-on-surface-variant mt-2">
          {coffees.length} Coffees offen
        </p>
      </header>

      {coffees.length === 0 ? (
        <div className="bg-white p-8 shadow-sm">
          <p className="text-sm text-on-surface-variant">
            ✓ Alle Coffees haben einen Einkaufspreis.
          </p>
        </div>
      ) : (
        <div className="bg-white p-6 md:p-8 shadow-sm divide-y divide-surface-container">
          {coffees.map((c) => {
            const roaster = Array.isArray(c.roaster) ? c.roaster[0] : c.roaster;
            return (
              <WholesaleRow
                key={c.id}
                id={c.id}
                name={c.name}
                slug={c.slug}
                roasterName={roaster?.name ?? ""}
                priceChf={Number(c.price_chf)}
                weightG={c.weight_g}
                initialWholesaleChf={
                  c.wholesale_price_chf == null
                    ? null
                    : Number(c.wholesale_price_chf)
                }
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
