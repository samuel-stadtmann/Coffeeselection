import Link from "next/link";
import { redirect } from "next/navigation";
import AccountLayout, { PageHeader } from "@/components/AccountLayout";
import { createClient } from "@/lib/supabase/server";
import OrderHistoryView from "./OrderHistoryView";

export type OrderItemForReorder = {
  coffee_id: string;
  coffee_name: string;
  coffee_slug: string;
  image_url: string | null;
  roaster_name: string;
  quantity: number;
  weight_g: number;
  unit_price_chf_250g: number;
  grind_preference: string | null;
};

export type OrderRow = {
  id: string;
  order_number: string;
  date: string; // formatiert de-CH
  type: "Abo" | "Einmalig";
  status: string;
  total: number;
  rated: boolean;
  // Items als Snapshots — fuer "Wiederbestellen" mit gleicher Konfig.
  items: OrderItemForReorder[];
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Wartet auf Zahlung",
  paid: "Bezahlt",
  processing: "In Vorbereitung",
  shipped: "Versendet",
  delivered: "Geliefert",
  cancelled: "Storniert",
  refunded: "Erstattet",
};

export default async function OrderHistoryPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/account/order-history");

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", auth.user.id)
    .single();
  if (!customer) redirect("/login");

  // Orders + Items, mit Coffee-Join fuer Slug/Image/aktuellen Preis.
  // Snapshots aus order_items_haben Vorrang fuer Anzeige (Historie), aber
  // fuer Wiederbestellen brauchen wir den aktuellen coffee_slug.
  const { data: ordersRaw } = await supabase
    .from("orders")
    .select(
      `id, order_number, placed_at, status, total_chf, subscription_id,
       items:order_items(
         coffee_id, coffee_name_snapshot, roaster_name_snapshot,
         quantity, weight_g, unit_price_chf, grind_preference,
         coffee:coffees(slug, image_url)
       )`
    )
    .eq("customer_id", customer.id)
    .neq("status", "pending")
    .order("placed_at", { ascending: false });

  // Bereits abgegebene Ratings -> rated-Flag je Order
  const { data: ratings } = await supabase
    .from("coffee_ratings")
    .select("order_id")
    .eq("customer_id", customer.id);
  const ratedOrderIds = new Set(
    (ratings ?? [])
      .map((r) => r.order_id)
      .filter((id): id is string => typeof id === "string")
  );

  type RawOrder = {
    id: string;
    order_number: string;
    placed_at: string;
    status: string;
    total_chf: number;
    subscription_id: string | null;
    items: Array<{
      coffee_id: string;
      coffee_name_snapshot: string;
      roaster_name_snapshot: string;
      quantity: number;
      weight_g: number;
      unit_price_chf: number;
      grind_preference: string | null;
      coffee:
        | { slug: string; image_url: string | null }
        | { slug: string; image_url: string | null }[]
        | null;
    }>;
  };

  const orders: OrderRow[] = ((ordersRaw ?? []) as unknown as RawOrder[]).map((o) => {
    const items: OrderItemForReorder[] = (o.items ?? []).map((it) => {
      const c = Array.isArray(it.coffee) ? it.coffee[0] : it.coffee;
      // Snapshot-Preis ist fuer weight_g — auf 250g-Basis zurueckrechnen.
      const unit250 = (Number(it.unit_price_chf) * 250) / it.weight_g;
      return {
        coffee_id: it.coffee_id,
        coffee_name: it.coffee_name_snapshot,
        coffee_slug: c?.slug ?? "",
        image_url: c?.image_url ?? null,
        roaster_name: it.roaster_name_snapshot,
        quantity: it.quantity,
        weight_g: it.weight_g,
        unit_price_chf_250g: Number(unit250.toFixed(2)),
        grind_preference: it.grind_preference,
      };
    });
    return {
      id: o.id,
      order_number: o.order_number,
      date: new Date(o.placed_at).toLocaleDateString("de-CH"),
      type: o.subscription_id ? "Abo" : "Einmalig",
      status: STATUS_LABEL[o.status] ?? o.status,
      total: Number(o.total_chf),
      rated: ratedOrderIds.has(o.id),
      items,
    };
  });

  return (
    <AccountLayout>
      <PageHeader
        subtitle="Bestellungen"
        title="Bestellhistorie"
        description="Alle deine bisherigen Bestellungen mit Status, Bewertung und Wiederbestellungs-Option."
      />
      <OrderHistoryView orders={orders} />
      <Link
        href="/account/dashboard"
        className="font-headline text-[11px] uppercase tracking-[0.2em] text-tertiary hover:text-primary transition-colors border-b-2 border-tertiary pb-1 inline-block"
      >
        ← Zurück zum Dashboard
      </Link>
    </AccountLayout>
  );
}
