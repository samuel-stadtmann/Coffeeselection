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

## P6 — `taste_types` DB-Tabelle als Single-Source-Of-Truth

**Problem.** Aktuell ist die Beschreibung der 8 Geschmackstypen
**doppelt vorhanden**: einmal in der DB (`taste_types.name_de`,
`description_de`, `aroma_families`, `acidity/body/sweetness/...`) und
einmal in `lib/taste-types.ts` (`name`, `tagline`, `heroDesc`,
`longDesc`, `aromas`, `profile`-Achsen, `brewing`).

Die statischen Strings sind handgeschriebenes Marketing-Copy und
detaillierter als die DB-Felder — aber: wenn Mattia oder ein
Roaster die DB-Werte aendert (z.B. `aroma_families` erweitert), faellt
das *auf der Website nicht auf* — die Aromas kommen weiterhin aus
`lib/taste-types.ts`. Gleichzeitig **aendert sich aber das
`taste_embedding`** im Onboarding via `embedding_seed_text`, und damit
das Match-Ranking. Folge: Beschreibung und Empfehlung driften
auseinander, ohne dass es jemand merkt.

**Fix-Optionen.**
- **Option A (klein, schnell):** DB-Felder ergaenzen
  (`tagline_de`, `hero_desc_de`, `long_desc_de`, `brewing_methods text[]`,
  `seo_title_de`, `seo_description_de`, `seo_keywords text[]`),
  Marketing-Copy einmalig ruebermigrieren, `lib/taste-types.ts` durch
  einen DB-Query in `lib/db/taste-types.ts` ersetzen. Pages bleiben
  Server-Components, `generateStaticParams` zieht aus DB.
- **Option B (gross):** statisches Build-Step (Next.js `generateStaticParams` +
  ISR mit Revalidation-Tag), sodass DB-Aenderungen automatisch in die
  statische Generierung einfliessen.

**Trigger.** Vor dem ersten Roaster der Geschmackstyp-Inhalte selbst
pflegen koennen soll, oder vor erster Marketing-Iteration.

**Aufwand.** Option A ~3-4 h. Option B ~6-8 h.

---

## P7 — Sensorik-Skala-Konflikt: Code 0-100 vs DB 1-5

**Problem.** `lib/taste-types.ts` hat `profile: [{ label: "Saeure",
value: 50 }, ...]` mit Werten **0-100**. Die DB-Tabellen
`taste_types`, `coffees`, `coffee_ratings` (Achsen `acidity_perceived`
etc.) verwenden alle die SCA-Skala **1-5**. Die Recommender-Logik
in `lib/db/recommendations.ts` arbeitet auf 1-5.

Der 0-100-Code-Wert ist nur ein Visual-Effekt fuer die Geschmackstyp-
Detail-Page (Progress-Bars). Die Mathematik laeuft komplett auf 1-5.

**Fix.** Beim Refactoring (P6) konsequent auf 1-5 umstellen und im
JSX `value * 20` rechnen falls man optisch 0-100% Bars haben will.
Damit gibt es nur eine Wahrheit.

**Trigger.** Im selben Schritt wie P6 — sonst haben wir es zweimal
angefasst.

**Aufwand.** ~30 min on top of P6.

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

## P9 — E2E-Test ergaenzen: HTTP-Layer + Hard-Filter Edge-Case

**Stand.** `scripts/test_e2e.ts` deckt den M5b/M5c-Pfad direkt via
service_role + getCoffeesForTasteType ab (Embedding-Generation,
Hybrid-Recommendation, Rating-Drift). Was fehlt:

1. **HTTP-Round-Trip durch /api/quiz/submit, /api/recommendation/next,
   /api/rating/submit.** Diese Routes sind Cookie-Auth-bound. Aktueller
   Test umgeht sie. Vorschlag: Playwright-basierter Test der einen
   Test-Browser-Kontext oeffnet, sich mit Test-Account einloggt, dann
   die drei Endpoints aufruft und die DB-Effekte verifiziert.

2. **Scenario 2 — Edge-Case "kein passender Coffee".** Playbook 9.11
   wollte einen Test mit sehr restriktivem Customer (z.B. mehrere
   Allergene, alle Top-Coffees in Cooldown) und Pruefung der
   Fallback-Cascade. Setzt das Hard-Filter-System aus 9.8 voraus
   (= P1).

**Trigger.**
- HTTP-E2E: bevor das Frontend grosse Refactorings am Quiz/Reco-Flow
  macht — sonst merken wir Regressions erst im Browser.
- Scenario 2: nachdem P1 erledigt ist (Ranking-Function aktiv).

**Aufwand.**
- HTTP-E2E: ~3-4 h (Playwright Setup + 3 Tests).
- Scenario 2: ~1 h on top von P1.

---
