# Go-Live Checklist

Diese Liste enthält alles, was vor dem Production-Launch von Development/Test- auf Production-Werte umgestellt werden muss.

## Deploy-Workflow (Stand 2026-05-09)

- **Production Branch in Vercel**: `main` — Vercel baut diesen Branch automatisch.
- **Development**: auf `claude/implement-loop-F7Mpw`. Mattia sieht hier die Commits.
- **Deployen**: PR von `claude/implement-loop-F7Mpw` → `main`, mergen, Vercel baut `main`.
- **Hintergrund**: Vercel-Webhook für `claude/implement-loop-F7Mpw` war zur Zeit der Migration gebrochen (Builds wurden silently gedroppt). Workaround = `main` als Deploy-Branch. Falls Vercel-Support den Bug fixt, kann Production-Branch jederzeit zurückgestellt werden.

## Lern-Pipeline (M5)

Läuft **Postgres-seitig** via `pg_cron` — unabhängig von Vercel:

- **Job**: `lern-worker-process-ratings`, alle 15 Min, ruft `public.process_pending_ratings()` auf
- **Funktion**: liest `coffee_ratings` mit `processed_at IS NULL`, aktualisiert `customer_aroma_preferences` per inkrementellem Mittelwert (`(sentiment * count + learning_rate) / (count + 1)`), zählt `customers.num_ratings_given`, setzt `reclassification_suggested_at` wenn 3+ "no" Bewertungen in 90 Tagen
- **Lernrate**: konfigurierbar in `algorithm_config.learning_rate_base` (aktuell 0.10)
- **Sanity-Check vor Go-Live**: `SELECT * FROM cron.job WHERE jobname = 'lern-worker-process-ratings';` — `active = true`

Pre-Launch-TODOs:

- [ ] **Aroma-basierte Reklassifikation** (anderer Trigger als der existierende "no"-Counter): über Aroma-Sentiment-Score per Geschmackstyp. Nach OpenAI-Integration (M5b) elegant via Embedding-Centroids; bis dahin als zweiter pg_cron-Job mit stündlichem/täglichem Score-Vergleich falls gewünscht.
- [x] **M5b — Embedding-Drift**: erledigt. `triggerBuildCustomerEmbedding` wird im Quiz-Submit-Pfad gerufen (`lib/db/quiz.ts:273`), `drift_customer_embedding` wandert das `customers.taste_embedding` bei jeder neuen Rating-Auswertung in/weg vom `coffees.flavor_embedding` (re-normalisiert auf Einheitslaenge), Lern-Worker `process_pending_ratings` laeuft alle 15 Min via pg_cron. Backfill-Button im Admin-Rewards laedt Bestandskunden nach.

## Supabase

- [ ] **Email-Templates**: Aktuell auf Development-Texten. In Supabase → Authentication → Email Templates die finalen Texte (de-CH) für Confirmation-, Magic-Link-, Password-Reset- und Email-Change-Mails einfügen.
- [ ] **SMTP-Provider**: Standard Supabase-Sender hat Rate-Limits (~30 Mails/h). Vor Launch eigenen SMTP (Resend / Postmark / SendGrid) in Supabase → Authentication → Email Settings konfigurieren.
- [ ] **Site URL & Redirect URLs**: Auf finale Production-Domain umstellen (Authentication → URL Configuration). Dev-URLs (`localhost:3000`, Vercel-Preview-URLs) entfernen oder behalten (jeweils mit Begründung).
- [ ] **Email-Confirmation Required**: Aktuell prüfen ob aktiv. Vor Launch sicherstellen dass User Email bestätigen müssen, bevor Login möglich ist.
- [ ] **RLS-Policies prüfen**: `rls_status`-View laufen lassen, alle Tables mit User-Daten müssen RLS aktiv haben.

## Stripe / Shopify

- [ ] Test-Keys → Live-Keys (in Vercel Env-Vars).
- [ ] Webhook-URLs auf Production-Domain umstellen.

