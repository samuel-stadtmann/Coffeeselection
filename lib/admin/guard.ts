import { redirect } from "next/navigation";
import { getAdminUser } from "./auth";
import { isAdminReauthValid } from "./reauth";

/**
 * Auth-Wand fuer alle Admin-Seiten (Layout-Level call).
 *
 * Drei Stufen:
 *   1. Nicht eingeloggt          -> /login?next=<currentPath>
 *   2. Eingeloggt, kein Admin    -> /account/dashboard (kein Loop)
 *   3. Admin, aber keine frische
 *      Re-Auth                   -> /admin/reauth?next=<currentPath>
 *
 * Liefert den auth.User-Datensatz zurueck wenn alle Stufen ok sind —
 * Caller kann z.B. user.email rendern.
 *
 * Der currentPath wird vom Caller mit reingereicht weil Next.js'
 * usePathname() nur client-seitig verfuegbar ist und Layouts keine
 * Request-Header-Info bekommen ohne middleware.
 */
export async function guardAdminAccess(currentPath: string) {
  // Re-Auth-Seite selbst darf nicht durch die Wand — sonst Loop.
  // Caller (Layout) ueberspringt den Call dort.
  const user = await getAdminUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(currentPath)}`);
  if (!(await isAdminReauthValid())) {
    redirect(`/admin/reauth?next=${encodeURIComponent(currentPath)}`);
  }
  return user;
}
