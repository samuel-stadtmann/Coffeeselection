-- Favoriten-System: Kunden koennen Coffees und Roester favorisieren.
--
-- Zwei separate Tabellen (customer_favorite_coffees, customer_favorite_roasters)
-- statt einer polymorphen Tabelle — sauberer per FK + RLS, und die zwei
-- Listen unterscheiden sich UI-seitig stark.
--
-- RLS: User darf nur eigene Favoriten lesen/schreiben. Service-Role darf
-- alles (Admin-Auswertung).

------------------------------------------------------------------------
-- customer_favorite_coffees
------------------------------------------------------------------------
create table public.customer_favorite_coffees (
  customer_id  uuid not null references public.customers(id) on delete cascade,
  coffee_id    uuid not null references public.coffees(id)   on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (customer_id, coffee_id)
);

create index customer_favorite_coffees_customer_idx
  on public.customer_favorite_coffees(customer_id, created_at desc);

alter table public.customer_favorite_coffees enable row level security;

drop policy if exists "fav_coffees_self_select" on public.customer_favorite_coffees;
create policy "fav_coffees_self_select"
  on public.customer_favorite_coffees for select
  to authenticated
  using (customer_id = public.current_customer_id());

drop policy if exists "fav_coffees_self_insert" on public.customer_favorite_coffees;
create policy "fav_coffees_self_insert"
  on public.customer_favorite_coffees for insert
  to authenticated
  with check (customer_id = public.current_customer_id());

drop policy if exists "fav_coffees_self_delete" on public.customer_favorite_coffees;
create policy "fav_coffees_self_delete"
  on public.customer_favorite_coffees for delete
  to authenticated
  using (customer_id = public.current_customer_id());

drop policy if exists "fav_coffees_all_service" on public.customer_favorite_coffees;
create policy "fav_coffees_all_service"
  on public.customer_favorite_coffees for all
  to service_role
  using (true) with check (true);

------------------------------------------------------------------------
-- customer_favorite_roasters
------------------------------------------------------------------------
create table public.customer_favorite_roasters (
  customer_id  uuid not null references public.customers(id) on delete cascade,
  roaster_id   uuid not null references public.roasters(id)  on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (customer_id, roaster_id)
);

create index customer_favorite_roasters_customer_idx
  on public.customer_favorite_roasters(customer_id, created_at desc);

alter table public.customer_favorite_roasters enable row level security;

drop policy if exists "fav_roasters_self_select" on public.customer_favorite_roasters;
create policy "fav_roasters_self_select"
  on public.customer_favorite_roasters for select
  to authenticated
  using (customer_id = public.current_customer_id());

drop policy if exists "fav_roasters_self_insert" on public.customer_favorite_roasters;
create policy "fav_roasters_self_insert"
  on public.customer_favorite_roasters for insert
  to authenticated
  with check (customer_id = public.current_customer_id());

drop policy if exists "fav_roasters_self_delete" on public.customer_favorite_roasters;
create policy "fav_roasters_self_delete"
  on public.customer_favorite_roasters for delete
  to authenticated
  using (customer_id = public.current_customer_id());

drop policy if exists "fav_roasters_all_service" on public.customer_favorite_roasters;
create policy "fav_roasters_all_service"
  on public.customer_favorite_roasters for all
  to service_role
  using (true) with check (true);
