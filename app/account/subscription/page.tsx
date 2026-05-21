"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AccountLayout, { PageHeader } from "@/components/AccountLayout";
import { INTERVAL_LABELS, type SubscriptionIntervalWeeks } from "@/lib/subscription-constants";

/**
 * P1B-7: /account/subscription
 *
 * Self-Service-Page fuer Abo-Verwaltung. Zeigt alle Subscriptions des
 * eingeloggten Customers (nicht-pending) mit Status, Items, naechster
 * Lieferung und Aktionen (pausieren/fortsetzen/kuendigen + Karte
 * via Stripe-Portal).
 *
 * Daten:
 *   - GET /api/account/subscriptions → eigene Subscriptions
 *   - POST /api/account/subscriptions/[id]/action → pause/resume/cancel
 *   - POST /api/account/portal → Stripe-Billing-Portal-Session-URL
 */

type Subscription = {
  id: string;
  subscription_type: "fix" | "discovery";
  interval_weeks: SubscriptionIntervalWeeks;
  status: "active" | "paused" | "past_due" | "cancelled" | "completed";
  started_at: string;
  paused_at: string | null;
  cancelled_at: string | null;
  next_delivery_on: string | null;
  total_deliveries: number;
  price_chf_per_delivery: number | string;
  shipping_chf: number | string;
  discount_percent: number | string;
  stripe_subscription_id: string | null;
  stripe_current_period_end: string | null;
  shipping_address: {
    recipient_name: string;
    street: string;
    street_additional: string | null;
    postal_code: string;
    city: string;
    country: string;
  } | null;
  items: Array<{
    quantity: number;
    weight_g: number;
    coffee: {
      id: string;
      name: string;
      slug: string;
      image_url: string | null;
      roaster: { name: string } | null;
    } | null;
  }>;
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

function statusLabel(s: Subscription["status"]): { label: string; tone: "ok" | "warn" | "muted" | "error" } {
  switch (s) {
    case "active":
      return { label: "Aktiv", tone: "ok" };
    case "paused":
      return { label: "Pausiert", tone: "muted" };
    case "past_due":
      return { label: "Zahlung ausstehend", tone: "warn" };
    case "cancelled":
      return { label: "Gekuendigt", tone: "muted" };
    case "completed":
      return { label: "Abgeschlossen", tone: "muted" };
  }
}

export default function Page() {
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/account/subscriptions").then((r) => r.json());
      if (res.error) {
        setError(res.error === "unauthenticated" ? "Bitte einloggen." : res.error);
      } else {
        setSubscriptions(res.subscriptions ?? []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function doAction(sub: Subscription, action: "pause" | "resume" | "cancel") {
    if (busy) return;
    setBusy(sub.id);
    setError(null);
    try {
      const res = await fetch(`/api/account/subscriptions/${sub.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      }).then((r) => r.json());
      if (!res.ok) {
        const detail = res.details ? ` (${res.details})` : "";
        throw new Error(`${res.error ?? "Aktion fehlgeschlagen"}${detail}`);
      }
      // Kurzer Wait damit der Stripe-Webhook (customer.subscription.updated /
      // .deleted) Zeit hat unsere DB zu syncen. Sonst zeigt load() noch
      // den alten Status. 2s reicht in der Praxis fuer Webhook-Roundtrip.
      await new Promise((r) => setTimeout(r, 2000));
      await load();
      if (action === "cancel") setConfirmCancel(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function openPortal() {
    if (portalLoading) return;
    setPortalLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/portal", { method: "POST" }).then(
        (r) => r.json()
      );
      if (!res.url) {
        const detail = res.details ? ` (${res.details})` : "";
        throw new Error(`${res.error ?? "Portal-Session fehlgeschlagen"}${detail}`);
      }
      window.location.href = res.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPortalLoading(false);
    }
  }

  return (
    <AccountLayout>
      <PageHeader
        subtitle="Mein Abo"
        title="Abo verwalten"
        description="Lieferintervall pausieren, Karte aktualisieren, kuendigen. Alles flexibel — keine Mindestlaufzeit."
      />

      {error && (
        <div className="bg-error/10 border-l-4 border-error p-4 text-sm text-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white p-8 text-center text-on-surface-variant">
          Lade Abos…
        </div>
      ) : subscriptions.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          {subscriptions.map((sub) => (
            <SubscriptionCard
              key={sub.id}
              sub={sub}
              busy={busy === sub.id}
              onPause={() => doAction(sub, "pause")}
              onResume={() => doAction(sub, "resume")}
              onCancelClick={() => setConfirmCancel(sub.id)}
            />
          ))}

          {/* Globale Aktion: Karte aktualisieren via Stripe-Portal */}
          <div className="bg-white p-6 md:p-8 shadow-sm flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg">
                Zahlungsmethode
              </h3>
              <p className="text-sm text-on-surface-variant mt-1">
                Karte aktualisieren oder Rechnungen einsehen — im Stripe-Portal.
              </p>
            </div>
            <button
              type="button"
              onClick={openPortal}
              disabled={portalLoading}
              className="bg-primary text-on-primary px-6 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-tertiary hover:text-primary transition-all disabled:opacity-50"
            >
              {portalLoading ? "Oeffne Portal…" : "Stripe-Portal oeffnen →"}
            </button>
          </div>
        </div>
      )}

      {/* Cancel-Confirm-Modal */}
      {confirmCancel && (
        <div
          className="fixed inset-0 bg-primary/80 z-[60] flex items-center justify-center p-6"
          onClick={() => setConfirmCancel(null)}
        >
          <div
            className="bg-white p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-xl mb-4">
              Abo wirklich kuendigen?
            </h3>
            <p className="text-on-surface-variant mb-6">
              Du verlierst deinen Abo-Rabatt von 10% und kannst jederzeit
              wieder neu starten. Bei zukuenftigen Bestellungen waere der
              regulaere Preis faellig. Wenn du nur eine Pause brauchst,
              nutze stattdessen "Pausieren".
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setConfirmCancel(null)}
                className="border-2 border-primary text-primary py-3 font-headline font-bold text-xs uppercase tracking-widest"
              >
                Doch nicht
              </button>
              <button
                onClick={() => {
                  const sub = subscriptions.find((s) => s.id === confirmCancel);
                  if (sub) doAction(sub, "cancel");
                }}
                disabled={busy === confirmCancel}
                className="bg-error text-on-error py-3 font-headline font-bold text-xs uppercase tracking-widest disabled:opacity-50"
              >
                {busy === confirmCancel ? "Wird gekuendigt…" : "Endgueltig kuendigen"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Link
        href="/account/dashboard"
        className="font-headline text-[11px] uppercase tracking-[0.2em] text-tertiary hover:text-primary transition-colors border-b-2 border-tertiary pb-1 inline-block"
      >
        ← Zurueck zum Dashboard
      </Link>
    </AccountLayout>
  );
}

function SubscriptionCard({
  sub,
  busy,
  onPause,
  onResume,
  onCancelClick,
}: {
  sub: Subscription;
  busy: boolean;
  onPause: () => void;
  onResume: () => void;
  onCancelClick: () => void;
}) {
  const status = statusLabel(sub.status);
  const intervalLabel = INTERVAL_LABELS[sub.interval_weeks]?.long ?? `Alle ${sub.interval_weeks} Wochen`;
  const isActive = sub.status === "active";
  const isPaused = sub.status === "paused";
  const isFinal = sub.status === "cancelled" || sub.status === "completed";
  const nextDate = sub.next_delivery_on ?? sub.stripe_current_period_end;

  const item = sub.items?.[0]; // 1 Abo = 1 Coffee in Phase 1B
  const coffee = item?.coffee;

  const toneColor = {
    ok: "bg-tertiary",
    warn: "bg-error",
    muted: "bg-on-primary/30",
    error: "bg-error",
  }[status.tone];

  return (
    <div className="bg-primary text-on-primary p-6 md:p-8">
      {/* Status-Header */}
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className={`w-2 h-2 rounded-full ${toneColor}`} />
          <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold">
            {status.label}
          </span>
        </div>
        <span className="font-headline text-[10px] uppercase tracking-widest text-on-primary/40">
          Abo seit {formatDate(sub.started_at)}
        </span>
      </div>

      {/* Coffee-Info */}
      <h2 className="text-xl md:text-2xl font-headline font-bold uppercase tracking-tight mb-2">
        {coffee?.name ?? "Coffee-Abo"}
      </h2>
      <p className="text-on-primary/70 mb-1 text-sm">
        {coffee?.roaster?.name ? `${coffee.roaster.name} · ` : ""}
        {item?.weight_g ? `${item.weight_g}g` : ""}
        {item?.quantity ? ` · ${item.quantity}×` : ""}
        {" · "}
        {intervalLabel}
      </p>
      <p className="text-on-primary/70 mb-6 text-sm">
        {Number(sub.total_deliveries) > 0
          ? `${sub.total_deliveries} Lieferung${Number(sub.total_deliveries) === 1 ? "" : "en"} bisher erhalten`
          : "Noch keine Lieferung erhalten"}
      </p>

      {/* Naechste Lieferung */}
      {!isFinal && (
        <div className="bg-on-primary/5 p-4 border-l-2 border-tertiary mb-6">
          <span className="font-headline text-[10px] uppercase tracking-widest text-on-primary/60 block mb-1">
            {isPaused ? "Naechste Lieferung (nach Fortsetzung)" : "Naechste Lieferung"}
          </span>
          <span className="font-headline font-bold text-tertiary text-lg">
            {nextDate ? formatDate(nextDate) : "wird festgelegt"}
          </span>
          <span className="block text-[11px] text-on-primary/60 mt-1">
            CHF {Number(sub.price_chf_per_delivery).toFixed(2)}
            {Number(sub.shipping_chf) > 0
              ? ` + CHF ${Number(sub.shipping_chf).toFixed(2)} Versand`
              : " · Gratis-Versand"}
          </span>
        </div>
      )}

      {/* Aktionen */}
      {!isFinal && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {isActive && (
            <button
              onClick={onPause}
              disabled={busy}
              className="bg-tertiary text-primary py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50"
            >
              {busy ? "Wird pausiert…" : "Pausieren"}
            </button>
          )}
          {isPaused && (
            <button
              onClick={onResume}
              disabled={busy}
              className="bg-tertiary text-primary py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50"
            >
              {busy ? "Wird fortgesetzt…" : "Fortsetzen"}
            </button>
          )}
          <button
            onClick={onCancelClick}
            disabled={busy}
            className="text-on-primary/70 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:text-on-primary transition-all border border-on-primary/30 hover:border-on-primary/60 disabled:opacity-50"
          >
            Kuendigen
          </button>
        </div>
      )}

      {/* Lieferadresse */}
      {sub.shipping_address && (
        <div className="mt-6 pt-6 border-t border-on-primary/10 text-sm">
          <span className="font-headline text-[10px] uppercase tracking-widest text-on-primary/60 block mb-2">
            Lieferadresse
          </span>
          <p className="text-on-primary/80 leading-relaxed">
            {sub.shipping_address.recipient_name}<br />
            {sub.shipping_address.street}
            {sub.shipping_address.street_additional ? (
              <>
                <br />
                {sub.shipping_address.street_additional}
              </>
            ) : null}
            <br />
            {sub.shipping_address.postal_code} {sub.shipping_address.city}
          </p>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white p-12 text-center">
      <span className="material-symbols-outlined text-6xl text-on-surface-variant block mb-4">
        autorenew
      </span>
      <h3 className="font-headline font-bold text-2xl text-primary uppercase tracking-tight mb-3">
        Noch kein Abo
      </h3>
      <p className="text-on-surface-variant mb-6">
        Spar 10% gegenueber Einzelbestellung und kriege deinen Coffee
        automatisch geliefert. Jederzeit pausieren oder kuendigen.
      </p>
      <Link
        href="/coffee"
        className="inline-block bg-primary text-on-primary px-8 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-tertiary hover:text-primary transition-all"
      >
        Coffee aussuchen
      </Link>
    </div>
  );
}
