-- ============================================================================
-- Auto-Trigger: bei jedem Insert/Update von embedding-relevanten Coffee-
-- Feldern den Edge-Function-Aufruf zu generate-coffee-embedding triggern.
--
-- Vorher: Embedding wurde nur manuell via Backfill-Button generiert. Neue
-- Coffees lagen ohne flavor_embedding rum, sahen schlecht im Hybrid-Match
-- aus.
--
-- Jetzt: AFTER INSERT / AFTER UPDATE auf den relevanten Spalten ruft eine
-- Trigger-Function pg_net.http_post auf die Edge-Function. Asynchron, der
-- Coffee-INSERT/UPDATE selber blockiert NICHT auf Embedding-Generierung.
--
-- Voraussetzungen (User-Setup auf Production / Staging einmalig):
--   * pg_net Extension aktiv (Standard in Supabase)
--   * Vault-Secrets fuer 'SUPABASE_URL' und 'SERVICE_ROLE_KEY' gesetzt
--     (gleiche Eintraege wie fuer send-reclassification-emails und
--     send-rating-reminders verwendet)
--   * Edge Function 'generate-coffee-embedding' deployt
--   * Edge Function Secret OPENAI_API_KEY_COFFEESELECTION gesetzt
-- ============================================================================

create extension if not exists pg_net;

-- ---------------------------------------------------------------------------
-- Trigger-Function: ruft die Edge-Function fuer den NEW.id (UUID) auf.
-- ---------------------------------------------------------------------------
create or replace function public.trigger_generate_coffee_embedding()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url       text;
  v_key       text;
  v_endpoint  text;
begin
  -- Vault-Secrets ziehen. Fehlen sie, loggen wir Warning und skippen — das
  -- Coffee-INSERT/UPDATE soll dadurch nicht crashen.
  select decrypted_secret into v_url
    from vault.decrypted_secrets where name = 'SUPABASE_URL' limit 1;
  select decrypted_secret into v_key
    from vault.decrypted_secrets where name = 'SERVICE_ROLE_KEY' limit 1;

  if v_url is null or v_key is null then
    raise warning '[trigger_generate_coffee_embedding] Vault-Secrets fehlen (SUPABASE_URL/SERVICE_ROLE_KEY) — Embedding-Trigger fuer coffee_id=% skipped', NEW.id;
    return NEW;
  end if;

  v_endpoint := v_url || '/functions/v1/generate-coffee-embedding';

  -- Async POST. pg_net puffert + retried im Hintergrund, der Trigger
  -- kehrt sofort zurueck. Response landet in net._http_response.
  perform net.http_post(
    url     := v_endpoint,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body    := jsonb_build_object('coffee_id', NEW.id)
  );

  return NEW;
end;
$$;

comment on function public.trigger_generate_coffee_embedding() is
  'Trigger-Funktion: feuert nach Insert/Update von embedding-relevanten Coffee-Feldern einen async pg_net.http_post an die Edge Function generate-coffee-embedding.';

-- ---------------------------------------------------------------------------
-- Trigger anhaengen.
-- Wir feuern auf:
--   * INSERT (jeder neue Coffee bekommt sofort ein Embedding)
--   * UPDATE der textuellen Felder (Beschreibung, Aromen, Sensorik geaendert
--     → Embedding stimmt nicht mehr).
-- Wichtig: NICHT bei UPDATE von flavor_embedding selber, sonst Infinite Loop
-- (Edge Function schreibt flavor_embedding zurueck → triggert sich endlos).
-- ---------------------------------------------------------------------------
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
    region, farm, producer
  on public.coffees
  for each row
  -- Nur fuer aktive Coffees triggern. Drafts ohne Daten sollen keinen
  -- API-Aufruf verbrennen.
  when (NEW.status is distinct from 'deleted')
  execute function public.trigger_generate_coffee_embedding();

comment on trigger trg_coffee_embedding_autosync on public.coffees is
  'Asynchroner Edge-Function-Aufruf zu generate-coffee-embedding nach Insert/Update von embedding-relevanten Spalten. Vermeidet flavor_embedding-Spalte (sonst Infinite Loop).';
