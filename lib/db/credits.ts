import type { SupabaseClient } from "@supabase/supabase-js";

export type CreditTransaction = {
  id: string;
  date: string;
  amount_chf: number;
  reason: string;
  description: string | null;
};

export type Campaign = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  credit_chf: number;
  max_uses_per_customer: number;
  max_total_uses: number | null;
  current_uses: number;
  valid_from: string;
  valid_until: string | null;
  active: boolean;
  channel: string | null;
  notes: string | null;
  created_at: string;
};

/** Aktueller CHF-Guthaben-Saldo (via SQL-Funktion). */
export async function getCreditBalance(
  supabase: SupabaseClient,
  customerId: string
): Promise<number> {
  const { data } = await supabase.rpc("customer_credit_balance", {
    p_customer_id: customerId,
  });
  return data != null ? Number(data) : 0;
}

/** Letzte N Buchungen — fuer die Transaktions-Liste auf /account/rewards. */
export async function getCreditTransactions(
  supabase: SupabaseClient,
  customerId: string,
  limit = 50
): Promise<CreditTransaction[]> {
  const { data } = await supabase
    .from("customer_credits")
    .select("id, created_at, amount_chf, reason, description, description_de")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as Array<{
    id: string;
    created_at: string;
    amount_chf: number;
    reason: string;
    description: string | null;
    description_de: string | null;
  }>).map((r) => ({
    id: r.id,
    date: new Date(r.created_at).toLocaleDateString("de-CH"),
    amount_chf: Number(r.amount_chf),
    reason: r.reason,
    description: r.description_de ?? r.description,
  }));
}

/** Generiert einen 6–8-stelligen Code aus Vor-/Nachname + 4 Zufallszeichen. */
function makeReferralCode(firstName: string | null, lastName: string | null): string {
  const base =
    (firstName ?? "").replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase() ||
    (lastName ?? "").replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase() ||
    "CS";
  // 4 random base32-ish Zeichen (ohne 0/O/1/I — verwechslungsarm)
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return base + suffix;
}

/**
 * Liest den persoenlichen Referral-Code des Kunden, generiert bei
 * Bedarf einen neuen und persistiert ihn. Bei Kollision (unique
 * violation) wird bis zu 5x neu probiert.
 */
export async function ensureReferralCode(
  supabase: SupabaseClient,
  customerId: string
): Promise<string | null> {
  const { data: customer } = await supabase
    .from("customers")
    .select("referral_code, first_name, last_name")
    .eq("id", customerId)
    .maybeSingle();
  if (!customer) return null;
  if (customer.referral_code) return customer.referral_code;

  // Lazy-Generation
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = makeReferralCode(customer.first_name, customer.last_name);
    const { error } = await supabase
      .from("customers")
      .update({ referral_code: code })
      .eq("id", customerId)
      .is("referral_code", null); // Race-Schutz: nur wenn noch null
    if (!error) {
      // Re-read um sicher zu sein (in race conditions koennte ein anderes
      // Request den Code geschrieben haben).
      const { data: re } = await supabase
        .from("customers")
        .select("referral_code")
        .eq("id", customerId)
        .maybeSingle();
      return re?.referral_code ?? code;
    }
    // 23505 = unique_violation -> retry mit neuem Code
  }
  return null;
}

/** Liste der Empfehlungen (als Werber) — fuer /account/referrals. */
export async function getReferralsForReferrer(
  supabase: SupabaseClient,
  customerId: string
) {
  const { data } = await supabase
    .from("referrals")
    .select(
      `id, status, created_at, qualified_at, reward_referrer_chf,
       referee:customers!referrals_referee_customer_id_fkey(first_name, last_name)`
    )
    .eq("referrer_customer_id", customerId)
    .order("created_at", { ascending: false });
  return ((data ?? []) as Array<{
    id: string;
    status: string;
    created_at: string;
    qualified_at: string | null;
    reward_referrer_chf: number;
    referee:
      | { first_name: string | null; last_name: string | null }
      | { first_name: string | null; last_name: string | null }[]
      | null;
  }>).map((r) => {
    const referee = Array.isArray(r.referee) ? r.referee[0] : r.referee;
    const initial = referee?.first_name?.slice(0, 1) ?? "?";
    const last = referee?.last_name?.slice(0, 1) ?? "";
    return {
      id: r.id,
      name: referee
        ? `${referee.first_name ?? ""} ${last ? last + "." : ""}`.trim()
        : "Ausstehend",
      initial: initial + last,
      date: new Date(r.created_at).toLocaleDateString("de-CH"),
      status: r.status,
      qualified: r.qualified_at != null,
      reward_chf: Number(r.reward_referrer_chf),
    };
  });
}
