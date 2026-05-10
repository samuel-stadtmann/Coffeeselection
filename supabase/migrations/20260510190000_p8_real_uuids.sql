-- ============================================================================
-- P8 — Demo-UUIDs durch RFC4122-konforme UUIDs ersetzen
--
-- 8 von 16 aktiven Coffees hatten Demo-UUIDs der Form
-- 'c0000001-0000-0000-0000-000000000000' — nicht RFC4122-konform (Versions-
-- Byte ist 0 statt 1-8). Strenge UUID-Validierung in Zod, in PostgREST und
-- in OpenAPI-Generierern lehnt diese ab. Wir ersetzen sie durch
-- gen_random_uuid().
--
-- Strategie: Insert-Move-Delete-Pattern in DO-Block.
--   1) Neue Coffees-Row mit neuer UUID + temp Slug einfuegen (kopiert alle
--      Spalten via %ROWTYPE — auch dynamisch via Dashboard hinzugefuegte).
--   2) Alle Child-FKs (coffee_ratings, coffee_allergens, coffee_certifications,
--      coffee_flavor_notes, coffee_brewing_methods, coffee_tasting_notes,
--      recommendation_history, order_items) umbiegen.
--   3) Alte Row loeschen.
--   4) Slug zurueck-renamen.
--
-- flavor_embedding bleibt valid (basiert auf Content, nicht id).
-- ============================================================================

do $$
declare
  v_row     public.coffees%rowtype;
  v_old_id  uuid;
  v_new_id  uuid;
  v_orig_slug text;
  v_count   int := 0;
begin
  for v_old_id in
    select id from public.coffees where id::text like 'c0000%'
  loop
    v_new_id := gen_random_uuid();

    -- 1) Coffee-Row laden, ID + Slug aendern, neu einfuegen.
    select * into v_row from public.coffees where id = v_old_id;
    v_orig_slug := v_row.slug;
    v_row.id   := v_new_id;
    v_row.slug := v_orig_slug || '__migrating__' || substring(v_new_id::text, 1, 8);
    insert into public.coffees values (v_row.*);

    -- 2) Alle Child-FKs umbiegen.
    --    Jede UPDATE hat explizites WHERE -> safeupdate-konform.
    --    Per BEGIN/EXCEPTION robust, falls eine Tabelle in dieser Umgebung
    --    nicht existiert.
    begin update public.coffee_ratings        set coffee_id = v_new_id where coffee_id = v_old_id;
    exception when undefined_table then null; end;

    begin update public.coffee_allergens      set coffee_id = v_new_id where coffee_id = v_old_id;
    exception when undefined_table then null; end;

    begin update public.coffee_certifications set coffee_id = v_new_id where coffee_id = v_old_id;
    exception when undefined_table then null; end;

    begin update public.coffee_flavor_notes   set coffee_id = v_new_id where coffee_id = v_old_id;
    exception when undefined_table then null; end;

    begin update public.coffee_brewing_methods set coffee_id = v_new_id where coffee_id = v_old_id;
    exception when undefined_table then null; end;

    begin update public.coffee_tasting_notes  set coffee_id = v_new_id where coffee_id = v_old_id;
    exception when undefined_table then null; end;

    begin update public.recommendation_history set coffee_id = v_new_id where coffee_id = v_old_id;
    exception when undefined_table then null; end;

    begin update public.order_items           set coffee_id = v_new_id where coffee_id = v_old_id;
    exception when undefined_table then null; end;

    -- 3) Alte Row loeschen — Children sind alle umgezogen, FK-CASCADE schadet nicht.
    delete from public.coffees where id = v_old_id;

    -- 4) Slug zurueck-renamen.
    update public.coffees set slug = v_orig_slug where id = v_new_id;

    v_count := v_count + 1;
  end loop;

  raise notice 'P8: % Coffees auf neue UUIDs umgezogen', v_count;
end $$;
