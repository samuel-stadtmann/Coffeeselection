-- ============================================================================
-- Aroma-basierte Reklassifikation als zweiter pg_cron-Job
-- ============================================================================
--
-- Hintergrund:
--   Es gab bislang nur den "no"-Counter im process_pending_ratings:
--   ≥3 negative Ratings → reclassification_suggested.
--   Das fängt nur den Extremfall (Customer mag Coffee gar nicht).
--
-- Neu:
--   Wir aggregieren customer_aroma_preferences.sentiment ueber alle Aromen
--   eines Geschmackstyps (taste_types.aroma_families). Pro Customer mit
--   ≥5 Ratings rechnen wir je Geschmackstyp einen Score:
--     score = sum(sentiment[aroma]) for aroma in type.aroma_families
--   Wenn der best-passende Typ ein anderer ist als der aktuelle
--   customers.taste_type_id UND die Score-Differenz signifikant
--   (>= 1.5 = ungefaehr "3 Aromen-Familien sehr positiv beim anderen
--   Typ und sehr negativ beim eigenen"), setzen wir
--   reclassification_suggested_at + reclassification_suggested_type.
--
--   Die existierende Edge Function send-reclassification-emails picked
--   diese Eintraege spaeter auf und schickt die Reklassifikations-Mail.
--
-- Schedule: taeglich 06:00 UTC (vor der Reminder-Mail um 09:00 UTC).
-- ============================================================================

create or replace function public.suggest_aroma_based_reclassification(
  p_min_ratings      integer default 5,
  p_score_threshold  numeric default 1.5
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer := 0;
  v_row     record;
  v_best    record;
begin
  -- Iterate ueber alle Customers mit genug Ratings + aktivem Geschmackstyp
  -- + ohne bereits offene Reklassifikations-Empfehlung.
  for v_row in
    select id, taste_type_id, num_ratings_given
    from public.customers
    where num_ratings_given >= p_min_ratings
      and taste_type_id is not null
      and reclassification_suggested_at is null
      and deleted_at is null
  loop
    -- Score pro Typ: Summe der Sentiments fuer Aromen die in
    -- type.aroma_families auftauchen. Typen ohne Aroma-Familien fallen
    -- automatisch raus (cross join + filter).
    select tt.id as type_id, sum(coalesce(cap.sentiment, 0)) as score
      into v_best
    from public.taste_types tt
      cross join lateral (
        select aroma_tag, sentiment
        from public.customer_aroma_preferences
        where customer_id = v_row.id
          and aroma_tag = any (tt.aroma_families)
      ) cap
    group by tt.id
    order by score desc nulls last
    limit 1;

    if v_best is null or v_best.type_id is null then
      continue;
    end if;

    -- Nur Vorschlag wenn:
    --   - best-Typ != aktueller Typ
    --   - Score >= threshold (sonst zu wenig Signal)
    if v_best.type_id <> v_row.taste_type_id
       and v_best.score >= p_score_threshold then
      update public.customers
      set
        reclassification_suggested_at   = now(),
        reclassification_suggested_type = v_best.type_id
      where id = v_row.id;
      v_updated := v_updated + 1;
    end if;
  end loop;

  return v_updated;
end;
$$;

comment on function public.suggest_aroma_based_reclassification(integer, numeric) is
  'Pickt Customer mit ≥N Ratings, scored alle Geschmackstypen anhand der gesammelten Aroma-Sentiments und setzt reclassification_suggested_at wenn ein anderer Typ deutlich besser passt. Schreibt nichts wenn der best-Typ identisch oder die Differenz zu klein ist.';

-- ---------------------------------------------------------------------------
-- pg_cron-Job. Bestehenden Job mit gleichem Namen ggf. ersetzen.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from cron.job where jobname = 'suggest-aroma-reclassification') then
    perform cron.unschedule('suggest-aroma-reclassification');
  end if;
end$$;

select cron.schedule(
  'suggest-aroma-reclassification',
  '0 6 * * *',  -- taeglich 06:00 UTC
  $$ select public.suggest_aroma_based_reclassification(5, 1.5); $$
);
