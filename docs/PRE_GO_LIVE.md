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
