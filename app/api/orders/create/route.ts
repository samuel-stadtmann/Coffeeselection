import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { SUBSCRIPTION_INTERVAL_WEEKS } from "@/lib/subscription-constants";

/**
 * C-3 + P1B-5: POST /api/orders/create
 *
 * Persistiert eine "pending"-Order aus dem Cart. Der eigentliche Zahlungs-
 * Flow folgt in /api/checkout/session — diese Route legt nur den
 * Datenbank-Datensatz an und gibt order_id + order_number zurueck.
 *
 * Cart-Modi:
 *   - Reiner Einmal-Cart    → order + order_items, keine subscriptions
 *   - Cart mit Abo-Item      → zusaetzlich subscriptions + subscription_items
 *                              mit status='pending' (Webhook hebt auf 'active')
 *   - Maximal 1 Abo-Item pro Cart (Stripe-Limit: 1 Subscription pro Session)
 *
 * Auth-Verhalten (Hybrid-Modell, siehe Phase-1A-Plan):
 *   - Auth-User in Session   → benutze existierenden customer-Datensatz
 *   - Kein Auth-User (Gast)  → silent create via auth.admin.createUser:
 *       1) Existiert email schon in auth.users? → reuse
 *       2) Sonst: createUser({email, email_confirm:true}) → Trigger
 *          handle_new_auth_user erstellt customers-Zeile automatisch
 *       Hinweis: Gast hat kein Passwort. Magic-Link "Account jetzt
 *       erstellen" kommt in der Confirmation-Mail.
 *
 * Preis-Berechnung (NIE Client vertrauen):
 *   - basis_unit_chf  = coffee.price_chf * (weight_g / 250)   (lineare Skalierung)
 *   - bei Abo-Item:   unit_price_chf = basis_unit_chf * (1 - discount_percent/100)
 *   - line_total_chf  = unit_price_chf * quantity
 *   - subtotal_chf    = sum(line_total_chf)  (inkl. Abo-Rabatt)
 *   - shipping_chf    = subtotal < 100 ? 6.90 : 0
 *   - tax_chf         = 0  (Stripe Tax berechnet bei Checkout, Webhook updated)
 *   - total_chf       = subtotal + shipping
 *
 * Status: order.status='pending', subscription.status='pending'. Wird durch
 * /api/webhooks/stripe auf 'paid' bzw. 'active' gesetzt.
 */

const DEFAULT_WEIGHT_G = 250;
const FREE_SHIPPING_THRESHOLD_CHF = 100;
const STANDARD_SHIPPING_CHF = 6.9;

const ItemSchema = z
  .object({
    coffee_id: z.uuid(),
    quantity: z.number().int().min(1).max(20),
    weight_g: z
      .number()
      .int()
      .refine((v) => [250, 500, 1000].includes(v), {
        message: "weight_g muss 250, 500 oder 1000 sein",
      }),
    grind_preference: z
      .enum([
        "whole_bean",
        "espresso",
        "filter",
        "french_press",
        "aeropress",
        "moka",
        "other",
      ])
      .optional()
      .nullable(),
    // Abo-Felder (P1B-5). Wenn is_subscription=true, sind interval_weeks
    // und discount_percent Pflicht.
    is_subscription: z.boolean().optional().default(false),
    interval_weeks: z
      .number()
      .int()
      .refine(
        (v): v is (typeof SUBSCRIPTION_INTERVAL_WEEKS)[number] =>
          (SUBSCRIPTION_INTERVAL_WEEKS as readonly number[]).includes(v),
        { message: "interval_weeks muss 1, 2, 4, 6 oder 8 sein" }
      )
      .optional(),
    discount_percent: z.number().min(0).max(100).optional(),
  })
  .refine(
    (it) =>
      !it.is_subscription ||
      (it.interval_weeks !== undefined && it.discount_percent !== undefined),
    {
      message:
        "interval_weeks und discount_percent sind Pflicht bei is_subscription=true",
    }
  );

