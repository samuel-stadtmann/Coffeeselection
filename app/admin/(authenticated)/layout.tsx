import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminUser } from "@/lib/admin/auth";
import { isAdminReauthValid } from "@/lib/admin/reauth";
import AdminTabs from "@/components/admin/AdminTabs";

const LOGO = "/logo.png";

/**
 * Auth-Wand fuer alle Admin-Sub-Routes die unter dem Route-Group
 * (authenticated) liegen. Drei Stufen:
 *
 *   1. Nicht eingeloggt          -> /login?next=/admin/dashboard
 *   2. Eingeloggt, kein Admin    -> /account/dashboard
 *   3. Admin, keine frische
 *      Re-Auth (>30 Min)         -> /admin/reauth?next=/admin/dashboard
 *
 * /admin/reauth selbst liegt ausserhalb dieses Route-Groups und
 * triggert die Wand daher nicht — sonst Loop.
 *
 * Der next-Pfad ist hier hardcoded auf /admin/dashboard. Wenn wir mehr
 * Tabs bekommen und die User direkt auf /admin/users etc. landen
 * lassen wollen, brauchen wir middleware-injizierte Header oder
 * eine clientseitige Capture der Original-URL.
 */
export default async function AdminAuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAdminUser();
  if (!user) redirect("/login?next=/admin/dashboard");
  if (!(await isAdminReauthValid())) {
    redirect("/admin/reauth?next=/admin/dashboard");
  }

  return (
    <div className="bg-[#F9F5F0] text-on-surface min-h-screen pb-20">
      {/* Einheitlicher Header — feste Hoehe, overflow-hidden nur am Logo. */}
      <header className="fixed top-0 w-full z-50 h-20 md:h-24 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5">
        <nav className="flex justify-between items-center gap-3 h-full max-w-7xl mx-auto px-6 md:px-8 w-full">
          <Link href="/" className="flex items-center shrink-0 h-full overflow-hidden">
            <img
              alt="Coffee Selection"
              className="h-12 sm:h-14 md:h-16 lg:h-20 w-auto object-contain object-left"
              src={LOGO}
            />
          </Link>
          <div className="flex items-center gap-6 shrink-0 min-w-0">
            <span className="font-headline text-[10px] uppercase tracking-[0.3em] text-tertiary font-bold truncate">
              Admin · {user.email}
            </span>
          </div>
        </nav>
      </header>

      <main className="pt-20 md:pt-24 max-w-7xl mx-auto px-6 md:px-8">
        <AdminTabs />
        {children}
      </main>
    </div>
  );
}
