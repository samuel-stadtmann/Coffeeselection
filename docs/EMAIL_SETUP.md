# Email-Setup (Resend)

**Status:** P1B-8 — implementiert 2026-05-13.

Coffee Selection nutzt **Resend** fuer alle transaktionalen Mails
(Order-Confirmation, Abo-Confirmation, Renewal, Cancel). Versendet wird
ausschliesslich vom Webhook-Handler nach erfolgreichem Stripe-Event —
nicht direkt aus User-Aktionen, damit eine Mail nur dann rausgeht wenn
der Stripe-Charge auch wirklich durch ist.

---

## ENV-Variablen

| Variable | Pflicht | Beispiel | Wofuer |
|---|---|---|---|
| `RESEND_API_KEY` | ja | `re_AbCdEf123...` | API-Key aus Resend-Dashboard |
| `EMAIL_FROM` | nein | `Coffee Selection <hello@coffeeselection.ch>` | Absender. Domain MUSS in Resend verifiziert sein. Default fuer Tests: `onboarding@resend.dev`. |
| `EMAIL_REPLY_TO` | nein | `support@coffeeselection.ch` | Reply-To-Header (falls Kunden auf Mails antworten) |

Hosting-Plattform (z.B. Vercel): unter Settings → Environment Variables eintragen.

---

## Setup

1. Resend-Account erstellen: https://resend.com (free tier: 3000 Mails/Monat, danach $20/Monat)
2. **Domain verifizieren** unter Resend → Domains → Add Domain → `coffeeselection.ch`
   - 3 DNS-Records hinzufuegen (SPF, DKIM, DMARC werden vorgegeben)
   - Verifikation kann bis 24h dauern
3. **API-Key generieren** unter API Keys → Create API Key (Permission: `Sending access`)
4. `RESEND_API_KEY` und `EMAIL_FROM` in der Hosting-Plattform setzen
5. `EMAIL_FROM` auf die verifizierte Domain umstellen sobald sie aktiv ist

**Vor Domain-Verification:** API-Key trotzdem schon setzen. `EMAIL_FROM`
weglassen — default `onboarding@resend.dev` funktioniert fuer Test-
Mails an Resend-Account-Inhaber. Andere Empfaenger werden geblockt.

---

## Mail-Typen

Alle Templates leben unter `lib/email/templates/`. Layout-Wrapper:
`lib/email/layout.ts`. Versand-Helper: `lib/email/send.ts`.

| Template | Trigger | Datei |
|---|---|---|
| Order Confirmation | `checkout.session.completed` mit `mode=payment` | `order-confirmation.ts` |
| Subscription Confirmation (Initial) | `checkout.session.completed` mit `mode=subscription` | `subscription-confirmation.ts` |
| Subscription Renewal | `invoice.payment_succeeded` mit `billing_reason=subscription_cycle` | `subscription-renewal.ts` |
| Subscription Cancelled | `customer.subscription.deleted` | `subscription-cancelled.ts` |

Webhook ruft `await sendXxxMail(...)` nach dem DB-Update auf.
`sendMail()` wirft **nie** — Mail-Fail blockiert NICHT den Webhook-Erfolg.
Errors werden geloggt fuer Debugging.

---

## Testen

### Lokal (Test-Mail an dich selbst)

```bash
# .env.local
RESEND_API_KEY=re_dein_test_key
EMAIL_FROM=onboarding@resend.dev
```

Dann: durch den normalen Checkout-Flow auf Stripe-Test-Karte zahlen.
Webhook (vom Stripe-CLI-Forward oder lokalem Ngrok) triggert Mail-Send.

### Resend-Dashboard verfolgt jede Mail

https://resend.com/emails

- Status: `delivered`, `bounced`, `complained`, `failed`
- Tags filtern (wir setzen z.B. `type=subscription_confirmation`)
- HTML-Vorschau pro Mail

### Wenn Mails nicht ankommen

1. Server-Logs anschauen: `[email/send]` Praefix. Output zeigt success oder fail
2. Resend-Dashboard → Logs: war der API-Call erfolgreich?
3. Spam-Folder im Empfaenger-Postfach pruefen
4. Domain-Verification noch nicht durch? → vor Verification nur Mails an Account-Inhaber-Email moeglich

---

## Kosten

- **Free Tier:** 3000 Mails/Monat, 100/Tag — fuer Testing + erste Wochen ok
- **Pro:** $20/Monat fuer 50k Mails — wenn Volume waechst

Mails pro Monat schaetzen: pro Bestellung 1 Mail, pro Abo-Renewal 1 Mail.
Bei 100 Bestellungen + 200 Abo-Lieferungen pro Monat = ~300 Mails. Free Tier reicht lange.
