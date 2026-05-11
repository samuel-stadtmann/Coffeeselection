# Pre-Go-Live Backlog

Tasks die vor dem ersten echten Launch erledigt sein muessen, aber im
laufenden Build nicht blockieren. Pro Eintrag: Auswirkung, Trigger,
geschaetzter Aufwand.

---

## ~~P1 — Recommender auf pgvector RPC umstellen~~ ✅ erledigt

Das volle Playbook-Ranking-System (9.8) ist als
`public.rank_coffees_for_customer(p_customer_id, p_subscription_type,
p_limit, p_save_snapshot, p_subscription_id, p_delivery_slot,
p_algorithm_version)` in der DB vorhanden — vermutlich aus Mattias
fruehrer Arbeit. Es enthaelt:

- Hartfilter mit Fallback-Cascade (5.2, 7) via
  `public.get_eligible_coffees(uuid, text, bool, bool, numeric)`
- 7-Dim-Soft-Scoring (5.3) via `public.compute_scoring_score(jsonb, uuid)`
- Vector-Similarity (5.5) direkt mit pgvector `<=>`
- MMR-Diversitaet (5.7) als PL/pgSQL-Schleife im Discovery-Pfad
- Begruendung (1.3) via `public.explain_coffee_match`
- Optionaler Snapshot in `public.recommendation_snapshots`

`lib/db/recommendations.ts` ruft die Funktion seit
`20260510150000_get_eligible_coffees_use_customer_allergens.sql` direkt
auf wenn ein `customerId` mitkommt. Anonyme Quiz-Aufrufer
(taste-types/[slug], match-result) bleiben auf dem JS-Hybrid mit
Type-Centroid.

**Performance.** Da das Ranking in Postgres laeuft, verlassen nur die
Top-N und ihre Coffee-Felder die DB — nicht mehr 16 × 1536 floats. P1
ist damit auch performance-seitig erledigt; der HNSW-Index aus dem
alten P1-Vorschlag wird erst bei >>300 Coffees relevant und bleibt als
Optimierung in P10 beobachtet.

---

## P10 — HNSW-Index auf flavor_embedding (Performance-Optimierung)

**Problem.** Aktuell verlaesst sich `rank_coffees_for_customer` auf
sequenziellen Vektor-Vergleich. Bei <300 Coffees ist das schneller als
jeder Index, ab 1.000+ wird's spuerbar.

**Fix.** HNSW-Index auf `coffees.flavor_embedding`:

```sql
create index coffees_flavor_embedding_hnsw_idx
  on public.coffees using hnsw (flavor_embedding vector_cosine_ops);
```

Voraussetzung: ausreichend `maintenance_work_mem` — siehe P4.

**Trigger.** > 1.000 Coffees, oder Latenz `rank_coffees_for_customer`
> 200 ms.

**Aufwand.** ~30 min inkl. Index-Build.

---

## ~~P2 — `coffees.roast_level` Daten-Hygiene~~ ✅ erledigt

Spalte ist tatsaechlich `smallint(1-5)` — die urspruengliche Migration
wollte `text` mit Enum-CHECK, das wurde aber im Dashboard auf smallint
umgebaut. Statt Schema-Roundtrip macht jetzt die Edge Function
`generate-coffee-embedding` das Mapping `1->light` / `2->medium_light` /
`3->medium` / `4->medium_dark` / `5->dark` beim Aufbau des Embedding-
Texts. Der DB-Wert bleibt smallint (Frontend-kompatibel), der Embedding-
Text liest sich `"Roestgrad: medium"` statt `"Roestgrad: 3"`.

Alle 16 aktiven Coffees am 2026-05-10 mit dem neuen Mapping neu
eingebettet. Falls neue Coffees per Webhook automatisch eingebettet
werden, gilt das Mapping ab sofort auch fuer die.

---

## ~~P3 — Lern-Worker mit Embedding-Update verifizieren~~ ✅ erledigt in M5c

Erweitert in Migration `20260510130000_lern_worker_embedding_drift.sql`:
`drift_customer_embedding()` + `centroid_reclassification_check()` werden
jetzt pro Bewertung von `process_pending_ratings()` aufgerufen. Smoke-Test
am 2026-05-10 zeigte messbare Drift (Cosine-Distanz Customer↔Coffee von
0.3246 auf 0.2705 nach einer 4-Sterne-Bewertung).

---

