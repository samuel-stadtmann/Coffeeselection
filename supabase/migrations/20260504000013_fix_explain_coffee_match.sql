-- =============================================================================
-- Migration 023 — Fix explain_coffee_match: jsonb -> text[] Cast
-- =============================================================================
-- Gleicher Bug wie in compute_scoring_score (Migration 021):
-- (p_target -> 'aroma_families')::jsonb::text[] ist ungueltig.
-- Fix: jsonb_array_elements_text() + array_agg().
-- =============================================================================

create or replace function public.explain_coffee_match(
  p_target            jsonb,
  p_coffee_id         uuid,
  p_scoring_score     numeric,
  p_vector_similarity numeric
)
returns jsonb
language plpgsql
stable
as $$
declare
  c               record;
  v_target_aromas text[];
begin
  select acidity, body, sweetness, bitterness, roast_level, complexity, aroma_families,
         is_decaf, is_organic, is_direct_trade
    into c
    from public.coffees where id = p_coffee_id;

  -- jsonb-Array -> text[]
  select coalesce(array_agg(v), '{}')
    into v_target_aromas
    from jsonb_array_elements_text(
      coalesce(p_target -> 'aroma_families', '[]'::jsonb)
    ) as t(v);

  return jsonb_build_object(
    'aroma_overlap',    public.aroma_overlap_score(v_target_aromas, coalesce(c.aroma_families, '{}')),
    'matched_aromas',   (
      select jsonb_agg(elem)
      from unnest(v_target_aromas) elem
      where elem = any(coalesce(c.aroma_families, '{}'))
    ),
    'roast_match',      public.distance_score((p_target ->> 'roast_level')::int, c.roast_level),
    'acidity_match',    public.distance_score((p_target ->> 'acidity')::int,     c.acidity),
    'body_match',       public.distance_score((p_target ->> 'body')::int,        c.body),
    'sweetness_match',  public.distance_score((p_target ->> 'sweetness')::int,   c.sweetness),
    'bitterness_match', public.distance_score((p_target ->> 'bitterness')::int,  c.bitterness),
    'complexity_match', public.distance_score((p_target ->> 'complexity')::int,  c.complexity),
    'scoring_score',    p_scoring_score,
    'vector_similarity', p_vector_similarity,
    'is_decaf',         c.is_decaf,
    'is_organic',       c.is_organic,
    'is_direct_trade',  c.is_direct_trade
  );
end;
$$;
