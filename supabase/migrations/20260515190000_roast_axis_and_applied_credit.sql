-- C3: roast_level als 6. Achse im Match-Algorithmus
-- Plus C1: applied_credit_chf auf orders
--
-- Korrektur zur ersten Version: taste_types.roast_level existiert
-- bereits als SMALLINT (1-5), nicht als text. Deshalb Seed mit
-- Integer-Werten statt Text-Strings.

------------------------------------------------------------------------
-- C3: taste_types.roast_level — Seed (Spalte existiert bereits als smallint)
------------------------------------------------------------------------
-- Mapping: 1=light, 2=medium_light, 3=medium, 4=medium_dark, 5=dark.
update public.taste_types set roast_level = case slug
  when 'der-klassiker'           then 3   -- medium
  when 'der-fruchtfreund'        then 2   -- medium_light
  when 'der-espresso-enthusiast' then 5   -- dark
  when 'der-entdecker'           then 3   -- medium
  when 'der-sanfte'              then 2   -- medium_light
  when 'der-florale'             then 1   -- light
  when 'der-erdige'              then 5   -- dark
  when 'der-vollmundige'         then 4   -- medium_dark
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
