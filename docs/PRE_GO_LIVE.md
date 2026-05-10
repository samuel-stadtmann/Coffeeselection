# Pre-Go-Live Backlog

Tasks die vor dem ersten echten Launch erledigt sein muessen, aber im
laufenden Build nicht blockieren. Pro Eintrag: Auswirkung, Trigger,
geschaetzter Aufwand.

---

## P1 — Recommender auf pgvector RPC umstellen

**Problem.** Aktuell holt `getCoffeesForTasteType` (in `lib/db/recommendations.ts`)
*alle* aktiven Coffees inklusive ihrer 1536-dimensionalen Embeddings aus der
DB und rechnet die Cosine-Similarity in JS. Pro Coffee ca. 6 KB Embedding-
Payload — das skaliert linear:

| Coffees | Payload | Latenz (geschaetzt) |
| ------- | ------- | ------------------- |
| 16      | 100 KB  | < 100 ms            |
| 100     | 600 KB  | ~250 ms             |
| 500     | 3 MB    | ~1 s — Grenzbereich |
| 1.000   | 6 MB    | ~2 s — unbrauchbar  |

**Fix.** Das Ranking als Postgres-Function bauen, damit nur die Top-N die DB
verlassen. Skizze:

```sql
create or replace function public.rank_coffees_for_customer(
  p_customer_id uuid,
  p_limit       int default 6,
  p_exclude_ids uuid[] default array[]::uuid[]
)
returns table (
  coffee_id     uuid,
  match_score   numeric,
  scoring_score numeric,
  vector_sim    numeric
) language sql stable as $$
  with q as (
    select coalesce(c.taste_embedding, tcm.centroid) as v
    from public.customers c
    left join public.type_centroids_mv tcm on tcm.taste_type_id = c.taste_type_id
    where c.id = p_customer_id
  )
  select
    co.id,
    -- 0.611 * manhattan_score + 0.389 * (1 - cosine_distance/2)
    ...
  from public.coffees co, q
  where co.status = 'active'
    and co.flavor_embedding is not null
    and not co.id = any(p_exclude_ids)
  order by co.flavor_embedding <=> q.v
  limit p_limit * 5;  -- Overfetch fuer Manhattan-Re-Ranking in Postgres
$$;
```

Plus HNSW-Index (statt ivfflat — bei uns Memory-Probleme):

```sql
create index coffees_flavor_embedding_hnsw_idx
  on public.coffees
  using hnsw (flavor_embedding vector_cosine_ops);
```

`recommendations.ts` ruft dann `supabase.rpc('rank_coffees_for_customer', ...)`
und macht nur noch das Hydrieren der Coffee-Felder.

**Trigger.** Sobald > ~300 aktive Coffees in der DB sind, oder spaetestens
zwei Wochen vor Public Launch.

**Aufwand.** ~4 h — DB-Function bauen, Index anlegen (Memory-Setting in
Supabase ggf. anpassen), `recommendations.ts` umstellen, Smoke-Test.

---

## P2 — `coffees.roast_level` Daten-Hygiene

**Problem.** Beim Smoke-Test der Edge Function fiel auf, dass mindestens
ein Coffee (`Sidamo Natural`) den Wert `"1"` in `roast_level` hat, statt
des erwarteten Enum-Werts (`light` / `medium_light` / `medium` /
`medium_dark` / `dark`). Der Embedding-Text enthielt deshalb
`"Roestgrad: 1"` statt `"Roestgrad: light"`. Das verschlechtert die
semantische Qualitaet der OpenAI-Embeddings.

**Fix.** Audit aller `coffees.roast_level`-Werte, Mapping `1`-`5` -> Enum,
ggf. zusaetzlich CHECK-Constraint setzen falls die Migration es nicht
schon tut. Danach **alle betroffenen Coffees neu einbetten** via
`scripts/backfill-coffee-embeddings.ts`.

```sql
-- Audit
SELECT roast_level, count(*) FROM coffees GROUP BY roast_level;

-- Migration (falls Mapping nicht eindeutig: erst manuell verifizieren)
UPDATE coffees SET roast_level = 'light'        WHERE roast_level = '1';
UPDATE coffees SET roast_level = 'medium_light' WHERE roast_level = '2';
UPDATE coffees SET roast_level = 'medium'       WHERE roast_level = '3';
UPDATE coffees SET roast_level = 'medium_dark'  WHERE roast_level = '4';
UPDATE coffees SET roast_level = 'dark'         WHERE roast_level = '5';
```

**Trigger.** Vor dem ersten echten Roaster-Onboarding — ab dem Punkt
liefern wir mit den Embeddings echte Empfehlungen aus.

**Aufwand.** ~30 min inkl. Re-Embedding.

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
