import { NextResponse, type NextRequest } from "next/server";
import { getAdminUser } from "@/lib/admin/auth";
import { refreshAdminReauthCookie } from "@/lib/admin/reauth";
import { createServiceClient } from "@/lib/supabase/service";

// DELETE /api/admin/roasters/[id]/users/[userId]
//   Entfernt einen User aus der Roaster-Verknuepfung. Der Auth-Account
//   bleibt bestehen — der User verliert nur den Zugriff auf diese
//   spezifische Roesterei.

const UUID_LOOSE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const { id: roasterId, userId } = await params;
  if (!UUID_LOOSE.test(roasterId) || !UUID_LOOSE.test(userId)) {
    return NextResponse.json({ error: "invalid_ids" }, { status: 400 });
  }

  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await refreshAdminReauthCookie())) {
    return NextResponse.json({ error: "reauth_required" }, { status: 401 });
  }

  const sb = createServiceClient();
  const { error } = await sb
    .from("roaster_users")
    .delete()
    .eq("roaster_id", roasterId)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json(
      { error: "delete_failed", details: error.message },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
