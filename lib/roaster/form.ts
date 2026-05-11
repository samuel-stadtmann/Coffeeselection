/**
 * Form-State + Validation für das Rösterei-Stammdaten-Formular
 * (/admin/roasters/new + /admin/roasters/[id]/edit).
 *
 * Spiegelt die Spalten in public.roasters die per Admin-UI editierbar sein
 * sollen. Nicht hier: created_at/updated_at/deleted_at (System), id (PK).
 */

export type RoasterFormState = {
  name: string;
  slug: string;
  legal_name: string;
  short_description: string;
  description: string;
  story: string;

  logo_url: string;
  hero_image_url: string;
  website_url: string;
  instagram_handle: string;

  contact_email: string;
  contact_phone: string;

  street: string;
  street_additional: string;
  postal_code: string;
  city: string;
  region: string;
  country: string;
  vat_number: string;

  status: "onboarding" | "active" | "paused" | "inactive";
};

export function emptyRoasterForm(): RoasterFormState {
  return {
    name: "",
    slug: "",
    legal_name: "",
    short_description: "",
    description: "",
    story: "",
    logo_url: "",
    hero_image_url: "",
    website_url: "",
    instagram_handle: "",
    contact_email: "",
    contact_phone: "",
    street: "",
    street_additional: "",
    postal_code: "",
    city: "",
    region: "",
    country: "CH",
    vat_number: "",
    status: "onboarding",
  };
}

export type RoasterValidationIssue = {
  field: keyof RoasterFormState;
  severity: "error" | "warn";
  message: string;
};

export function validateRoaster(r: RoasterFormState): RoasterValidationIssue[] {
  const issues: RoasterValidationIssue[] = [];

  if (!r.name.trim()) {
    issues.push({ field: "name", severity: "error", message: "Anzeigename ist Pflicht." });
  }
  if (!r.slug.trim()) {
    issues.push({ field: "slug", severity: "error", message: "Slug ist Pflicht." });
  } else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(r.slug)) {
    issues.push({
      field: "slug",
      severity: "error",
      message:
        "Slug nur kleine Buchstaben, Zahlen und Bindestriche (kein Leerzeichen, kein Umlaut).",
    });
  }
  if (r.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.contact_email)) {
    issues.push({
      field: "contact_email",
      severity: "warn",
      message: "E-Mail-Adresse sieht nicht plausibel aus.",
    });
  }
  if (r.website_url && !/^https?:\/\//i.test(r.website_url)) {
    issues.push({
      field: "website_url",
      severity: "warn",
      message: "Website-URL sollte mit http:// oder https:// beginnen.",
    });
  }
  if (r.logo_url && !/^https?:\/\//i.test(r.logo_url)) {
    issues.push({
      field: "logo_url",
      severity: "warn",
      message: "Logo-URL sollte mit http:// oder https:// beginnen.",
    });
  }
  if (r.hero_image_url && !/^https?:\/\//i.test(r.hero_image_url)) {
    issues.push({
      field: "hero_image_url",
      severity: "warn",
      message: "Hero-Bild-URL sollte mit http:// oder https:// beginnen.",
    });
  }
  if (r.short_description.length > 200) {
    issues.push({
      field: "short_description",
      severity: "warn",
      message: `Kurzbeschreibung sehr lang (${r.short_description.length} Zeichen) — ideal sind 1–2 Sätze.`,
    });
  }

  return issues;
}

export function slugifyRoaster(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
