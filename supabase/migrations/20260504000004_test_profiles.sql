-- =============================================================================
-- Migration 014 — Test-Suite Seed + simulate_classification()  (Schritt 9.6)
-- Logischer Name: 004_test_profiles.sql
-- =============================================================================
-- Legt die "goldenen" Test-Profile aus Playbook Kap. 4.9 in test_quiz_profiles
-- ab und stellt eine seiteneffekt-freie Variante des Klassifikators bereit
-- (simulate_classification), damit die Test-Suite ohne echte Kunden-Records
-- laufen kann.
-- =============================================================================


-- =============================================================================
-- A) simulate_classification(p_answers jsonb)
-- =============================================================================
-- Macht dasselbe wie classify_taste_type(), aber WITHOUT side effects: kein
-- UPDATE auf quiz_responses, kein UPDATE auf customers. Nimmt die Antworten
-- direkt als JSONB-Array entgegen — Format gemaess Playbook 4.9:
--   [{"q": "Q1_brewing_method", "a": "A_espresso"}, ...]
-- =============================================================================
create or replace function public.simulate_classification(p_answers jsonb)
returns table (
  primary_type_id   smallint,
  secondary_type_id smallint,
  confidence        numeric,
  primary_score     numeric,
  secondary_score   numeric,
  coverage          numeric
)
language plpgsql
stable
as $$
declare
  v_primary_id      smallint;
  v_secondary_id    smallint;
  v_primary_score   numeric;
  v_secondary_score numeric;
  v_coverage        numeric;
  v_confidence      numeric;
begin
  -- JSONB-Array in (question_code, answer_code) Paare aufloesen
  with answers as (
    select
      (elem ->> 'q') as question_code,
      (elem ->> 'a') as answer_code
    from jsonb_array_elements(p_answers) elem
  ),
  raw_scores as (
    select
      tt.id as type_id,
      coalesce(sum(s.points), 0) as raw_points
    from public.taste_types tt
    left join public.quiz_scoring s
      on s.taste_type_id = tt.id
      and (s.question_code, s.answer_code) in (
        select question_code, answer_code from answers
      )
    where tt.active = true
    group by tt.id
  ),
  normalized as (
    select
      r.type_id,
      r.raw_points,
      round((r.raw_points::numeric / nullif(m.max_score, 0)) * 100, 1) as norm_score
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

  -- Coverage: wie viele Fragen geben Punkte fuer den Primaertyp?
  with answers as (
    select
      (elem ->> 'q') as question_code,
      (elem ->> 'a') as answer_code
    from jsonb_array_elements(p_answers) elem
  )
  select count(distinct s.question_code)::numeric / 12.0
  into v_coverage
  from public.quiz_scoring s
  inner join answers a
    on s.question_code = a.question_code
    and s.answer_code  = a.answer_code
  where s.taste_type_id = v_primary_id
    and s.points > 0;

  -- Confidence-Formel (Kap. 4.6)
  v_confidence := round(
      0.5 * (v_primary_score / 100.0)
    + 0.3 * ((v_primary_score - coalesce(v_secondary_score, 0)) / 100.0)
    + 0.2 * coalesce(v_coverage, 0),
    3
  );

  v_confidence := greatest(0, least(1, v_confidence));

  return query select
    v_primary_id,
    v_secondary_id,
    v_confidence,
    v_primary_score,
    v_secondary_score,
    coalesce(v_coverage, 0);
end;
$$;

comment on function public.simulate_classification(jsonb) is
  'Seiteneffekt-freie Variante von classify_taste_type — fuer Tests, '
  'A/B-Vergleiche und Vorschau-UI im Frontend (Kap. 4.9).';


-- =============================================================================
-- B) test_quiz_profiles — 8 goldene Profile (Kap. 4.9)
-- =============================================================================
-- Pro Geschmackstyp ein klares Profil. Jede Antwort gibt dem Zieltyp
-- moeglichst viele Punkte. Confidence-Schwellen sind konservativ, damit
-- kleine Scoring-Anpassungen nicht sofort die Tests brechen.
-- =============================================================================

