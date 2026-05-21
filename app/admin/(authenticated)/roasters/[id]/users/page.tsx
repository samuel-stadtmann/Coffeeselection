import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import InviteUserForm from "./InviteUserForm";
import RemoveUserButton from "./RemoveUserButton";

export const metadata: Metadata = {
  title: "Admin · Röster-User — Coffee Selection",
  robots: { index: false, follow: false },
};

type RoasterUserRow = {
  user_id: string;
  role: "owner" | "editor";
  created_at: string;
  email: string | null;
};

export default async function AdminRoasterUsersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sb = createServiceClient();

  const { data: roaster } = await sb
    .from("roasters")
    .select("id, name, slug")
    .eq("id", id)
    .single();
  if (!roaster) notFound();

  // roaster_users + auth.users.email via auth.admin.listUsers (Service-Role).
  const { data: links } = await sb
    .from("roaster_users")
    .select("user_id, role, created_at")
    .eq("roaster_id", id);

  // Auth-Emails laden — paginiert geholt, dann lokal gefiltert.
  const linkIds = new Set((links ?? []).map((l) => l.user_id));
  const emailById = new Map<string, string | null>();
  if (linkIds.size > 0) {
    let page = 1;
    while (true) {
      const { data: u, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
      if (error || !u) break;
      for (const usr of u.users) {
        if (linkIds.has(usr.id)) emailById.set(usr.id, usr.email ?? null);
      }
      if (u.users.length < 200) break;
      page++;
      if (page > 20) break; // Sicherheitsanker
    }
  }

  const rows: RoasterUserRow[] = (links ?? []).map((l) => ({
    user_id: l.user_id as string,
    role: l.role as "owner" | "editor",
    created_at: l.created_at as string,
    email: emailById.get(l.user_id as string) ?? null,
  }));

  return (
    <>
      <div className="mb-8">
        <Link
          href="/admin/roasters"
          className="font-headline text-[10px] uppercase tracking-widest text-tertiary hover:text-primary inline-block mb-4"
        >
          ← Zurück zu allen Röstern
        </Link>
        <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
          Partner · Portal-Zugriff
        </span>
        <h1 className="text-4xl md:text-5xl text-primary uppercase tracking-tight font-headline font-bold mb-2">
          {roaster.name} · User
        </h1>
        <p className="text-on-surface-variant text-sm max-w-2xl">
          {rows.length} User mit Portal-Zugang. Neue User per E-Mail einladen
          — Supabase verschickt eine Set-Password-Mail an die Adresse.
        </p>
      </div>

      <div className="bg-white shadow-sm p-6 mb-8">
        <h2 className="font-headline text-[11px] uppercase tracking-widest font-bold text-tertiary mb-4">
          Neuen User einladen
        </h2>
        <InviteUserForm roasterId={id} />
      </div>

      <div className="bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left font-headline text-[10px] uppercase tracking-widest text-tertiary border-b border-primary/10 bg-surface-container-low">
            <tr>
              <th className="px-4 py-3 font-bold">E-Mail</th>
              <th className="px-4 py-3 font-bold">Rolle</th>
              <th className="px-4 py-3 font-bold">Hinzugefügt</th>
              <th className="px-4 py-3 font-bold text-right">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.user_id} className="border-b border-primary/5">
                <td className="px-4 py-3 font-mono text-xs">{r.email ?? r.user_id}</td>
                <td className="px-4 py-3">
                  <span className="font-headline text-[10px] uppercase tracking-widest font-bold px-2 py-1 bg-stone-100 text-stone-700">
                    {r.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-on-surface-variant">
                  {new Date(r.created_at).toLocaleDateString("de-CH")}
                </td>
                <td className="px-4 py-3 text-right">
                  <RemoveUserButton roasterId={id} userId={r.user_id} email={r.email ?? ""} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-on-surface-variant italic"
                >
                  Noch kein User für diese Rösterei. Lade jemanden ein.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
