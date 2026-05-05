-- =============================================================================
-- Migration 021 — Fix compute_scoring_score: jsonb -> text[] Cast
-- =============================================================================
-- Bug: (p_target -> 'aroma_families')::jsonb::text[] wirft 42846
-- "cannot cast type jsonb to text[]".
-- Fix: jsonb_array_elements_text() verwenden.
-- =============================================================================

create or replace function public.compute_scoring_score(p_target jsonb, p_coffee_id uuid)
returns numeric
language plpgsql
stable
as $$
declare
  c              record;
  s_aroma        numeric;
  s_acidity      numeric;
  s_body         numeric;
  s_sweetness    numeric;
  s_bitterness   numeric;
  s_roast        numeric;
  s_complexity   numeric;
  v_target_aromas text[];
  v_total        numeric;
begin
  select acidity, body, sweetness, bitterness, roast_level, complexity, aroma_families
    into c
    from public.coffees
    where id = p_coffee_id;

  if not found then
    return 0;
  end if;

  -- jsonb-Array -> text[] (kein direkter Cast moeglich, jsonb_array_elements_text noetig)
  select coalesce(array_agg(v), '{}')
    into v_target_aromas
    from jsonb_array_elements_text(
      coalesce(p_target -> 'aroma_families', '[]'::jsonb)
    ) as t(v);

  s_aroma      := public.aroma_overlap_score(v_target_aromas, coalesce(c.aroma_families, '{}'));
  s_acidity    := coalesce(public.distance_score((p_target ->> 'acidity')::int,    c.acidity),    0);
  s_body       := coalesce(public.distance_score((p_target ->> 'body')::int,       c.body),       0);
  s_sweetness  := coalesce(public.distance_score((p_target ->> 'sweetness')::int,  c.sweetness),  0);
  s_bitterness := coalesce(public.distance_score((p_target ->> 'bitterness')::int, c.bitterness), 0);
  s_roast      := coalesce(public.distance_score((p_target ->> 'roast_level')::int, c.roast_level), 0);
  s_complexity := coalesce(public.distance_score((p_target ->> 'complexity')::int, c.complexity), 0);

  v_total :=
      0.25 * s_aroma
    + 0.20 * s_acidity
    + 0.15 * s_roast
    + 0.12 * s_body
    + 0.10 * s_sweetness
    + 0.10 * s_bitterness
    + 0.08 * s_complexity;

  return round(v_total, 2);
end;
$$;
