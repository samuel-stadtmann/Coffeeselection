import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getRoasterUser } from "@/lib/roaster/auth";
import { createServiceClient } from "@/lib/supabase/service";
import RoasterTabs from "@/components/roaster/RoasterTabs";
import LogoutButton from "@/components/roaster/LogoutButton";

const LOGO = "/logo.png";

/**
 * Auth-Wand fuer den Roaster-Self-Service-Bereich.
 *   1. Nicht eingeloggt          -> /roaster/login?next=/...
 *   2. Eingeloggt aber kein
 *      roaster_users-Eintrag      -> /roaster/login?error=not_roaster
 *
 * /roaster/login selbst liegt ausserhalb der (authenticated)-Gruppe
 * und triggert daher den Wall nicht.
 */
export default async function RoasterAuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Erst: User eingeloggt?
  const sb = await createClient();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) redirect("/roaster/login");

  // Dann: Roester-Membership?
  const roasterUser = await getRoasterUser();
  if (!roasterUser) {
    // User existiert, aber kein roaster_users-Eintrag.
    redirect("/roaster/login?error=not_roaster");
  }

  // Roesterei-Namen fuer den Header laden — bei mehreren Memberships
  // zeigen wir alle, primaer aber die erste.
  const svc = createServiceClient();
  const { data: roasters } = await svc
    .from("roasters")
    .select("id, name, slug")
    .in(
      "id",
      roasterUser.memberships.map((m) => m.roaster_id)
    );

  const primaryRoaster = roasters?.[0];

  return (
    <div className="bg-[#F9F5F0] text-on-surface min-h-screen pb-20">
      {/* Einheitlicher Header — feste Hoehe, overflow-hidden nur am Logo. */}
      <header className="fixed top-0 w-full z-50 h-20 md:h-24 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5">
        <nav className="flex justify-between items-center gap-3 h-full max-w-7xl mx-auto px-6 md:px-8 w-full">
          <Link href="/" className="flex items-center shrink-0 h-full overflow-hidden">
            <img
              alt="Coffee Selection"
              className="h-24 sm:h-32 md:h-40 lg:h-44 w-auto object-contain object-left"
              src={LOGO}
            />
          </Link>
          <div className="flex items-center gap-3 md:gap-6 shrink-0 min-w-0">
            <div className="flex flex-col items-end min-w-0">
              <span className="font-headline text-[10px] uppercase tracking-[0.3em] text-tertiary font-bold truncate max-w-[40vw]">
                {primaryRoaster?.name ?? "Röster-Portal"}
              </span>
              <span className="text-[10px] text-on-surface-variant truncate max-w-[40vw]">
                {roasterUser.email}
              </span>
            </div>
            <LogoutButton />
          </div>
        </nav>
      </header>

      <main className="pt-20 md:pt-24 max-w-7xl mx-auto px-6 md:px-8">
        <RoasterTabs />
        {children}
      </main>
    </div>
  );
}
