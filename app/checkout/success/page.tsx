import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import { SuccessClient } from "./SuccessClient";

const LOGO = "/logo.png";

/**
 * C-4: /checkout/success
 *
 * Stripe redirected hierher nach erfolgreicher Bezahlung mit der Session-ID
 * im Query-Parameter. Wir laden die Order ueber stripe_checkout_session_id
 * und zeigen Bestaetigung.
 *
 * Achtung: der Webhook /api/webhooks/stripe (C-5) setzt order.status='paid'
 * — der koennte aber bei Stripe-Redirect noch nicht eingetroffen sein (paar
 * Sekunden Latenz). Falls status noch 'pending' ist, zeigen wir
 * "Zahlung wird verarbeitet" und pollen client-seitig alle 2s.
 */

type Params = Promise<{ session_id?: string }>;

async function loadOrderBySession(sessionId: string) {
  const svc = createServiceClient();
  const { data, error } = await svc
    .from("orders")
    .select(
      "id, order_number, status, subtotal_chf, shipping_chf, tax_chf, total_chf, language, paid_at"
    )
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();
  if (error) {
    console.error("[checkout/success] order lookup failed", error);
    return null;
  }
  return data;
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Params;
}) {
  const sp = await searchParams;
  const sessionId = sp.session_id;

  if (!sessionId) {
    return (
      <ErrorShell
        title="Keine Session-ID"
        message="Wir konnten deine Bestellung nicht eindeutig zuordnen. Bitte prüfe deine E-Mail oder kontaktiere uns."
      />
    );
  }

  const order = await loadOrderBySession(sessionId);

  if (!order) {
    return (
      <ErrorShell
        title="Bestellung nicht gefunden"
        message="Die Stripe-Session konnte keiner Bestellung zugeordnet werden. Falls Zahlung erfolgt ist, melde dich bei uns – wir klären das."
      />
    );
  }

  // Wir geben die initialen Daten an einen Client-Component weiter, der bei
  // Bedarf pollen kann (status='pending' → Webhook noch nicht durch).
  return (
    <Shell>
      <SuccessClient
        sessionId={sessionId}
        initialOrder={{
          id: order.id,
          order_number: order.order_number,
          status: order.status,
          subtotal_chf: Number(order.subtotal_chf),
          shipping_chf: Number(order.shipping_chf),
          tax_chf: Number(order.tax_chf),
          total_chf: Number(order.total_chf),
        }}
      />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#F9F5F0] text-on-surface min-h-screen">
      <header className="fixed top-0 w-full z-50 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-6 md:px-8">
          <Link href="/" className="flex items-center">
            <img
              alt="Coffee Selection"
              className="h-56 md:h-72 w-auto object-contain -my-10 md:-my-16"
              src={LOGO}
            />
          </Link>
        </div>
      </header>
      <main className="pt-36 md:pt-40 pb-12">
        <div className="max-w-2xl mx-auto px-6 md:px-8">{children}</div>
      </main>
    </div>
  );
}

function ErrorShell({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <Shell>
      <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12 text-center">
        <h1 className="font-headline text-3xl md:text-4xl mb-4">{title}</h1>
        <p className="text-on-surface-variant mb-8">{message}</p>
        <Link
          href="/"
          className="inline-block bg-primary text-on-primary px-6 py-3 rounded-full font-medium"
        >
          Zur Startseite
        </Link>
      </div>
    </Shell>
  );
}