## Checkout / Payment-Flow — ✅ erledigt

- [x] **Schritt-Anzahl reduziert**: Cart → Checkout → Stripe → Bestätigung. `/checkout/shipping` ist Redirect auf `/checkout/review` (Single-Page-Checkout); Stepper auf 3 Schritte gekürzt.
- [x] **Lieferadresse nur einmal abgefragt**: Adress-Form via `components/checkout/ShippingForm.tsx` direkt auf `/checkout/review` eingebettet (statt separater Step).
- [x] **Saved Addresses fuer eingeloggte User**: `SavedAddressesPicker` (in ShippingForm) laed bis zu 5 Adressen aus `customer_addresses`, ein Klick fuellt die Form, „Neue Adresse" raeumt sie wieder leer.
- [x] **Order-Persistierung**: `POST /api/orders/create` legt echten `orders`+`order_items`-Eintrag an (war schon live, kein Mock).
- [x] **Stripe-Integration**: Hosted Checkout, Webhook setzt Status, Stripe-Tax aktiv. Live.
- [x] **Confirmation-Email**: `/api/webhooks/stripe` sendet bei `paid` automatisch `orderConfirmationEmail()` (Einmalkauf) bzw. `subscriptionConfirmationEmail()` (Abo) ueber Resend. (Edge-Function-Variante laut Original-Eintrag waere ein Refactor ohne Mehrwert — Webhook ist der natuerliche Trigger-Punkt.)
- [x] **Error-States**: Stripe-Cancel-Redirect geht auf `/checkout/review?canceled=1` und zeigt eine Hinweisbox, Customer kann Adresse/Zahlungsmittel anpassen und retry. `/api/orders/create`-Fehler werden inline gerendert.

## Röster-Dashboard (Pre-Launch)

Aktuell gibt's keine UI für Röster, um ihre Daten zu pflegen. Vor Go-Live:

- [ ] **Eigene Roaster-Login-Domäne** unter `/roaster/...` aufbauen — getrennt vom Kunden-Login (anderer Auth-Flow oder zumindest anderer Bereich)
- [ ] **Coffee-CRUD-Page**: Coffees anlegen/editieren mit allen Feldern (name, slug, profile-Achsen, aromen, preis, stock, status). Direct-Edit auf `coffees`-Tabelle via RLS-Policy `auth.uid() == roaster.owner_user_id`.
- [ ] **Bestand-Management**: stock_kg / stock_status, automatisch ausverkauft setzen wenn 0.
- [ ] **Roaster-Profil-Pflege**: Eigene `roasters`-Zeile editieren — Beschreibung, Bilder, Story, Adresse, Website, Instagram.
- [ ] **Order-Notifications**: Wenn Kunde einen Coffee dieses Rösters bestellt, kommt Email/Webhook an Röster.
- [ ] **Rating-View**: Röster sieht (anonymisiert) wie seine Coffees bewertet werden — als Feedback für eigene Profil-Werte.
- [ ] **RLS**: Alle Mutationen scoped auf eigene `roaster_id` — kein Röster sieht/ändert Daten anderer.

## Datenpflege Coffees + Röster (Pre-Launch)

Wie kommen Röster und Coffees produktiv in die DB? Drei Optionen — entscheiden bevor Go-Live:

- [ ] **Variante A: Self-Service über Roaster-Dashboard** (siehe oben) — jeder Röster pflegt eigene Coffees selbst. Skaliert, braucht funktionierendes Dashboard.
- [ ] **Variante B: CSV-Import durch Admin** — Röster schickt CSV/Excel mit Coffees, Admin importiert via Supabase oder eigenes Skript. Schnell für Launch, nicht skalierbar.
- [ ] **Variante C: Onboarding-Form** — neue Röster füllen ein Online-Formular aus, Admin reviewed + freigibt. Hybrid aus A und B.
- [ ] **Pflicht-Felder pro Coffee**: Sensorik-Profile (acidity/body/sweetness/bitterness/complexity, jeweils 1–5) müssen gesetzt sein, sonst landet der Coffee nicht in Empfehlungen. Heute fehlt z.B. bei "Brasil Cerrado" das ganze Profil — solche Coffees sind unsichtbar im Match.
- [ ] **Aroma-Familien** (`aroma_families` text[]) müssen aus dem Standard-Vokabular kommen (chocolate, fruity, floral, nutty, sugary etc.) — sonst funktionieren Aroma-basierte Empfehlungen (Post-Launch-Verfeinerung) nicht.
- [x] **Flavor-Embedding** (pgvector) wird automatisch synchronisiert: DB-Trigger `trg_coffee_embedding_autosync` (Migration `20260518200000`) ruft `generate-coffee-embedding` per `pg_net.http_post` async nach Insert/Update von embedding-relevanten Coffee-Feldern. Voraussetzung Production: Vault-Secrets `SUPABASE_URL` + `SERVICE_ROLE_KEY` + Edge-Function-Secret `OPENAI_API_KEY_COFFEESELECTION`.

## Automatisierte Bewertungs-Email — ✅ erledigt

- [x] **Trigger**: 5–14 Tage nach `orders.paid_at` (`delivered_at` ist heute noch nicht befuellt, paid_at ist der praktikable Proxy bis Tracking-Anbindung).
- [x] **Design**: `lib/email/templates/rating-reminder.ts` im CS-Stil mit 1-Klick-Sternen pro Coffee.
- [x] **Magic-Link**: `/api/rate/via-token?t=<HMAC>&s=<stars>` — Submit ohne Login, signiert mit `RATING_TOKEN_SECRET`.
- [x] **Job-Queue**: pg_cron (`send-rating-reminders`, 09:00 UTC daily) → `pg_net.http_get` auf `/api/cron/rating-reminders` mit `CRON_SECRET`-Bearer. Migration `20260518100000_cron_rating_reminders.sql`. Vault: `SITE_URL` + `CRON_SECRET`.
- [x] **Rate-Limit / Idempotenz**:
  - `orders.rating_reminder_sent_at` blockt eine Order nach erstem Send.
  - `rating_reminder_log(customer_id, coffee_id, sent_at)` blockt Coffee-Reminder fuer 90 Tage.
  - Coffees mit bestehendem `coffee_ratings`-Eintrag werden vor Send ausgefiltert (kein Reminder fuer bereits bewertete Sorten).
- [ ] **Vor Go-Live noch zu erledigen** (Production-Supabase + Production-Vercel):
  ```sql
  -- Im Production-Supabase SQL Editor:
  select vault.create_secret('https://coffeeselection.ch', 'SITE_URL');
  select vault.create_secret('<production_cron_secret>', 'CRON_SECRET');
  -- Falls schon vorhanden, vault.update_secret(...) statt create_secret.
  ```
  Dann gleiche Migration `20260518100000_cron_rating_reminders.sql` einmal auf Production laufen lassen. `CRON_SECRET` als Vercel Env-Var (Production) muss identisch sein.

## Domain & DNS

- [ ] Custom Domain in Vercel verifizieren.
- [ ] SSL-Zertifikat aktiv.
- [ ] `next.config.ts` `images.remotePatterns` auf finalen Image-Host (Supabase Storage / CDN) erweitern.

## Analytics & Monitoring

- [ ] Google Analytics / Plausible Tracking-ID einbauen.
- [ ] Sentry o.ä. für Error-Tracking.
- [ ] Vercel Analytics aktivieren.

## SEO

- [ ] `app/sitemap.ts` mit finalen Routen.
- [ ] `app/robots.ts` von `noindex` auf `index, follow` umstellen.
- [ ] OpenGraph-Bilder pro wichtiger Page.
- [ ] Strukturierte Daten (Schema.org Product/Organization).