const AddressSchema = z.object({
  recipient_name: z.string().min(1).max(120),
  company: z.string().max(120).optional().nullable(),
  street: z.string().min(1).max(200),
  street_additional: z.string().max(200).optional().nullable(),
  postal_code: z.string().min(2).max(20),
  city: z.string().min(1).max(120),
  region: z.string().max(80).optional().nullable(),
  country: z
    .string()
    .length(2)
    .regex(/^[A-Z]{2}$/)
    .default("CH"),
  delivery_instructions: z.string().max(500).optional().nullable(),
});

const BodySchema = z
  .object({
    items: z.array(ItemSchema).min(1).max(20),
    // Customer-Info — bei Gast required, bei auth-User optional (kommt aus Session)
    customer: z
      .object({
        email: z.email().max(254),
        first_name: z.string().min(1).max(80).optional().nullable(),
        last_name: z.string().min(1).max(80).optional().nullable(),
        language: z.enum(["de-CH", "fr-CH", "it-CH", "en"]).default("de-CH"),
        marketing_opt_in: z.boolean().default(false),
      })
      .optional(),
    shipping_address: AddressSchema,
    billing_address_same_as_shipping: z.boolean().default(true),
    billing_address: AddressSchema.optional().nullable(),
    customer_note: z.string().max(1000).optional().nullable(),
  })
  .refine(
    (b) => b.billing_address_same_as_shipping || b.billing_address,
    { message: "billing_address ist Pflicht wenn billing_address_same_as_shipping=false" }
  )
  .refine(
    (b) => b.items.filter((i) => i.is_subscription).length <= 1,
    {
      message:
        "Max 1 Abo-Item pro Order (Stripe-Limit: 1 Subscription pro Session)",
    }
  );

type Body = z.infer<typeof BodySchema>;
type Address = z.infer<typeof AddressSchema>;

