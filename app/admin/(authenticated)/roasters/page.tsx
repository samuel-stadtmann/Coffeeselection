import Link from "next/link";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";

export const metadata: Metadata = {
  title: "Admin · Röster — Coffee Selection",
  robots: { index: false, follow: false },
};

type Roaster = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  user_count?: number;
};

export default async function AdminRoastersPage() {
  const sb = createServiceClient();
  const [{ data: roasters }, { data: users }] = await Promise.all([
    sb
      .from("roasters")
      .select("id, slug, name, city")
      .is("deleted_at", null)
      .order("name"),
    sb.from("roaster_users").select("roaster_id"),
  ]);

  const userCount = new Map<string, number>();
  (users ?? []).forEach((u: { roaster_id: string }) => {
    userCount.set(u.roaster_id, (userCount.get(u.roaster_id) ?? 0) + 1);
  });

  const rows = ((roasters ?? []) as Roaster[]).map((r) => ({
    ...r,
    user_count: userCount.get(r.id) ?? 0,
  }));

  return (
    <>
      <div className="mb-8">
        <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
          Partner · Verwaltung
        </span>
        <h1 className="text-4xl md:text-5xl text-primary uppercase tracking-tight font-headline font-bold mb-2">
          Röster
        </h1>
        <p className="text-on-surface-variant text-sm max-w-2xl">
          {rows.length} Röster im System ·{" "}
          {rows.filter((r) => r.user_count > 0).length} mit Portal-Zugang.
          Klick auf einen Röster um User einzuladen / zu verwalten.
        </p>
      </div>

      <div className="bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left font-headline text-[10px] uppercase tracking-widest text-tertiary border-b border-primary/10 bg-surface-container-low">
            <tr>
              <th className="px-4 py-3 font-bold">Röster</th>
              <th className="px-4 py-3 font-bold">Ort</th>
              <th className="px-4 py-3 font-bold">Portal-User</th>
              <th className="px-4 py-3 font-bold text-right">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-primary/5">
                <td className="px-4 py-3 font-bold">{r.name}</td>
                <td className="px-4 py-3 text-on-surface-variant">{r.city ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      "font-headline text-[10px] uppercase tracking-widest font-bold px-2 py-1 " +
                      (r.user_count === 0
                        ? "bg-stone-100 text-stone-700"
                        : "bg-emerald-100 text-emerald-800")
                    }
                  >
                    {r.user_count} User
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/roasters/${r.id}/users`}
                    className="font-headline text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 bg-primary text-on-primary hover:bg-black inline-block"
                  >
                    User verwalten
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-on-surface-variant italic"
                >
                  Noch keine Röster im System.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
