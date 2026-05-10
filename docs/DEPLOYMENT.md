# Deployment Runbook

Dieser Runbook beschreibt **(1)** wie das Matching-System auf einer
**neuen** Supabase-Umgebung von Grund auf aufgesetzt wird (z.B. Staging
oder Disaster-Recovery), und **(2)** welche Restschritte bis zum
echten Go-Live noch offen sind.

Letzte Aktualisierung: 2026-05-10 nach M5b/M5c/9.10/9.11.

---

## 1) Aufsetzen einer frischen Supabase-Umgebung

### Voraussetzungen

- Supabase-Projekt erstellt (Cloud oder lokal via Docker)
- pgvector-Extension verfuegbar (auf Supabase Cloud Default)
- OpenAI-API-Key verfuegbar
- Schreibrechte auf den Branch in diesem Repo

### Reihenfolge

| # | Schritt | Voraussetzung | Wo |
|---|---------|---------------|-----|
| 1 | Migrations 1-N ausfuehren in chronologischer Reihenfolge | Leere DB | Supabase SQL Editor, Inhalt aus `supabase/migrations/*.sql` reinkopieren |
| 2 | Seed-Daten einfuegen: `taste_types`, `quiz_questions`, `quiz_options`, `quiz_scoring`, `algorithm_config` | Migration aus 1 erfolgreich | Supabase SQL Editor |
| 3 | Max-Scores berechnen: `SELECT public.compute_taste_type_max_scores();` | Seed-Daten vorhanden | Supabase SQL Editor |
| 4 | OpenAI-Key als Supabase Secret hinterlegen unter dem Namen `OPENAI_API_KEY_COFFEESELECTION` | Edge Functions aktiviert | Supabase Dashboard -> Edge Functions -> Manage Secrets |
| 5 | Edge Function `generate-coffee-embedding` deployen | Secret aus 4 gesetzt | Dashboard -> Edge Functions -> Create new function. Code aus `supabase/functions/generate-coffee-embedding/index.ts` |
| 6 | Edge Function `build-customer-embedding` deployen | Secret aus 4 gesetzt | Dashboard -> Edge Functions -> Create new function. Code aus `supabase/functions/build-customer-embedding/index.ts` |
| 7 | Database Webhook `coffees-embedding-trigger` einrichten: `coffees` INSERT/UPDATE -> Edge Function `generate-coffee-embedding` | Schritt 5 done | Dashboard -> Database -> Webhooks |
| 8 | Migration `20260510120000_type_centroids_mv.sql` ausfuehren | mind. 1 Customer mit `taste_embedding` (sonst View leer) | Supabase SQL Editor. **Wichtig**: in derselben Session vorher `SET maintenance_work_mem = '128MB';` (sonst Memory-Fehler bei `avg(vector)`) |
| 9 | pg_cron-Job fuer `process_pending_ratings` registrieren falls nicht durch Migration bereits gesetzt | Lern-Worker-Migration ausgefuehrt | siehe `cron.schedule(...)` in `20260510130000_lern_worker_embedding_drift.sql` |
| 10 | `.env.local` setzen: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Werte aus Supabase Dashboard -> Settings -> API | Lokal im Repo |
| 11 | Coffees + Roasters seed'n (echte Roaster-Daten, nicht Demo) | Schema komplett | Migration oder einmaliger Import-Job |
| 12 | Backfill: `npx tsx scripts/backfill-coffee-embeddings.ts` | mind. 1 Coffee in DB | Lokal |
| 13 | Backfill: `npx tsx scripts/backfill-customer-embeddings.ts` | mind. 1 Customer mit `taste_type_id` | Lokal |
| 14 | E2E-Test: `npx tsx scripts/test_e2e.ts` -> erwartet `ALL TESTS OK` | Schritte 1-13 done | Lokal |
| 15 | Next.js-App deployen (Vercel oder Self-Host) | Schritt 14 gruen | Vercel CLI / Dashboard |

---

## 2) Aktueller Stand unseres Live-Systems

Wir haben **eine** Supabase-Umgebung (kein Staging). Auf dieser laufen
heute (Stand 2026-05-10):

✅ Alle Migrations bis `20260510130000` deployt
✅ Seed-Daten + Max-Scores in DB
✅ 16 Demo-Coffees mit `flavor_embedding`
✅ 9 Test-Customers mit `taste_embedding`
✅ Edge Functions `generate-coffee-embedding`, `build-customer-embedding` deployt
✅ Database Webhook auf `coffees` aktiv
✅ pg_cron Jobs `lern-worker-process-ratings` (15 min) und
   `refresh-type-centroids-mv` (taeglich 03:00 UTC) aktiv
✅ Drei API-Routes (`/api/quiz/submit`, `/api/recommendation/next`,
   `/api/rating/submit`) im Repo, lokal getestet
✅ E2E-Test `scripts/test_e2e.ts` gruen

Was vor dem **echten** Public-Launch noch zu tun ist, steht in
[`PRE_GO_LIVE.md`](./PRE_GO_LIVE.md). Pflichtschritte daraus:

| Pflicht | Was | Aufwand |
|---------|-----|---------|
| **P2** | `coffees.roast_level` Daten-Hygiene | ~30 min |
| **P8** | Demo-UUIDs durch echte UUIDs ersetzen + Validatoren strikter | ~1 h |
| **P1** | Recommender auf pgvector-RPC umstellen sobald >300 Coffees | ~4 h |

Optional aber empfohlen vor Launch:
- **P5** Dead Code raus (~10 min)
- **P6+P7** taste_types Single-Source-Of-Truth + Skala vereinheitlichen (~4 h)
- **P9** HTTP-E2E mit Playwright (~3-4 h)

---

## 3) Continuous Integration (TODO)

Aktuell: keine CI. Empfehlung aus Playbook 9.12 ist ein GitHub-Actions-
Job der bei jedem Push auf `main` und auf PR-Branches `test_e2e.ts`
ausfuehrt und rote Tests den Merge blockieren laesst.

Skizze (`.github/workflows/test.yml`):

```yaml
name: E2E Pipeline Test
on:
  push:
    branches: [main]
  pull_request:
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npx tsx scripts/test_e2e.ts
        env:
          NEXT_PUBLIC_SUPABASE_URL:     ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY:    ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

Setup-Aufwand: ~30 min, plus drei Secrets in GitHub Repo Settings.
Risiko: der E2E-Test schreibt in die echte Supabase-DB. Loesung:
**Staging-Supabase aufsetzen** und Secrets darauf zeigen lassen.

**Trigger.** Sinnvoll sobald > 1 Person aktiv am Code arbeitet, oder
spaetestens vor Public-Launch (= Pre-Go-Live).

---

## 4) Post-Deployment Smoke-Tests

Nach jedem Deploy einmal manuell durchspielen:

1. Quiz starten unter `/quiz/start` -> 12 Fragen beantworten
2. Auf `/match-result` warten bis Top-Match angezeigt wird
3. `/account/dashboard` oeffnen -> Top-Empfehlung pruefen
4. Eine Bewertung abgeben -> 15 Min spaeter pruefen ob
   `customers.taste_embedding` sich gegenueber Vorher unterscheidet:

```sql
SELECT id, num_ratings_given, profile_last_updated_at
FROM customers WHERE auth_user_id = '...';
```

Wenn `profile_last_updated_at` nach der Bewertung fortgeschritten ist
und `num_ratings_given` hochgezaehlt hat, hat der Lern-Worker den Drift
gefahren.
