import type { SupabaseClient } from "@supabase/supabase-js";

const REFERRER_REWARD_CHF = 10;
const REFEREE_WELCOME_CHF = 10;
const LOYALTY_BONUS_CHF = 10;
const LOYALTY_EVERY_N_ORDERS = 10;

type PromoValidation =
  | {
      valid: true;
      type: "campaign";
      campaign_id: string;
      code: string;
      discount_chf: number;
      label: string;
    }
  | {
      valid: true;
      type: "referral";
      referrer_customer_id: string;
      code: string;
      discount_chf: number;
      label: string;
    }
  | {
      valid: false;
      reason: string;
    };

/**
 * Validiert einen Code im Checkout. Reihenfolge:
 *   1) marketing_campaigns (active, in valid range, current_uses < max_total_uses,
 *      und User hat ihn noch nicht max_uses_per_customer mal eingeloest)
 *   2) customers.referral_code (jemand anderes als der einloesende User)
 *
 * Gibt sofort {valid:false, reason} zurueck wenn der Code nicht passt —
 * der Caller kann den Grund anzeigen.
 */
export async function validatePromoCode(
  svc: SupabaseClient,
  code: string,
  customerId: string
): Promise<PromoValidation> {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return { valid: false, reason: "empty_code" };

  // 1) Kampagne
  const { data: campaign } = await svc
    .from("marketing_campaigns")
    .select(
      "id, code, name, credit_chf, max_uses_per_customer, max_total_uses, current_uses, valid_from, valid_until, active"
    )
    .eq("code", trimmed)
    .maybeSingle();
  if (campaign) {
    if (!campaign.active) return { valid: false, reason: "code_inactive" };
    const now = new Date();
    if (campaign.valid_from && new Date(campaign.valid_from) > now) {
      return { valid: false, reason: "code_not_yet_valid" };
    }
    if (campaign.valid_until && new Date(campaign.valid_until) < now) {
      return { valid: false, reason: "code_expired" };
    }
    if (
      campaign.max_total_uses != null &&
      campaign.current_uses >= campaign.max_total_uses
    ) {
      return { valid: false, reason: "code_fully_redeemed" };
    }
    // Wie oft hat dieser User den Code schon eingeloest?
    const { count: usesByCustomer } = await svc
      .from("customer_credits")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", customerId)
      .eq("campaign_id", campaign.id);
    if ((usesByCustomer ?? 0) >= campaign.max_uses_per_customer) {
      return { valid: false, reason: "code_already_used_by_you" };
    }
    return {
      valid: true,
      type: "campaign",
      campaign_id: campaign.id,
      code: campaign.code,
      discount_chf: Number(campaign.credit_chf),
      label: campaign.name,
    };
  }

  // 2) Referral
  const { data: refUser } = await svc
    .from("customers")
    .select("id, first_name, last_name")
    .eq("referral_code", trimmed)
    .maybeSingle();
  if (refUser) {
    if (refUser.id === customerId) {
      return { valid: false, reason: "no_self_referral" };
    }
    // Hat dieser User bereits eine Referral-Zeile (egal von wem)? -> nur 1x
    const { data: existingReferral } = await svc
      .from("referrals")
      .select("id")
      .eq("referee_customer_id", customerId)
      .maybeSingle();
    if (existingReferral) {
      return { valid: false, reason: "already_referred" };
    }
    return {
      valid: true,
      type: "referral",
      referrer_customer_id: refUser.id,
      code: trimmed,
      discount_chf: REFEREE_WELCOME_CHF,
      label: `Willkommens-Bonus von ${refUser.first_name ?? "Coffee Selection"}`,
    };
  }

  return { valid: false, reason: "code_unknown" };
}

/**
 * Beim Order-Create wird der Code zusammen mit dem Discount auf die
 * Order geschrieben (orders.promo_code, orders.discount_chf,
 * orders.total_chf reduziert). Die Buchung der Credits + Increments
 * passiert ERST nach Payment-Success im Webhook.
 *
 * Diese Funktion wird vom Stripe-Webhook aufgerufen, sobald die Order
 * status='paid' wird. Sie:
 *   - Increment marketing_campaigns.current_uses (falls campaign-Code)
 *   - Erstellt referrals-Zeile + writes Credit an Referrer (falls referral-Code)
 *   - Bucht Loyalty-Bonus bei jeder N-ten paid Order
 *   - Bucht negative customer_credits-Zeile fuer angewandtes Balance-Redemption
 *
 * Idempotent: prueft customer_credits + referrals auf bestehende Eintraege
 * pro order_id, damit Webhook-Retries nichts doppelt buchen.
 */