insert into public.test_quiz_profiles
  (profile_name, description, expected_type, expected_min_confidence, answers) values

  ('Standard-Vollautomat-Trinker',
   'Klassischer Alltagstrinker — Vollautomat, etwas Milch, Konstanz wichtig.',
   1, 0.70,
   '[
      {"q":"Q1_brewing_method","a":"D_fully_auto"},
      {"q":"Q2_consumption","a":"B_throughout_day"},
      {"q":"Q3_milk_or_black","a":"B_with_milk"},
      {"q":"Q4_breakfast","a":"B_yogurt_honey"},
      {"q":"Q5_chocolate","a":"B_dark_50_70"},
      {"q":"Q6_drink","a":"E_beer_cider"},
      {"q":"Q7_aroma","a":"A_fresh_bread"},
      {"q":"Q8_tea","a":"A_strong_black"},
      {"q":"Q9_citrus","a":"B_neutral"},
      {"q":"Q10_mouthfeel","a":"B_balanced"},
      {"q":"Q11_experience","a":"A_beginner"},
      {"q":"Q12_openness","a":"B_consistency"}
   ]'::jsonb),

  ('Skandinavischer Filter-Purist',
   'Heller Filter, schwarz, fruchtig-blumig, Wochenend-Genuss.',
   2, 0.75,
   '[
      {"q":"Q1_brewing_method","a":"B_filter"},
      {"q":"Q2_consumption","a":"C_weekend"},
      {"q":"Q3_milk_or_black","a":"A_black"},
      {"q":"Q4_breakfast","a":"A_croissant_berries"},
      {"q":"Q5_chocolate","a":"D_berry_filled"},
      {"q":"Q6_drink","a":"A_white_wine"},
      {"q":"Q7_aroma","a":"B_strawberries"},
      {"q":"Q8_tea","a":"C_fruit_tea"},
      {"q":"Q9_citrus","a":"A_pleasant"},
      {"q":"Q10_mouthfeel","a":"A_light_tealike"},
      {"q":"Q11_experience","a":"C_enthusiast"},
      {"q":"Q12_openness","a":"A_discovery"}
   ]'::jsonb),

  ('Hardcore-Italo-Espresso',
   'Italienisch-traditioneller Espresso-Trinker, dunkle Roestung, schwarz.',
   3, 0.75,
   '[
      {"q":"Q1_brewing_method","a":"A_espresso"},
      {"q":"Q2_consumption","a":"D_after_meals"},
      {"q":"Q3_milk_or_black","a":"C_cappuccino"},
      {"q":"Q4_breakfast","a":"F_dark_chocolate"},
      {"q":"Q5_chocolate","a":"C_dark_80plus"},
      {"q":"Q6_drink","a":"B_strong_red"},
      {"q":"Q7_aroma","a":"D_fireplace"},
      {"q":"Q8_tea","a":"A_strong_black"},
      {"q":"Q9_citrus","a":"C_unpleasant"},
      {"q":"Q10_mouthfeel","a":"C_full_syrupy"},
      {"q":"Q11_experience","a":"B_advanced"},
      {"q":"Q12_openness","a":"D_perfect_one"}
   ]'::jsonb),

  ('Naturwein-Anaerobic-Liebhaber',
   'Aroma-Abenteurer — Naturwein, ungewoehnliche Verarbeitungen, Profi-Niveau.',
   4, 0.70,
   '[
      {"q":"Q1_brewing_method","a":"B_filter"},
      {"q":"Q2_consumption","a":"C_weekend"},
      {"q":"Q3_milk_or_black","a":"A_black"},
      {"q":"Q4_breakfast","a":"E_hummus_sandwich"},
      {"q":"Q5_chocolate","a":"D_berry_filled"},
      {"q":"Q6_drink","a":"D_natural_wine"},
      {"q":"Q7_aroma","a":"F_herbs"},
      {"q":"Q8_tea","a":"E_chai_spices"},
      {"q":"Q9_citrus","a":"A_pleasant"},
      {"q":"Q10_mouthfeel","a":"B_balanced"},
      {"q":"Q11_experience","a":"D_pro"},
      {"q":"Q12_openness","a":"A_discovery"}
   ]'::jsonb),

  ('Saeure-Sensitiver Magenfreund',
   'Niedrige Saeure, Vollautomat, Kamillentee, Konstanz.',
   5, 0.70,
   '[
      {"q":"Q1_brewing_method","a":"D_fully_auto"},
      {"q":"Q2_consumption","a":"B_throughout_day"},
      {"q":"Q3_milk_or_black","a":"B_with_milk"},
      {"q":"Q4_breakfast","a":"B_yogurt_honey"},
      {"q":"Q5_chocolate","a":"A_milk_chocolate"},
      {"q":"Q6_drink","a":"G_water_tea"},
      {"q":"Q7_aroma","a":"A_fresh_bread"},
      {"q":"Q8_tea","a":"D_chamomile_rooibos"},
      {"q":"Q9_citrus","a":"C_unpleasant"},
      {"q":"Q10_mouthfeel","a":"D_creamy_cocoa"},
      {"q":"Q11_experience","a":"A_beginner"},
      {"q":"Q12_openness","a":"B_consistency"}
   ]'::jsonb),

  ('Geisha-Liebhaber',
   'Florale, helle Roestung, Earl Grey, Geisha-Faszination.',
   6, 0.70,
   '[
      {"q":"Q1_brewing_method","a":"B_filter"},
      {"q":"Q2_consumption","a":"A_morning_ritual"},
      {"q":"Q3_milk_or_black","a":"A_black"},
      {"q":"Q4_breakfast","a":"A_croissant_berries"},
      {"q":"Q5_chocolate","a":"F_no_chocolate"},
      {"q":"Q6_drink","a":"C_champagne"},
      {"q":"Q7_aroma","a":"C_earl_grey"},
      {"q":"Q8_tea","a":"B_green_jasmine"},
      {"q":"Q9_citrus","a":"A_pleasant"},
      {"q":"Q10_mouthfeel","a":"A_light_tealike"},
      {"q":"Q11_experience","a":"D_pro"},
      {"q":"Q12_openness","a":"A_discovery"}
   ]'::jsonb),

  ('Sumatra-Erdig-Fan',
   'Indonesisch-erdig, French Press, Bauernfruehstueck, kraeftiger Rotwein.',
   7, 0.55,
   '[
      {"q":"Q1_brewing_method","a":"C_french_press"},
      {"q":"Q2_consumption","a":"D_after_meals"},
      {"q":"Q3_milk_or_black","a":"A_black"},
      {"q":"Q4_breakfast","a":"C_farmer_breakfast"},
      {"q":"Q5_chocolate","a":"C_dark_80plus"},
      {"q":"Q6_drink","a":"B_strong_red"},
      {"q":"Q7_aroma","a":"D_fireplace"},
      {"q":"Q8_tea","a":"E_chai_spices"},
      {"q":"Q9_citrus","a":"C_unpleasant"},
      {"q":"Q10_mouthfeel","a":"C_full_syrupy"},
      {"q":"Q11_experience","a":"C_enthusiast"},
      {"q":"Q12_openness","a":"D_perfect_one"}
   ]'::jsonb),

  ('Karamell-Latte-Liebhaber',
   'Dessert-Trinker — Latte mit Sirup, Karamell-Aromen, Vollmilchschokolade.',
   8, 0.70,
   '[
      {"q":"Q1_brewing_method","a":"A_espresso"},
      {"q":"Q2_consumption","a":"A_morning_ritual"},
      {"q":"Q3_milk_or_black","a":"E_with_sugar"},
      {"q":"Q4_breakfast","a":"D_pancakes_caramel"},
      {"q":"Q5_chocolate","a":"E_white_caramel"},
      {"q":"Q6_drink","a":"F_sweet_cocktail"},
      {"q":"Q7_aroma","a":"E_caramel"},
      {"q":"Q8_tea","a":"E_chai_spices"},
      {"q":"Q9_citrus","a":"D_depends"},
      {"q":"Q10_mouthfeel","a":"D_creamy_cocoa"},
      {"q":"Q11_experience","a":"A_beginner"},
      {"q":"Q12_openness","a":"D_perfect_one"}
   ]'::jsonb);


