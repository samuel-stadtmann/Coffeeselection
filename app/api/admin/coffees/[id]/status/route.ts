import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin/auth";
import { isAdminReauthValid } from "@/lib/admin/reauth";
import { createServiceClient } from "@/lib/supabase/service";

// PATCH /api/admin/coffees/[id]/status
//   Body: { status: 'active' | 'draft' | 'paused' | 'discontinued' }
//   Genehmigt einen Coffee (= setzt status). Wird verwendet fuer:
//     - 'draft' -> 'active' (Genehmigen nach Review)
//     - 'active' -> 'paused' (vorübergehend offline)
//     - 'active' -> 'discontinued' (Auslauf)

const UUID_LOOSE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BodySchema = z.object({
  status: z.enum(["draft", "active", "paused", "discontinued"]),
});

export async function PATCH(
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
  const { error } = await sb.from("coffees").update({ status: body.status }).eq("id", id);
  if (error) {
    return NextResponse.json(
      { error: "update_failed", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, status: body.status });
}
