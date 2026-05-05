-- =============================================================================
-- Migration 019 — Lern-Worker (Schritt 9.9 / Playbook Kap. 6)
-- =============================================================================
-- Verarbeitet unverarbeitete Bewertungen (coffee_ratings.processed_at IS NULL):
--   1. Positive Tags -> customer_aroma_preferences.sentiment erhoeht
--   2. Negative Tags -> customer_aroma_preferences.sentiment gesenkt
--   3. Zu viele 'no'-Bewertungen -> reclassification_suggested
--   4. customers.num_ratings_given + profile_last_updated_at aktualisiert
--   5. coffee_ratings.processed_at = now() gesetzt
--
-- Lernrate: gewichteter laufender Durchschnitt mit learning_rate_base (0.10).
--   Sentiment_neu = (sentiment_alt * count + delta) / (count + 1)
--   → natuerliches Abflachen bei vielen Bewertungen (Playbook Kap. 6.3)
--
-- Reklassifikation wird vorgeschlagen wenn:
--   * >= 3 'no'-Bewertungen in den letzten 90 Tagen
--   * kein Vorschlag juenger als 30 Tage existiert
-- =============================================================================


-- =============================================================================
-- A) Lern-Worker-Funktion
-- =============================================================================
create or replace function public.process_pending_ratings(
  p_batch_size int default 100
)
returns table(processed int, skipped int)
language plpgsql
security definer
as $$
declare
  v_rating             record;
  v_learning_rate      numeric;
  v_reclass_threshold  int := 3;
  v_recent_no_count    int;
  v_tag                text;
  v_processed          int := 0;
  v_skipped            int := 0;
begin
  -- Lernrate aus algorithm_config (Standard 0.10)
  select coalesce(
    (select value_numeric from public.algorithm_config where key = 'learning_rate_base'),
    0.10
  ) into v_learning_rate;

  -- Unverarbeitete Bewertungen (aelteste zuerst, max. p_batch_size)
  for v_rating in
    select
      r.id            as rating_id,
      r.customer_id,
      r.coffee_id,
      r.would_drink_again,
      r.positive_tags,
      r.negative_tags
    from public.coffee_ratings r
    where r.processed_at is null
    order by r.created_at
    limit p_batch_size
    for update skip locked
  loop

    -- -------------------------------------------------------------------------
    -- 1) Positive Tags: Sentiment anheben
    -- -------------------------------------------------------------------------
    foreach v_tag in array coalesce(v_rating.positive_tags, '{}')
    loop
      if v_tag is not null and v_tag <> '' then
        insert into public.customer_aroma_preferences
          (customer_id, aroma_tag, sentiment, count, last_seen_at)
        values
          (v_rating.customer_id, v_tag, v_learning_rate, 1, now())
        on conflict (customer_id, aroma_tag) do update
          set
            sentiment = least(1.0, greatest(-1.0,
                (customer_aroma_preferences.sentiment * customer_aroma_preferences.count
                 + v_learning_rate)
                / (customer_aroma_preferences.count + 1)
              )),
            count      = customer_aroma_preferences.count + 1,
            last_seen_at = now();
      end if;
    end loop;

    -- -------------------------------------------------------------------------
    -- 2) Negative Tags: Sentiment senken
    -- -------------------------------------------------------------------------
    foreach v_tag in array coalesce(v_rating.negative_tags, '{}')
    loop
      if v_tag is not null and v_tag <> '' then
        insert into public.customer_aroma_preferences
          (customer_id, aroma_tag, sentiment, count, last_seen_at)
        values
          (v_rating.customer_id, v_tag, -v_learning_rate, 1, now())
        on conflict (customer_id, aroma_tag) do update
          set
            sentiment = least(1.0, greatest(-1.0,
                (customer_aroma_preferences.sentiment * customer_aroma_preferences.count
                 + (-v_learning_rate))
                / (customer_aroma_preferences.count + 1)
              )),
            count      = customer_aroma_preferences.count + 1,
            last_seen_at = now();
      end if;
    end loop;

    -- -------------------------------------------------------------------------
    -- 3) Reklassifikations-Check (would_drink_again = 'no')
    -- -------------------------------------------------------------------------
    if v_rating.would_drink_again = 'no' then
      select count(*) into v_recent_no_count
      from public.coffee_ratings
      where customer_id   = v_rating.customer_id
        and would_drink_again = 'no'
        and created_at    > now() - interval '90 days';

      if v_recent_no_count >= v_reclass_threshold then
        update public.customers
        set reclassification_suggested_at = now()
        where id = v_rating.customer_id
          and (
            reclassification_suggested_at is null
            or reclassification_suggested_at < now() - interval '30 days'
          );
      end if;
    end if;

    -- -------------------------------------------------------------------------
    -- 4) Kunden-Statistik aktualisieren
    -- -------------------------------------------------------------------------
    update public.customers
    set
      num_ratings_given       = num_ratings_given + 1,
      profile_last_updated_at = now()
    where id = v_rating.customer_id;

    -- -------------------------------------------------------------------------
    -- 5) Bewertung als verarbeitet markieren
    -- -------------------------------------------------------------------------
    update public.coffee_ratings
    set processed_at = now()
    where id = v_rating.rating_id;

    v_processed := v_processed + 1;
  end loop;

  return query select v_processed, v_skipped;
end;
$$;

comment on function public.process_pending_ratings(int) is
  'Lern-Worker (Kap. 6): verarbeitet neue Bewertungen, aktualisiert Aroma-Sentiments '
  'und schlaegt Reklassifikation vor. Wird via pg_cron alle 15 min aufgerufen.';


-- =============================================================================
-- B) algorithm_config: reclassification_threshold eintragen (falls noch nicht da)
-- =============================================================================
insert into public.algorithm_config (key, value_numeric, description)
values (
  'reclassification_threshold',
  3,
  'Anzahl negativer Bewertungen ("would_drink_again=no") in 90 Tagen, '
  'ab der eine Reklassifikation des Kunden vorgeschlagen wird (Kap. 6.5).'
)
on conflict (key) do nothing;


-- =============================================================================
-- C) pg_cron Job einrichten
-- =============================================================================
-- Voraussetzung: pg_cron Extension muss im Supabase Dashboard aktiviert sein:
--   Dashboard -> Database -> Extensions -> pg_cron -> Enable
--
-- Danach diesen Block separat ausfuehren (oder den Kommentar entfernen):
-- =============================================================================

-- Bereits vorhandenen Job loeschen, damit kein Duplikat entsteht
select cron.unschedule('lern-worker-process-ratings')
where exists (
  select 1 from cron.job where jobname = 'lern-worker-process-ratings'
);

-- Alle 15 Minuten ausfuehren
select cron.schedule(
  'lern-worker-process-ratings',
  '*/15 * * * *',
  $cron$select public.process_pending_ratings()$cron$
);


-- =============================================================================
-- D) Smoke-Test (manuell ausfuehren nach dem Einspielen)
-- =============================================================================
-- select * from public.process_pending_ratings();
-- Erwartet: processed=0, skipped=0  (noch keine unverarbeiteten Ratings)
--
-- Cron-Jobs pruefen:
-- select jobname, schedule, command, active from cron.job;