## P4 — `maintenance_work_mem` Ceiling auf Supabase Free

**Problem.** Beim Versuch einen `ivfflat`-Index auf
`type_centroids_mv` anzulegen scheiterte das mit
`memory required is 59 MB, maintenance_work_mem is 32 MB`.
Wir haben den Index gestrichen weil die View nur 8 Zeilen hat — bei
`coffees.flavor_embedding` (HNSW-Index, P1) wird der gleiche Fehler
wieder kommen, je nach Coffee-Anzahl deutlich groesser.

**Workaround Optionen:**
- Pro-Session vor dem Index-Build: `SET maintenance_work_mem = '256MB';`
  (geht auch im Supabase SQL Editor, gilt aber nur fuer die Session)
- Permanent ueber `ALTER DATABASE postgres SET maintenance_work_mem = '256MB';`
  (braucht Superuser, bei Supabase Free nicht moeglich)
- Upgrade auf Supabase Pro -> hoeherer Default + Tuning erlaubt

**Trigger.** Sobald HNSW-Index angelegt werden soll (= P1 Migration).

**Aufwand.** Wenige Minuten — aber Plan-Upgrade ist eine Cost-Decision.

---

## ~~P5 — Dead Code aufraeumen~~ ✅ erledigt

`coffees: [...]` und `roasters: [...]` aus allen 8 TasteType-Eintraegen
in `lib/taste-types.ts` entfernt (-80 Zeilen), Type-Definition
abgespeckt, `lib/coffees.ts` komplett geloescht (war einziger Konsument).
`lib/coffee-categories.ts → getCoffeesForCategory` ist jetzt async und
faehrt echte DB-Coffees via `getCoffeesForTasteType` pro filterType,
dedupliziert by coffee.id. Category-Pages zeigen damit ab sofort echte
Coffees statt Fake-Daten.

---

## ~~P6+P7 — `taste_types` als Single-Source-Of-Truth + Skala vereinheitlicht~~ ✅ erledigt

DB ist jetzt die einzige Wahrheit fuer Geschmackstypen. Drei
Migrations am 2026-05-10 (`20260510200000`, `_210000_fix_slugs_reseed`,
`_220000_real_umlauts`):

- 9 neue Spalten in `taste_types`: `tagline_de`, `icon`,
  `hero_desc_de`, `long_desc_de`, `aromas_de`, `brewing_methods`,
  `seo_title_de`, `seo_description_de`, `seo_keywords`.
- DB-Slugs auf Deutsch normiert (`classic` -> `der-klassiker` etc.),
  damit Frontend-URLs konsistent sind.
- Marketing-Copy aus dem alten `lib/taste-types.ts` reinmigriert,
  inklusive echter Umlaute.

Code-Refactor:
- `lib/db/taste-types.ts` mit async `getTasteTypes()`,
  `getTasteTypeBySlug()`, `getTasteTypeById()`. Skala 1-5 -> 0-100
  (mal 20) wird hier zentral gerechnet (P7 erledigt).
- `/api/taste-types` GET-Endpoint mit Cache-Control fuer
  Client-Komponenten die Bedarf haben.
- `lib/taste-types.ts` geloescht. `lib/taste-types-map.ts` reduziert
  auf nur das statische ID<->Slug-Mapping.
- Alle Consumer (taste-types-Seiten, dashboard, match-result,
  alternatives, coffee-categories) ziehen die Daten jetzt async
  aus der DB.

Damit kann Mattia ab sofort Texte/Aromen/Brewing direkt in
`taste_types` aendern — Frontend spiegelt das beim naechsten
Page-Load.

---



## ~~P8 — Demo-UUIDs durch echte UUIDs~~ ✅ erledigt

Migration `20260510190000_p8_real_uuids.sql` hat die 8 Demo-Coffees
auf `gen_random_uuid()` umgezogen via Insert-Move-Delete in einer
Transaction. Spaltenliste dynamisch aus `information_schema` (skipt
generated columns wie `is_single_origin` automatisch). Alle 10
Child-FKs umgebogen: `coffee_ratings`, `coffee_allergens`,
`coffee_certifications`, `coffee_flavor_notes`,
`coffee_brewing_methods`, `coffee_tasting_notes`,
`recommendation_history`, `order_items`, `subscription_items`,
`recommendation_snapshots.selected_coffee_id`.

API-Validatoren in `/api/rating/submit` und `/api/recommendation/next`
sind ab sofort `z.uuid()` (RFC4122-strict). Die loose-UUID-Konstante
ist weg.

