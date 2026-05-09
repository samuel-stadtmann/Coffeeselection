# Go-Live Checklist

Diese Liste enthält alles, was vor dem Production-Launch von Development/Test- auf Production-Werte umgestellt werden muss.

## Supabase

- [ ] **Email-Templates**: Aktuell auf Development-Texten. In Supabase → Authentication → Email Templates die finalen Texte (de-CH) für Confirmation-, Magic-Link-, Password-Reset- und Email-Change-Mails einfügen.
- [ ] **SMTP-Provider**: Standard Supabase-Sender hat Rate-Limits (~30 Mails/h). Vor Launch eigenen SMTP (Resend / Postmark / SendGrid) in Supabase → Authentication → Email Settings konfigurieren.
- [ ] **Site URL & Redirect URLs**: Auf finale Production-Domain umstellen (Authentication → URL Configuration). Dev-URLs (`localhost:3000`, Vercel-Preview-URLs) entfernen oder behalten (jeweils mit Begründung).
- [ ] **Email-Confirmation Required**: Aktuell prüfen ob aktiv. Vor Launch sicherstellen dass User Email bestätigen müssen, bevor Login möglich ist.
- [ ] **RLS-Policies prüfen**: `rls_status`-View laufen lassen, alle Tables mit User-Daten müssen RLS aktiv haben.

## Stripe / Shopify

- [ ] Test-Keys → Live-Keys (in Vercel Env-Vars).
- [ ] Webhook-URLs auf Production-Domain umstellen.

## Checkout / Payment-Flow optimieren (Pre-Launch)

Aktuell gibt es Redundanzen und unnötige Schritte im Checkout. Vor Go-Live aufräumen:

- [ ] **Lieferadresse nur einmal abfragen** — aktuell taucht sie sowohl in `/checkout/shipping` als auch in `/checkout/payment` auf. Heute via Redirect entschärft (`shipping → payment`), aber Payment-Page muss überarbeitet werden damit alles einheitlich an einer Stelle ist.
- [ ] **Schritt-Anzahl reduzieren** — Cart → Payment statt Cart → Shipping → Review → Payment. Aktuell sind `/checkout/shipping` und `/checkout/review` per Redirect deaktiviert; entweder ganz löschen oder in einen Single-Page-Checkout konsolidieren.
- [ ] **Saved Addresses für eingeloggte User** aus `customer_addresses`-Tabelle vorausfüllen.
- [ ] **Order-Persistierung**: Bei Checkout-Submit echten Eintrag in `orders` + `order_items` schreiben (heute reines Mock).
- [ ] **Stripe oder Shopify-Integration** finalisieren — heute Stub mit env-gated Init.
- [ ] **Confirmation-Email** nach erfolgreichem Checkout (via Supabase-Trigger oder Edge-Function).
- [ ] **Error-States im Checkout** sauber behandeln (Karten-Decline, Versand-Fehler, etc.).

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

### A.7 Cleanup: Mock-Datenquellen entfernen
- [ ] `lib/coffees.ts` (Mock-Coffees aus `taste-types.ts`-Arrays) → entfernen sobald A.2 + A.3 durch
- [ ] `lib/roasters.ts` → entfernen (DB ist jetzt Source-of-Truth, lib nur noch von alten Pages referenziert)
- [ ] `lib/taste-types.ts` reduzieren auf statische SEO-Texte (Name, Tagline, Hero-Desc) — alle Coffee/Roaster-Listen daraus entfernen

## Post-Launch — Empfehlungs-Algorithmus verfeinern

Aktuell nutzt der Match-Score eine reine Manhattan-Distanz auf 5 Sensorik-Achsen (1–5 SCA-Skala) zwischen Geschmackstyp-Profil und Coffee-Profil. Das ist transparent und nachvollziehbar, aber verfeinerungsfähig.

**Schrittweise Verbesserung nach Launch — sortiert nach Impact / Aufwand:**

- [ ] **Aroma-Familien-Match einbauen** (einfach, sofort spürbar): Coffee bekommt Bonus-Punkte pro übereinstimmender Aroma-Familie zwischen `coffees.aroma_families` und `taste_types.aroma_families`. z.B. +5% pro Treffer.
- [ ] **Roast-Level als 6. Achse einbauen** (trivial): `coffees.roast_level` ↔ `taste_types.roast_level` zur Manhattan-Distanz dazuzählen.
- [ ] **Achsen-Gewichtung** (mittel): Säure & Körper stärker gewichten als Komplexität, weil sie wahrnehmungsnäher sind. Gewichte konfigurierbar in `algorithm_config`-Tabelle hinterlegen.
- [ ] **pgvector-Embedding-Match** (mittel, grosser Sprung): Cosine-Similarity zwischen `customers.taste_embedding` und `coffees.flavor_embedding`. Setzt voraus dass User-Embeddings generiert werden via OpenAI (heute null) — Phase A.5 Voraussetzung.
- [ ] **Hybrid-Score** (komplex, finaler Schliff): Kombination aus Embedding-Cosine + Sensorik-Distanz + Aroma-Overlap + Tag-Sentiment, gewichtet nach Daten-Reife des Users (mehr Ratings → mehr Embedding-Gewicht). Folgt Playbook Kap. 5 ("Pre-Score + MMR für Diversität").

**Wichtig:** Solange wir auf der reinen Sensorik-Distanz bleiben, ist der Score sehr nachvollziehbar und manuell auditierbar. Der Wechsel zu Embeddings macht's mächtiger, aber weniger erklärbar — Trade-off bewusst entscheiden.

### Empfehlungs-Begründungen dynamisch aus DB
- [ ] Aktuell zeigt `/recommendation/alternatives` für jede Alternative einen **statischen** Text ("Sehr nah an deinem Profil — du darfst ihn unbesorgt probieren"). Funktional, aber nicht datengetrieben.
- [ ] Soll: Begründung dynamisch ableiten aus dem Profil-Diff zwischen User-Geschmackstyp und Coffee-Profil — z.B. "Etwas weniger Säure, dafür mehr Körper als dein Match. Falls du gelegentlich kräftigere Brews magst, perfekt."
- [ ] Logik dafür gibt's bereits als Helper `reasoningForMatch()` in `lib/db/recommendations.ts` — aktuell deaktiviert weil das alte Output ("Volltreffer") gegen die Nachbar-Type-Annahme verglich, was UX-mässig irreführend war.
- [ ] Korrekte Implementation: Diff zwischen **User-Geschmackstyp-Profil** und **Coffee-Profil** rechnen (nicht Nachbar-Type vs Coffee), Top-1 oder Top-2 Achsen-Differenzen positiv formulieren, mit "darf bedenkenlos probieren" als Closing.
- [ ] Optional: pro Coffee 1–2 statt nur 1 Begründungssatz — falls mehrere Achsen relevant differenzieren.
