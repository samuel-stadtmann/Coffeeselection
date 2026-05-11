import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getRoasterUser } from "@/lib/roaster/auth";
import { createServiceClient } from "@/lib/supabase/service";
import CoffeeForm, { type LookupOption } from "@/components/coffee-form/CoffeeForm";
import {
  emptyCoffeeForm,
  fiveToTen,
  type CoffeeFormState,
} from "@/lib/coffee/form-helpers";

export const metadata: Metadata = {
  title: "Röster · Coffee bearbeiten — Coffee Selection",
  robots: { index: false, follow: false },
};

async function loadCatalogs(roasterIds: string[]) {
  const sb = createServiceClient();
  const [
    roasters,
    origins,
    varieties,
    processings,
    certifications,
    allergens,
    brewingMethods,
    flavorNotes,
  ] = await Promise.all([
    sb.from("roasters").select("id, name").in("id", roasterIds).order("name"),
    sb.from("origins_catalog").select("id, name_de").eq("active", true).order("name_de"),
    sb.from("varieties_catalog").select("id, name").eq("active", true).order("name"),
    sb.from("processing_methods_catalog").select("id, name_de").eq("active", true).order("name_de"),
    sb.from("certifications_catalog").select("id, name").eq("active", true).order("name"),
    sb.from("allergens_catalog").select("slug, name_de").eq("active", true).order("sort_order"),
    sb
      .from("brewing_methods_catalog")
      .select("id, name_de, category")
      .eq("active", true)
      .order("sort_order"),
    sb
      .from("flavor_notes_catalog")
      .select("id, name_de, family")
      .eq("active", true)
      .order("sort_order"),
  ]);

  return {
    roasters: ((roasters.data ?? []) as { id: string; name: string }[]).map((r) => ({
      id: r.id,
      label: r.name,
    })) as LookupOption[],
    origins: ((origins.data ?? []) as { id: string; name_de: string }[]).map((o) => ({
      id: o.id,
      label: o.name_de,
    })) as LookupOption[],
    varieties: ((varieties.data ?? []) as { id: string; name: string }[]).map((v) => ({
      id: v.id,
      label: v.name,
    })) as LookupOption[],
    processings: ((processings.data ?? []) as { id: string; name_de: string }[]).map((p) => ({
      id: p.id,
      label: p.name_de,
    })) as LookupOption[],
    certifications: ((certifications.data ?? []) as { id: string; name: string }[]).map((c) => ({
      id: c.id,
      label: c.name,
    })) as LookupOption[],
    allergens: ((allergens.data ?? []) as { slug: string; name_de: string }[]).map((a) => ({
      slug: a.slug,
      label: a.name_de,
    })),
    brewingMethods: ((brewingMethods.data ?? []) as {
      id: string;
      name_de: string;
      category: string;
    }[]).map((b) => ({ id: b.id, label: b.name_de, category: b.category })),
    flavorNotes: ((flavorNotes.data ?? []) as {
      id: string;
      name_de: string;
      family: string;
    }[]).map((f) => ({ id: f.id, label: f.name_de, family: f.family })),
  };
}

