-- =============================================================================
-- E2E-Test fuer rank_coffees_for_customer()  (NICHT als Migration einspielen!)
-- =============================================================================
-- Dieses Script:
--   1. Legt 8 Test-Kunden an (je einer pro Geschmackstyp)
--   2. Setzt taste_type_id + Confidence direkt (ohne Quiz-Durchlauf)
--   3. Ruft rank_coffees_for_customer() fuer jeden Kunden auf
--   4. Erwartet: Der "passende" Demo-Kaffee landet in den Top 3
--
-- Hinweis: Embeddings werden nicht generiert -> Cold-Start-Fallback im Ranking
-- (vector_weight wird auf scoring umverteilt, Schritt 9.7 / Kap. 5.6).
-- Damit testen wir hier reines Scoring + Filter.
--
-- Im SQL Editor komplett markieren und ausfuehren.
-- =============================================================================


-- =============================================================================
-- 1) Test-Auth-User + Test-Kunden anlegen
-- =============================================================================
-- Wir muessen erst auth.users-Zeilen anlegen, weil customers.auth_user_id FK ist.
-- Im echten Flow uebernimmt das Supabase Auth.

do $e2e$
declare
  v_taste_type_id smallint;
  v_auth_uid uuid;
  v_customer_id uuid;
  v_email text;
begin
  for v_taste_type_id in 1..8 loop
    v_email := 'test-type-' || v_taste_type_id || '@coffeeselection.test';
    v_auth_uid := ('aaaaaaaa-bbbb-cccc-dddd-' || lpad(v_taste_type_id::text, 12, '0'))::uuid;

    -- 1a) Auth-User
    insert into auth.users (
      id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data
    )
    values (
      v_auth_uid, 'authenticated', 'authenticated', v_email,
      'dummy_password_not_real', now(), now(), now(),
      '{"provider":"test"}'::jsonb, '{}'::jsonb
    )
    on conflict (id) do nothing;

    -- 1b) Customer
    insert into public.customers (
      auth_user_id, email, first_name, last_name,
      taste_type_id, secondary_type, confidence,
      requires_decaf, requires_organic, requires_direct_trade,
      max_price_per_250g
    )
    values (
      v_auth_uid, v_email,
      'Test',
      (select name_internal from public.taste_types where id = v_taste_type_id),
      v_taste_type_id,
      ((v_taste_type_id % 8) + 1)::smallint,  -- naechster Typ als Sekundaer
      0.85,
      false, false, false,
      100.00
    )
    on conflict (email) do nothing;
  end loop;
end $e2e$;


-- =============================================================================
-- 2) Test pro Kunde: rank_coffees_for_customer() aufrufen
-- =============================================================================
-- Wir holen die Top-1-Empfehlung pro Test-Kunden und vergleichen den
-- Kaffee-Slug mit dem Erwartungswert.

with expected as (
  select 1 as taste_type_id, 'demo-brasil-cerrado-klassiker'           as expected_slug, 'Klassiker'           as label union all
  select 2,                  'demo-ethiopia-yirgacheffe-fruchtfreund',                'Fruchtfreund'        union all
  select 3,                  'demo-brasil-mogiana-espresso',                          'Espresso-Enthusiast' union all
  select 4,                  'demo-panama-geisha-entdecker',                          'Entdecker'           union all
  select 5,                  'demo-colombia-huila-sanfte',                            'Sanfte'              union all
  select 6,                  'demo-rwanda-nyamasheke-florale',                        'Florale'             union all
  select 7,                  'demo-sumatra-mandheling-erdige',                        'Erdige'              union all
  select 8,                  'demo-guatemala-antigua-suesse',                         'Suesse'
),
test_customers as (
  select c.id, c.taste_type_id, e.expected_slug, e.label
  from public.customers c
  join expected e on e.taste_type_id = c.taste_type_id
  where c.email like 'test-type-%@coffeeselection.test'
),
top1 as (
  select
    tc.taste_type_id,
    tc.label,
    tc.expected_slug,
    (
      select cf.slug
      from public.rank_coffees_for_customer(
        p_customer_id      := tc.id,
        p_subscription_type := 'discovery',
        p_limit            := 1,
        p_save_snapshot    := false
      ) r
      join public.coffees cf on cf.id = r.coffee_id
      order by r.rank
      limit 1
    ) as actual_slug,
    (
      select r.final_score
      from public.rank_coffees_for_customer(
        p_customer_id      := tc.id,
        p_subscription_type := 'discovery',
        p_limit            := 1,
        p_save_snapshot    := false
      ) r
      order by r.rank
      limit 1
    ) as final_score
  from test_customers tc
)
select
  taste_type_id,
  label,
  expected_slug,
  actual_slug,
  case when actual_slug = expected_slug then 'PASS' else 'FAIL' end as result,
  final_score
from top1
order by taste_type_id;


-- =============================================================================
-- 3) Top-3-Ranking fuer Klassiker-Kunde (zur Inspektion)
-- =============================================================================
select
  r.rank,
  cf.slug,
  cf.name,
  r.scoring_score,
  r.vector_similarity,
  r.diversity_bonus,
  r.final_score
from public.rank_coffees_for_customer(
  p_customer_id      := (
    select id from public.customers where email = 'test-type-1@coffeeselection.test'
  ),
  p_subscription_type := 'discovery',
  p_limit            := 3,
  p_save_snapshot    := false
) r
join public.coffees cf on cf.id = r.coffee_id
order by r.rank;


-- =============================================================================
-- 4) Optional: Test-Kunden wieder loeschen
-- =============================================================================
-- Auskommentiert lassen, wenn du sie behalten willst.
--
-- delete from public.customers where email like 'test-type-%@coffeeselection.test';
-- delete from auth.users where email like 'test-type-%@coffeeselection.test';
