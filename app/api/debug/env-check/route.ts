import { NextResponse } from "next/server";

/**
 * DEBUG-ENDPOINT — TEMPORÄR.
 *
 * Zeigt die letzten 6 Zeichen der Stripe-Keys + grobe Status-Info.
 * NIEMALS den vollen Key zurueckgeben.
 *
 * Nach dem Debugging wieder ENTFERNEN.
 */
export async function GET() {
  const sk = process.env.STRIPE_SECRET_KEY ?? "";
  const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
  const whsec = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  const tail = (s: string, n = 6) => (s.length >= n ? s.slice(-n) : `(len=${s.length})`);

  return NextResponse.json(
    {
      vercel_env: process.env.VERCEL_ENV ?? "unknown",
      vercel_region: process.env.VERCEL_REGION ?? "unknown",
      deploy_id: process.env.VERCEL_DEPLOYMENT_ID ?? "unknown",
      now_iso: new Date().toISOString(),
      stripe_secret_key: {
        present: sk.length > 0,
        length: sk.length,
        prefix: sk.slice(0, 8),
        tail6: tail(sk, 6),
      },
      stripe_publishable_key: {
        present: pk.length > 0,
        length: pk.length,
        prefix: pk.slice(0, 8),
        tail6: tail(pk, 6),
      },
      stripe_webhook_secret: {
        present: whsec.length > 0,
        length: whsec.length,
        prefix: whsec.slice(0, 8),
        tail6: tail(whsec, 6),
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
