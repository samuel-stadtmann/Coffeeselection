-- =============================================================================
-- Migration 010 — Mehrsprachigkeit + Public Views + Final Touches
-- =============================================================================
-- Letzte Migration der Phase-2-Datenbank. Drei Themen:
--
--   1. Mehrsprachigkeit: name_fr + name_it auf allen Katalog-Tabellen,
--      description_fr/it auf coffees und roasters.
--      → DE bleibt Pflichtfeld, FR/IT sind optional (NULL = noch nicht uebersetzt,
--         Frontend faellt auf DE zurueck).
--
--   2. Public Views: sichere Lese-Sicht auf sensible Tabellen.
--      → order_items_public (OHNE wholesale_price_chf — Marge geheim halten)
--      → coffees_with_details (Kaffee + Roester + Origin + Aromen vorgejoint)
--      → customer_self_dashboard (Kunde sieht eigenes Profil + Aggregate)
--
--   3. RLS-Setup-Check: Hilfs-View, die anzeigt, welche Tabellen RLS aktiv
--      haben und wie viele Policies definiert sind. Pure Diagnostik.
-- =============================================================================


-- =============================================================================
-- 1) Mehrsprachigkeit: FR + IT-Spalten auf Katalogen und Content-Tabellen
-- =============================================================================

-- Kataloge (alle haben bereits name_de)
alter table public.flavor_notes_catalog       add column name_fr text, add column name_it text;
alter table public.brewing_methods_catalog    add column name_fr text, add column name_it text;
alter table public.origins_catalog            add column name_fr text, add column name_it text;
alter table public.varieties_catalog          add column name_fr text, add column name_it text;
alter table public.processing_methods_catalog add column name_fr text, add column name_it text;
alter table public.certifications_catalog     add column name_fr text, add column name_it text;

-- Roesterer + Kaffees: Beschreibungen mehrsprachig
alter table public.roasters
  add column short_description_fr text,
  add column short_description_it text,
  add column description_fr       text,
  add column description_it       text,
  add column story_fr             text,
  add column story_it             text;

alter table public.coffees
  add column short_description_fr text,
  add column short_description_it text,
  add column description_fr       text,
  add column description_it       text,
  add column tasting_summary_fr   text,
  add column tasting_summary_it   text;

-- Helper-Funktion: gibt das passende Sprachfeld zurueck (Fallback DE).
-- Beispiel-Aufruf: select public.l10n_text('de-CH', name_de, name_fr, name_it) from origins_catalog;
create or replace function public.l10n_text(
  lang   text,
  txt_de text,
  txt_fr text default null,
  txt_it text default null,
  txt_en text default null
)
returns text
language sql
immutable
as $$
  select case
    when lang = 'fr-CH' then coalesce(txt_fr, txt_de)
    when lang = 'it-CH' then coalesce(txt_it, txt_de)
    when lang = 'en'    then coalesce(txt_en, txt_de)
    else txt_de
  end;
$$;

comment on function public.l10n_text(text,text,text,text,text) is
  'Faellt auf DE zurueck wenn die gewaehlte Uebersetzung NULL ist. Frontend kann customers.language uebergeben.';


-- =============================================================================
-- 2) Public Views
-- =============================================================================

-- 2a) order_items_public — OHNE wholesale_price_chf
-- ----------------------------------------------------------------------------
-- In Migration 007 hatten wir wholesale_price_chf in derselben Tabelle wie
-- den Verkaufspreis. Damit das Frontend nicht versehentlich SELECT * macht
-- und den Einkaufspreis leakt, gibt es jetzt diese sichere View.
-- WICHTIG: 'with (security_invoker = true)' → die View prueft die RLS-Policy
-- des aufrufenden Users (nicht des View-Erstellers). Damit greift
-- order_items_self_select korrekt durch.
create or replace view public.order_items_public
with (security_invoker = true)
as
select
  id,
  order_id,
  coffee_id,
  coffee_name_snapshot,
  roaster_name_snapshot,
  roast_level_snapshot,
  quantity,
  weight_g,
  unit_price_chf,
  -- wholesale_price_chf ABSICHTLICH AUSGELASSEN
  line_total_chf,
  grind_preference,
  created_at
