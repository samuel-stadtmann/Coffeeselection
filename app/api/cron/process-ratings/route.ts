import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Worker: verarbeitet alle coffee_ratings mit processed_at IS NULL.
 *
 * Aktionen pro Rating (gemäss Playbook Kap. 6.4):
 * 1. Aroma-Tag-Sentiment update in customer_aroma_preferences
 *    - positiver Tag: sentiment += 0.2 (clamped auf [-1, 1])
 *    - negativer Tag: sentiment -= 0.2
 *    - count +=1, last_seen_at = NOW()
 * 2. customers.num_ratings_given += 1
 * 3. customers.profile_last_updated_at = NOW()
 * 4. coffee_ratings.processed_at = NOW()
 *
 * Embedding-Drift (Playbook 6.3) folgt in M5b sobald OpenAI-Integration steht.
 *
 * Auth: erfordert Header `Authorization: Bearer ${CRON_SECRET}` oder Vercel
 * setzt automatisch Vercel-Cron-Signature-Header bei eigenen Cron-Jobs.
 */

const SENTIMENT_DELTA = 0.2;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export async function GET(request: Request) {
  // Auth: Vercel Cron sendet automatisch einen Authorization-Header mit dem CRON_SECRET
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const startedAt = Date.now();

  // 1) Fällige Ratings holen
  const { data: pending, error: fetchErr } = await supabase
    .from("coffee_ratings")
    .select("id, customer_id, rating, positive_tags, negative_tags")
    .is("processed_at", null)
    .order("created_at", { ascending: true })
    .limit(100);

  if (fetchErr) {
    console.error("[cron] fetch failed", fetchErr);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  if (!pending || pending.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, durationMs: Date.now() - startedAt });
  }

  let processed = 0;
  let failed = 0;

  for (const rating of pending) {
    try {
      const tags: { tag: string; delta: number }[] = [
        ...(rating.positive_tags ?? []).map((t: string) => ({ tag: t, delta: +SENTIMENT_DELTA })),
        ...(rating.negative_tags ?? []).map((t: string) => ({ tag: t, delta: -SENTIMENT_DELTA })),
      ];

      // 2) Per Tag: Aroma-Pref upsert (read-modify-write, weil sentiment +/- delta)
      for (const { tag, delta } of tags) {
        const { data: existing } = await supabase
          .from("customer_aroma_preferences")
          .select("id, sentiment, count")
          .eq("customer_id", rating.customer_id)
          .eq("aroma_tag", tag)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("customer_aroma_preferences")
            .update({
              sentiment: clamp(Number(existing.sentiment) + delta, -1, 1),
              count: existing.count + 1,
              last_seen_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
        } else {
          await supabase.from("customer_aroma_preferences").insert({
            customer_id: rating.customer_id,
            aroma_tag: tag,
            sentiment: clamp(delta, -1, 1),
            count: 1,
          });
        }
      }

      // 3) Customer Counter + Timestamp
      const { data: customer } = await supabase
        .from("customers")
        .select("num_ratings_given")
        .eq("id", rating.customer_id)
        .maybeSingle();
      if (customer) {
        await supabase
          .from("customers")
          .update({
            num_ratings_given: (customer.num_ratings_given ?? 0) + 1,
            profile_last_updated_at: new Date().toISOString(),
          })
          .eq("id", rating.customer_id);
      }

      // 4) Rating als verarbeitet markieren
      await supabase
        .from("coffee_ratings")
        .update({ processed_at: new Date().toISOString() })
        .eq("id", rating.id);

      processed++;
    } catch (err) {
      console.error("[cron] rating failed", rating.id, err);
      failed++;
      // Nicht als verarbeitet markieren — wird nächsten Run retried
    }
  }

  return NextResponse.json({
    ok: true,
    processed,
    failed,
    pending: pending.length,
    durationMs: Date.now() - startedAt,
  });
}
