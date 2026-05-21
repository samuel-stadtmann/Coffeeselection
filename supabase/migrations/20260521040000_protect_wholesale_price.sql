-- ============================================================================
-- Audit P43: wholesale_price_chf (Einkaufspreis) gegen Lesezugriff absichern
-- ============================================================================
-- Problem: wholesale_price_chf ist als "vertraulich" dokumentiert, aber NICHT
-- erzwungen. RLS ist row-level, nicht column-level — die Tabellen-Grants geben
-- allen Spalten frei:
--   * public.coffees     — SELECT-Policy "coffees_read_visible" fuer
--                          anon + authenticated → jeder Besucher koennte per
--                          Supabase-Client `select wholesale_price_chf` ueber
--                          alle aktiven Coffees abfragen.
--   * public.order_items — SELECT-Policy "order_items_self_select" fuer
--                          authenticated → Kunde koennte den Einkaufspreis
--                          seiner eigenen Positionen lesen.
--
-- Fix: Column-Level-Grants. Tabellen-SELECT fuer anon/authenticated entziehen,
-- dann ALLE Spalten AUSSER wholesale_price_chf explizit zurueckgeben. Dynamisch
-- ueber information_schema, damit die Liste zum aktuellen Schema passt.
--
-- Unberuehrt:
--   * service_role  — Admin-Pages, Roaster-Portal (liest/schreibt wholesale
--                     ausschliesslich via Service-Client) und RPCs.
--   * RLS-Policies  — Row-Filter bleiben wie sie sind; Grants steuern nur,
--                     welche Spalten die Rollen ueberhaupt sehen.
--
-- WICHTIG fuer kuenftige Migrationen: neue Spalten auf diesen Tabellen sind
-- fuer anon/authenticated NICHT automatisch lesbar (Allow-List) — pro neuer
-- Spalte ein `grant select (<spalte>) on <tabelle> to ...` ergaenzen.
-- ============================================================================

do $$
declare
  cols text;
begin
  -- public.coffees → anon + authenticated (oeffentlicher Katalog)
  select string_agg(format('%I', column_name), ', ')
    into cols
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'coffees'
    and column_name <> 'wholesale_price_chf';

  revoke select on public.coffees from anon, authenticated;
  execute format('grant select (%s) on public.coffees to anon, authenticated', cols);

  -- public.order_items → nur authenticated (anon hat ohnehin keine Policy)
  select string_agg(format('%I', column_name), ', ')
    into cols
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'order_items'
    and column_name <> 'wholesale_price_chf';

  revoke select on public.order_items from anon, authenticated;
  execute format('grant select (%s) on public.order_items to authenticated', cols);
end $$;