from public.order_items;

comment on view public.order_items_public is
  'Sichere View auf order_items ohne wholesale_price_chf. Frontend sollte IMMER diese View nutzen, nie order_items direkt.';


-- 2b) coffees_with_details — vorgejointes Listing
-- ----------------------------------------------------------------------------
-- Reduziert N+1-Queries im Frontend: Kaffee, Roester-Name, Origin-Name,
-- Aromen-Liste, Bruehmethoden-Liste in einer einzigen Zeile.
-- Achtung: nur aktive, sichtbare Kaffees (gleich wie RLS-Policy in Migration 004).
create or replace view public.coffees_with_details
with (security_invoker = true)
as
select
  c.id,
  c.slug,
  c.name,
  c.short_description,
  c.description,
  c.tasting_summary,
  c.image_url,
  c.gallery_urls,

  -- Roester
  r.id          as roaster_id,
  r.slug        as roaster_slug,
  r.name        as roaster_name,
  r.logo_url    as roaster_logo_url,

  -- Origin
  o.id          as origin_id,
  o.slug        as origin_slug,
  o.name_de     as origin_name_de,
  o.name_fr     as origin_name_fr,
  o.name_it     as origin_name_it,
  c.region,
  c.farm,
  c.producer,

  -- Variety
  v.slug        as variety_slug,
  v.name_de     as variety_name_de,

  -- Processing
  p.slug        as processing_slug,
  p.name_de     as processing_name_de,

  -- Roest- und Kommerz-Daten
  c.altitude_m_min,
  c.altitude_m_max,
  c.harvest_year,
  c.roast_level,
  c.roast_profile,
  c.roast_date,
  c.is_decaf,
  c.is_blend,
  c.is_single_origin,
  c.sca_score,
  c.price_chf,
  c.weight_g,
  c.stock_status,
  c.status,

  -- Aggregierte Aroma-Liste (Array von Slugs)
  (
    select array_agg(fn.slug order by cfn.sort_order, fn.slug)
    from public.coffee_flavor_notes cfn
    join public.flavor_notes_catalog fn on fn.id = cfn.flavor_note_id
    where cfn.coffee_id = c.id
  ) as flavor_slugs,

  -- Aggregierte Brueh-Methoden (nur empfohlene)
  (
    select array_agg(bm.slug)
    from public.coffee_brewing_methods cbm
    join public.brewing_methods_catalog bm on bm.id = cbm.brewing_method_id
    where cbm.coffee_id = c.id and cbm.is_recommended = true
  ) as recommended_brewing_slugs,

  -- Aggregierte Zertifikate
  (
    select array_agg(cc2.slug)
    from public.coffee_certifications ccs
    join public.certifications_catalog cc2 on cc2.id = ccs.certification_id
    where ccs.coffee_id = c.id
  ) as certification_slugs,

  -- Durchschnitts-Bewertung (nur oeffentliche Ratings)
  (
    select round(avg(cr.rating)::numeric, 2)
    from public.coffee_ratings cr
    where cr.coffee_id = c.id and cr.is_public = true
  ) as avg_rating_public,

  (
    select count(*)
    from public.coffee_ratings cr
    where cr.coffee_id = c.id and cr.is_public = true
  ) as rating_count_public

from public.coffees c
join public.roasters r on r.id = c.roaster_id
left join public.origins_catalog o            on o.id = c.origin_id
left join public.varieties_catalog v          on v.id = c.variety_id
left join public.processing_methods_catalog p on p.id = c.processing_method_id;

comment on view public.coffees_with_details is
  'Vorgejointes Detail-Listing fuer Frontend. Nutzt RLS der Basis-Tabellen via security_invoker.';


