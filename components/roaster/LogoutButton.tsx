"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function logout() {
    startTransition(async () => {
      const sb = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      await sb.auth.signOut();
      router.push("/roaster/login");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={pending}
      className="font-headline text-[10px] uppercase tracking-widest font-bold text-on-surface-variant hover:text-primary transition-colors disabled:opacity-50"
    >
      {pending ? "…" : "Abmelden"}
    </button>
  );
}
