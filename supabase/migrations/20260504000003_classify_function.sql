-- =============================================================================
-- Migration 013 — classify_taste_type()  (Schritt 9.5 / Playbook Kap. 4)
-- Logischer Name: 003_classify_function.sql
-- =============================================================================
-- Klassifikation Stufe 1: Aus den 12 Quiz-Antworten leiten wir den
-- Geschmackstyp ab — plus Confidence-Score, Sekundaertyp und normalisierte
-- Punktzahl. Die Funktion ist deterministisch (gleiche Eingabe -> gleiche
-- Ausgabe) und schnell (< 50 ms).
--
-- Aufruf: SELECT * FROM classify_taste_type('<response_uuid>');
--
-- Effekt:
--   * UPDATE quiz_responses SET taste_type_id, secondary_type, confidence,
--     primary_score, secondary_score, completed_at WHERE id = p_response_id
--   * RETURNS Tabelle mit denselben Werten (fuer Logging/Tests)
-- =============================================================================


create or replace function public.classify_taste_type(p_response_id uuid)
returns table (
  primary_type_id   smallint,
  secondary_type_id smallint,
  confidence        numeric,
  primary_score     numeric,
  secondary_score   numeric,
  coverage          numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_primary_id      smallint;
  v_secondary_id    smallint;
  v_primary_score   numeric;
  v_secondary_score numeric;
  v_coverage        numeric;
  v_confidence      numeric;
  v_num_answers     integer;
begin
  -- ---------------------------------------------------------------------------
  -- Vorpruefung: gibt es ueberhaupt Antworten fuer diese Response?
  -- ---------------------------------------------------------------------------
  select count(*) into v_num_answers
  from public.quiz_answers
  where response_id = p_response_id;

  if v_num_answers = 0 then
    raise exception 'classify_taste_type: keine Antworten fuer response_id = %', p_response_id;
  end if;

  -- ---------------------------------------------------------------------------
  -- Schritt 1+2: Antworten einlesen, Punkte je Typ aggregieren
  -- (LEFT JOIN auf taste_types damit jeder Typ erscheint, auch mit 0 Punkten)
  -- Schritt 3: Normalisierung auf 0-100 via taste_type_max_scores
  -- Schritt 4: Primaer- und Sekundaertyp ermitteln
  -- ---------------------------------------------------------------------------
  with raw_scores as (
    select
      tt.id as type_id,
      coalesce(sum(s.points), 0) as raw_points
    from public.taste_types tt
    left join public.quiz_scoring s
      on s.taste_type_id = tt.id
      and (s.question_code, s.answer_code) in (
        select question_code, answer_code
        from public.quiz_answers
        where response_id = p_response_id
      )
    where tt.active = true
    group by tt.id
  ),
  normalized as (
    select
      r.type_id,
      r.raw_points,
      round(
        (r.raw_points::numeric / nullif(m.max_score, 0)) * 100,
        1
      ) as norm_score
    from raw_scores r
    inner join public.taste_type_max_scores m on m.taste_type_id = r.type_id
  ),
  ranked as (
    select
      type_id,
      norm_score,
      row_number() over (order by norm_score desc nulls last, type_id asc) as rank
    from normalized
  )
  select
    max(case when rank = 1 then type_id    end),
    max(case when rank = 2 then type_id    end),
    max(case when rank = 1 then norm_score end),
    max(case when rank = 2 then norm_score end)
  into v_primary_id, v_secondary_id, v_primary_score, v_secondary_score
  from ranked;

  -- ---------------------------------------------------------------------------
  -- Schritt 5a: Coverage berechnen
  -- (wie viele der 12 Fragen geben Punkte fuer den Primaertyp?)
  -- ---------------------------------------------------------------------------
  select count(distinct s.question_code)::numeric / 12.0
  into v_coverage
  from public.quiz_scoring s
  inner join public.quiz_answers a
    on s.question_code = a.question_code
    and s.answer_code  = a.answer_code
  where a.response_id = p_response_id
    and s.taste_type_id = v_primary_id
    and s.points > 0;

  -- ---------------------------------------------------------------------------
  -- Schritt 5b: Confidence-Score (Kap. 4.6)
  --   confidence = 0.5 * absolute_strength
  --              + 0.3 * relative_dominance
  --              + 0.2 * coverage
  -- ---------------------------------------------------------------------------
  v_confidence := round(
      0.5 * (v_primary_score / 100.0)
    + 0.3 * ((v_primary_score - coalesce(v_secondary_score, 0)) / 100.0)
    + 0.2 * coalesce(v_coverage, 0),
    3
  );

  -- Cap auf [0, 1] (defensiv)
  v_confidence := greatest(0, least(1, v_confidence));

  -- ---------------------------------------------------------------------------
  -- Resultat in quiz_responses zurueckschreiben
  -- ---------------------------------------------------------------------------
  update public.quiz_responses
  set
    taste_type_id   = v_primary_id,
    secondary_type  = v_secondary_id,
    confidence      = v_confidence,
    primary_score   = v_primary_score,
    secondary_score = v_secondary_score,
    completed_at    = coalesce(completed_at, now())
  where id = p_response_id;

  -- ---------------------------------------------------------------------------
  -- Spiegel auf customers schreiben (nur bei aktiver Response)
  -- ---------------------------------------------------------------------------
  update public.customers c
  set
    taste_type_id  = v_primary_id,
    secondary_type = v_secondary_id,
    confidence     = v_confidence,
    profile_last_updated_at = now()
  from public.quiz_responses qr
  where qr.id = p_response_id
    and qr.is_active = true
    and c.id = qr.customer_id;

  -- Rueckgabe fuer Tests / Logging
  return query select
    v_primary_id,
    v_secondary_id,
    v_confidence,
    v_primary_score,
    v_secondary_score,
    coalesce(v_coverage, 0);
end;
$$;

comment on function public.classify_taste_type(uuid) is
  'Stufe 1 des Matching-Algorithmus (Kap. 4). Klassifiziert eine '
  'quiz_responses-Zeile in einen der 8 Geschmackstypen, berechnet Confidence '
  'aus absolute_strength (50%), relative_dominance (30%) und coverage (20%), '
  'und schreibt das Resultat zurueck in quiz_responses + customers.';


-- =============================================================================
-- Hilfsfunktion: get_taste_type_breakdown()
-- =============================================================================
-- Gibt fuer eine Response alle 8 Typen mit Rohpunkten und normalisiertem Score
-- zurueck — nuetzlich fuer Debugging, Erklaerbarkeit und das Admin-Dashboard.
-- =============================================================================
create or replace function public.get_taste_type_breakdown(p_response_id uuid)
returns table (
  type_id      smallint,
  type_slug    text,
  type_name    text,
  raw_points   integer,
  max_score    integer,
  norm_score   numeric,
  rank         integer
)
language sql
stable
as $$
  with raw_scores as (
    select
      tt.id as type_id,
      tt.slug as type_slug,
      tt.name_de as type_name,
      coalesce(sum(s.points), 0)::integer as raw_points
    from public.taste_types tt
    left join public.quiz_scoring s
      on s.taste_type_id = tt.id
      and (s.question_code, s.answer_code) in (
        select question_code, answer_code
        from public.quiz_answers
        where response_id = p_response_id
      )
    where tt.active = true
    group by tt.id, tt.slug, tt.name_de
  )
  select
    r.type_id,
    r.type_slug,
    r.type_name,
    r.raw_points,
    m.max_score,
    round((r.raw_points::numeric / nullif(m.max_score, 0)) * 100, 1) as norm_score,
    (row_number() over (order by r.raw_points::numeric / nullif(m.max_score, 0) desc, r.type_id asc))::integer as rank
  from raw_scores r
  inner join public.taste_type_max_scores m on m.taste_type_id = r.type_id
  order by rank asc;
$$;

comment on function public.get_taste_type_breakdown(uuid) is
  'Liefert pro Quiz-Response die Punktzahlen aller 8 Geschmackstypen — '
  'fuer Debugging, Erklaerbarkeit und Admin-Dashboard (Kap. 4.3).';


-- =============================================================================
-- Hilfsfunktion: confidence_band()
-- =============================================================================
-- Mappt einen Confidence-Wert auf das Band aus Kap. 4.6 — wird vom Ranking
-- verwendet, um zu entscheiden wie stark der Sekundaertyp eingemischt wird.
-- =============================================================================
create or replace function public.confidence_band(p_confidence numeric)
returns text
language sql
immutable
as $$
  select case
    when p_confidence is null     then 'unknown'
    when p_confidence >= 0.85     then 'very_high'   -- 100/0
    when p_confidence >= 0.65     then 'high'        -- 85/15
    when p_confidence >= 0.45     then 'medium'      -- 70/30
    when p_confidence >= 0.25     then 'low'         -- 60/40
    else                                'critical'   -- WARNUNG
  end;
$$;

comment on function public.confidence_band(numeric) is
  'Mappt Confidence (0-1) auf eines von 5 Baendern (Kap. 4.6). '
  'Wird im Ranking benutzt um Mischverhaeltnis Primaer/Sekundaer zu bestimmen.';
