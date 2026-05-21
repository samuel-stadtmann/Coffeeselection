import { createClient } from "@/lib/supabase/server";

/**
 * Admin-E-Mails kommen aus der Env-Variable ADMIN_EMAILS (komma-getrennt).
 * Beispiel:  ADMIN_EMAILS=samuel@coffeeselection.ch,mattia@coffeeselection.ch
 *
 * Bewusst KEIN role-Modell in der DB — fuer ein paar interne Power-User
 * ist eine Env-Liste robuster und einfacher als ein RBAC-System.
 */
function adminEmailList(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmailList().includes(email.toLowerCase());
}

/**
 * Liefert den eingeloggten Admin-User (auth.User), oder null wenn entweder
 * nicht eingeloggt ODER die E-Mail nicht in der Admin-Liste steht.
 * Fuer Use auf Server-Components/Routes zur Auth-Wand.
 */
export async function getAdminUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  if (!isAdminEmail(data.user.email)) return null;
  return data.user;
}
