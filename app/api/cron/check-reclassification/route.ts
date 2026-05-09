import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Daily Cron: prüft ob User basierend auf Aroma-Sentiments einen anderen
 * Geschmackstyp besser passt als ihr aktueller. Bei klarem Wechsel:
 *
 *  - setzt customers.reclassification_suggested_at = NOW()
 *  - setzt customers.reclassification_suggested_type = neuer_typ_id
 *  - (Email-Benachrichtigung folgt — wird in Pre-Launch Email-Worker
 *     verkabelt, siehe GO-LIVE.md)
 *
 * Logik (Playbook 6.5 — vereinfacht ohne Embedding-Centroids weil keine
 * customer.taste_embedding existieren bis M5b):
 *
 *  Für jeden User mit num_ratings_given >= 5:
 *    1. Aggregiere customer_aroma_preferences mit count >= 2
 *    2. Match jedes Aroma gegen taste_types.aroma_families
 *    3. Berechne Score pro Geschmackstyp = sum(sentiment * confidence)
 *    4. Wenn Top-Score-Typ ≠ aktuellem AND Differenz signifikant: tag for reclassification
 *
 * Auth: Bearer CRON_SECRET (Vercel Cron Header)
 */

const MIN_RATINGS_FOR_RECLASS = 5;
const SIGNIFICANCE_THRESHOLD = 0.3; // Top-Score muss um diesen Faktor besser sein als aktueller

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const startedAt = Date.now();

  // Alle Geschmackstypen mit ihren Aroma-Familien
  const { data: tasteTypes } = await supabase
    .from("taste_types")
    .select("id, name_de, aroma_families");
  if (!tasteTypes) return NextResponse.json({ error: "no taste types" }, { status: 500 });

  // Kandidaten: User mit genug Ratings + bestehender taste_type_id
  const { data: candidates } = await supabase
    .from("customers")
    .select("id, taste_type_id, num_ratings_given, reclassification_suggested_at")
    .gte("num_ratings_given", MIN_RATINGS_FOR_RECLASS)
    .not("taste_type_id", "is", null);
  if (!candidates) return NextResponse.json({ ok: true, suggested: 0 });

  let suggested = 0;
  let unchanged = 0;

  for (const c of candidates) {
    // Aroma-Sentiments des Users laden
    const { data: prefs } = await supabase
      .from("customer_aroma_preferences")
      .select("aroma_tag, sentiment, count")
      .eq("customer_id", c.id)
      .gte("count", 2);

    if (!prefs || prefs.length === 0) {
      unchanged++;
      continue;
    }

    // Score pro Geschmackstyp = Summe(sentiment * confidence) für Aromen die zum Typ gehören
    const scoresByType = new Map<number, number>();
    for (const tt of tasteTypes) {
      const families = (tt.aroma_families ?? []) as string[];
      let score = 0;
      for (const pref of prefs) {
        // Match: aroma_tag (DE/Freitext) ↔ aroma_family (canonical EN slug)
        // Heute case-insensitive Substring-Match (lose). Vor Launch sauberer
        // mappen — siehe GO-LIVE.md "Aroma-Vokabular standardisieren".
        const tagLower = String(pref.aroma_tag).toLowerCase();
        const matches = families.some((f) => tagLower.includes(String(f).toLowerCase()));
        if (matches) {
          const confidence = Math.min(pref.count / 3, 1);
          score += Number(pref.sentiment) * confidence;
        }
      }
      scoresByType.set(tt.id, score);
    }

    const ranked = Array.from(scoresByType.entries()).sort((a, b) => b[1] - a[1]);
    const topId = ranked[0]?.[0];
    const topScore = ranked[0]?.[1] ?? 0;
    const currentScore = scoresByType.get(c.taste_type_id) ?? 0;

    // Reklassifikation vorschlagen wenn Top-Typ ≠ aktuell UND signifikant besser
    if (topId && topId !== c.taste_type_id && topScore - currentScore > SIGNIFICANCE_THRESHOLD) {
      await supabase
        .from("customers")
        .update({
          reclassification_suggested_at: new Date().toISOString(),
          reclassification_suggested_type: topId,
        })
        .eq("id", c.id);
      suggested++;
    } else {
      unchanged++;
    }
  }

  return NextResponse.json({
    ok: true,
    candidates: candidates.length,
    suggested,
    unchanged,
    durationMs: Date.now() - startedAt,
  });
}