Verifikation: 16/16 Coffees rfc4122_compliant, 0 demo_uuids.

---

## ~~P9 — HTTP-E2E + Hard-Filter Edge-Case~~ ✅ erledigt

Playwright-Setup unter `e2e/`, gestartet via `npm run test:e2e`. Globaler
Setup legt einen ephemeren Test-User via service_role an, loggt durchs
echte `/login`-Form ein und persistiert Cookies in
`playwright/.auth/user.json`. Teardown loescht alles.

11 Tests gruen, 2 bewusst geskippt:

- POST /api/quiz/submit — Validation 400 + 401 ohne Auth
- POST /api/rating/submit — Upsert + Validation + Auth
- GET /api/recommendation/next — Happy-Path + Auth
- Hartfilter-Cascade Scenario 2 — `max_price_per_250g = 2` -> 404
  `no_coffees_available`

Beim Bauen aufgedeckt + gefixt:

- `coffees.price_per_250g` war NULL fuer Demo-Daten ->
  Migration `20260510230000` befuellt aus `price_chf * 250 / weight_g`.
- **Production-Bug** in `lib/db/recommendations.ts`: bei leerer
  RPC-Antwort fiel der Recommender auf den JS-Hybrid-Pfad zurueck
  und ignorierte damit Allergene/Cooldowns/Praeferenzen. Customers
  mit Restriktionen haetten ungeeignete Coffees empfohlen bekommen.
  Fix unterscheidet RPC-Error (-> JS-Fallback) von RPC-leer (-> []).

---

## P11 — Resend Sender-Domain bei Hostpoint live schalten

**Problem.** Die Reklassifikations-E-Mail (Playbook 6.5, Edge Function
`send-reclassification-emails`) läuft aktuell mit Resends Test-
Domain `onboarding@resend.dev`. Diese hat zwei harte Limits:

- Empfänger muss eine bei Resend verifizierte Adresse sein
  (typischerweise nur die des Account-Inhabers).
- Max 100 Mails/Tag, „Sent via Resend"-Hinweis im Footer.

Für echte Kunden müssen wir auf die eigene Domain (bei Hostpoint
registriert, aktuell noch nicht live) umstellen.

**Fix.**
1. Domain bei Hostpoint live schalten (DNS-Zone aktiv).
2. Resend Dashboard → **Domains** → **Add domain** → die echte Domain
   (z. B. `coffeeselection.ch`) eintragen.
3. Resend zeigt drei DNS-Einträge an (TXT für SPF, CNAME für DKIM,
   optional TXT für DMARC). Diese im Hostpoint-Control-Panel
   eintragen — kann 1–24h dauern bis Resend sie validiert.
4. Sobald Resend den grünen Haken zeigt: Supabase Edge Function
   Secret aktualisieren:
   `RESEND_FROM_EMAIL = Coffee Selection <hello@coffeeselection.ch>`
   (oder welche Absender-Adresse auch immer).
5. Smoke-Test: Edge Function manuell mit `{ "customer_id": "<eigene_id>" }`
   triggern → E-Mail muss bei eigenem Postfach ankommen, ohne
   „via resend.dev"-Footer.

6. **Auth-Account-E-Mails umstellen.** Aktuell laufen Logins
   (inkl. Admin-Account) auf `samuel.stadtmann@gmail.com`. Sobald
   `coffeeselection.ch` live ist:
   - Supabase Dashboard → Authentication → Users → eigene Account-
     E-Mail auf `samuel@coffeeselection.ch` umstellen.
   - Bestätigungs-Mail empfangen + clicken (Supabase verlangt
     E-Mail-Verifikation beim Change).
   - `.env.local` (lokal) und Vercel-Env (prod) `ADMIN_EMAILS`
     auf die neue Adresse setzen.
   - Mattia analog onboarden falls er Admin sein soll.

**Trigger.** Vor dem ersten echten Reklassifikations-Mail-Versand
(also vor dem ersten Kunden mit ≥ 5 Bewertungen die das Profil
spürbar driftet) — und vor jedem geplanten Onboarding-Mail-Versand.

**Aufwand.** ~30 min Resend + DNS + Account-Switch, plus DNS-
Propagation-Wartezeit.

---

## P12 — Staging-Alias auf Custom-Domain binden

