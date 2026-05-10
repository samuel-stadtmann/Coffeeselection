-- ============================================================================
-- P2 — coffees.roast_level Daten-Hygiene
--
-- Ist-Stand (16 aktive Coffees):
--   '1' = 4, '2' = 2, '3' = 6, '4' = 4
-- Soll-Stand (Schema-Definition aus 20260430120300_coffees.sql):
--   roast_level text NOT NULL
--     CHECK (roast_level IN ('light','medium_light','medium','medium_dark','dark'))
--
-- Mapping (Standard-Roesteinheiten 1-5 -> SCA-Enum):
--   1 -> light
--   2 -> medium_light
--   3 -> medium
--   4 -> medium_dark
--   5 -> dark
--
-- Wichtig: nach dieser Migration EINMAL `npx tsx scripts/backfill-coffee-embeddings.ts`
-- ausfuehren, damit der Embedding-Text in coffees.flavor_embedding den lesbaren
-- Roestgrad enthaelt ("Roestgrad: light") statt der Zahl ("Roestgrad: 1").
-- ============================================================================

-- 1) Bestehende Constraint(s) auf roast_level entfernen — defensiv: koennte
--    aus der ursprung-Migration noch herumlungern oder via Dashboard geaendert
--    worden sein. Wir kennen den Namen nicht sicher.
do $$
declare
  v_conname text;
begin
  for v_conname in
    select c.conname
    from pg_constraint c
    join pg_class cl on cl.oid = c.conrelid
    join pg_namespace n on n.oid = cl.relnamespace
    where n.nspname = 'public'
      and cl.relname = 'coffees'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%roast_level%'
  loop
    execute format('alter table public.coffees drop constraint %I', v_conname);
  end loop;
end $$;

-- 2) Numerische String-Werte auf Enum mappen.
--    Jeder UPDATE hat WHERE — safeupdate-kompatibel.
update public.coffees set roast_level = 'light'        where roast_level = '1';
update public.coffees set roast_level = 'medium_light' where roast_level = '2';
update public.coffees set roast_level = 'medium'       where roast_level = '3';
update public.coffees set roast_level = 'medium_dark'  where roast_level = '4';
update public.coffees set roast_level = 'dark'         where roast_level = '5';

-- 3) Defensive: alles was nicht im Enum landet (Tippfehler, Whitespace) auf
--    'medium' setzen. Wir wollen nichts blockieren — der Re-Add der Constraint
--    weiter unten wuerde sonst scheitern.
update public.coffees
set roast_level = 'medium'
where roast_level not in ('light','medium_light','medium','medium_dark','dark');

-- 4) CHECK-Constraint wieder einsetzen mit dem dokumentierten Namen.
alter table public.coffees
  add constraint coffees_roast_level_check
  check (roast_level in ('light','medium_light','medium','medium_dark','dark'));