## Content

- [ ] Logo-PNG ohne transparente Ränder zuschneiden (`public/logo.png`).
- [ ] Echte Schweizer Röstereien + Coffees in DB einpflegen (statt Mock-Daten).
- [ ] City-SEO-Pages mit echten Stadt-Fotos (statt Coffee-Placeholder in `lib/images.ts`).
- [ ] AGB & Datenschutzerklärung schreiben (aktuell Stub-Links).

## Auth & Account

- [ ] Mock-Daten in Account-Pages durch echte DB-Queries ersetzen (Phase 2 der Supabase-Anbindung).

## Phase A — Empfehlungs-Maschine (höchste Priorität, kritisch für Produkterlebnis)

Aktuell sind alle "Empfehlungen" Mock-Daten oder Platzhalter. Phase A löst das vollständig:

### A.1 Quiz-Scoring → echtes `taste_type_id`
- [ ] Quiz-Antworten in `quiz_responses` persistieren (12 Fragen × User)
- [ ] Score pro Geschmackstyp berechnen via `quiz_scoring` + `taste_type_max_scores`
- [ ] Best-Match in `customers.taste_type_id` + `customers.secondary_type` + `customers.confidence` schreiben
- [ ] Aktuell: `match-result` schreibt Platzhalter `taste_type_id=2` — muss durch echte Quiz-Auswertung ersetzt werden

### A.2 Coffee-Empfehlungen pro User (via pgvector)
- [ ] Beim Quiz-Ende: Initial-`taste_embedding` für User aus Antworten erzeugen
- [ ] Match-Result-Page: Top-N Coffees nach Distanz `customers.taste_embedding <=> coffees.flavor_embedding`
- [ ] Aktuell: Yirgacheffe ist hardcoded — muss durch echten Vector-Match ersetzt werden

### A.3 Coffee ↔ Taste-Type Mapping (`/taste-types/[slug]` Pages)
- [ ] Auf jeder Geschmackstyp-Seite: echte Coffees aus DB, die zu diesem Typ passen
- [ ] Variante 1 (manuell): neue Tabelle `coffee_taste_types` (n:m via Pflege)
- [ ] Variante 2 (auto): pro Geschmackstyp Centroid-Embedding berechnen, Coffees mit `flavor_embedding` Distanz < Threshold
- [ ] **Wichtig**: Aktuell zeigen diese Seiten erfundene Mock-Coffees aus `lib/taste-types.ts` — User hat explizit verlangt, dass das in Phase A vollständig ersetzt wird

### A.4 Recommendation-Alternatives (`/recommendation/alternatives`)
- [ ] Heute: liest aus `lib/taste-types.ts` mit Profil-Distanz-Berechnung im Code
- [ ] Soll: liest aus DB via Embedding-Distanz, mit echter Begründung aus Profil-Diff zwischen User und Coffee

### A.5 Feedback-Loop (Playbook Kap. 6)
- [ ] `/account/rate/[orderId]` schreibt heute kein Rating in DB — muss `coffee_ratings`-Insert machen
- [ ] Background-Worker (Edge Function + pg_cron alle 15 Min) verarbeitet `processed_at IS NULL`
- [ ] Profil-Vektor-Drift: `update_customer_embedding(...)` mit adaptiver Lernrate
- [ ] Aroma-Tag-Sentiment in `customer_aroma_preferences` upserten

### A.6 Reklassifikations-Cron
- [ ] Täglicher Job: User mit ≥5 Ratings → Distance zu Type-Centroids berechnen → bei klarem Wechsel Email senden ("Geschmack hat sich entwickelt — Quiz neu machen?")

