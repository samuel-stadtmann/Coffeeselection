-- ============================================================================
-- Playbook 8.4 Massnahme 3 — Coffee-Verifikation
--
-- Erlaubt es Samuel/Mattia (Admins) einen Coffee als "haben wir selber
-- verkostet und das Profil stimmt" zu markieren. Verifizierte Coffees
-- bekommen +2 auf den data_quality_score (laut Playbook). Der
-- Hartfilter `quality_threshold_active` (Default 75) profitiert davon —
-- ein knapp-unter-Schwelle-Coffee kann durch Verifikation eligible werden.
--
-- Idempotent: die Spalten kommen IF NOT EXISTS, der Trigger kann beliebig
-- oft re-erstellt werden.
-- ============================================================================

alter table public.coffees
  add column if not exists data_verified_at timestamptz,
  add column if not exists data_verified_by uuid references auth.users(id) on delete set null;

comment on column public.coffees.data_verified_at is
  'Wann wurde dieser Coffee von einem Admin/QS-Team verkostet + bestaetigt?';
comment on column public.coffees.data_verified_by is
  'Welcher Admin (auth.users.id) hat verifiziert?';

-- ----------------------------------------------------------------------------
-- Trigger: data_quality_score bekommt +2 wenn verifiziert wird,
--          -2 wenn unverifiziert wird. Cap zwischen 0 und 100.
-- ----------------------------------------------------------------------------

create or replace function public.coffees_verification_quality_bonus()
returns trigger
language plpgsql
as $$
declare
  v_old_verified boolean := (old.data_verified_at is not null);
  v_new_verified boolean := (new.data_verified_at is not null);
  v_delta        int     := 0;
begin
  if v_new_verified and not v_old_verified then
    v_delta := 2;     -- frisch verifiziert
  elsif v_old_verified and not v_new_verified then
    v_delta := -2;    -- Verifikation entzogen
  end if;

  if v_delta <> 0 then
    new.data_quality_score := greatest(0, least(100,
      coalesce(new.data_quality_score, 75) + v_delta
    ));
  end if;

  return new;
end $$;

drop trigger if exists trg_coffees_verification_bonus on public.coffees;
create trigger trg_coffees_verification_bonus
  before update of data_verified_at on public.coffees
  for each row
  execute function public.coffees_verification_quality_bonus();

comment on function public.coffees_verification_quality_bonus() is
  'Playbook 8.4: +2 data_quality_score bei Verifikation, -2 bei Entzug.';
