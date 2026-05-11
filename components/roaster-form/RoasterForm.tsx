"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  emptyRoasterForm,
  slugifyRoaster,
  validateRoaster,
  type RoasterFormState,
} from "@/lib/roaster/form";

type Props = {
  initial?: RoasterFormState;
  submitEndpoint: string;
  submitMethod: "POST" | "PATCH";
  afterSaveHref: string;
};

export default function RoasterForm({
  initial,
  submitEndpoint,
  submitMethod,
  afterSaveHref,
}: Props) {
  const router = useRouter();
  const [s, setS] = useState<RoasterFormState>(initial ?? emptyRoasterForm());
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function onNameChange(v: string) {
    setS((prev) => ({ ...prev, name: v, slug: prev.slug || slugifyRoaster(v) }));
  }

  const issues = useMemo(() => validateRoaster(s), [s]);
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warn");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    if (errors.length > 0) {
      setServerError("Bitte zuerst die rot markierten Pflichtfelder ausfüllen.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(submitEndpoint, {
        method: submitMethod,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        roaster_id?: string;
        error?: string;
        details?: string;
      };
      if (!res.ok || !body.ok) {
        setServerError(body.details ?? body.error ?? `HTTP ${res.status}`);
        setSubmitting(false);
        return;
      }
      router.push(afterSaveHref);
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  }

  const errorFields = new Set(errors.map((e) => e.field));
  const warnFields = new Set(warnings.map((w) => w.field));

  function fieldClass(field: keyof RoasterFormState): string {
    const base =
      "w-full px-3 py-2 bg-white border focus:outline-none text-sm transition-colors";
    if (errorFields.has(field)) return base + " border-rose-400 focus:border-rose-500";
    if (warnFields.has(field)) return base + " border-amber-400 focus:border-amber-500";
    return base + " border-primary/15 focus:border-primary";
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8 max-w-4xl">
      <Section title="Identität">
        <Field label="Anzeigename *" hint="So sieht der Kunde die Rösterei.">
          <input
            type="text"
            required
            value={s.name}
            onChange={(e) => onNameChange(e.target.value)}
            className={fieldClass("name")}
          />
        </Field>
        <Field label="Slug *" hint="URL-Identifier, z.B. 'mame-coffee'. Wird aus dem Namen abgeleitet.">
          <input
            type="text"
            required
            value={s.slug}
            onChange={(e) => setS({ ...s, slug: e.target.value })}
            className={fieldClass("slug")}
          />
        </Field>
        <Field label="Firmenname (legal)" hint="Offizieller Firmenname, z.B. 'MAME Specialty Coffee AG'.">
          <input
            type="text"
            value={s.legal_name}
            onChange={(e) => setS({ ...s, legal_name: e.target.value })}
            className={fieldClass("legal_name")}
          />
        </Field>
        <Field label="Status" hint="'onboarding' = im Setup, 'active' = sichtbar im Shop.">
          <select
            value={s.status}
            onChange={(e) =>
              setS({ ...s, status: e.target.value as RoasterFormState["status"] })
            }
            className={fieldClass("status")}
          >
            <option value="onboarding">Onboarding</option>
            <option value="active">Aktiv (im Shop sichtbar)</option>
            <option value="paused">Pausiert (vorübergehend offline)</option>
            <option value="inactive">Inaktiv (Auslauf)</option>
          </select>
        </Field>
      </Section>

      <Section title="Webseiten-Inhalt">
        <Field
          label="Kurzbeschreibung"
          hint="1–2 Sätze für Listen und Karten (max. 200 Zeichen ideal)."
        >
          <textarea
            rows={2}
            value={s.short_description}
            onChange={(e) => setS({ ...s, short_description: e.target.value })}
            className={fieldClass("short_description")}
          />
          <div className="text-[10px] text-on-surface-variant mt-1">
            {s.short_description.length} Zeichen
          </div>
        </Field>
        <Field label="Beschreibung" hint="Ein paar Sätze für die Rösterei-Detailseite.">
          <textarea
            rows={4}
            value={s.description}
            onChange={(e) => setS({ ...s, description: e.target.value })}
            className={fieldClass("description")}
          />
        </Field>
        <Field
          label="Geschichte / Story"
          hint="Ausführliche Rösterei-Geschichte (Markdown erlaubt — Absätze, **fett**, *kursiv*)."
        >
          <textarea
            rows={6}
            value={s.story}
            onChange={(e) => setS({ ...s, story: e.target.value })}
            className={fieldClass("story")}
          />
        </Field>
      </Section>

      <Section title="Bilder & Links">
        <Field label="Logo-URL" hint="Quadratisches Logo auf transparentem Hintergrund (PNG/SVG).">
          <input
            type="url"
            placeholder="https://…"
            value={s.logo_url}
            onChange={(e) => setS({ ...s, logo_url: e.target.value })}
            className={fieldClass("logo_url")}
          />
        </Field>
        <Field
          label="Hero-Bild-URL"
          hint="Breites Bild für die Rösterei-Detailseite (mind. 1600×900px ideal)."
        >
          <input
            type="url"
            placeholder="https://…"
            value={s.hero_image_url}
            onChange={(e) => setS({ ...s, hero_image_url: e.target.value })}
            className={fieldClass("hero_image_url")}
          />
        </Field>
        <Field label="Website" hint="Vollständige URL inkl. https://">
          <input
            type="url"
            placeholder="https://…"
            value={s.website_url}
            onChange={(e) => setS({ ...s, website_url: e.target.value })}
            className={fieldClass("website_url")}
          />
        </Field>
        <Field label="Instagram-Handle" hint="Ohne @, z.B. 'mamecoffee'.">
          <input
            type="text"
            placeholder="mamecoffee"
            value={s.instagram_handle}
            onChange={(e) => setS({ ...s, instagram_handle: e.target.value })}
            className={fieldClass("instagram_handle")}
          />
        </Field>
      </Section>

      <Section title="Kontakt">
        <Field label="E-Mail" hint="Öffentliche Kontakt-E-Mail (z.B. info@…).">
          <input
            type="email"
            value={s.contact_email}
            onChange={(e) => setS({ ...s, contact_email: e.target.value })}
            className={fieldClass("contact_email")}
          />
        </Field>
        <Field label="Telefon" hint="Öffentliche Kontakt-Telefonnummer.">
          <input
            type="tel"
            value={s.contact_phone}
            onChange={(e) => setS({ ...s, contact_phone: e.target.value })}
            className={fieldClass("contact_phone")}
          />
        </Field>
      </Section>

      <Section title="Adresse">
        <Field label="Strasse">
          <input
            type="text"
            value={s.street}
            onChange={(e) => setS({ ...s, street: e.target.value })}
            className={fieldClass("street")}
          />
        </Field>
        <Field label="Adresszusatz" hint="z.B. 'c/o' oder Stockwerk.">
          <input
            type="text"
            value={s.street_additional}
            onChange={(e) => setS({ ...s, street_additional: e.target.value })}
            className={fieldClass("street_additional")}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="PLZ">
            <input
              type="text"
              value={s.postal_code}
              onChange={(e) => setS({ ...s, postal_code: e.target.value })}
              className={fieldClass("postal_code")}
            />
          </Field>
          <Field label="Ort">
            <input
              type="text"
              value={s.city}
              onChange={(e) => setS({ ...s, city: e.target.value })}
              className={fieldClass("city")}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Kanton">
            <input
              type="text"
              placeholder="z.B. ZH"
              value={s.region}
              onChange={(e) => setS({ ...s, region: e.target.value })}
              className={fieldClass("region")}
            />
          </Field>
          <Field label="Land">
            <input
              type="text"
              value={s.country}
              onChange={(e) => setS({ ...s, country: e.target.value })}
              className={fieldClass("country")}
            />
          </Field>
        </div>
        <Field label="UID / MWST-Nummer" hint="z.B. 'CHE-123.456.789 MWST'.">
          <input
            type="text"
            value={s.vat_number}
            onChange={(e) => setS({ ...s, vat_number: e.target.value })}
            className={fieldClass("vat_number")}
          />
        </Field>
      </Section>

      {/* Fehler + Warnungen */}
      {issues.length > 0 && (
        <div className="space-y-2">
          {errors.map((e) => (
            <div
              key={e.field + e.message}
              className="bg-rose-50 border-l-4 border-rose-400 p-3 text-sm text-rose-900"
            >
              <strong>{String(e.field)}:</strong> {e.message}
            </div>
          ))}
          {warnings.map((w) => (
            <div
              key={w.field + w.message}
              className="bg-amber-50 border-l-4 border-amber-400 p-3 text-sm text-amber-900"
            >
              <strong>{String(w.field)}:</strong> {w.message}
            </div>
          ))}
        </div>
      )}

      {serverError && (
        <div className="bg-rose-50 border-l-4 border-rose-400 p-4 text-sm text-rose-900">
          {serverError}
        </div>
      )}

      <div className="flex gap-3 items-center sticky bottom-0 bg-[#F9F5F0] py-4 border-t border-primary/10">
        <button
          type="submit"
          disabled={submitting || errors.length > 0}
          className="bg-primary text-on-primary px-6 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
        >
          {submitting ? "Speichern…" : "Speichern"}
        </button>
        {errors.length > 0 && (
          <span className="text-xs text-rose-700">
            {errors.length} Fehler — siehe oben
          </span>
        )}
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white p-6 shadow-sm">
      <h2 className="font-headline text-[11px] uppercase tracking-widest font-bold text-tertiary mb-4">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="font-headline text-[10px] uppercase tracking-widest font-bold text-tertiary mb-1.5 block">
        {label}
      </span>
      {children}
      {hint && <p className="text-[10px] text-on-surface-variant mt-1">{hint}</p>}
    </label>
  );
}