-- 2c) customer_self_dashboard — Kunde sieht eigene Aggregate
-- ----------------------------------------------------------------------------
-- Eine View, die das gesamte "Mein Konto"-Dashboard mit einer einzigen Query
-- liefert: Profil + LTV + naechste Lieferung + offene Tickets + Punkte-Saldo.
create or replace view public.customer_self_dashboard
with (security_invoker = true)
as
select
  c.id                                        as customer_id,
  c.email,
  c.first_name,
  c.last_name,
  c.language,
  c.customer_segment,
  c.lifetime_value_chf,
  c.total_orders,
  c.first_order_at,
  c.last_order_at,
  c.created_at                                as customer_since,

  -- Aktives Abo (falls vorhanden, das aktuellste)
  (
    select s.id from public.subscriptions s
    where s.customer_id = c.id and s.status = 'active'
    order by s.started_at desc limit 1
  )                                           as active_subscription_id,
  (
    select s.next_delivery_on from public.subscriptions s
    where s.customer_id = c.id and s.status = 'active'
    order by s.started_at desc limit 1
  )                                           as next_delivery_on,

  -- Anzahl aktive Abos
  (select count(*) from public.subscriptions s
   where s.customer_id = c.id and s.status = 'active') as active_subscription_count,

  -- Offene Support-Tickets
  (select count(*) from public.support_tickets t
   where t.customer_id = c.id and t.status in ('open','in_progress','waiting_customer')) as open_ticket_count,

  -- Treuepunkte-Saldo
  public.customer_loyalty_balance(c.id)       as loyalty_balance,

  -- Letzte 5 Ratings (als JSON-Array fuer "Zuletzt bewertet"-Widget)
  (
    select coalesce(jsonb_agg(jsonb_build_object(
             'coffee_id', cr.coffee_id,
             'rating', cr.rating,
             'created_at', cr.created_at
           ) order by cr.created_at desc), '[]'::jsonb)
    from (
      select coffee_id, rating, created_at
      from public.coffee_ratings
      where customer_id = c.id
      order by created_at desc
      limit 5
    ) cr
  )                                           as recent_ratings

from public.customers c
where c.deleted_at is null;

comment on view public.customer_self_dashboard is
  'Eine Zeile pro Kunde mit allen Aggregaten fuer das Mein-Konto-Dashboard. RLS via security_invoker → jeder Kunde sieht nur seine eigene Zeile.';


-- =============================================================================
-- 3) RLS-Diagnostik-View (nur fuer Wartung, kein Kunden-Zugriff)
-- =============================================================================
-- Zeigt fuer jede Tabelle: ist RLS aktiv? Wie viele Policies?
-- Hilft beim Setup-Check und bei Audits.
create or replace view public.rls_status
as
select
  c.relname                                              as table_name,
  c.relrowsecurity                                       as rls_enabled,
  c.relforcerowsecurity                                  as rls_forced,
  (select count(*) from pg_policies p
   where p.schemaname = 'public' and p.tablename = c.relname) as policy_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r';                                   -- nur normale Tabellen

comment on view public.rls_status is
  'Diagnostik: RLS-Status pro public-Tabelle. Sollte ueberall rls_enabled=true und policy_count>=1 zeigen.';


-- =============================================================================
-- 4) Final: kleine Beschreibung der finalen DB-Schichten als Tabellen-Kommentar
-- =============================================================================
comment on table public.customers          is 'Phase 2 / Layer 1 — Identitaet';
comment on table public.taste_profiles     is 'Phase 2 / Layer 2 — Geschmack';
comment on table public.subscriptions      is 'Phase 2 / Layer 3 — Kommerz';
comment on table public.coffee_ratings     is 'Phase 2 / Layer 4 — Feedback & KI-Signale';
comment on table public.loyalty_points     is 'Phase 2 / Layer 5 — Engagement & Support';
