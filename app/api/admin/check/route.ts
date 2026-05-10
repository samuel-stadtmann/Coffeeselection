import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin/auth";

// GET /api/admin/check
//   Liefert {isAdmin: bool}. Wird vom Footer auf der Homepage genutzt um
//   den Admin-Link conditionell zu rendern, ohne die ADMIN_EMAILS-Liste an
//   den Client zu leaken.

export async function GET() {
  const user = await getAdminUser();
  return NextResponse.json(
    { isAdmin: !!user },
    {
      headers: {
        // Kurzes private-cache: Antwort bezieht sich auf die Session-Cookies.
        "Cache-Control": "private, max-age=30",
      },
    }
  );
}
