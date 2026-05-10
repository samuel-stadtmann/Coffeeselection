-- ============================================================================
-- P8 — Demo-UUIDs durch RFC4122-konforme UUIDs ersetzen
--
-- 8 von 16 aktiven Coffees hatten Demo-UUIDs der Form
-- 'c0000001-0000-0000-0000-000000000000' — nicht RFC4122-konform (Versions-
-- Byte 0 statt 1-8). Strenge UUID-Validierung lehnt diese ab.
--
-- Strategie: Insert-Move-Delete-Pattern in einer Transaction.
--   1) Spaltenliste dynamisch aus information_schema bauen — skipt
--      generated columns (is_single_origin) automatisch.
--   2) Neue Coffees-Row mit neuer UUID + temp Slug einfuegen.
--   3) Alle 10 Child-FKs umbiegen.
--   4) Alte Row loeschen.
--   5) Slug zurueck-renamen.
--
-- Vollstaendige Liste der Child-FKs auf coffees.id (verifiziert via
-- information_schema.referential_constraints am 2026-05-10):
--   coffee_ratings.coffee_id           (CASCADE)
--   coffee_allergens.coffee_id         (CASCADE)
--   coffee_certifications.coffee_id    (CASCADE)
--   coffee_flavor_notes.coffee_id      (CASCADE)
--   coffee_brewing_methods.coffee_id   (CASCADE)
--   coffee_tasting_notes.coffee_id     (CASCADE)
--   recommendation_history.coffee_id   (CASCADE)
--   order_items.coffee_id              (RESTRICT) — keine Demo-Bestellungen
--   subscription_items.coffee_id       (RESTRICT) — keine Demo-Subs
--   recommendation_snapshots.selected_coffee_id (SET NULL)
-- ============================================================================

do $$
declare
  v_cols_no_id_slug text;
  v_old_id          uuid;
  v_new_id          uuid;
  v_orig_slug       text;
  v_count           int := 0;
begin
  -- Spaltenliste der coffees-Tabelle ohne generated columns, ohne id, ohne slug.
  select string_agg(quote_ident(column_name), ',' order by ordinal_position)
  into v_cols_no_id_slug
  from information_schema.columns
  where table_schema = 'public'
    and table_name   = 'coffees'
    and is_generated = 'NEVER'
    and column_name not in ('id', 'slug');

  for v_old_id in
    select id from public.coffees where id::text like 'c0000%'
  loop
    v_new_id := gen_random_uuid();
    select slug into v_orig_slug from public.coffees where id = v_old_id;

    -- 1) Neuer Row mit neuer UUID + temp Slug + Rest kopiert.
    execute format(
      'insert into public.coffees (id, slug, %s) select $1, $2, %s from public.coffees where id = $3',
      v_cols_no_id_slug,
      v_cols_no_id_slug
    )
    using v_new_id,
          v_orig_slug || '__migrating__' || substring(v_new_id::text, 1, 8),
          v_old_id;

    -- 2) Alle Child-FKs umbiegen. WHERE-Klausel pro UPDATE -> safeupdate-konform.
    update public.coffee_ratings           set coffee_id          = v_new_id where coffee_id          = v_old_id;
    update public.coffee_allergens         set coffee_id          = v_new_id where coffee_id          = v_old_id;
    update public.coffee_certifications    set coffee_id          = v_new_id where coffee_id          = v_old_id;
    update public.coffee_flavor_notes      set coffee_id          = v_new_id where coffee_id          = v_old_id;
    update public.coffee_brewing_methods   set coffee_id          = v_new_id where coffee_id          = v_old_id;
    update public.coffee_tasting_notes     set coffee_id          = v_new_id where coffee_id          = v_old_id;
    update public.recommendation_history   set coffee_id          = v_new_id where coffee_id          = v_old_id;
    update public.order_items              set coffee_id          = v_new_id where coffee_id          = v_old_id;
    update public.subscription_items       set coffee_id          = v_new_id where coffee_id          = v_old_id;
    update public.recommendation_snapshots set selected_coffee_id = v_new_id where selected_coffee_id = v_old_id;

    -- 3) Alte Row loeschen — Children umgezogen, FK-CASCADE laeuft ins Leere.
    delete from public.coffees where id = v_old_id;

    -- 4) Slug zurueck-renamen.
    update public.coffees set slug = v_orig_slug where id = v_new_id;

    v_count := v_count + 1;
  end loop;

  raise notice 'P8: % Coffees auf neue UUIDs umgezogen', v_count;
end $$;
