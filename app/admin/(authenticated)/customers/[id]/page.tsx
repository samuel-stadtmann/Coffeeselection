import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import CustomerEditForm from "./CustomerEditForm";
import CustomerActions from "./CustomerActions";
import SubscriptionRow from "./SubscriptionRow";

export const metadata: Metadata = {
  title: "Admin · Kunde — Coffee Selection",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function fmtChf(n: number): string {
  return n.toLocaleString("de-CH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("de-CH");
}

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const svc = createServiceClient();

  const { data: customer, error } = await svc
    .from("customers")
    .select(
      "id, first_name, last_name, email, phone, language, marketing_opt_in, notify_shipping, notify_recommendations, taste_type_id, num_ratings_given, created_at, deleted_at, profile_last_updated_at, reclassification_suggested_at"
    )
    .eq("id", id)
    .single();
  if (error || !customer) notFound();

  const [
    { data: tasteType },
    { data: addresses },
    { data: orders },
    { data: subscriptions },
    { data: credits },
  ] = await Promise.all([
    customer.taste_type_id
      ? svc
          .from("taste_types")
          .select("name_de")
          .eq("id", customer.taste_type_id)
          .maybeSingle()
      : Promise.resolve({ data: null as { name_de: string } | null }),
    svc
      .from("customer_addresses")
      .select(
        "id, type, is_default, recipient_name, company, street, street_additional, postal_code, city, region, country, delivery_instructions, created_at"
      )
      .eq("customer_id", id)
      .in("type", ["shipping", "both"])
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1),
    svc
      .from("orders")
      .select(
        `id, order_number, status, placed_at, total_chf, subscription_id, stripe_invoice_url,
         items:order_items(coffee_name_snapshot, quantity, weight_g)`
      )
      .eq("customer_id", id)
      .order("placed_at", { ascending: false }),
    svc
      .from("subscriptions")
      .select(
        `id, status, interval_weeks, price_chf_per_delivery, discovery_mode, created_at, cancelled_at,
         items:subscription_items(coffee_id, quantity, weight_g, coffee:coffees(name)),
         deliveries:subscription_deliveries(delivered_at, coffee:coffees(name))`
      )
      .eq("customer_id", id)
      .order("created_at", { ascending: false }),
    svc
      .from("customer_credits")
      .select(
        "id, amount_chf, reason, description, created_at, order_id, campaign_id"
      )
      .eq("customer_id", id)
      .order("created_at", { ascending: false }),
  ]);

  type Order = {
    id: string;
    order_number: string;
    status: string;
    placed_at: string;
    total_chf: number;
    subscription_id: string | null;
    stripe_invoice_url: string | null;
    items: Array<{
      coffee_name_snapshot: string;
      quantity: number;
      weight_g: number;
    }>;
  };
  const orderList = (orders ?? []) as Order[];
  const totalRevenue = orderList
    .filter((o) => ["paid", "processing", "shipped", "delivered"].includes(o.status))
    .reduce((s, o) => s + Number(o.total_chf), 0);

  // Supabase liefert verschachtelte FK-Joins immer als Array. Wir lassen
  // den Typ entsprechend offen und unwrap'en pro Item via Array.isArray.
  type Sub = {
    id: string;
    status: string;
    interval_weeks: number;
    price_chf_per_delivery: number;
    discovery_mode: boolean;
    created_at: string;
    cancelled_at: string | null;
    items: Array<{
      coffee_id: string;
      quantity: number;
      weight_g: number;
      coffee: { name: string } | { name: string }[] | null;
    }>;
    deliveries: Array<{
      delivered_at: string;
      coffee: { name: string } | { name: string }[] | null;
    }>;
  };
  type Credit = {
    id: string;
    amount_chf: number;
    reason: string;
    description: string | null;
    created_at: string;
    order_id: string | null;
    campaign_id: string | null;
  };

  // Default-Adresse — wir laden nur die eine, kein Listen-Rendering mehr
  // (Section "Adressen" pro User-Wunsch entfernt). Editing passiert
  // direkt im Stammdaten-Form.
  const defaultAddress = (addresses ?? [])[0] ?? null;
  const subList = (subscriptions ?? []) as Sub[];
  const creditList = (credits ?? []) as Credit[];

  const creditTotal = creditList.reduce((s, c) => s + Number(c.amount_chf), 0);

  const fullName =
    `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim() || "—";

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/customers"
          className="font-headline text-[11px] uppercase tracking-widest text-tertiary hover:text-primary inline-block mb-3"
        >
          ← Zurück zur Kunden-Liste
        </Link>
        <div className="flex justify-between items-end flex-wrap gap-4">
          <div>
            <h1 className="font-headline font-bold text-3xl md:text-4xl text-primary uppercase tracking-tight">
              {fullName}
            </h1>
            <p className="text-on-surface-variant mt-1">{customer.email}</p>
            <p className="text-xs text-on-surface-variant mt-1">
              Kunde seit {fmtDate(customer.created_at)}
              {customer.deleted_at && (
                <span className="ml-2 text-rose-700 font-bold">
                  · Gelöscht am {fmtDate(customer.deleted_at)}
                </span>
              )}
              {tasteType?.name_de && (
                <span className="ml-2">· Typ: {tasteType.name_de}</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Bestellungen" value={String(orderList.length)} />
        <Kpi label="Umsatz" value={`CHF ${fmtChf(totalRevenue)}`} />
        <Kpi label="Aktive Abos" value={String(subList.filter((s) => s.status === "active").length)} />
        <Kpi label="Guthaben-Saldo" value={`CHF ${fmtChf(creditTotal)}`} />
      </section>

      {/* Profil-Edit */}
      <section className="bg-white p-6 md:p-8 shadow-sm">
        <h2 className="font-headline font-bold text-lg text-primary uppercase tracking-tight mb-6">
          Stammdaten bearbeiten
        </h2>
        <CustomerEditForm
          customerId={customer.id}
          initial={{
            first_name: customer.first_name ?? "",
            last_name: customer.last_name ?? "",
            phone: customer.phone ?? "",
            language: customer.language ?? "de-CH",
            marketing_opt_in: !!customer.marketing_opt_in,
            notify_shipping: customer.notify_shipping ?? true,
            notify_recommendations: customer.notify_recommendations ?? true,
          }}
          address={
            defaultAddress
              ? {
                  id: defaultAddress.id as string,
                  recipient_name: defaultAddress.recipient_name ?? "",
                  company: defaultAddress.company ?? "",
                  street: defaultAddress.street ?? "",
                  street_additional: defaultAddress.street_additional ?? "",
                  postal_code: defaultAddress.postal_code ?? "",
                  city: defaultAddress.city ?? "",
                  region: defaultAddress.region ?? "",
                  country: defaultAddress.country ?? "CH",
                  delivery_instructions:
                    defaultAddress.delivery_instructions ?? "",
                }
              : {
                  id: null,
                  recipient_name: "",
                  company: "",
                  street: "",
                  street_additional: "",
                  postal_code: "",
                  city: "",
                  region: "",
                  country: "CH",
                  delivery_instructions: "",
                }
          }
        />
      </section>

      {/* Aktionen: Marketing-Code zuweisen, Soft-Delete */}
      <section className="bg-white p-6 md:p-8 shadow-sm">
        <h2 className="font-headline font-bold text-lg text-primary uppercase tracking-tight mb-6">
          Aktionen
        </h2>
        <CustomerActions
          customerId={customer.id}
          email={customer.email}
          alreadyDeleted={!!customer.deleted_at}
        />
      </section>

      {/* Subscriptions — eigene Row-Component mit Bearbeiten-Modal,
          Pause/Resume/Cancel-Buttons, Interval- + Quantity-Edit. */}
      <section className="bg-white p-6 md:p-8 shadow-sm">
        <h2 className="font-headline font-bold text-lg text-primary uppercase tracking-tight mb-6">
          Abos ({subList.length})
        </h2>
        {subList.length === 0 ? (
          <p className="text-sm text-on-surface-variant">
            Noch keine Abos.
          </p>
        ) : (
          <div className="divide-y divide-surface-container">
            {subList.map((s) => {
              const item = s.items?.[0];
              const itemCoffee = item
                ? Array.isArray(item.coffee)
                  ? item.coffee[0]
                  : item.coffee
                : null;
              const lastDelivery = s.deliveries?.length
                ? [...s.deliveries].sort(
                    (a, b) =>
                      new Date(b.delivered_at).getTime() -
                      new Date(a.delivered_at).getTime()
                  )[0]
                : null;
              const lastCoffee = lastDelivery
                ? Array.isArray(lastDelivery.coffee)
                  ? lastDelivery.coffee[0]
                  : lastDelivery.coffee
                : null;
              return (
                <SubscriptionRow
                  key={s.id}
                  sub={{
                    id: s.id,
                    status: s.status,
                    interval_weeks: s.interval_weeks,
                    price_chf_per_delivery: Number(s.price_chf_per_delivery),
                    discovery_mode: s.discovery_mode,
                    coffee_name: itemCoffee?.name ?? "—",
                    quantity: item?.quantity ?? 1,
                    weight_g: item?.weight_g ?? 250,
                    last_delivery_at: lastDelivery?.delivered_at ?? null,
                    last_delivery_coffee: lastCoffee?.name ?? null,
                    created_at: s.created_at,
                  }}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Bestellungen — mit Coffee-Namen + Stripe-Rechnung-Button. */}
      <section className="bg-white p-6 md:p-8 shadow-sm">
        <h2 className="font-headline font-bold text-lg text-primary uppercase tracking-tight mb-6">
          Bestellungen ({orderList.length})
        </h2>
        {orderList.length === 0 ? (
          <p className="text-sm text-on-surface-variant">
            Noch keine Bestellungen.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                <tr>
                  <th className="text-left py-2">Order-Nr.</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Datum</th>
                  <th className="text-left py-2">Coffees</th>
                  <th className="text-right py-2">Total</th>
                  <th className="text-left py-2 pl-3">Rechnung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {orderList.map((o) => {
                  const coffeeSummary = (o.items ?? [])
                    .map((it) =>
                      it.quantity > 1
                        ? `${it.coffee_name_snapshot} (${it.quantity}× ${it.weight_g}g)`
                        : `${it.coffee_name_snapshot} (${it.weight_g}g)`
                    )
                    .join(", ");
                  return (
                    <tr key={o.id}>
                      <td className="py-2 font-mono text-xs">{o.order_number}</td>
                      <td className="py-2">
                        <span
                          className={`inline-block px-2 py-0.5 text-[9px] font-headline font-bold uppercase tracking-widest ${
                            o.status === "paid" ||
                            o.status === "shipped" ||
                            o.status === "delivered"
                              ? "bg-tertiary/20 text-tertiary"
                              : o.status === "pending"
                                ? "bg-amber-100 text-amber-900"
                                : "bg-stone-200 text-stone-700"
                          }`}
                        >
                          {o.status}
                        </span>
                        {o.subscription_id && (
                          <span className="ml-2 text-[9px] font-headline uppercase tracking-widest text-tertiary">
                            Abo
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-xs text-on-surface-variant">
                        {fmtDate(o.placed_at)}
                      </td>
                      <td className="py-2 text-xs max-w-xs truncate" title={coffeeSummary}>
                        {coffeeSummary || "—"}
                      </td>
                      <td className="py-2 text-right font-headline font-bold">
                        {fmtChf(Number(o.total_chf))}
                      </td>
                      <td className="py-2 pl-3">
                        {o.stripe_invoice_url ? (
                          <a
                            href={o.stripe_invoice_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block bg-primary text-on-primary px-3 py-1.5 font-headline font-bold text-[10px] uppercase tracking-widest hover:bg-black transition-all"
                          >
                            Rechnung ↓
                          </a>
                        ) : (
                          <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Credits */}
      {creditList.length > 0 && (
        <section className="bg-white p-6 md:p-8 shadow-sm">
          <h2 className="font-headline font-bold text-lg text-primary uppercase tracking-tight mb-6">
            Guthaben-Bewegungen ({creditList.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                <tr>
                  <th className="text-left py-2">Datum</th>
                  <th className="text-left py-2">Grund</th>
                  <th className="text-left py-2">Beschreibung</th>
                  <th className="text-right py-2">CHF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {creditList.map((c) => (
                  <tr key={c.id}>
                    <td className="py-2 text-xs text-on-surface-variant">
                      {fmtDate(c.created_at)}
                    </td>
                    <td className="py-2 font-headline text-[10px] uppercase tracking-widest font-bold">
                      {c.reason}
                    </td>
                    <td className="py-2 text-xs">{c.description ?? "—"}</td>
                    <td
                      className={`py-2 text-right font-headline font-bold ${
                        Number(c.amount_chf) >= 0 ? "text-tertiary" : "text-on-surface-variant"
                      }`}
                    >
                      {Number(c.amount_chf) >= 0 ? "+" : ""}
                      {Number(c.amount_chf).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-5 shadow-sm">
      <p className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">
        {label}
      </p>
      <p className="font-headline font-bold text-xl md:text-2xl text-primary">
        {value}
      </p>
    </div>
  );
}
