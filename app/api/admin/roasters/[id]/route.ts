import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin/auth";
import { refreshAdminReauthCookie } from "@/lib/admin/reauth";
import { createServiceClient } from "@/lib/supabase/service";

// PATCH /api/admin/roasters/[id]
//   Body: RoasterFormState — Stammdaten-Update.
//   Output: { ok: true, roaster_id }

const UUID_LOOSE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const BodySchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
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
  status: z.enum(["onboarding", "active", "paused", "inactive"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!UUID_LOOSE.test(id)) {
    return NextResponse.json({ error: "invalid_roaster_id" }, { status: 400 });
  }

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
  const payload = nullifyEmpty(parsed);
  const { error } = await sb.from("roasters").update(payload).eq("id", id);
  if (error) {
    return NextResponse.json(
      { error: "update_failed", details: error.message },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true, roaster_id: id });
}

function nullifyEmpty<T extends Record<string, unknown>>(o: T): T {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(o)) {
    const v = o[k];
    out[k] = typeof v === "string" && v.length === 0 ? null : v;
  }
  return out as T;
}
