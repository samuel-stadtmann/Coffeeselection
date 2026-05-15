import { redirect } from "next/navigation";
import Link from "next/link";
import AccountLayout, { PageHeader } from "@/components/AccountLayout";
import { createClient } from "@/lib/supabase/server";
import { ensureReferralCode, getReferralsForReferrer } from "@/lib/db/credits";
import ReferralActions from "./ReferralActions";

const REFERRER_REWARD_CHF = 10;
const SITE_BASE = "https://staging.coffeeselection.ch";

export default async function ReferralsPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/account/referrals");

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", auth.user.id)
    .single();
  if (!customer) redirect("/login");

  const code = await ensureReferralCode(supabase, customer.id);
  const url = code ? `${SITE_BASE}/r/${code}` : null;
  const referrals = await getReferralsForReferrer(supabase, customer.id);

  const totalReferred = referrals.length;
  const qualified = referrals.filter((r) => r.qualified).length;
  const earned = referrals
    .filter((r) => r.qualified || r.status === "rewarded")
    .reduce((sum, r) => sum + r.reward_chf, 0);

  return (
    <AccountLayout>
      <PageHeader
        subtitle="Referrals"
        title="Empfehle Coffee Selection"
        description={`Teile deinen Code mit Freunden — du erhältst CHF ${REFERRER_REWARD_CHF} Guthaben pro neuem Mitglied, dein Freund einen Willkommens-Bonus auf die erste Bestellung.`}
      />

      {/* Hero Card */}
      <div className="bg-primary text-on-primary p-8 md:p-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2">
            <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold block mb-2">
              Dein persönlicher Code
            </span>
            <p className="font-headline font-bold text-3xl md:text-5xl text-tertiary uppercase tracking-tight mb-4">
              {code ?? "—"}
            </p>
            <p className="text-on-primary/70 text-sm">
              Teile diesen Code oder den Link unten. Pro neuem Mitglied: CHF{" "}
              {REFERRER_REWARD_CHF} für dich.
            </p>
          </div>
          {code && url && <ReferralActions code={code} url={url} />}
        </div>
        {url && (
          <p className="text-xs font-headline text-on-primary/60 uppercase tracking-widest mt-6 break-all">
            Link: {url}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Geworben", value: String(totalReferred), icon: "group_add" },
          { label: "Qualifiziert", value: String(qualified), icon: "check_circle" },
          { label: "Verdient", value: `CHF ${earned.toFixed(0)}`, icon: "payments" },
        ].map((s) => (
          <div key={s.label} className="bg-white p-6 shadow-sm">
            <span className="material-symbols-outlined text-tertiary text-2xl mb-3 block">
              {s.icon}
            </span>
            <p className="font-headline font-bold text-primary text-2xl uppercase tracking-tight">
              {s.value}
            </p>
            <p className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="bg-white p-6 md:p-8 shadow-sm">
        <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-6">
          Geworbene Freunde
        </h3>
        {referrals.length === 0 ? (
          <p className="text-sm text-on-surface-variant">
            Noch keine Empfehlungen. Sobald jemand mit deinem Code bestellt, erscheint sie hier.
          </p>
        ) : (
          <div className="divide-y divide-surface-container">
            {referrals.map((r) => (
              <div
                key={r.id}
                className="py-4 grid grid-cols-3 gap-3 items-center"
              >
                <div>
                  <p className="font-headline font-bold text-primary uppercase tracking-tight">
                    {r.name}
                  </p>
                  <p className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant">
                    {r.date}
                  </p>
                </div>
                <span
                  className={`font-headline text-[10px] uppercase tracking-widest font-bold justify-self-center px-3 py-1 ${
                    r.qualified || r.status === "rewarded"
                      ? "bg-tertiary/15 text-tertiary"
                      : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {r.qualified || r.status === "rewarded"
                    ? "Eingelöst"
                    : r.status === "signed_up"
                    ? "Registriert"
                    : "Pending"}
                </span>
                <span className="font-headline font-bold text-primary justify-self-end">
                  {r.qualified || r.status === "rewarded"
                    ? `CHF ${r.reward_chf.toFixed(0)}`
                    : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Link
        href="/account/dashboard"
        className="font-headline text-[11px] uppercase tracking-[0.2em] text-tertiary hover:text-primary transition-colors border-b-2 border-tertiary pb-1 inline-block"
      >
        ← Zurück zum Dashboard
      </Link>
    </AccountLayout>
  );
}
