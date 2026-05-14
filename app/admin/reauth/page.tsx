import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getAdminUser } from "@/lib/admin/auth";
import { isAdminReauthValid } from "@/lib/admin/reauth";
import ReauthForm from "./ReauthForm";

const LOGO = "/logo.png";

export const metadata: Metadata = {
  title: "Admin · Re-Login — Coffee Selection",
  robots: { index: false, follow: false },
};

/**
 * Re-Authentication-Seite. Wer hier landet ist:
 *   - eingeloggt (sonst Layout/Guard redirected nach /login)
 *   - Admin (sonst nach /account/dashboard)
 *   - hat KEINE frische Re-Auth (sonst sofortiger Redirect zu next)
 *
 * Form unten ist Client-Component (ReauthForm) — Passwort + Submit.
 */
export default async function AdminReauthPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = next && next.startsWith("/admin") ? next : "/admin/metrics";

  // Auth-Pre-Check: nicht eingeloggt -> /login; nicht admin -> /account/dashboard.
  const user = await getAdminUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(target)}`);

  // Schon frische Re-Auth? Direkt durchwinken.
  if (await isAdminReauthValid()) redirect(target);

  return (
    <div className="bg-[#F9F5F0] min-h-screen flex flex-col">
      <header className="fixed top-0 w-full z-50 h-20 md:h-24 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5">
        <div className="flex justify-between items-center gap-3 h-full max-w-7xl mx-auto px-6 md:px-8 w-full">
          <Link href="/" className="flex items-center shrink-0 h-full overflow-hidden">
            <img alt="Coffee Selection" className="h-24 sm:h-32 md:h-40 lg:h-44 w-auto object-contain object-left" src={LOGO} />
          </Link>
          <Link href="/" className="font-headline text-[11px] uppercase tracking-[0.3em] text-primary hover:text-tertiary transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-base">close</span>
            <span className="hidden sm:inline">Beenden</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center pt-20 md:pt-24 pb-16 px-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
              Admin · Re-Login
            </span>
            <h1 className="text-3xl md:text-4xl text-primary leading-[1.1] mb-4 uppercase tracking-tight font-headline font-bold">
              Passwort bestätigen
            </h1>
            <p className="text-sm text-on-surface-variant">
              Für den Admin-Bereich brauchen wir einen frischen Passwort-Beweis.
              <br />
              Eingeloggt als <strong>{user.email}</strong>. Gültig danach 30 Min.
            </p>
          </div>

          <ReauthForm email={user.email ?? ""} next={target} />
        </div>
      </main>
    </div>
  );
}
