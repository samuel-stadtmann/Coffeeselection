import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getRoasterUser } from "@/lib/roaster/auth";
import { createServiceClient } from "@/lib/supabase/service";
import CoffeeForm, { type LookupOption } from "@/components/coffee-form/CoffeeForm";
import { emptyCoffeeForm } from "@/lib/coffee/form-helpers";

export const metadata: Metadata = {
  title: "Röster · Neuer Coffee — Coffee Selection",
  robots: { index: false, follow: false },
};

async function loadCatalogsForRoaster(roasterIds: string[]) {
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
    // Roester sieht nur seine eigenen Roesterei(en) im Dropdown — bei nur
    // einer Membership ist das effektiv ein gesperrtes Feld.
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

export default async function RoasterNewCoffeePage() {
  const u = await getRoasterUser();
  if (!u) redirect("/roaster/login");

  const roasterIds = u.memberships.map((m) => m.roaster_id);
  const cat = await loadCatalogsForRoaster(roasterIds);

  const initial = emptyCoffeeForm();
  // Vorbefuellen mit dem ersten Roester — bei nur einer Membership ist das
  // exakt die Roesterei des Users, bei mehreren kann er noch wechseln.
  initial.roaster_id = roasterIds[0] ?? "";

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
          Neuer Coffee
        </h1>
        <p className="text-on-surface-variant text-sm max-w-2xl">
          Erfasse alle Daten die der Algorithmus braucht. Pflichtfelder sind mit
          * markiert. Konsistenz-Warnungen erscheinen inline. Nach dem Speichern
          geht der Coffee als <strong>Entwurf</strong> in Review — wir prüfen die
          Daten und veröffentlichen ihn dann im Shop.
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
        submitEndpoint="/api/roaster/coffees"
        submitMethod="POST"
        afterSaveHref="/roaster/coffees"
      />
    </>
  );
}
