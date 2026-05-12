import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * GET /api/checkout/session/status?session_id=cs_...
 *
 * Lightweight Polling-Endpoint fuer /checkout/success. Liefert den aktuellen
 * Order-Status zur uebergebenen Stripe-Session-ID. Wird vom SuccessClient
 * alle 2s aufgerufen bis status != 'pending' oder Timeout.
 *
 * NICHT von Stripe authentifiziert — die Session-ID ist genug Schutz
 * (lange, unguessable Stripe-ID). Wenn jemand die ID kennt, hat er die Seite
 * sowieso geoeffnet.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId || !sessionId.startsWith("cs_")) {
    return NextResponse.json({ error: "invalid_session_id" }, { status: 400 });
  }

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("orders")
    .select(
      "id, order_number, status, subtotal_chf, shipping_chf, tax_chf, total_chf"
    )
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "lookup_failed", details: error.message },
      { status: 500 }
    );
  }
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      order: {
        id: data.id,
        order_number: data.order_number,
        status: data.status,
        subtotal_chf: Number(data.subtotal_chf),
        shipping_chf: Number(data.shipping_chf),
        tax_chf: Number(data.tax_chf),
        total_chf: Number(data.total_chf),
      },
    },
    {
      headers: {
        // Browser darf NIE cachen — sonst sieht der Kunde alten Status
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
