import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin/auth";
import { refreshAdminReauthCookie } from "@/lib/admin/reauth";
import { createServiceClient } from "@/lib/supabase/service";

// POST /api/admin/roasters
//   Body: RoasterFormState (siehe lib/roaster/form.ts)
//   Legt eine neue Rösterei an. Nach Erfolg verwendet der Admin
//   "User verwalten" um den ersten Portal-User einzuladen.
//   Output: { ok: true, roaster_id }

const BodySchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "invalid slug"),
  legal_name: z.string().max(200).optional().default(""),
  short_description: z.string().max(500).optional().default(""),
  description: z.string().max(5000).optional().default(""),
  story: z.string().max(20000).optional().default(""),
  logo_url: z.string().max(1000).optional().default(""),
  hero_image_url: z.string().max(1000).optional().default(""),
  website_url: z.string().max(1000).optional().default(""),
  instagram_handle: z.string().max(100).optional().default(""),
  contact_email: z.string().max(200).optional().default(""),
  contact_phone: z.string().max(100).optional().default(""),
  street: z.string().max(200).optional().default(""),
  street_additional: z.string().max(200).optional().default(""),
  postal_code: z.string().max(20).optional().default(""),
  city: z.string().max(100).optional().default(""),
  region: z.string().max(100).optional().default(""),
  country: z.string().max(2).default("CH"),
  vat_number: z.string().max(50).optional().default(""),
  status: z.enum(["onboarding", "active", "paused", "inactive"]).default("onboarding"),
});

export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await refreshAdminReauthCookie())) {
    return NextResponse.json({ error: "reauth_required" }, { status: 401 });
  }

  let parsed: z.infer<typeof BodySchema>;
  try {
    parsed = BodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: "invalid_body", details: err instanceof z.ZodError ? err.issues : String(err) },
      { status: 400 }
    );
  }

  const sb = createServiceClient();

  // Leere Strings auf null für nullable-Spalten (sauberere DB).
  const payload = nullifyEmpty(parsed);

  const { data: roaster, error } = await sb
    .from("roasters")
    .insert(payload)
    .select("id")
    .single();
  if (error || !roaster) {
    return NextResponse.json(
      { error: "insert_failed", details: error?.message ?? "unknown" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, roaster_id: roaster.id });
}

function nullifyEmpty<T extends Record<string, unknown>>(o: T): T {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(o)) {
    const v = o[k];
    out[k] = typeof v === "string" && v.length === 0 ? null : v;
  }
  return out as T;
}
