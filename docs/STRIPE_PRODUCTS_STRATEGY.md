# Stripe-Products-Strategie

**Status:** Entschieden (P1B-2, 2026-05-13)
**Gilt fuer:** Einmalkauf (Phase 1A, C-4) UND Abos (Phase 1B)
**Code-Konvention:** Dynamische Prices via `price_data` inline — KEINE
vorkonfigurierten Products/Prices im Stripe-Dashboard.

---

## Entscheidung

Wir erzeugen alle Stripe-Prices **dynamisch zur Laufzeit** mit `price_data`
inline. Wir pflegen **keine** Products oder Prices im Stripe-Dashboard.

Konkret:

- **Einmalkauf:** `stripe.checkout.sessions.create({ line_items: [{
  price_data: { currency, unit_amount, product_data } }] })`.
  Siehe `app/api/checkout/session/route.ts:217-237`.
- **Abos:** `stripe.subscriptions.create({ items: [{ price_data: { currency,
  unit_amount, recurring: { interval, interval_count }, product_data } }] })`.
  Wird in P1B-5 implementiert.

Das aus `price_data` resultierende Stripe-`Price`-Objekt persistieren wir
in `subscriptions.stripe_price_id` (Migration P1B-1).

---

## Warum dynamisch — und nicht vorkonfiguriert

| Aspekt | Dynamisch (`price_data`) | Vorkonfiguriert |
|---|---|---|
| Neuer Kaffee live | sofort verkaufbar | erst nach Stripe-Dashboard-Setup |
| Anzahl Stripe-Objekte | viele (1 pro Sale) | wenige (geplante Matrix) |
| Code-Komplexitaet | Preis aus DB → inline | DB ↔ Stripe-IDs syncen |
| Roaster-Self-Service | passt (nur DB) | Roaster brauchen Stripe-Zugriff |
| Stripe-Product-Reports | nicht nutzbar | nutzbar |

**Treiber fuer dynamisch:**

1. **Preis-Matrix waere absurd gross.** Ein Coffee hat 3-4 Groessen, Abos
   haben 5 Intervalle (1/2/4/6/8 Wochen), Abo-Rabatt-Snapshot kann
   variieren. Pro Coffee waeren das schnell ≥20 Prices. Bei 50 Coffees =
   1000 Stripe-Prices, die wir syncen muessten.

2. **Preise sind in unserer DB die Source-of-Truth**, nicht in Stripe.
   `coffees.price_chf_<size>g` und `subscriptions.discount_percent` sind
   die Quellen. Stripe duplizieren waere Anti-Pattern (zwei Wahrheiten,
   Drift garantiert).

3. **Konsistenz mit C-4.** Einmalkauf nutzt schon `price_data`. Abos auch
   so zu machen heisst: ein Pattern fuer alles, weniger Code zu lernen,
   keine Sonderfaelle.

4. **Roaster-Onboarding bleibt einfach.** Wir wollen Roaster nicht durch
   ein Stripe-Onboarding zwingen — Coffee in unserer DB anlegen, fertig.

**Verzicht (bewusst):**

- **Stripe-Product-Reports** zeigen "wie viel Coffee X verkauft". Brauchen
  wir nicht — Reports machen wir aus `order_items` / `subscription_items`
  in unserer DB (richtiger Ort, mehr Detail).
- **Stripe-Dashboard "Pricing-Tables"** koennten wir nicht nutzen. Brauchen
  wir auch nicht — Pricing-UI bauen wir selbst (Coffee-Detail-Page).

---

## Code-Konvention

### Pflicht-Felder fuer `price_data`

```ts
price_data: {
  currency: "chf",
  unit_amount: Math.round(Number(priceChf) * 100), // CHF → Rappen
  product_data: {
    name: coffee.name,
    description: `${weight_g}g · ${roaster.name}`,
    metadata: {
      coffee_id: coffee.id,
      weight_g: String(weight_g),
      // bei Abos zusaetzlich:
      // is_subscription: "true",
      // interval_weeks: String(intervalWeeks),
      // discount_percent: String(discountPercent),
    },
  },
  // nur bei Abos:
  recurring: {
    interval: "week",
    interval_count: intervalWeeks, // 1, 2, 4, 6, 8
  },
}
```

### Snapshots in unserer DB

Sobald Stripe ein Price-Objekt erzeugt hat (z.B. `subscription.items.data[0].price.id`):

- **Einmalkauf:** brauchen wir NICHT zu persistieren — die `order_items` haben
  schon `unit_price_chf` und `coffee_name_snapshot` als Snapshot. Stripe-Price
  ist transient.
- **Abos:** persistieren in `subscriptions.stripe_price_id` (P1B-1-Spalte).
  Brauchen wir fuer: Subscription-Updates ("Intervall aendern" → neue Price
  erzeugen → alte Price loeschen).

### Verbot: keine `stripe.prices.create()` / `stripe.products.create()`

Wenn wir das jemals brauchen → erst hier dokumentieren, warum die
dynamische Variante nicht reicht.

---

## Stripe-Tax

`price_data.tax_code` koennten wir setzen (`txcd_99020001` fuer "Coffee
Beans"). **Aktivieren erst wenn UID da ist** — siehe C-4-Kommentar im
Checkout-Code. Gilt sowohl fuer Einmalkauf als auch Abos.

---

## Loeschen alter Prices

Wenn ein Abo-Intervall geaendert wird (zukuenftiges Feature in P1B-7):

1. Neue `price_data` an `stripe.subscriptions.update({ items: [...] })`.
2. Alten Price NICHT manuell loeschen — Stripe archiviert ihn automatisch
   wenn keine aktive Subscription mehr drauf zeigt. Wir wuerden's eh nicht
   sicher koennen (laufende Webhooks etc.).

---

## Was das fuer P1B-5 (Subscription-Create-API) heisst

Der Code wird aussehen wie:

```ts
const sub = await stripe.subscriptions.create({
  customer: stripeCustomerId,
  items: [{
    price_data: {
      currency: "chf",
      unit_amount: Math.round(discountedPriceChf * 100),
      product_data: { name: coffee.name, metadata: {...} },
      recurring: { interval: "week", interval_count: intervalWeeks },
    },
    quantity: 1,
  }],
  metadata: { subscription_id: ourSubscriptionUuid },
});

await svc
  .from("subscriptions")
  .update({
    stripe_subscription_id: sub.id,
    stripe_price_id: sub.items.data[0].price.id,
    stripe_current_period_end: new Date(sub.current_period_end * 1000),
    status: "active",
  })
  .eq("id", ourSubscriptionUuid);
```

Detaillierte Implementierung in P1B-5.
