-- ============================================================================
-- Fix: Coffee-Embedding-Trigger nur fuer aktive Coffees + bei Aktivierung
-- ============================================================================
--
-- Bug-Audit ergab zwei Schwaechen im Trigger aus 20260518200000:
--   1) when (NEW.status is distinct from 'deleted') → feuert auch fuer
--      'draft'/'pending'-Coffees, verbrennt OpenAI-Calls fuer unfertige
--      Entwuerfe.
--   2) 'status' war NICHT in der AFTER-UPDATE-OF-Spaltenliste. Folge: ein
--      Coffee der als Draft angelegt (kein Embedding), spaeter nur per
--      Status-Wechsel auf 'active' gesetzt wird, triggert NICHT → bleibt
--      ohne Embedding und wird im Hybrid-Match nie sauber gerankt.
--
-- Fix:
--   - 'status' in die Spaltenliste aufnehmen (Draft→Active triggert jetzt)
--   - when-Guard auf NEW.status = 'active' (nur aktive Coffees kosten
--     OpenAI-Calls; Drafts werden ohnehin nicht empfohlen)
-- ============================================================================

drop trigger if exists trg_coffee_embedding_autosync on public.coffees;

create trigger trg_coffee_embedding_autosync
after insert or update of
    name,
    short_description,
    description,
    tasting_summary,
    flavor_description,
    aroma_families,
    acidity, body, sweetness, bitterness, complexity,
    roast_level,
    region, farm, producer,
    status
  on public.coffees
  for each row
  when (NEW.status = 'active')
  execute function public.trigger_generate_coffee_embedding();

comment on trigger trg_coffee_embedding_autosync on public.coffees is
  'Async Edge-Function-Aufruf zu generate-coffee-embedding NUR fuer aktive Coffees (when NEW.status=active) nach Insert/Update embedding-relevanter Spalten inkl. status (damit Draft->Active triggert). flavor_embedding NICHT in der Spaltenliste (sonst Infinite Loop).';
