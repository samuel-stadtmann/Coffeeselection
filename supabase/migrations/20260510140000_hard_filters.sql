-- ============================================================================
-- M5d / Playbook 5.2 — Hartfilter-System (get_eligible_coffees)
--
-- Implementiert die Hartfilter aus Playbook 5.2 als idempotente
-- Postgres-Function. Schema andockt an die bereits existierende
-- public.coffee_allergens(coffee_id uuid, allergen text, ...).
--
-- Allergene werden als TEXT-Slugs gefuehrt ('milk','nuts','gluten',...).
-- Der allergens_catalog ist eine optionale Lookup-Tabelle fuer UI-Namen
-- und Uebersetzungen — ohne harte FK auf die anderen Tabellen, damit
-- bestehende Daten nicht migrieren muessen.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0) Aufraeumen: falls eine fruehere fehlgeschlagene Variante dieser Migration
--    customer_allergens mit anderem Schema (allergen_id uuid) angelegt hat,
--    droppen — wir bauen es gleich passend zum coffee_allergens-Pattern neu.
-- ----------------------------------------------------------------------------

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema='public'
      and table_name='customer_allergens'
      and column_name='allergen_id'
  ) then
    raise notice 'Dropping old customer_allergens (allergen_id-style) to recreate with allergen text';
    drop table if exists public.customer_allergens cascade;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 1) Allergens-Catalog (optional, fuer UI-Naming)
-- ----------------------------------------------------------------------------

create table if not exists public.allergens_catalog (
  slug         text primary key,                     -- z.B. 'milk', 'nuts'
  name_de      text not null,
  name_en      text,
  description  text,
  active       boolean not null default true,
  sort_order   smallint not null default 0,
  created_at   timestamptz not null default now()
);

comment on table public.allergens_catalog is
  'Lookup fuer Allergen-Slugs. Nicht via FK referenziert — Inhalte in customer_allergens und coffee_allergens sind TEXT.';

insert into public.allergens_catalog (slug, name_de, name_en, sort_order)
values
  ('milk',     'Milchprodukte',           'Milk',       10),
  ('nuts',     'Nuesse / Erdnuesse',      'Nuts',       20),
  ('gluten',   'Gluten',                  'Gluten',     30),
  ('soy',      'Soja',                    'Soy',        40),
  ('sulfites', 'Sulfite (Konservierung)', 'Sulfites',   50)
on conflict (slug) do nothing;

alter table public.allergens_catalog enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='allergens_catalog'
      and policyname='allergens_catalog_public_select'
  ) then
    create policy "allergens_catalog_public_select"
      on public.allergens_catalog for select
      to anon, authenticated using (active = true);
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 2) customer_allergens — gleiches Schema-Pattern wie coffee_allergens
-- ----------------------------------------------------------------------------

create table if not exists public.customer_allergens (
  customer_id uuid not null references public.customers(id) on delete cascade,
  allergen    text not null,                                                      -- z.B. 'milk', 'nuts'
  severity    text not null default 'avoid'
              check (severity in ('avoid','strict')),
  notes       text,
  created_at  timestamptz not null default now(),
  primary key (customer_id, allergen)
);

create index if not exists customer_allergens_customer_idx
  on public.customer_allergens(customer_id);

alter table public.customer_allergens enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='customer_allergens'
      and policyname='customer_allergens_self'
  ) then
    create policy "customer_allergens_self"
      on public.customer_allergens for all
      to authenticated
      using (customer_id = public.current_customer_id())
      with check (customer_id = public.current_customer_id());
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='customer_allergens'
      and policyname='customer_allergens_service'
  ) then
    create policy "customer_allergens_service"
      on public.customer_allergens for all
      to service_role using (true) with check (true);
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 3) Customer-Praeferenzen erweitern
-- ----------------------------------------------------------------------------

alter table public.customers
  add column if not exists requires_decaf        boolean       not null default false,
  add column if not exists requires_organic      boolean       not null default false,
  add column if not exists requires_direct_trade boolean       not null default false,
  add column if not exists max_price_per_250g    numeric(10,2);

do $$ begin
  if not exists (
    select 1 from information_schema.constraint_column_usage
    where table_name='customers' and column_name='max_price_per_250g'
      and constraint_name='customers_max_price_chk'
  ) then
    alter table public.customers
      add constraint customers_max_price_chk
      check (max_price_per_250g is null or max_price_per_250g > 0);
  end if;
end $$;

comment on column public.customers.requires_decaf is
  'Hartfilter: nur entkoffeinierte Kaffees empfehlen.';