### A.7 Cleanup: Mock-Datenquellen entfernen — ✅ erledigt
- [x] `lib/coffees.ts`, `lib/roasters.ts`, `lib/taste-types.ts` existieren nicht mehr — DB-Layer unter `lib/db/*.ts` ist Source-of-Truth.
- [x] `lib/taste-types-map.ts` bleibt als statisches Slug↔ID-Mapping (kein Mock-Daten-File, sondern Routing-Helper).

## Post-Launch — Empfehlungs-Algorithmus verfeinern

Aktuell nutzt der Match-Score eine reine Manhattan-Distanz auf 5 Sensorik-Achsen (1–5 SCA-Skala) zwischen Geschmackstyp-Profil und Coffee-Profil. Das ist transparent und nachvollziehbar, aber verfeinerungsfähig.

**Schrittweise Verbesserung nach Launch — sortiert nach Impact / Aufwand:**

- [ ] **Aroma-Familien-Match einbauen** (einfach, sofort spürbar): Coffee bekommt Bonus-Punkte pro übereinstimmender Aroma-Familie zwischen `coffees.aroma_families` und `taste_types.aroma_families`. z.B. +5% pro Treffer.
- [ ] **Roast-Level als 6. Achse einbauen** (trivial): `coffees.roast_level` ↔ `taste_types.roast_level` zur Manhattan-Distanz dazuzählen.
- [ ] **Achsen-Gewichtung** (mittel): Säure & Körper stärker gewichten als Komplexität, weil sie wahrnehmungsnäher sind. Gewichte konfigurierbar in `algorithm_config`-Tabelle hinterlegen.
- [ ] **pgvector-Embedding-Match** (mittel, grosser Sprung): Cosine-Similarity zwischen `customers.taste_embedding` und `coffees.flavor_embedding`. Setzt voraus dass User-Embeddings generiert werden via OpenAI (heute null) — Phase A.5 Voraussetzung.
- [ ] **Hybrid-Score** (komplex, finaler Schliff): Kombination aus Embedding-Cosine + Sensorik-Distanz + Aroma-Overlap + Tag-Sentiment, gewichtet nach Daten-Reife des Users (mehr Ratings → mehr Embedding-Gewicht). Folgt Playbook Kap. 5 ("Pre-Score + MMR für Diversität").

**Wichtig:** Solange wir auf der reinen Sensorik-Distanz bleiben, ist der Score sehr nachvollziehbar und manuell auditierbar. Der Wechsel zu Embeddings macht's mächtiger, aber weniger erklärbar — Trade-off bewusst entscheiden.

### Profil-Reife (Konfidenz-Kurve im Geschmacksprofil)
- [ ] Auf `/account/taste-profile` gab es eine "Profil-Reife"-Box mit hardcoded 6-Monats-Trendwerten. Vor Launch entfernt — wieder einbauen, wenn echte Daten da sind.
- [ ] Datenquelle Vorschlag: pro Customer monatlich einen Snapshot ablegen mit (a) Anzahl Quiz-Wiederholungen, (b) Anzahl `coffee_ratings`, (c) Streuung der Ratings, (d) `quiz_responses.confidence` des aktiven Quiz. Aggregiertes Mass = "Reife in %", visualisiert als Spark-Bars über die letzten 6–12 Monate.
- [ ] Einfache MVP-Variante ohne Snapshot-Tabelle: live berechnete Reife = `min(100, ratings_count * 10 + confidence * 50)` — keine Zeitreihe, nur Status quo. Lieber so als gar nichts.

### P6 Schritt 2 — Stripe Connect für Marketplace-Splits (Backlog, vor Bauen klären)

Heute fliesst jede Customer-Zahlung 1:1 auf das Coffee-Selection-Stripe-Konto.
Margen vs. Wholesale werden NUR via `order_items.wholesale_price_chf` für
internes Reporting berechnet (P6 Schritt 1) — Auszahlungen an Röster passieren
manuell ausserhalb von Stripe.

