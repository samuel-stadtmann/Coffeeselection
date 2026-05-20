import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import RoasterForm from "@/components/roaster-form/RoasterForm";
import { emptyRoasterForm, type RoasterFormState } from "@/lib/roaster/form";
import RoasterPayoutForm from "./RoasterPayoutForm";

export const metadata: Metadata = {
  title: "Admin · Rösterei bearbeiten — Coffee Selection",
  robots: { index: false, follow: false },
};

export default async function AdminEditRoasterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sb = createServiceClient();
  const { data: r, error } = await sb
    .from("roasters")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  if (error || !r) notFound();

  // Payout-Stammdaten (eigene Tabelle, 1:1 zu roaster). Kann null sein
  // wenn fuer diesen Roester noch nie erfasst.
  const { data: payout } = await sb
    .from("roasters_payout")
    .select(
      "bank_account_holder, iban, bic, bank_name, payout_method, payout_currency, payout_threshold_chf, commission_pct, contract_start_on, contract_end_on, contract_notes"
    )
    .eq("roaster_id", id)
    .maybeSingle();

  const initial: RoasterFormState = {
    ...emptyRoasterForm(),
    name: r.name ?? "",
    slug: r.slug ?? "",
    legal_name: r.legal_name ?? "",
    short_description: r.short_description ?? "",
    description: r.description ?? "",
    story: r.story ?? "",
    logo_url: r.logo_url ?? "",
    hero_image_url: r.hero_image_url ?? "",
    website_url: r.website_url ?? "",
    instagram_handle: r.instagram_handle ?? "",
    contact_email: r.contact_email ?? "",
    contact_phone: r.contact_phone ?? "",
    street: r.street ?? "",
    street_additional: r.street_additional ?? "",
    postal_code: r.postal_code ?? "",
    city: r.city ?? "",
    region: r.region ?? "",
    country: r.country ?? "CH",
    vat_number: r.vat_number ?? "",
    status: (r.status as RoasterFormState["status"]) ?? "onboarding",
  };

  return (
    <>
      <div className="mb-8">
        <Link
          href="/admin/roasters"
          className="font-headline text-[10px] uppercase tracking-widest text-tertiary hover:text-primary inline-block mb-4"
        >
          ← Zurück zu allen Röstern
        </Link>
        <h1 className="text-4xl md:text-5xl text-primary uppercase tracking-tight font-headline font-bold mb-2">
          {r.name} bearbeiten
        </h1>
        <p className="text-on-surface-variant text-sm max-w-2xl">
          Änderungen werden sofort übernommen. Status auf „Aktiv" → Rösterei
          erscheint im Shop.
        </p>
      </div>

      <RoasterForm
        initial={initial}
        submitEndpoint={`/api/admin/roasters/${id}`}
        submitMethod="PATCH"
        afterSaveHref="/admin/roasters"
      />

      {/* Payout-Stammdaten — separates Panel, schreibt auf roasters_payout.
          Vertraulich (kein Read-Zugriff fuer anon/authenticated via RLS). */}
      <div className="mt-12 max-w-3xl">
        <h2 className="text-2xl text-primary uppercase tracking-tight font-headline font-bold mb-2">
          Auszahlungs-Daten
        </h2>
        <p className="text-on-surface-variant text-sm mb-6">
          Bankverbindung + Vertragsdaten für die monatliche Wholesale-Auszahlung
          (Reseller-Modell). Vertraulich — nur im Admin sichtbar. Erscheint im{" "}
          <Link href="/admin/roasters/payouts" className="text-tertiary underline">
            Auszahlungs-Report
          </Link>
          .
        </p>
        <RoasterPayoutForm
          roasterId={id}
          initial={{
            bank_account_holder: payout?.bank_account_holder ?? "",
            iban: payout?.iban ?? "",
            bic: payout?.bic ?? "",
            bank_name: payout?.bank_name ?? "",
            payout_method:
              (payout?.payout_method as string) ?? "bank_transfer",
            payout_currency: payout?.payout_currency ?? "CHF",
            payout_threshold_chf:
              payout?.payout_threshold_chf != null
                ? Number(payout.payout_threshold_chf)
                : 0,
            commission_pct:
              payout?.commission_pct != null
                ? Number(payout.commission_pct)
                : null,
            contract_start_on: payout?.contract_start_on ?? "",
            contract_end_on: payout?.contract_end_on ?? "",
            contract_notes: payout?.contract_notes ?? "",
          }}
        />
      </div>
    </>
  );
}
