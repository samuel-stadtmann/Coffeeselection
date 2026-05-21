"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/account/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/account/taste-profile", label: "Geschmacksprofil", icon: "psychology" },
  { href: "/account/subscription", label: "Mein Abo", icon: "autorenew" },
  { href: "/account/order-history", label: "Bestellungen", icon: "receipt_long" },
  { href: "/account/favorites", label: "Favoriten", icon: "favorite" },
  { href: "/account/recommendation-history", label: "Empfehlungen", icon: "auto_awesome" },
  { href: "/account/referrals", label: "Referrals", icon: "share" },
  { href: "/account/rewards", label: "Rewards", icon: "redeem" },
  { href: "/account/settings", label: "Einstellungen", icon: "settings" },
];

type Profile = { firstName: string | null; lastName: string | null; email: string };

export default function AccountSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data } = await supabase
        .from("customers")
        .select("first_name, last_name")
        .eq("auth_user_id", auth.user.id)
        .single();
      setProfile({
        firstName: data?.first_name ?? null,
        lastName: data?.last_name ?? null,
        email: auth.user.email ?? "",
      });
    })();
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const displayName =
    profile?.firstName && profile?.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : profile?.firstName || profile?.email.split("@")[0] || "—";

  return (
    <aside className="lg:sticky lg:top-28 lg:self-start lg:h-fit bg-white shadow-sm">
      <div className="p-6 border-b border-surface-container">
        <span className="font-headline text-[10px] uppercase tracking-[0.3em] text-on-surface-variant font-bold block mb-1">
          Mein Konto
        </span>
        <p className="font-headline font-bold text-primary uppercase tracking-tight">
          {displayName}
        </p>
        <p className="text-xs text-on-surface-variant mt-1 truncate">{profile?.email ?? ""}</p>
      </div>
      <nav className="py-2">
        {links.map((l) => {
          const active = pathname === l.href || (l.href !== "/account/dashboard" && pathname?.startsWith(l.href));
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 px-6 py-3 font-headline text-[12px] uppercase tracking-widest font-bold transition-all border-l-4 ${
                active
                  ? "border-tertiary bg-tertiary/5 text-primary"
                  : "border-transparent text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
              }`}
            >
              <span className="material-symbols-outlined text-lg">{l.icon}</span>
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-6 border-t border-surface-container">
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-2 font-headline text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-tertiary transition-colors font-bold disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-base">logout</span>
          {signingOut ? "Wird abgemeldet…" : "Abmelden"}
        </button>
      </div>
    </aside>
  );
}