-- =============================================================================
-- C) Hilfsfunktion: run_classifier_tests()
-- =============================================================================
-- Laeuft alle aktiven Test-Profile durch simulate_classification und gibt
-- pro Profil zurueck: erwartet vs. tatsaechlich + Pass/Fail.
-- Aufruf: SELECT * FROM run_classifier_tests();
-- =============================================================================
create or replace function public.run_classifier_tests()
returns table (
  profile_name      text,
  expected_type     smallint,
  actual_type       smallint,
  expected_min_conf numeric,
  actual_conf       numeric,
  type_ok           boolean,
  conf_ok           boolean,
  passed            boolean
)
language plpgsql
stable
as $$
declare
  v_profile         record;
  v_result          record;
begin
  for v_profile in
    select profile_name, expected_type, expected_min_confidence, answers
    from public.test_quiz_profiles
    where is_active = true
    order by expected_type
  loop
    select * from public.simulate_classification(v_profile.answers) into v_result;

    profile_name      := v_profile.profile_name;
    expected_type     := v_profile.expected_type;
    actual_type       := v_result.primary_type_id;
    expected_min_conf := v_profile.expected_min_confidence;
    actual_conf       := v_result.confidence;
    type_ok           := (v_result.primary_type_id = v_profile.expected_type);
    conf_ok           := (v_result.confidence >= v_profile.expected_min_confidence);
    passed            := type_ok and conf_ok;

    return next;
  end loop;
end;
$$;

comment on function public.run_classifier_tests() is
  'Laeuft alle goldenen Test-Profile durch simulate_classification (Kap. 4.9). '
  'Wird vom Skript scripts/test_classifier.js und manuell in der SQL-Konsole '
  'aufgerufen. Bei FAIL: Algorithmus nicht deployen.';