export default async function RoasterEditCoffeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const u = await getRoasterUser();
  if (!u) redirect("/roaster/login");

  const sb = createServiceClient();
  const { data: coffee, error } = await sb
    .from("coffees")
    .select(
      "*, allergens:coffee_allergens(allergen), certifications:coffee_certifications(certification_id), brewing_methods:coffee_brewing_methods(brewing_method_id, is_recommended, notes), flavor_notes:coffee_flavor_notes(flavor_note_id, intensity)"
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !coffee) notFound();

  // Permission: Coffee muss zu einer Rösterei des Users gehören.
  const roasterIds = u.memberships.map((m) => m.roaster_id);
  if (!roasterIds.includes(coffee.roaster_id)) {
    return (
      <div className="bg-rose-50 border-l-4 border-rose-400 p-6 text-sm text-rose-900">
        <p className="font-bold mb-1">Kein Zugriff</p>
        <p>Dieser Coffee gehört einer anderen Rösterei.</p>
        <Link href="/roaster/coffees" className="underline mt-2 inline-block">
          ← Zurück zu meinen Coffees
        </Link>
      </div>
    );
  }

  const cat = await loadCatalogs(roasterIds);

  // DB → Form-State. Sensorik in der DB ist 1-5, im Form 1-10 (Cupping-Bogen).
  const initial: CoffeeFormState = {
    ...emptyCoffeeForm(),
    name: coffee.name ?? "",
    slug: coffee.slug ?? "",
    roaster_id: coffee.roaster_id ?? "",
    short_description: coffee.short_description ?? "",
    description: coffee.description ?? "",
    flavor_description: coffee.flavor_description ?? "",
    tasting_summary: coffee.tasting_summary ?? "",
    origin_id: coffee.origin_id ?? null,
    region: coffee.region ?? "",
    farm: coffee.farm ?? "",
    producer: coffee.producer ?? "",
    variety_id: coffee.variety_id ?? null,
    processing_method_id: coffee.processing_method_id ?? null,
    altitude_m_min: coffee.altitude_m_min ?? null,
    altitude_m_max: coffee.altitude_m_max ?? null,
    harvest_year: coffee.harvest_year ?? null,
    lot_number: coffee.lot_number ?? "",
    roast_level: coffee.roast_level ?? 3,
    roast_level_touched: coffee.roast_level != null,
    roast_profile: (coffee.roast_profile as "espresso" | "filter" | "omni") ?? "omni",
    is_decaf: !!coffee.is_decaf,
    decaf_method: (coffee.decaf_method as CoffeeFormState["decaf_method"]) ?? "",
    acidity: fiveToTen(coffee.acidity),
    body: fiveToTen(coffee.body),
    sweetness: fiveToTen(coffee.sweetness),
    bitterness: fiveToTen(coffee.bitterness),
    complexity: fiveToTen(coffee.complexity),
    // Edit-Form: existierende DB-Werte gelten als "vom Roester gesetzt"
    // — sonst muesste der Roester bei jedem bestehenden Coffee jede
    // Achse neu anfassen.
    sensory_touched: {
      acidity: coffee.acidity != null,
      body: coffee.body != null,
      sweetness: coffee.sweetness != null,
      bitterness: coffee.bitterness != null,
      complexity: coffee.complexity != null,
    },
    aroma_families: (coffee.aroma_families ?? []) as CoffeeFormState["aroma_families"],
    price_chf: coffee.price_chf ?? null,
    wholesale_price_chf: coffee.wholesale_price_chf ?? null,
    weight_g: coffee.weight_g ?? 250,
    stock_kg: coffee.stock_kg ?? null,
    stock_status: (coffee.stock_status as CoffeeFormState["stock_status"]) ?? "in_stock",
    min_order_qty: coffee.min_order_qty ?? 1,
    is_organic: !!coffee.is_organic,
    is_direct_trade: !!coffee.is_direct_trade,
    sca_score: coffee.sca_score ?? null,
    allergen_slugs: ((coffee.allergens ?? []) as { allergen: string }[]).map((a) => a.allergen),
    certification_ids: ((coffee.certifications ?? []) as { certification_id: string }[]).map(
      (c) => c.certification_id
    ),
    status: (coffee.status as CoffeeFormState["status"]) ?? "draft",
    is_fresh_roast_on_demand: !!coffee.is_fresh_roast_on_demand,
    image_url: coffee.image_url ?? "",
    brewing_methods: (
      (coffee.brewing_methods ?? []) as Array<{
        brewing_method_id: string;
        is_recommended: boolean | null;
        notes: string | null;
      }>
    ).map((b) => ({
      brewing_method_id: b.brewing_method_id,
      is_recommended: b.is_recommended ?? true,
      notes: b.notes ?? "",
    })),
    flavor_notes: (
      (coffee.flavor_notes ?? []) as Array<{
        flavor_note_id: string;
        intensity: number | null;
      }>
    ).map((f) => ({
      flavor_note_id: f.flavor_note_id,
      intensity: f.intensity ?? 3,
    })),
  };

  return (
    <>
      <div className="mb-8">
        <Link
          href="/roaster/coffees"
          className="font-headline text-[10px] uppercase tracking-widest text-tertiary hover:text-primary inline-block mb-4"
        >
          ← Zurück zu meinen Coffees
        </Link>
        <h1 className="text-4xl md:text-5xl text-primary uppercase tracking-tight font-headline font-bold mb-2">
          Coffee bearbeiten
        </h1>
        <p className="text-on-surface-variant text-sm max-w-2xl">
          Änderungen werden beim Speichern direkt übernommen. Falls der Coffee
          aktuell live ist und du wesentliche Daten änderst (z.B. Geschmacksprofil),
          prüft das Coffee-Selection-Team nochmals.
        </p>
      </div>

      <CoffeeForm
        initial={initial}
        roasters={cat.roasters}
        origins={cat.origins}
        varieties={cat.varieties}
        processings={cat.processings}
        allergens={cat.allergens}
        certifications={cat.certifications}
        brewingMethods={cat.brewingMethods}
        flavorNotes={cat.flavorNotes}
        submitEndpoint={`/api/roaster/coffees/${id}`}
        submitMethod="PATCH"
        afterSaveHref="/roaster/coffees"
      />
    </>
  );
}