**Problem.** Wir haben einen `staging`-Branch in GitHub eingerichtet
und Vercel deployed ihn unter
`coffeeselection-git-staging-samuelstadtmann-4931s-projects.vercel.app`.
Diese URL ist lang und unschoen — fuer Mattia/Roester-Demos ok,
aber suboptimal.

**Fix.** Sobald `coffeeselection.ch` bei Hostpoint live ist und auf
Vercel zeigt (P11 DNS-Setup):

1. Vercel Dashboard → Project → **Settings** → **Domains**
2. **Add Domain** → `staging.coffeeselection.ch`
3. Vercel zeigt DNS-Records die bei Hostpoint einzutragen sind
   (CNAME auf `cname.vercel-dns.com.`)
4. Bei „Git Branch" das `staging`-Branch waehlen, damit der Alias
   immer den letzten Staging-Deploy zeigt.

Damit:
- `coffeeselection.ch` -> production (`main` branch)
- `staging.coffeeselection.ch` -> staging branch
- Feature-Preview-URLs bleiben wie bisher unter den `*.vercel.app`
  Adressen.

**Trigger.** Direkt nach P11 (Domain live).

**Aufwand.** ~10 min + DNS-Propagation.

---

## P13 — Roaster-Self-Onboarding-UI (Playbook 8.4 M1+M2)

**Stand.** Wir haben heute (2026-05-10) Massnahme 3 aus 8.4 umgesetzt:
Admin-Verifikations-Tooling unter `/admin/coffees` mit +2-Quality-Bonus.
Offen bleiben:

- **Massnahme 1 — Onboarding-Guide:** PDF/Markdown-Doku die jedem
  neuen Roaster erklärt wie er die 1-5-Skalen interpretiert. Säure 1
  = "wie Sumatra Mandheling", Säure 5 = "wie äthiopischer
  Yirgacheffe washed". Reine Doku-Arbeit, ~2 h.

- **Massnahme 2 — Konsistenzvalidierung im Frontend:** Roaster-Self-
  Service-Formular um Coffees selbst anzulegen. Validiert
  unplausible Kombinationen mit Inline-Warnungen
  („Light Roast + Bitterkeit 5 → Bist du sicher?"). Plus
  Draft/Submit/Review-Workflow weil das Frontend dann Roaster-
  Zugang braucht (eigener Auth-Pfad).

**Trigger.** Sobald wir mehr als 2-3 Röster onboarden wollen ohne
selbst jeden Coffee einzupflegen.

**Aufwand.** Massnahme 1: ~2 h Copy. Massnahme 2: 6-10 h für ein
robustes Formular mit Validation + Roaster-Auth.

---

## P14 — Coffee-Verifikation an echten Workflow anpassen (data_quality_score-driven)

**Stand.** Heute (8.4 M3) ist die Verifikation als „nach eigener
Verkostung bestaetigen" gebaut. Tatsaechlicher Workflow von Samuel
ist aber: er entscheidet anhand `data_quality_score` (>=75 = ok), er
verkostet die Coffees nicht selber.

**Was muss anders?**
- Dashboard `/admin/coffees` soll die Entscheidung nach Score
  unterstuetzen: Coffees mit `data_quality_score < 75` markieren als
  „braucht Aufmerksamkeit", Coffees >= 75 als „freigegeben".
- Die `data_verified_at`/`data_verified_by`-Felder bleiben, aber
  bekommen eine andere Semantik: „von Samuel manuell freigegeben
  trotz Score < 75" — also Override-Flag fuer Edge-Cases, nicht
  Default-Workflow.
- Plus: wir brauchen eine **Erklaerung wo der quality_score
  herkommt**. Aktuell ist das ein opaker `smallint`. Mattia/Samuel
  muessten sehen koennen: „Score 65 weil flavor_description fehlt,
  Aroma-Familien leer, kein Variety-Eintrag, …". Computed via
  Trigger `compute_coffee_quality_score` der bereits in der DB
  existiert — wir muessten den Body extrahieren und im UI rendern.

**Aufwand.** ~2-3 h:
- 30 min: data_quality_score-Breakdown-View (welche Felder fehlen)
- 1 h: Dashboard-Refactor mit Filter „< 75" und Detail-Aufklappen
- 30 min: Verifikation umtexten zu „Override / freigeben trotz Score"

**Trigger.** Wenn Samuel das Dashboard regelmaessig benutzt und das
heutige Tool-Setup ihm im Weg ist.
