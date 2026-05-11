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
 *   1. Nicht eingeloggt          -> /login?next=/admin/metrics
 *   2. Eingeloggt, kein Admin    -> /account/dashboard
 *   3. Admin, keine frische
 *      Re-Auth (>30 Min)         -> /admin/reauth?next=/admin/metrics
 *
 * /admin/reauth selbst liegt ausserhalb dieses Route-Groups und
 * triggert die Wand daher nicht — sonst Loop.
 *
 * Der next-Pfad ist hier hardcoded auf /admin/metrics. Wenn wir mehr
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
  if (!user) redirect("/login?next=/admin/metrics");
  if (!(await isAdminReauthValid())) {
    redirect("/admin/reauth?next=/admin/metrics");
  }

  return (
    <div className="bg-[#F9F5F0] text-on-surface min-h-screen pb-20">
      <header className="fixed top-0 w-full z-50 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5 overflow-hidden">
        <nav className="flex justify-between items-center max-w-7xl mx-auto px-6 md:px-8 w-full">
          <Link href="/" className="flex items-center">
            <img
              alt="Coffee Selection"
              className="h-56 md:h-72 w-auto object-contain -my-10 md:-my-16"
              src={LOGO}
            />
          </Link>
          <div className="flex items-center gap-6">
            <span className="font-headline text-[10px] uppercase tracking-[0.3em] text-tertiary font-bold">
              Admin · {user.email}
            </span>
          </div>
        </nav>
      </header>

      <main className="pt-36 md:pt-40 max-w-7xl mx-auto px-6 md:px-8">
        <AdminTabs />
        {children}
      </main>
    </div>
  );
}