export async function processOrderEarnings(
  svc: SupabaseClient,
  orderId: string,
  customerId: string
) {
  // Order laden
  const { data: order } = await svc
    .from("orders")
    .select("id, customer_id, promo_code, discount_chf, status, total_chf")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || order.status !== "paid") return;

  // Idempotenz: hat diese Order bereits Earnings/Redemptions?
  const { count: alreadyProcessed } = await svc
    .from("customer_credits")
    .select("id", { count: "exact", head: true })
    .eq("order_id", orderId);
  if ((alreadyProcessed ?? 0) > 0) {
    console.log(`[earnings] order ${orderId} already processed, skip`);
    return;
  }

  const code = (order.promo_code ?? "").trim().toUpperCase();
  const discountChf = Number(order.discount_chf ?? 0);

  // 1) Promo-Code-Verarbeitung
  if (code && discountChf > 0) {
    // Kampagne?
    const { data: campaign } = await svc
      .from("marketing_campaigns")
      .select("id, current_uses")
      .eq("code", code)
      .maybeSingle();

    if (campaign) {
      await svc
        .from("marketing_campaigns")
        .update({ current_uses: campaign.current_uses + 1 })
        .eq("id", campaign.id);
      await svc.from("customer_credits").insert({
        customer_id: customerId,
        amount_chf: -discountChf,
        reason: "campaign_bonus",
        order_id: orderId,
        campaign_id: campaign.id,
        description: `Kampagne ${code} eingelöst`,
      });
    } else {
      // Referral?
      const { data: refUser } = await svc
        .from("customers")
        .select("id, first_name, last_name")
        .eq("referral_code", code)
        .maybeSingle();
      if (refUser && refUser.id !== customerId) {
        // Referrals-Zeile anlegen (status=qualified, da Order bereits paid)
        const { data: ref } = await svc
          .from("referrals")
          .insert({
            referrer_customer_id: refUser.id,
            referee_customer_id: customerId,
            referral_code: code,
            reward_referrer_chf: REFERRER_REWARD_CHF,
            reward_referee_chf: discountChf,
            status: "rewarded",
            qualifying_order_id: orderId,
            signed_up_at: new Date().toISOString(),
            qualified_at: new Date().toISOString(),
            rewarded_at: new Date().toISOString(),
          })
          .select("id")
          .single();
        // Welcome-Bonus fuer den Geworbenen ist als discount_chf bereits
        // angewendet — als Buchhaltung trotzdem 2 Eintraege:
        // +CHF welcome (Earned) und -CHF redeemed.
        await svc.from("customer_credits").insert([
          {
            customer_id: customerId,
            amount_chf: discountChf,
            reason: "referral_referee",
            order_id: orderId,
            referral_id: ref?.id ?? null,
            description: `Willkommens-Bonus über Code ${code}`,
          },
          {
            customer_id: customerId,
            amount_chf: -discountChf,
            reason: "order_redemption",
            order_id: orderId,
            referral_id: ref?.id ?? null,
            description: `Eingelöst auf Bestellung`,
          },
          {
            customer_id: refUser.id,
            amount_chf: REFERRER_REWARD_CHF,
            reason: "referral_referrer",
            order_id: orderId,
            referral_id: ref?.id ?? null,
            description: `Empfehlung qualifiziert`,
          },
        ]);
      }
    }
  }

  // 2) Loyalty-Bonus bei jeder N-ten paid Order
  const { count: paidOrderCount } = await svc
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customerId)
    .eq("status", "paid");
  if (paidOrderCount && paidOrderCount > 0 && paidOrderCount % LOYALTY_EVERY_N_ORDERS === 0) {
    await svc.from("customer_credits").insert({
      customer_id: customerId,
      amount_chf: LOYALTY_BONUS_CHF,
      reason: "loyalty_bonus",
      order_id: orderId,
      description: `Treuebonus für ${paidOrderCount}. Bestellung`,
    });
  }
}

export const REWARDS_CONSTANTS = {
  REFERRER_REWARD_CHF,
  REFEREE_WELCOME_CHF,
  LOYALTY_BONUS_CHF,
  LOYALTY_EVERY_N_ORDERS,
};
