-- ============================================================================
-- Migration: roaster_users join table fuer P13/P15 Phase 1 (Roaster Portal)
-- Datum: 2026-05-11
--
-- Verknuepft auth.users mit einem oder mehreren Roestereien. Damit kann sich
-- ein Roester einloggen und (a) seine eigenen Coffees sehen + bearbeiten,
-- (b) neue Coffees als Entwurf einreichen.
--
-- Accounts werden initial NICHT durch Self-Signup angelegt — der Admin legt
-- den Roester-User-Eintrag in /admin/roasters/[id]/users an, Supabase schickt
-- eine Set-Password-Mail (Invite-Flow), und der Roester loggt sich ueber
-- /roaster/login ein.
--
-- Rolle:
--   'owner'  - kann andere Roester-Users einladen + alle Coffees verwalten.
--   'editor' - kann nur Coffees verwalten, keine Users einladen.
-- ============================================================================

create table if not exists public.roaster_users (
  user_id     uuid not null references auth.users(id) on delete cascade,
  roaster_id  uuid not null references public.roasters(id) on delete cascade,
  role        text not null default 'editor' check (role in ('owner', 'editor')),
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id) on delete set null,

  primary key (user_id, roaster_id)
);

comment on table public.roaster_users is
  'Verknuepfung auth.users <-> roasters fuer den Roaster-Self-Service-Bereich.';
comment on column public.roaster_users.role is
  '''owner'' kann Co-Users einladen, ''editor'' nur Coffees verwalten.';
comment on column public.roaster_users.created_by is
  'Welcher Admin/Owner hat den Eintrag angelegt (Audit).';

-- Index fuer den haeufigen Lookup "alle Roester von User X"
create index if not exists roaster_users_user_id_idx
  on public.roaster_users(user_id);

-- Index fuer "alle User von Roester Y" (Admin-User-Listing)
create index if not exists roaster_users_roaster_id_idx
  on public.roaster_users(roaster_id);

-- ----------------------------------------------------------------------------
-- Hilfsfunktion: ist ein User Roester-User irgendeiner Rolle?
-- Wird vom Auth-Wall im /roaster-Layout via SQL aufgerufen.
-- ----------------------------------------------------------------------------
create or replace function public.is_roaster_user(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.roaster_users where user_id = p_user_id
  );
$$;

comment on function public.is_roaster_user(uuid) is
  'Returnt true wenn der User mindestens einer Roesterei zugeordnet ist.';

-- ----------------------------------------------------------------------------
-- Hilfsfunktion: liefert alle roaster_ids des aktuellen Users.
-- Wird in RLS-Policies fuer coffees / coffee_allergens / coffee_certifications
-- verwendet.
-- ----------------------------------------------------------------------------
create or replace function public.current_user_roaster_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select roaster_id from public.roaster_users where user_id = auth.uid();
$$;

comment on function public.current_user_roaster_ids() is
  'Liefert alle roaster_ids zu denen der aktuelle eingeloggte User gehoert.';

-- ----------------------------------------------------------------------------
-- RLS auf roaster_users selbst:
--   - User darf seine eigenen Eintraege sehen (damit /roaster die richtige
--     Roesterei laden kann).
--   - Service-Role umgeht RLS ohnehin (fuer Admin-Aktionen).
-- ----------------------------------------------------------------------------
alter table public.roaster_users enable row level security;

drop policy if exists roaster_users_self_select on public.roaster_users;
create policy roaster_users_self_select
  on public.roaster_users
  for select
  to authenticated
  using (user_id = auth.uid());

-- INSERT/UPDATE/DELETE bleibt der Service-Role vorbehalten (Admin-API).
-- Roester-User koennen also keine Co-Users selbst hinzufuegen. Wenn das
-- spaeter gewuenscht ist, fuegen wir eine Policy nur fuer role='owner' hinzu.

-- ----------------------------------------------------------------------------
-- Coffees: Roester sieht/editiert nur eigene Coffees (RLS).
-- Achtung: bestehende SELECT-Policy fuer Public bleibt unbenommen — die
-- service_role-Pfade (Admin, RPC) auch.
--
-- Hier fuegen wir nur ZUSAETZLICHE Policies fuer den authenticated-Rollen-Pfad
-- des Roesters hinzu. Andere authenticated-User (Kunden) haben keinen
-- INSERT/UPDATE-Zugriff (existierende Policies blocken das).
-- ----------------------------------------------------------------------------
drop policy if exists coffees_roaster_select_own on public.coffees;
create policy coffees_roaster_select_own
  on public.coffees
  for select
  to authenticated
  using (roaster_id in (select public.current_user_roaster_ids()));

drop policy if exists coffees_roaster_insert_own on public.coffees;
create policy coffees_roaster_insert_own
  on public.coffees
  for insert
  to authenticated
  with check (
    roaster_id in (select public.current_user_roaster_ids())
    and status = 'draft' -- Roester duerfen nur Entwuerfe einreichen
  );

drop policy if exists coffees_roaster_update_own on public.coffees;
create policy coffees_roaster_update_own
  on public.coffees
  for update
  to authenticated
  using (roaster_id in (select public.current_user_roaster_ids()))
  with check (
    roaster_id in (select public.current_user_roaster_ids())
    -- Roester duerfen Status NICHT auf 'active' setzen (das macht Admin).
    -- Sie koennen aber 'draft' lassen oder zurueck auf 'draft' setzen.
    and status in ('draft', 'paused')
  );

-- DELETE bewusst NICHT erlaubt — Roester koennen Coffees nur archivieren
-- (status='discontinued' wuerde aktuell von der UPDATE-Policy oben geblockt,
-- das ist gewollt: Auslauf ist eine Admin-Entscheidung).