export async function POST(req: NextRequest) {
  // ---- 1) Input-Parsing -----------------------------------------------------
  let body: Body;
  try {
    body = BodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      {
        error: "invalid_body",
        details:
          err instanceof z.ZodError ? err.issues : String(err),
      },
      { status: 400 }
    );
  }

  // ---- 2) Customer ermitteln (Auth-User oder Gast) --------------------------
  const supa = await createClient();
  const { data: authData } = await supa.auth.getUser();
  const authUser = authData.user;

  // Bei Gast brauchen wir die customer-Daten im Body
  if (!authUser && !body.customer) {
    return NextResponse.json(
      { error: "customer_required_for_guest" },
      { status: 400 }
    );
  }

  const svc = createServiceClient();
  let customerId: string;
  let customerEmail: string;

  if (authUser) {
    // Auth-User → lookup customer durch auth_user_id
    const { data: c, error: cErr } = await svc
      .from("customers")
      .select("id, email")
      .eq("auth_user_id", authUser.id)
      .maybeSingle();
    if (cErr || !c) {
      console.error("[api/orders/create] customer lookup failed", cErr);
      return NextResponse.json(
        { error: "customer_not_found", details: cErr?.message ?? "unknown" },
        { status: 500 }
      );
    }
    customerId = c.id;
    customerEmail = c.email;
  } else {
    // Gast — finde oder erzeuge auth.users + customer
    const email = body.customer!.email.toLowerCase().trim();

    // 2a) Existiert customer schon mit dieser E-Mail?
    const { data: existing, error: exErr } = await svc
      .from("customers")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();
    if (exErr) {
      console.error("[api/orders/create] customer email-lookup failed", exErr);
      return NextResponse.json(
        { error: "customer_lookup_failed", details: exErr.message },
        { status: 500 }
      );
    }

    if (existing) {
      customerId = existing.id;
      customerEmail = existing.email;
    } else {
      // 2b) Neuer Gast → auth user anlegen → Trigger erstellt customers-Row
      const { data: newAuth, error: createErr } = await svc.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          language: body.customer!.language,
          first_name: body.customer!.first_name ?? null,
          last_name: body.customer!.last_name ?? null,
          marketing_opt_in: body.customer!.marketing_opt_in,
          created_via: "guest_checkout",
        },
      });
      if (createErr || !newAuth.user) {
        console.error("[api/orders/create] auth.admin.createUser failed", createErr);
        return NextResponse.json(
          { error: "guest_creation_failed", details: createErr?.message ?? "unknown" },
          { status: 500 }
        );
      }

      // Trigger handle_new_auth_user laeuft synchron — customer-Row sollte
      // jetzt existieren. Lookup zur Bestaetigung.
      const { data: newCust, error: ncErr } = await svc
        .from("customers")
        .select("id, email")
        .eq("auth_user_id", newAuth.user.id)
        .maybeSingle();
      if (ncErr || !newCust) {
        console.error("[api/orders/create] customer not created by trigger", ncErr);
        return NextResponse.json(
          { error: "customer_trigger_failed", details: ncErr?.message ?? "unknown" },
          { status: 500 }
        );
      }

      // Optional: first/last name + marketing_opt_in nach Anlage updaten,
      // weil der Trigger nur email + language setzt.
      await svc
        .from("customers")
        .update({
          first_name: body.customer!.first_name ?? null,
          last_name: body.customer!.last_name ?? null,
          marketing_opt_in: body.customer!.marketing_opt_in,
        })
        .eq("id", newCust.id);

      customerId = newCust.id;
      customerEmail = newCust.email;
    }
  }

  // ---- 3) Coffees aus DB laden + Preise validieren --------------------------
  const coffeeIds = [...new Set(body.items.map((i) => i.coffee_id))];
  const { data: coffees, error: coffeesErr } = await svc
    .from("coffees")
    .select(
      "id, name, price_chf, weight_g, status, stock_status, roaster:roasters(name), roast_level"
    )
    .in("id", coffeeIds);

  if (coffeesErr) {
    console.error("[api/orders/create] coffees lookup failed", coffeesErr);
    return NextResponse.json(
      { error: "coffees_lookup_failed", details: coffeesErr.message },
      { status: 500 }
    );
  }

  const coffeeMap = new Map(
    (coffees ?? []).map((c) => [
      c.id,
      {
        ...c,
        // Supabase typed FK -> array in TS, aber im Runtime ist's ein Objekt.
        // Cast fuer den Snapshot.
        roaster_name: (c.roaster as unknown as { name: string } | null)?.name ?? "",
      },
    ])
  );

  for (const item of body.items) {
    const c = coffeeMap.get(item.coffee_id);
    if (!c) {
      return NextResponse.json(
        { error: "coffee_not_found", coffee_id: item.coffee_id },
        { status: 400 }
      );
    }
    if (c.status !== "active") {
      return NextResponse.json(
        {
          error: "coffee_not_active",
          coffee_id: item.coffee_id,
          name: c.name,
          status: c.status,
        },
        { status: 400 }
      );
    }
    if (c.stock_status === "out_of_stock") {
      return NextResponse.json(
        { error: "coffee_out_of_stock", coffee_id: item.coffee_id, name: c.name },
        { status: 400 }
      );
    }
  }

  // ---- 4) Preise berechnen --------------------------------------------------
  // Bei Abo-Items: discount_percent vom Body wird auf die LINEAR-skalierten
  // Preise angewendet. So zahlt der Customer in der Initial-Order schon den
  // Abo-Preis (gleichbleibend fuer alle Folge-Renewals via subscriptions.
  // price_chf_per_delivery).
  const lineItems = body.items.map((item) => {
    const c = coffeeMap.get(item.coffee_id)!;
    // Lineare Skalierung: 500g = 2x Preis, 1000g = 4x Preis von 250g.
    const weightFactor = item.weight_g / DEFAULT_WEIGHT_G;
    const basisUnit = Number(c.price_chf) * weightFactor;
    const discountMul = item.is_subscription
      ? 1 - (item.discount_percent ?? 0) / 100
      : 1;
    const unitPrice = Number((basisUnit * discountMul).toFixed(2));
    const lineTotal = Number((unitPrice * item.quantity).toFixed(2));
    return {
      coffee_id: item.coffee_id,
      coffee_name_snapshot: c.name,
      roaster_name_snapshot: c.roaster_name,
      roast_level_snapshot: c.roast_level ?? null,
      quantity: item.quantity,
      weight_g: item.weight_g,
      unit_price_chf: unitPrice,
      line_total_chf: lineTotal,
      grind_preference: item.grind_preference ?? null,
      // Wird nach order-insert genutzt um subscriptions anzulegen
      is_subscription: item.is_subscription ?? false,
      interval_weeks: item.interval_weeks,
      discount_percent: item.discount_percent,
    };
  });

  const subtotal = Number(
    lineItems.reduce((s, li) => s + li.line_total_chf, 0).toFixed(2)
  );
  const shipping =
    subtotal >= FREE_SHIPPING_THRESHOLD_CHF ? 0 : STANDARD_SHIPPING_CHF;
  // tax_chf bleibt 0 — Stripe Tax berechnet auf Checkout, Webhook (C-5)
  // schreibt den realen Wert zurueck.
  const total = Number((subtotal + shipping).toFixed(2));

  // ---- 5) Addressen-Snapshots vorbereiten -----------------------------------
  const billing: Address = body.billing_address_same_as_shipping
    ? body.shipping_address
    : body.billing_address!;

  const toSnapshot = (a: Address) => ({
    recipient_name: a.recipient_name,
    company: a.company ?? null,
    street: a.street,
    street_additional: a.street_additional ?? null,
    postal_code: a.postal_code,
    city: a.city,
    region: a.region ?? null,
    country: a.country,
    delivery_instructions: a.delivery_instructions ?? null,
  });

  // ---- 6) (Optional) Adressen in customer_addresses persistieren ------------
  // Wir speichern fuer Auth-User die Adresse als wiederverwendbar. Bei Gaesten
  // ebenfalls — der Magic-Link kann den Account spaeter freischalten.
  const { data: shipAddr, error: saErr } = await svc
    .from("customer_addresses")
    .insert({
      customer_id: customerId,
      type: "shipping",
      ...toSnapshot(body.shipping_address),
    })
    .select("id")
    .single();
  if (saErr || !shipAddr) {
    console.error("[api/orders/create] shipping_address insert failed", saErr);
    return NextResponse.json(
      { error: "address_insert_failed", details: saErr?.message ?? "unknown" },
      { status: 500 }
    );
  }

  let billAddrId: string;
  if (body.billing_address_same_as_shipping) {
    billAddrId = shipAddr.id;
  } else {
    const { data: ba, error: baErr } = await svc
      .from("customer_addresses")
      .insert({
        customer_id: customerId,
        type: "billing",
        ...toSnapshot(billing),
      })
      .select("id")
      .single();
    if (baErr || !ba) {
      console.error("[api/orders/create] billing_address insert failed", baErr);
      return NextResponse.json(
        { error: "billing_insert_failed", details: baErr?.message ?? "unknown" },
        { status: 500 }
      );
    }
    billAddrId = ba.id;
  }

  // ---- 7) Order anlegen -----------------------------------------------------
  const { data: order, error: oErr } = await svc
    .from("orders")
    .insert({
      customer_id: customerId,
      subscription_id: null,
      status: "pending",
      shipping_address_id: shipAddr.id,
      billing_address_id: billAddrId,
      shipping_address_snapshot: toSnapshot(body.shipping_address),
      billing_address_snapshot: toSnapshot(billing),
      subtotal_chf: subtotal,
      shipping_chf: shipping,
      discount_chf: 0,
      tax_chf: 0,
      total_chf: total,
      language: body.customer?.language ?? "de-CH",
      customer_note: body.customer_note ?? null,
    })
    .select("id, order_number, subtotal_chf, shipping_chf, total_chf")
    .single();

  if (oErr || !order) {
    console.error("[api/orders/create] order insert failed", oErr);
    return NextResponse.json(
      { error: "order_insert_failed", details: oErr?.message ?? "unknown" },
      { status: 500 }
    );
  }

  // ---- 8) order_items anlegen -----------------------------------------------
  // interval_weeks + discount_percent waren interne Marker fuer Step 9
  // (Subscription-Anlage) — order_items hat dafuer keine Spalten.
  // is_subscription wird zu is_subscription_item (DB-Spalte) gemappt.
  const orderItemsToInsert = lineItems.map((li) => {
    const {
      is_subscription,
      interval_weeks: _iw,
      discount_percent: _dp,
      ...rest
    } = li;
    return {
      order_id: order.id,
      is_subscription_item: is_subscription,
      ...rest,
    };
  });

  const { error: itemsErr } = await svc
    .from("order_items")
    .insert(orderItemsToInsert);

  if (itemsErr) {
    console.error("[api/orders/create] order_items insert failed", itemsErr);
    // Cleanup: order ist da, items nicht. Loeschen damit kein verwaister
    // Order ohne items uebrig bleibt (ON DELETE CASCADE auf order_items).
    await svc.from("orders").delete().eq("id", order.id);
    return NextResponse.json(
      { error: "order_items_insert_failed", details: itemsErr.message },
      { status: 500 }
    );
  }

  // ---- 9) Subscription anlegen (falls Abo-Item im Cart) ---------------------
  // Max 1 Abo-Item pro Order (validiert via BodySchema). Wenn keins:
  // nichts zu tun, weiter mit Response.
  const subItem = lineItems.find((li) => li.is_subscription);
  let subscriptionId: string | null = null;
  if (subItem) {
    const pricePerDelivery = subItem.line_total_chf; // discounted, incl. menge
    // Versand-Snapshot: bei Renewal wuerde wieder die gleiche Logik greifen
    // (>=100 CHF gratis). Wir snapshoten den fuer DIESE Abo-Konfiguration
    // geltenden Wert — Customer weiss was die Folge-Lieferungen kosten.
    const subShippingChf =
      pricePerDelivery >= FREE_SHIPPING_THRESHOLD_CHF
        ? 0
        : STANDARD_SHIPPING_CHF;

    const { data: sub, error: subErr } = await svc
      .from("subscriptions")
      .insert({
        customer_id: customerId,
        subscription_type: "fix",
        interval_weeks: subItem.interval_weeks!,
        quantity_g_per_delivery: subItem.weight_g * subItem.quantity,
        shipping_address_id: shipAddr.id,
        billing_address_id: billAddrId,
        price_chf_per_delivery: pricePerDelivery,
        shipping_chf: subShippingChf,
        discount_percent: subItem.discount_percent ?? 0,
        status: "pending", // Webhook hebt auf 'active' bei Stripe-Bestaetigung
        first_order_id: order.id,
      })
      .select("id")
      .single();

    if (subErr || !sub) {
      console.error("[api/orders/create] subscription insert failed", subErr);
      // Cleanup: order + order_items wieder loeschen (CASCADE), damit kein
      // halbfertiger Mixed-State zurueckbleibt.
      await svc.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { error: "subscription_insert_failed", details: subErr?.message ?? "unknown" },
        { status: 500 }
      );
    }
    subscriptionId = sub.id;

    const { error: siErr } = await svc.from("subscription_items").insert({
      subscription_id: sub.id,
      coffee_id: subItem.coffee_id,
      quantity: subItem.quantity,
      weight_g: subItem.weight_g,
      sort_order: 0,
    });

    if (siErr) {
      console.error(
        "[api/orders/create] subscription_items insert failed",
        siErr
      );
      // Cleanup analog
      await svc.from("subscriptions").delete().eq("id", sub.id);
      await svc.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        {
          error: "subscription_items_insert_failed",
          details: siErr.message,
        },
        { status: 500 }
      );
    }
  }

  // ---- 10) Erfolgs-Response -------------------------------------------------
  return NextResponse.json({
    success: true,
    order_id: order.id,
    order_number: order.order_number,
    customer_id: customerId,
    customer_email: customerEmail,
    subtotal_chf: Number(order.subtotal_chf),
    shipping_chf: Number(order.shipping_chf),
    total_chf: Number(order.total_chf),
    currency: "chf",
    subscription_id: subscriptionId,
  });
}
