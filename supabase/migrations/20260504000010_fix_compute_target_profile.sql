-- =============================================================================
-- Migration 020 — Fix compute_target_profile: unassigned v_secondary record
-- =============================================================================
-- Bug: v_secondary wird nur bedingt via SELECT INTO befuellt (wenn
-- v_mix_secondary > 0). Aber der nachfolgende jsonb_build_object greift
-- trotzdem auf v_secondary.acidity etc. zu -> PG-Fehler 55000
-- "record is not assigned yet".
--
-- Fix: Sekundaerwerte vorab auf 0 initialisieren und separat befuellen.
-- =============================================================================

create or replace function public.compute_target_profile(
  p_primary_id   smallint,
  p_secondary_id smallint,
  p_confidence   numeric
)
returns jsonb
language plpgsql
stable
as $$
declare
  v_mix_secondary  numeric;
  v_primary        record;
  v_secondary      record;
  v_has_secondary  boolean := false;

  -- Sekundaer-Beitraege vorab auf 0 — so muss der Return-Block nie pruefen
  -- ob v_secondary befuellt ist.
  v_sec_acidity    numeric := 0;
  v_sec_body       numeric := 0;
  v_sec_sweetness  numeric := 0;
  v_sec_bitterness numeric := 0;
  v_sec_roast      numeric := 0;
  v_sec_complexity numeric := 0;
  v_aroma_union    text[];
begin
  -- Misch-Verhaeltnis aus Confidence-Band (Kap. 4.6 / 5.4)
  v_mix_secondary := case
    when p_confidence is null then 0.30
    when p_confidence >= 0.85 then 0.00   -- 100/0
    when p_confidence >= 0.65 then 0.15   -- 85/15
    when p_confidence >= 0.45 then 0.30   -- 70/30
    else                           0.40   -- 60/40
  end;

  select * into v_primary from public.taste_types where id = p_primary_id;

  -- Sekundaertyp nur laden wenn Mischung gewuenscht und ID vorhanden
  if v_mix_secondary > 0 and p_secondary_id is not null then
    select * into v_secondary from public.taste_types where id = p_secondary_id;
    if found then
      v_has_secondary  := true;
      v_sec_acidity    := v_mix_secondary * v_secondary.acidity;
      v_sec_body       := v_mix_secondary * v_secondary.body;
      v_sec_sweetness  := v_mix_secondary * v_secondary.sweetness;
      v_sec_bitterness := v_mix_secondary * v_secondary.bitterness;
      v_sec_roast      := v_mix_secondary * v_secondary.roast_level;
      v_sec_complexity := v_mix_secondary * v_secondary.complexity;
    else
      -- Sekundaertyp nicht gefunden -> 100% Primaer
      v_mix_secondary := 0;
    end if;
  end if;

  -- Aroma-Familien: Vereinigung beider Sets bei Mischprofil
  if v_has_secondary then
    v_aroma_union := array(
      select distinct unnest(v_primary.aroma_families || v_secondary.aroma_families)
    );
  else
    v_aroma_union := v_primary.aroma_families;
  end if;

  return jsonb_build_object(
    'acidity',        round((1 - v_mix_secondary) * v_primary.acidity     + v_sec_acidity),
    'body',           round((1 - v_mix_secondary) * v_primary.body        + v_sec_body),
    'sweetness',      round((1 - v_mix_secondary) * v_primary.sweetness   + v_sec_sweetness),
    'bitterness',     round((1 - v_mix_secondary) * v_primary.bitterness  + v_sec_bitterness),
    'roast_level',    round((1 - v_mix_secondary) * v_primary.roast_level + v_sec_roast),
    'complexity',     round((1 - v_mix_secondary) * v_primary.complexity  + v_sec_complexity),
    'aroma_families', v_aroma_union,
    'mix_secondary',  v_mix_secondary,
    'primary_id',     p_primary_id,
    'secondary_id',   p_secondary_id
  );
end;
$$;
