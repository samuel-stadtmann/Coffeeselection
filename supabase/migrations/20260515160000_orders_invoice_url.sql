-- Rechnungs-URL pro Order (Stripe-hosted).
--
-- Stripe hostet bei subscription-Invoices eine HTML-Seite mit der
-- Rechnung (hosted_invoice_url) — bei one-time-Payments ein einfaches
-- Belegs-PDF (charge.receipt_url). Wir speichern beides in einer
-- Spalte, der UI-Button reicht den Kunden 1:1 weiter ("Rechnung").

alter table public.orders
  add column if not exists stripe_invoice_url text;

comment on column public.orders.stripe_invoice_url is
  'Stripe-hosted Invoice- oder Receipt-URL. Bei Subscription-Orders: '
  'invoice.hosted_invoice_url (gehostete HTML-Rechnung). Bei one-time: '
  'charge.receipt_url. NULL solange Stripe noch keinen Beleg generiert '
  'hat (z.B. unbezahlte Order) oder fuer Alt-Bestellungen vor dieser '
  'Migration.';
