import Link from "next/link";
import { redirect } from "next/navigation";
import AccountLayout, { PageHeader } from "@/components/AccountLayout";
import { createClient } from "@/lib/supabase/server";

type FavCoffeeRow = {
  coffee_id: string;
  created_at: string;
  coffee:
    | {
        id: string;
        slug: string;
        name: string;
        price_chf: number;
        image_url: string | null;
        origin: { name_de: string | null } | { name_de: string | null }[] | null;
        roaster: { name: string; slug: string } | { name: string; slug: string }[] | null;
      }
    | null;
};

type FavRoasterRow = {
  roaster_id: string;
  created_at: string;
  roaster:
    | {
        id: string;
        slug: string;
        name: string;
        city: string | null;
      }
    | null;
};

export default async function FavoritesPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/account/favorites");

  // RLS filtert beide Tabellen automatisch auf den aktuellen Kunden.
  const [{ data: favCoffeesRaw }, { data: favRoastersRaw }] = await Promise.all([
    supabase
      .from("customer_favorite_coffees")
      .select(
        `coffee_id, created_at,
         coffee:coffees(id, slug, name, price_chf, image_url,
           origin:origins_catalog(name_de),
           roaster:roasters(name, slug))`
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("customer_favorite_roasters")
      .select(
        `roaster_id, created_at,
         roaster:roasters(id, slug, name, city)`
      )
      .order("created_at", { ascending: false }),
  ]);

  const favCoffees = ((favCoffeesRaw ?? []) as unknown as FavCoffeeRow[])
    .map((r) => r.coffee)
    .filter((c): c is NonNullable<FavCoffeeRow["coffee"]> => c != null)
    .map((c) => {
      const roaster = Array.isArray(c.roaster) ? c.roaster[0] : c.roaster;
      const origin = Array.isArray(c.origin) ? c.origin[0] : c.origin;
      return {
        id: c.id,
        slug: c.slug,
        name: c.name,
        origin: origin?.name_de ?? "Specialty",
        roasterName: roaster?.name ?? "",
        price: c.price_chf,
      };
    });

  const favRoasters = ((favRoastersRaw ?? []) as unknown as FavRoasterRow[])
    .map((r) => r.roaster)
    .filter((r): r is NonNullable<FavRoasterRow["roaster"]> => r != null);

  return (
    <AccountLayout>
      <PageHeader
        subtitle="Favoriten"
        title="Deine Lieblings-Kaffees"
        description="Schneller Zugriff auf die Kaffees und Röster, die du markiert hast."
      />

      {/* Coffees */}
      <div className="bg-white p-6 md:p-8 shadow-sm">
        <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-6">
          Kaffees ({favCoffees.length})
        </h3>
        {favCoffees.length === 0 ? (
          <p className="text-sm text-on-surface-variant">
            Noch keine Favoriten. Tippe auf einer Coffee-Detail-Seite das Herz, um Kaffees hier zu sammeln.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {favCoffees.map((c) => (
              <div
                key={c.id}
                className="bg-surface-container-low p-5 flex items-start justify-between gap-4 group"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold">
                    {c.origin}
                  </span>
                  <Link href={`/coffee/${c.slug}`} className="block">
                    <h4 className="font-headline font-bold text-primary uppercase tracking-tight group-hover:text-tertiary transition-colors">
                      {c.name}
                    </h4>
                  </Link>
                  <p className="text-xs text-on-surface-variant">{c.roasterName}</p>
                  <p className="font-headline font-bold text-primary mt-2">
                    CHF {c.price.toFixed(2)}
                  </p>
                </div>
                <Link
                  href={`/coffee/${c.slug}`}
                  className="bg-primary text-on-primary px-3 py-1 font-headline text-[10px] uppercase tracking-widest font-bold hover:bg-black transition-all whitespace-nowrap shrink-0"
                >
                  Bestellen
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Roasters */}
      <div className="bg-white p-6 md:p-8 shadow-sm">
        <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-6">
          Lieblings-Röster ({favRoasters.length})
        </h3>
        {favRoasters.length === 0 ? (
          <p className="text-sm text-on-surface-variant">
            Noch keine Lieblings-Röster. Tippe das Herz auf einer Röster-Seite.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {favRoasters.map((r) => (
              <Link
                key={r.id}
                href={`/roasters/${r.slug}`}
                className="bg-surface-container-low p-5 border-l-4 border-tertiary block hover:bg-tertiary/5 transition-colors"
              >
                <h4 className="font-headline font-bold text-primary uppercase tracking-tight">
                  {r.name}
                </h4>
                {r.city && (
                  <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold">
                    {r.city}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      <Link
        href="/account/dashboard"
        className="font-headline text-[11px] uppercase tracking-[0.2em] text-tertiary hover:text-primary transition-colors border-b-2 border-tertiary pb-1 inline-block"
      >
        ← Zurück zum Dashboard
      </Link>
    </AccountLayout>
  );
}
