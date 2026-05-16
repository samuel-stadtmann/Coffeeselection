-- C3: roast_level als 6. Achse im Match-Algorithmus
-- Plus C1: applied_credit_chf auf orders, damit der Webhook das angewandte
-- Customer-Credit-Balance sauber als customer_credits-Negativ-Eintrag buchen
-- kann (separat vom promo_code-Discount).

------------------------------------------------------------------------
-- C3: taste_types.roast_level
------------------------------------------------------------------------
alter table public.taste_types
  add column if not exists roast_level text
  check (roast_level is null or roast_level in
         ('light','medium_light','medium','medium_dark','dark'));

comment on column public.taste_types.roast_level is
  'Bevorzugtes Roesterprofil dieses Typs. Wird als 6. Achse in der '
  'Match-Distanz mitgerechnet — Mapping text->numeric in '
  'lib/db/recommendations.ts.';

-- Seed: opinionated Defaults pro Typ. Werte basieren auf Typ-Charakter
-- (Saeure/Koerper/Komplexitaet) — koennen vom Marketing manuell
-- angepasst werden, der Algorithmus respektiert dann den neuen Wert.
update public.taste_types set roast_level = case slug
  when 'der-klassiker'           then 'medium'        -- ausgewogen
  when 'der-fruchtfreund'        then 'medium_light'  -- hell, fruchtig
  when 'der-espresso-enthusiast' then 'dark'          -- kraeftig, Espresso
  when 'der-entdecker'           then 'medium'        -- vielfaeltig
  when 'der-sanfte'              then 'medium_light'  -- mild
  when 'der-florale'             then 'light'         -- blumig, hell
  when 'der-erdige'              then 'dark'          -- erdig, intensiv
  when 'der-vollmundige'         then 'medium_dark'   -- voll, schokoladig
  else roast_level
end
where roast_level is null;

------------------------------------------------------------------------
-- C1: orders.applied_credit_chf
------------------------------------------------------------------------
alter table public.orders
  add column if not exists applied_credit_chf numeric(10,2)
  not null default 0
  check (applied_credit_chf >= 0);

comment on column public.orders.applied_credit_chf is
  'Anteil des discount_chf, der aus dem customer_credit_balance kommt '
  '(NICHT aus promo_code/campaign). Webhook bucht das nach Payment-Success '
  'als customer_credits-Negativ-Eintrag mit reason=order_redemption.';
