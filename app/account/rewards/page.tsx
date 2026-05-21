import { redirect } from "next/navigation";
import Link from "next/link";
import AccountLayout, { PageHeader } from "@/components/AccountLayout";
import { createClient } from "@/lib/supabase/server";
import { getCreditBalance, getCreditTransactions } from "@/lib/db/credits";

const REASON_LABEL: Record<string, string> = {
  referral_referrer: "Referral",
  referral_referee: "Willkommens-Bonus",
  loyalty_bonus: "Treuebonus",
  campaign_bonus: "Aktion",
  manual_credit: "Gutschrift",
  order_redemption: "Eingelöst",
  refund_reversal: "Refund",
  expiration: "Verfall",
  correction: "Korrektur",
};

// Statische Liste der Verdien-Wege — fuer die "So verdienst du mehr"-Box.
// Marketing-Kampagnen kommen NICHT hier rein (die laufen ueber Promo-Codes
// im Checkout, nicht automatisch).
const earnMethods = [
  {
    icon: "share",
    title: "Freunde werben",
    reward: "CHF 10",
    desc: "Pro neuem Mitglied das eine Bestellung aufgibt",
  },
  {
    icon: "loyalty",
    title: "Treue belohnt",
    reward: "CHF 10",
    desc: "Bei jeder 10. Bestellung automatisch gutgeschrieben",
  },
  {
    icon: "redeem",
    title: "Marketing-Aktionen",
    reward: "variabel",
    desc: "Promo-Codes aus Newsletter, Instagram & Partner-Aktionen — beim Checkout einlösen",
  },
];

export default async function RewardsPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/account/rewards");

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", auth.user.id)
    .single();
  if (!customer) redirect("/login");

  const [balance, transactions] = await Promise.all([
    getCreditBalance(supabase, customer.id),
    getCreditTransactions(supabase, customer.id, 50),
  ]);

  return (
    <AccountLayout>
      <PageHeader
        subtitle="Rewards"
        title="Dein Guthaben"
        description="Verdient durch Empfehlungen, Treue und Marketing-Aktionen. Einlösbar bei jeder Bestellung."
      />

      {/* Balance Hero */}
      <div className="bg-tertiary text-primary p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="font-headline text-[10px] uppercase tracking-widest font-bold block mb-2">
            Aktuelles Guthaben
          </span>
          <p className="font-headline font-bold text-5xl md:text-7xl uppercase tracking-tight">
            CHF {balance.toFixed(2)}
          </p>
          <p className="text-sm mt-3">
            {balance > 0
              ? "Wird automatisch bei deiner nächsten Bestellung abgezogen."
              : "Sobald du Empfehlungen einlöst oder Aktionen mitmachst, erscheint dein Guthaben hier."}
          </p>
        </div>
        <Link
          href="/coffee"
          className="bg-primary text-on-primary px-8 py-4 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all whitespace-nowrap"
        >
          Jetzt einsetzen
        </Link>
      </div>

      {/* How to earn */}
      <div className="bg-white p-6 md:p-8 shadow-sm">
        <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-6">
          So verdienst du mehr
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {earnMethods.map((m) => (
            <div
              key={m.title}
              className="bg-surface-container-low p-5 flex items-start gap-4"
            >
              <span className="material-symbols-outlined text-tertiary text-2xl shrink-0">
                {m.icon}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-headline font-bold text-primary uppercase tracking-tight text-sm">
                    {m.title}
                  </h4>
                  <span className="font-headline text-tertiary uppercase tracking-widest text-sm font-bold">
                    {m.reward}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white p-6 md:p-8 shadow-sm">
        <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-6">
          Transaktionen
        </h3>
        {transactions.length === 0 ? (
          <p className="text-sm text-on-surface-variant">
            Noch keine Buchungen. Empfehle einen Freund oder löse einen Aktions-Code ein, dann erscheinen sie hier.
          </p>
        ) : (
          <div className="divide-y divide-surface-container">
            {transactions.map((t) => (
              <div
                key={t.id}
                className="py-4 grid grid-cols-[auto_1fr_auto] gap-3 items-center"
              >
                <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant w-24">
                  {t.date}
                </span>
                <div>
                  <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold block">
                    {REASON_LABEL[t.reason] ?? t.reason}
                  </span>
                  <p className="text-sm text-primary">{t.description ?? ""}</p>
                </div>
                <span
                  className={`font-headline font-bold ${
                    t.amount_chf >= 0 ? "text-tertiary" : "text-on-surface-variant"
                  }`}
                >
                  {t.amount_chf >= 0 ? "+" : ""}CHF {t.amount_chf.toFixed(2)}
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