Schritt 2 wäre, das auf **Stripe Connect Destination Charges** umzustellen,
damit pro Order der Wholesale-Anteil automatisch an den jeweiligen Röster
ausgezahlt wird und Coffee Selection nur die Marge auf dem eigenen Konto behält.

**Architektur (Vorschlag — zu verifizieren bevor wir bauen):**
- Jeder Röster onboarded sich via Stripe Connect Express → `roasters.stripe_account_id`
- Bei `checkout.session.create` für Single-Roaster-Orders: Destination-Charge
  mit `application_fee_amount = total_chf - sum(wholesale_price_chf)` und
  `transfer_data.destination = roaster.stripe_account_id`
- Bei Multi-Roaster-Orders (Cart mit Coffees verschiedener Röster): Stripe
  unterstützt das nicht direkt → nach Payment-Success per `stripe.transfers.create`
  pro Röster den Wholesale-Anteil auszahlen
- Bei Renewals (Subscriptions): gleiche Logik im `invoice.payment_succeeded`-Webhook

**Offene Fragen (vor Implementierung von User klären lassen):**
- [ ] **Stripe-Gebühren auf welche Seite?** (Coffee Selection trägt die 2.9% +
      30 Rp je Transaktion komplett, oder Röster anteilig?)
- [ ] **MwSt-Verteilung**: Wer ist Steuerschuldner gegenüber dem Endkunden —
      Coffee Selection (Reseller-Modell) oder der Röster (Marketplace-Modell)?
      → Beeinflusst Stripe-Tax-Konfiguration und Konfigurations-Required-Felder
      beim Connect-Onboarding (TIN/UID-Pflicht).
- [ ] **Mindest-Auszahlungsschwelle pro Röster** (sonst zu viele kleine
      Transfers; üblich: weekly batch ab CHF 50)
- [ ] **Refund-Handling**: Bei Customer-Refund müssen wir den Transfer ggf.
      `reverse_transfer=true` setzen — d.h. Geld vom Röster zurückholen.
      Operativ ok oder Streitpotenzial?
- [ ] **Vertragliche Grundlage**: Röster muss Connect-AGB akzeptieren — neue
      Klausel im bestehenden Röster-Vertrag oder separates Onboarding-Dokument?
- [ ] **Auszahlungs-Currency**: Stripe Connect rechnet pro Account in einer
      Currency. CHF für alle Schweizer Röster ok; falls EU-Röster dazukommen,
      separate Logik.
- [ ] **Reporting für Röster**: Eigene `/roaster/payouts`-Page mit Verlauf
      (ähnlich `/roaster/orders`) oder reichen Stripe-Dashboard-Mails?
- [ ] **Live-Switch**: bestehende Subscriptions müssten umgehängt werden →
      Stripe-Subscription mit `application_fee_percent` nachträglich editieren,
      oder neue Subscription erzeugen und alte canceln?

**Aufwand-Einschätzung** (grob, nach Klärung): 2-3 Wochen Bau + Test, plus
Onboarding-Kommunikation an die bestehenden 4 Röster.

### Empfehlungs-Begründungen dynamisch aus DB — ✅ erledigt
- [x] `/recommendation/alternatives` ruft `reasoningForMatch(userProfile1to5, coffee)` aus `lib/db/recommendations.ts` auf und rendert headline + detail dynamisch aus dem Profil-Diff zwischen User-Geschmackstyp und Coffee.
- [x] Tasting-Summary wird als sekundaerer Geschmacks-Satz darunter angezeigt, Fallback auf Aroma-Familien wenn beides fehlt.
- [ ] Korrekte Implementation: Diff zwischen **User-Geschmackstyp-Profil** und **Coffee-Profil** rechnen (nicht Nachbar-Type vs Coffee), Top-1 oder Top-2 Achsen-Differenzen positiv formulieren, mit "darf bedenkenlos probieren" als Closing.
- [ ] Optional: pro Coffee 1–2 statt nur 1 Begründungssatz — falls mehrere Achsen relevant differenzieren.
