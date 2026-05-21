import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin/auth";
import { refreshAdminReauthCookie } from "@/lib/admin/reauth";
import { createServiceClient } from "@/lib/supabase/service";

// POST /api/admin/roasters/[id]/users
//   Body: { email: string, role: 'owner' | 'editor' }
//   Aktion:
//     1. Prueft ob User mit der E-Mail schon existiert.
//        Ja  -> verknuepft ihn nur (kein Invite-Mail).
//        Nein -> ruft supabase.auth.admin.inviteUserByEmail()
//                -> Supabase verschickt Set-Password-Link.
//     2. Insert in roaster_users mit (user_id, roaster_id, role,
//        created_by=admin).
//   Output: { ok: true, invited: bool, user_id }

const UUID_LOOSE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BodySchema = z.object({
  email: z.string().email().max(200),
  role: z.enum(["owner", "editor"]).default("editor"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roasterId } = await params;
  if (!UUID_LOOSE.test(roasterId)) {
    return NextResponse.json({ error: "invalid_roaster_id" }, { status: 400 });
  }

  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await refreshAdminReauthCookie())) {
    return NextResponse.json({ error: "reauth_required" }, { status: 401 });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: "invalid_body", details: err instanceof z.ZodError ? err.issues : String(err) },
      { status: 400 }
    );
  }

  const sb = createServiceClient();

  // 1) Roesterei muss existieren
  const { data: roaster } = await sb
    .from("roasters")
    .select("id")
    .eq("id", roasterId)
    .single();
  if (!roaster) {
    return NextResponse.json({ error: "roaster_not_found" }, { status: 404 });
  }

  // 2) User suchen — listUsers ist paginiert, also linear durchgehen.
  const emailLower = body.email.toLowerCase();
  let existingUserId: string | null = null;
  let page = 1;
  while (page <= 20) {
    const { data: usrs, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !usrs) break;
    const hit = usrs.users.find((u) => (u.email ?? "").toLowerCase() === emailLower);
    if (hit) {
      existingUserId = hit.id;
      break;
    }
    if (usrs.users.length < 200) break;
    page++;
  }

  let userId: string;
  let invited = false;
  if (existingUserId) {
    userId = existingUserId;
  } else {
    // Neuer User -> Invite-Mail. Redirect zur Roaster-Login-Seite nach
    // Set-Password.
    const { data: invite, error: invErr } = await sb.auth.admin.inviteUserByEmail(
      body.email,
      {
        redirectTo:
          (process.env.NEXT_PUBLIC_SITE_URL ?? "") + "/roaster/login",
      }
    );
    if (invErr || !invite?.user) {
      return NextResponse.json(
        { error: "invite_failed", details: invErr?.message ?? "unknown" },
        { status: 500 }
      );
    }
    userId = invite.user.id;
    invited = true;
  }

  // 3) Verknuepfung in roaster_users — upsert damit doppelte Eintraege
  //    nicht 500en.
  const { error: linkErr } = await sb
    .from("roaster_users")
    .upsert(
      {
        user_id: userId,
        roaster_id: roasterId,
        role: body.role,
        created_by: admin.id,
      },
      { onConflict: "user_id,roaster_id" }
    );
  if (linkErr) {
    return NextResponse.json(
      { error: "link_failed", details: linkErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, invited, user_id: userId });
}
