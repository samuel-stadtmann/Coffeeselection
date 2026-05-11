import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin/auth";
import { isAdminReauthValid } from "@/lib/admin/reauth";
import { createServiceClient } from "@/lib/supabase/service";

// POST /api/admin/coffees/[id]/verify
//   Body: { action: 'verify' | 'unverify' }
//   Setzt coffees.data_verified_at + .data_verified_by entsprechend.
//   Trigger trg_coffees_verification_bonus aktualisiert
//   data_quality_score (+/- 2).
//
//   Auth: nur eingeloggte Admin-User mit gueltiger Re-Auth.

const UUID_LOOSE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BodySchema = z.object({ action: z.enum(["verify", "unverify"]) });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!UUID_LOOSE.test(id)) {
    return NextResponse.json({ error: "invalid_coffee_id" }, { status: 400 });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await isAdminReauthValid())) {
    return NextResponse.json({ error: "reauth_required" }, { status: 401 });
  }

  const sb = createServiceClient();
  const update =
    body.action === "verify"
      ? { data_verified_at: new Date().toISOString(), data_verified_by: user.id }
      : { data_verified_at: null, data_verified_by: null };

  const { error } = await sb.from("coffees").update(update).eq("id", id);
  if (error) {
    return NextResponse.json({ error: "update_failed", details: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, action: body.action });
}
