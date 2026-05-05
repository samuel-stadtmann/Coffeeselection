-- =============================================================================
-- Migration 015 — Fix run_classifier_tests() (Hotfix)
-- =============================================================================
-- Bug: Spaltennamen der RETURNS TABLE-Definition kollidieren mit Spaltennamen
-- in public.test_quiz_profiles ("profile_name", "expected_type", ...). PL/pgSQL
-- weiss nicht, ob "profile_name" im SELECT die OUT-Variable oder die
-- Tabellenspalte meint -> Fehler 42702 "column reference is ambiguous".
--
-- Fix: Tabellen-Alias setzen und alle Tabellenspalten qualifizieren.
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
    select t.profile_name           as p_name,
           t.expected_type          as p_expected_type,
           t.expected_min_confidence as p_min_conf,
           t.answers                as p_answers
    from public.test_quiz_profiles t
    where t.is_active = true
    order by t.expected_type
  loop
    select * from public.simulate_classification(v_profile.p_answers) into v_result;

    profile_name      := v_profile.p_name;
    expected_type     := v_profile.p_expected_type;
    actual_type       := v_result.primary_type_id;
    expected_min_conf := v_profile.p_min_conf;
    actual_conf       := v_result.confidence;
    type_ok           := (v_result.primary_type_id = v_profile.p_expected_type);
    conf_ok           := (v_result.confidence >= v_profile.p_min_conf);
    passed            := type_ok and conf_ok;

    return next;
  end loop;
end;
$$;

comment on function public.run_classifier_tests() is
  'Laeuft alle goldenen Test-Profile durch simulate_classification (Kap. 4.9). '
  'Bei FAIL: Algorithmus nicht deployen.';
