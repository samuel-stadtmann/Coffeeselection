-- ============================================================================
-- M5d Followup — get_eligible_coffees korrekt mit customer_allergens verdrahten
--
-- Die existierende 5-Arg-Variante von get_eligible_coffees (von Mattia) hatte
-- das customer_allergens-CTE auf array[]::text[] hardcoded — Allergene wurden
-- effektiv ignoriert. Diese Migration:
--
--   1) droppt das ungenutzte 2-Arg get_eligible_coffees aus 20260510140000
--      (das parallel existierte aber von rank_coffees_for_customer nicht
--       aufgerufen wird — Dead Code).
--   2) ersetzt das 5-Arg get_eligible_coffees durch eine Variante die
--      tatsaechlich aus public.customer_allergens liest.
--   3) Restliche Logik (Cooldown, Stock, Praeferenzen, Preisband-Lockerung)
--      bleibt 1:1 wie zuvor.
--
-- Damit ist Allergen-Hartfilter zum ersten Mal wirklich aktiv.
-- ============================================================================

drop function if exists public.get_eligible_coffees(uuid, text);

create or replace function public.get_eligible_coffees(
  p_customer_id            uuid,
  p_subscription_type      text    default 'discovery',
  p_relax_roaster_cooldown boolean default false,
  p_relax_direct_trade     boolean default false,
  p_relax_price_band       numeric default 1.0
)
returns table (coffee_id uuid, roaster_id uuid)
language sql
stable
as $$
  with
  cust as (
    select
      id,
      requires_decaf,
      requires_organic,
      requires_direct_trade,
      coalesce(max_price_per_250g, 9999) as max_price
    from public.customers where id = p_customer_id
  ),
  cooldown_threshold as (
    select
      coalesce((select value_numeric::int from public.algorithm_config where key = 'cooldown_months_coffee'),  6) as months_coffee,
      coalesce((select value_numeric::int from public.algorithm_config where key = 'cooldown_count_roaster'),  3) as count_roaster
  ),
  recent_orders as (
    select oi.coffee_id, c.roaster_id, o.delivered_at
    from public.order_items oi
    join public.orders   o on o.id = oi.order_id
    join public.coffees  c on c.id = oi.coffee_id
    where o.customer_id = p_customer_id
      and o.delivered_at is not null
    order by o.delivered_at desc
  ),
  coffees_in_cooldown as (
    select coffee_id
    from recent_orders, cooldown_threshold
    where delivered_at > now() - (months_coffee || ' months')::interval
  ),
  roasters_in_cooldown as (
    select distinct roaster_id from (
      select roaster_id, row_number() over (order by delivered_at desc) as rn
      from recent_orders
    ) r, cooldown_threshold
    where r.rn <= count_roaster
  ),
  -- HIER war der Bug: vorher 'array[]::text[]' hardcoded.
  -- Jetzt holen wir die tatsaechlichen Allergene des Kunden.
  customer_allergen_slugs as (
    select coalesce(array_agg(allergen), array[]::text[]) as allergens
    from public.customer_allergens
    where customer_id = p_customer_id
  ),
  quality_threshold as (
    select coalesce((select value_numeric::int from public.algorithm_config where key = 'quality_threshold_active'), 75) as min_score
  )
  select cf.id, cf.roaster_id
  from public.coffees cf
  cross join cust              cp
  cross join quality_threshold qt
  cross join customer_allergen_slugs cas
  where
        cf.status = 'active'
    and cf.deleted_at is null
    and cf.stock_kg >= 0.25
    and (cf.data_quality_score is null or cf.data_quality_score >= qt.min_score)
    and (cf.visible_from  is null or cf.visible_from  <= now())
    and (cf.visible_until is null or cf.visible_until >  now())
    and (cf.price_per_250g is null
         or cf.price_per_250g <= cp.max_price * p_relax_price_band)
    and (cp.requires_decaf = false or cf.is_decaf = true)
    and (cp.requires_organic = false or cf.is_organic = true)
    and (cp.requires_direct_trade = false
         or p_relax_direct_trade = true
         or cf.is_direct_trade = true)
    -- Allergen-Hartfilter: Coffee fliegt raus wenn auch nur ein Allergen-Slug
    -- mit dem Kunden-Profil ueberlappt.
    and not exists (
      select 1 from public.coffee_allergens ca
      where ca.coffee_id = cf.id
        and ca.allergen = any(cas.allergens)
    )
    and cf.id not in (select coffee_id from coffees_in_cooldown)
    and (
      p_subscription_type = 'fix'
      or p_relax_roaster_cooldown = true
      or cf.roaster_id not in (select roaster_id from roasters_in_cooldown)
    );
$$;

comment on function public.get_eligible_coffees(uuid, text, boolean, boolean, numeric) is
  'Playbook 5.2 Hartfilter mit Fallback-Cascade (Cooldowns, Stock, Praeferenzen, Allergene). Wird aus rank_coffees_for_customer aufgerufen.';
