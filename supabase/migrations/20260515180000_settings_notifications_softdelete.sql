-- Settings: Notification-Praeferenzen + Soft-Delete-Marker.
--
-- 1) customers.notify_*  — drei Boolean-Spalten fuer Mail-Praeferenzen.
--    Einer entspricht (vorhandenem) marketing_opt_in — wir doppeln ihn
--    NICHT, sondern lassen marketing_opt_in der Single-Source-Of-Truth
--    fuer Newsletter, und fuegen 2 weitere flags fuer transaktionale
--    Mails (Liefer-Updates) und Empfehlungs-Mails dazu.
--    Default: shipping=true (transaktional, immer an), recommendations=true.
--
-- 2) customers.deleted_at  — Soft-Delete-Marker. Wenn gesetzt, ist der
--    Customer fuer die App "geloescht" (Anonymisiert in App-Logik), aber
--    Order-Historie bleibt fuer Buchhaltung/Steueramt erhalten.
--    Auth-User wird im Delete-Endpoint via auth.admin.deleteUser entfernt.
--    customers.auth_user_id ist ON DELETE SET NULL (siehe unten), d.h. beim
--    Loeschen des Auth-Users wird der FK automatisch auf NULL gesetzt; der
--    anonymisierte customers-Datensatz (Order-Historie) bleibt erhalten.

alter table public.customers
  add column if not exists notify_shipping       boolean not null default true,
  add column if not exists notify_recommendations boolean not null default true,
  add column if not exists deleted_at            timestamptz;

comment on column public.customers.notify_shipping is
  'E-Mail-Updates zu Bestell-Status (Bestaetigung, Versand, Zustellung). '
  'Transaktional — sollte selten deaktiviert werden, ist aber moeglich.';
comment on column public.customers.notify_recommendations is
  'E-Mails wenn der Algorithmus einen neuen Match findet.';
comment on column public.customers.deleted_at is
  'Soft-Delete: gesetzt = Account vom User geloescht (DSGVO Recht auf Vergessen). '
  'Personendaten werden im Loesch-Endpoint anonymisiert; Order-Historie bleibt '
  'fuer Buchhaltung (CH-AufbewahrungspflichtenH 10 Jahre).';

create index if not exists customers_deleted_at_idx
  on public.customers(deleted_at) where deleted_at is not null;

-- 3) auth_user_id nullable + ON DELETE SET NULL statt CASCADE.
-- Ohne diese Aenderung wuerde auth.admin.deleteUser den ganzen Customer
-- per CASCADE wegloeschen — und damit die Order-Historie zerstoeren.
-- Mit SET NULL bleibt der Customer-Datensatz (anonymisiert) stehen,
-- nur der Auth-Bezug wird genullt.
alter table public.customers
  alter column auth_user_id drop not null;

alter table public.customers
  drop constraint if exists customers_auth_user_id_fkey;

alter table public.customers
  add constraint customers_auth_user_id_fkey
  foreign key (auth_user_id) references auth.users(id) on delete set null;
