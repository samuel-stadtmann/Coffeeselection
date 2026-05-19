import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Alle Routen ausser Static, Image-Optimization, Favicon und
    // Sentry-Tunnel-Route (/monitoring proxied an Sentry, soll NICHT
    // durch updateSession laufen — ist kein User-Request).
    "/((?!monitoring|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
