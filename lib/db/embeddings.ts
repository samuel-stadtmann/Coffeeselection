/**
 * Helper fuer das Anstossen der Embedding-Funktionen.
 *
 * Hybrid-Recommendation-Score in lib/db/recommendations.ts ist bereits
 * implementiert — er nutzt cosine similarity zwischen
 * customers.taste_embedding und coffees.flavor_embedding, *wenn* der
 * Customer ein Embedding hat. Aktuell sind die Embeddings auf 99% der
 * Customers null, weil die Edge-Function build-customer-embedding nie
 * automatisch getriggert wurde.
 *
 * Diese Helper schliessen die Luecke:
 *   - triggerBuildCustomerEmbedding: nach Quiz-Submit (warm/cold-Start)
 *   - triggerDriftCustomerEmbedding: nach Rating-Submit (lernender Drift)
 *
 * Beide sind fire-and-forget: keine Failure-Propagation, damit der
 * Quiz-/Rating-Flow nicht blockt wenn OpenAI mal langsam ist.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Triggert die Edge-Function build-customer-embedding via HTTP.
 * Erfordert NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
export async function triggerBuildCustomerEmbedding(
  customerId: string
): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn("[embeddings] supabase env vars missing — skip");
    return;
  }
  try {
    const res = await fetch(`${url}/functions/v1/build-customer-embedding`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ customer_id: customerId }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(
        `[embeddings] build-customer-embedding ${res.status}:`,
        body.slice(0, 200)
      );
    }
  } catch (e) {
    console.error("[embeddings] build trigger failed", e);
  }
}

/**
 * Drift-Update nach Rating: zieht das taste_embedding Richtung
 * (sign=+1) oder weg von (sign=-1) coffees.flavor_embedding.
 *
 * Mapping rating -> sign:
 *   1, 2  -> -1 (push away)
 *   3     ->  0 (skip — neutral, kein Drift)
 *   4, 5  -> +1 (pull towards)
 *
 * Adaptive Lernrate alpha: konservativ 0.05 — Playbook-Default.
 *
 * Voraussetzung: customer.taste_embedding muss existieren. Wenn null,
 * wird die DB-Function early-return — wir loggen das, ist kein Fehler
 * (User hatte noch keinen Embedding-Build).
 */
export async function triggerDriftCustomerEmbedding(
  svc: SupabaseClient,
  customerId: string,
  coffeeId: string,
  rating: number
): Promise<void> {
  if (rating < 1 || rating > 5) return;
  if (rating === 3) return; // neutral
  const sign = rating >= 4 ? 1 : -1;
  try {
    const { error } = await svc.rpc("drift_customer_embedding", {
      p_customer_id: customerId,
      p_coffee_id: coffeeId,
      p_alpha: 0.05,
      p_sign: sign,
    });
    if (error) {
      console.error("[embeddings] drift_customer_embedding RPC failed", error);
    }
  } catch (e) {
    console.error("[embeddings] drift call failed", e);
  }
}