comment on column public.customers.requires_organic is
  'Hartfilter: nur Coffees mit Bio-Zertifizierung empfehlen.';
comment on column public.customers.requires_direct_trade is
  'Hartfilter: nur Coffees mit Direct-Trade-Zertifizierung empfehlen.';
comment on column public.customers.max_price_per_250g is
  'Hartfilter: Preis pro 250g normalisiert. NULL = kein Limit.';

-- ----------------------------------------------------------------------------
-- 4) get_eligible_coffees-Function
-- ----------------------------------------------------------------------------

create or replace function public.get_eligible_coffees(
  p_customer_id       uuid,
  p_subscription_type text default 'fix'        -- 'fix' | 'discovery'
)
returns table (
  coffee_id  uuid,
  roaster_id uuid
)
language sql
stable
security definer
as $$
  with
  prefs as (
    select
      id,
      coalesce(requires_decaf,        false) as requires_decaf,
      coalesce(requires_organic,      false) as requires_organic,
      coalesce(requires_direct_trade, false) as requires_direct_trade,
      max_price_per_250g
    from public.customers
    where id = p_customer_id
  ),
  customer_allergen_slugs as (
    select coalesce(array_agg(allergen), array[]::text[]) as slugs
    from public.customer_allergens
    where customer_id = p_customer_id
  ),
  -- Letzte 6 Lieferungen (Cooldown identisch)
  recent_deliveries as (
    select
      oi.coffee_id,
      cf.roaster_id,
      o.delivered_at
    from public.order_items oi
    join public.orders   o  on o.id  = oi.order_id
    join public.coffees  cf on cf.id = oi.coffee_id
    where o.customer_id  = p_customer_id
      and o.delivered_at is not null
      and o.delivered_at > now() - interval '6 months'
    order by o.delivered_at desc
    limit 6
  ),
  -- Letzte 3 Lieferungen fuer Roester-Cooldown
  recent_roasters as (
    select distinct roaster_id
    from (
      select roaster_id, delivered_at
      from recent_deliveries
      order by delivered_at desc
      limit 3
    ) t
  ),
  organic_cert_ids as (
    select id from public.certifications_catalog
    where slug in ('bio_suisse','bio-suisse','eu_organic','eu-bio','usda_organic','usda-organic','organic')
  ),
  direct_trade_cert_ids as (
    select id from public.certifications_catalog
    where slug in ('direct_trade','direct-trade','direct_relationship')
  )
  select
    cf.id         as coffee_id,
    cf.roaster_id as roaster_id
  from public.coffees cf
  cross join prefs                       p
  cross join customer_allergen_slugs     ca
  where
    -- 1) Status + nicht geloescht
    cf.status = 'active'
    and cf.deleted_at is null
    -- 2) Lagerbestand
    and cf.stock_status in ('in_stock','low_stock')
    -- 3) Preis pro 250g unter Budget (nur wenn Budget gesetzt)
    and (
      p.max_price_per_250g is null
      or (cf.price_chf * 250.0 / nullif(cf.weight_g, 0)) <= p.max_price_per_250g
    )
    -- 4) Decaf-Anforderung
    and (p.requires_decaf = false or cf.is_decaf = true)
    -- 5) Bio-Anforderung
    and (
      p.requires_organic = false
      or exists (
        select 1 from public.coffee_certifications cc
        where cc.coffee_id = cf.id
          and cc.certification_id in (select id from organic_cert_ids)
      )
    )
    -- 6) Direct-Trade-Anforderung
    and (
      p.requires_direct_trade = false
      or exists (
        select 1 from public.coffee_certifications cc
        where cc.coffee_id = cf.id
          and cc.certification_id in (select id from direct_trade_cert_ids)
      )
    )
    -- 7) Allergen-Ueberschneidung
    and not exists (
      select 1 from public.coffee_allergens ca2
      where ca2.coffee_id = cf.id
        and ca2.allergen = any(ca.slugs)
    )
    -- 8) Cooldown identisch
    and not exists (
      select 1 from recent_deliveries rd where rd.coffee_id = cf.id
    )
    -- 9) Roester-Cooldown nur fuer Discovery-Abo
    and (
      p_subscription_type <> 'discovery'
      or not exists (
        select 1 from recent_roasters rr where rr.roaster_id = cf.roaster_id
      )
    );
$$;

comment on function public.get_eligible_coffees(uuid, text) is
  'Playbook 5.2: liefert Coffees die alle Hartfilter (Stock, Allergene, Praeferenzen, Cooldowns, Budget) bestehen.';

grant execute on function public.get_eligible_coffees(uuid, text) to authenticated, service_role;
