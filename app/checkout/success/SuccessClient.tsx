"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { trackPurchase } from "@/lib/analytics";
import { useCart } from "@/lib/cart";

/**
 * Client-Komponente fuer /checkout/success.
 *
 * Zweck: bei status='pending' polled sie alle 2s den Order-Status. Stripe-
 * Webhook (C-5) braucht oft 1-3 Sekunden bis er ankommt — ohne Polling
 * sieht der Kunde "Zahlung wird verarbeitet" und muesste manuell refreshen.
 *
 * Polling endet bei:
 *   - status='paid'        → Bestaetigung anzeigen
 *   - status='cancelled'   → Fehler anzeigen (Edge-Case)
 *   - 30 Sekunden Timeout  → "wird verarbeitet, du erhaeltst eine E-Mail"
 */

type OrderState = {
  id: string;
  order_number: string;
  status: string;
  subtotal_chf: number;
  shipping_chf: number;
  tax_chf: number;
  total_chf: number;
};

const POLL_INTERVAL_MS = 2_000;
const POLL_TIMEOUT_MS = 30_000;

export function SuccessClient({
  sessionId,
  initialOrder,
}: {
  sessionId: string;
  initialOrder: OrderState;
}) {
  const [order, setOrder] = useState<OrderState>(initialOrder);
  const [polling, setPolling] = useState(initialOrder.status === "pending");
  const [timedOut, setTimedOut] = useState(false);
  const { clear: clearCart } = useCart();

  // GA4 purchase-Event genau EINMAL feuern, sobald die Order auf 'paid'
  // umspringt (egal ob initial oder via Polling). Doppelt-Fire vermeiden
  // wenn React den State mehrmals an uns durchschickt. Gleicher Trigger
  // leert auch den SessionStorage-Cart — sonst sieht der Customer beim
  // naechsten Cart-Aufruf seine bereits bestellten Items.
  const purchaseFired = useRef(false);
  useEffect(() => {
    if (order.status !== "paid" || purchaseFired.current) return;
    purchaseFired.current = true;
    trackPurchase({
      orderId: order.id,
      totalChf: order.total_chf,
      shippingChf: order.shipping_chf,
      taxChf: order.tax_chf,
      // Items werden auf der Success-Page selber nicht geladen — fuer den
      // GA4-Funnel reichen die Gesamtwerte. Wer Item-Level-Reporting will,
      // muesste das in einer Erweiterung aus orders.items nachladen.
      items: [],
    });
    clearCart();
  }, [order.status, order.id, order.total_chf, order.shipping_chf, order.tax_chf, clearCart]);

  useEffect(() => {
    if (!polling) return;

    const start = Date.now();
    let active = true;

    const tick = async () => {
      if (!active) return;
      if (Date.now() - start > POLL_TIMEOUT_MS) {
        setPolling(false);
        setTimedOut(true);
        return;
      }
      try {
        const res = await fetch(
          `/api/checkout/session/status?session_id=${encodeURIComponent(sessionId)}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const data = (await res.json()) as { order?: OrderState };
          if (data.order && active) {
            setOrder(data.order);
            if (data.order.status !== "pending") {
              setPolling(false);
              return;
            }
          }
        }
      } catch {
        // Netzwerk-Fehler — naechster Tick versucht's nochmal
      }
      if (active) setTimeout(tick, POLL_INTERVAL_MS);
    };

    const t = setTimeout(tick, POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [polling, sessionId]);

  if (order.status === "paid") {
    return (
      <ConfirmationCard
        title="Vielen Dank!"
        subtitle="Deine Bestellung ist bezahlt und wird verarbeitet."
        order={order}
      />
    );
  }

  if (order.status === "cancelled" || order.status === "refunded") {
    return (
      <ConfirmationCard
        title="Bestellung storniert"
        subtitle="Die Zahlung wurde nicht abgeschlossen oder zurückgebucht. Bei Fragen melde dich bei uns."
        order={order}
        tone="error"
      />
    );
  }

  // status === 'pending'
  return (
    <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
        <span className="material-symbols-outlined text-amber-700 animate-spin">
          progress_activity
        </span>
      </div>
      <h1 className="font-headline text-3xl md:text-4xl mb-3">
        Zahlung wird verarbeitet …
      </h1>
      <p className="text-on-surface-variant mb-2">
        Bestell-Nr. <strong>{order.order_number}</strong>
      </p>
      <p className="text-on-surface-variant mb-6">
        Wir bestätigen den Eingang, sobald Stripe die Zahlung an uns übergibt
        (meistens unter 5 Sekunden).
      </p>
      {timedOut ? (
        <p className="text-sm text-on-surface-variant">
          Die Bestätigung dauert länger als erwartet. Du erhältst eine E-Mail,
          sobald die Zahlung verbucht ist. Du kannst diese Seite schließen.
        </p>
      ) : (
        <p className="text-sm text-on-surface-variant">
          Bitte schließe diese Seite nicht.
        </p>
      )}
    </div>
  );
}

function ConfirmationCard({
  title,
  subtitle,
  order,
  tone = "success",
}: {
  title: string;
  subtitle: string;
  order: OrderState;
  tone?: "success" | "error";
}) {
  const iconBg = tone === "success" ? "bg-emerald-100" : "bg-red-100";
  const iconColor = tone === "success" ? "text-emerald-700" : "text-red-700";
  const icon = tone === "success" ? "check_circle" : "error";

  return (
    <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
      <div className="text-center">
        <div
          className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${iconBg} mb-4`}
        >
          <span
            className={`material-symbols-outlined ${iconColor} text-4xl`}
            style={{ fontSize: "2rem" }}
          >
            {icon}
          </span>
        </div>
        <h1 className="font-headline text-3xl md:text-4xl mb-3">{title}</h1>
        <p className="text-on-surface-variant mb-2">{subtitle}</p>
        <p className="text-sm text-on-surface-variant mb-8">
          Bestellnummer: <strong>{order.order_number}</strong>
        </p>
      </div>

      <div className="border-t border-b border-primary/10 py-6 my-6 space-y-2 text-sm">
        <Row label="Zwischensumme" value={`CHF ${order.subtotal_chf.toFixed(2)}`} />
        <Row label="Versand" value={`CHF ${order.shipping_chf.toFixed(2)}`} />
        {order.tax_chf > 0 && (
          <Row label="MWST (Stripe Tax)" value={`CHF ${order.tax_chf.toFixed(2)}`} />
        )}
        <Row
          label="Total"
          value={`CHF ${order.total_chf.toFixed(2)}`}
          bold
        />
      </div>

      <p className="text-sm text-on-surface-variant text-center mb-6">
        Eine Bestätigungs-E-Mail ist unterwegs. Bei Rückfragen antworte einfach
        darauf.
      </p>

      <div className="flex justify-center">
        <Link
          href="/"
          className="inline-block bg-primary text-on-primary px-6 py-3 rounded-full font-medium"
        >
          Zur Startseite
        </Link>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex justify-between ${bold ? "font-semibold text-base pt-2" : ""}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
