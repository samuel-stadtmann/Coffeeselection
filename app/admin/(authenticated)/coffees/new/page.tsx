import type { Metadata } from "next";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import CoffeeForm, { type LookupOption } from "@/components/coffee-form/CoffeeForm";
import { emptyCoffeeForm } from "@/lib/coffee/form-helpers";

export const metadata: Metadata = {
  title: "Admin · Neuer Coffee",
  robots: { index: false, follow: false },
};

async function loadCatalogs() {
  const sb = createServiceClient();
  const [roasters, origins, varieties, processings, certifications, allergens] = await Promise.all([
    sb.from("roasters").select("id, name").is("deleted_at", null).order("name"),
    sb.from("origins_catalog").select("id, name_de").eq("active", true).order("name_de"),
    sb.from("varieties_catalog").select("id, name").eq("active", true).order("name"),
    sb.from("processing_methods_catalog").select("id, name_de").eq("active", true).order("name_de"),
    sb.from("certifications_catalog").select("id, name").eq("active", true).order("name"),
    sb.from("allergens_catalog").select("slug, name_de").eq("active", true).order("sort_order"),
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
  };
}

export default async function AdminNewCoffeePage() {
  const cat = await loadCatalogs();

  return (
    <>
      <div className="mb-8">
        <Link
          href="/admin/coffees"
          className="font-headline text-[10px] uppercase tracking-widest text-tertiary hover:text-primary inline-block mb-4"
        >
          ← Zurück zur Coffee-Liste
        </Link>
        <h1 className="text-4xl md:text-5xl text-primary uppercase tracking-tight font-headline font-bold mb-2">
          Neuer Coffee
        </h1>
        <p className="text-on-surface-variant text-sm max-w-2xl">
          Erfasse alle Daten die der Algorithmus braucht. Pflichtfelder sind mit
          * markiert. Konsistenz-Warnungen erscheinen inline. Nach dem Speichern
          ist der Coffee im Status <strong>draft</strong> und muss in der Liste
          freigegeben werden.
        </p>
      </div>

      <CoffeeForm
        initial={emptyCoffeeForm()}
        roasters={cat.roasters}
        origins={cat.origins}
        varieties={cat.varieties}
        processings={cat.processings}
        allergens={cat.allergens}
        certifications={cat.certifications}
        submitEndpoint="/api/admin/coffees"
        submitMethod="POST"
        afterSaveHref="/admin/coffees"
      />
    </>
  );
}
