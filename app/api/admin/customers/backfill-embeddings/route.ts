import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin/auth";
import { refreshAdminReauthCookie } from "@/lib/admin/reauth";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Einmal-Backfill: ruft build-customer-embedding fuer alle Customers
 * auf, die einen taste_type_id haben (= Quiz gemacht) aber noch kein
 * taste_embedding (Edge-Function wurde nie getriggert).
 *
 * Nutzt die /functions/v1/build-customer-embedding-Edge-Function via
 * HTTP. Edge-Function selbst dedupliziert nicht — der Backfill checkt
 * vorab und ueberspringt schon-vorhandene Embeddings.
 *
 * Pro Aufruf max 50 Customers (OpenAI-Rate-Limits + Vercel-Timeout).
 * Mehrfach aufrufbar — laeuft die naechsten 50 ab.
 */
export async function POST(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await refreshAdminReauthCookie())) {
    return NextResponse.json({ error: "reauth_required" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const limit = Math.min(Math.max(Number(body?.limit) || 50, 1), 200);

  const svc = createServiceClient();
  const { data: customers } = await svc
    .from("customers")
    .select("id")
    .not("taste_type_id", "is", null)
    .is("taste_embedding", null)
    .limit(limit);

  const results: { customer_id: string; status: string; error?: string }[] = [];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json(
      { error: "supabase env vars missing" },
      { status: 500 }
    );
  }

  // Sequentiell, NICHT parallel — OpenAI-Rate-Limits und Edge-Function-
  // Concurrency sollten respektiert werden. Bei 50 Calls a ~2s = 100s,
  // unter Vercel-Function-Timeout 5min.
  for (const c of customers ?? []) {
    try {
      const res = await fetch(
        `${url}/functions/v1/build-customer-embedding`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ customer_id: c.id }),
        }
      );
      if (res.ok) {
        results.push({ customer_id: c.id, status: "ok" });
      } else {
        const errBody = await res.text();
        results.push({
          customer_id: c.id,
          status: "edge_failed",
          error: `${res.status}: ${errBody.slice(0, 200)}`,
        });
      }
    } catch (e) {
      results.push({
        customer_id: c.id,
        status: "fetch_failed",
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const summary = {
    candidates: customers?.length ?? 0,
    ok: results.filter((r) => r.status === "ok").length,
    failed: results.filter((r) => r.status !== "ok").length,
  };
  return NextResponse.json({ summary, results });
}
