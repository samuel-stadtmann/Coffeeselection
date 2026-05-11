import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Liefert den eingeloggten User UND seine Roester-Zuordnungen.
 * Returnt null wenn entweder nicht eingeloggt ODER nicht in roaster_users.
 *
 * Wird vom Auth-Wall im /roaster-Layout aufgerufen — analog zu
 * getAdminUser() im Admin-Bereich.
 */
export type RoasterMembership = {
  roaster_id: string;
  role: "owner" | "editor";
};

export type RoasterUser = {
  id: string;
  email: string | null;
  memberships: RoasterMembership[];
};

export async function getRoasterUser(): Promise<RoasterUser | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;

  // Service-Role weil die RLS-Policy "user darf seine eigenen Eintraege
  // sehen" zwar greift, aber wir wollen hier 100% Vorhersagbarkeit auch
  // wenn ein Cookie-Refresh-Glitch dazwischen kommt.
  const sb = createServiceClient();
  const { data: rows, error } = await sb
    .from("roaster_users")
    .select("roaster_id, role")
    .eq("user_id", data.user.id);

  if (error || !rows || rows.length === 0) return null;

  return {
    id: data.user.id,
    email: data.user.email ?? null,
    memberships: rows.map((r) => ({
      roaster_id: r.roaster_id as string,
      role: r.role as "owner" | "editor",
    })),
  };
}

/**
 * Pruefen ob der eingeloggte User Zugriff auf einen bestimmten Roester
 * (z.B. fuer Coffee-Edit-Permission). Returnt die Rolle oder null.
 */
export async function getRoasterRole(roasterId: string): Promise<"owner" | "editor" | null> {
  const u = await getRoasterUser();
  if (!u) return null;
  const m = u.memberships.find((x) => x.roaster_id === roasterId);
  return m ? m.role : null;
}
