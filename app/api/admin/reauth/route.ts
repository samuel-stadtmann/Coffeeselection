import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient as createPlainClient } from "@supabase/supabase-js";
import { getAdminUser } from "@/lib/admin/auth";
import { setAdminReauthCookie } from "@/lib/admin/reauth";

// POST /api/admin/reauth
//   Body: { password: string }
//   Validiert das Passwort des aktuell eingeloggten Admin-Users gegen
//   Supabase Auth. Bei Erfolg: setzt das admin-reauth Cookie (30 Min TTL)
//   und liefert 200. Die eigentliche Session bleibt unveraendert — wir
//   validieren nur, wir tauschen keinen Token aus.

const BodySchema = z.object({ password: z.string().min(1).max(128) });

export async function POST(req: NextRequest) {
  let body: { password: string };
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const user = await getAdminUser();
  if (!user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Fresh anon-key client OHNE persistSession — der validiert das Passwort
  // gegen Supabase Auth ohne die Cookie-basierte Hauptsession anzufassen.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }
  const validator = createPlainClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await validator.auth.signInWithPassword({
    email: user.email,
    password: body.password,
  });
  if (error) {
    return NextResponse.json({ error: "invalid_password" }, { status: 401 });
  }

  await setAdminReauthCookie();
  return NextResponse.json({ ok: true });
}
