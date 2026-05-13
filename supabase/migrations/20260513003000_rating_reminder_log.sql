-- ============================================================================
-- PA-Loop3.2: rating_reminder_log fuer Per-Coffee-Frequenz-Kontrolle
--
-- Hintergrund:
--   orders.rating_reminder_sent_at sagt nur "Order schon mal Mail bekommen".
--   Das reicht nicht: bei Abo-Renewals (immer gleicher Coffee in neuen Orders)
--   wuerde der Customer alle 2 Wochen die gleiche "Wie war dein X?" Mail
--   kriegen. Spam.
--
--   Loesung: pro (customer_id, coffee_id) wird der letzte Mail-Versand
--   protokolliert. Vor Mail-Send pruefen ob es einen Eintrag in den letzten
--   90 Tagen gibt — wenn ja, dieser Coffee wird aus der Mail rausgefiltert.
--
-- Regel:
--   - Neuer Coffee (keine Mail in 90d): 1 Woche nach Bezahlung Mail
--   - Wiederholter Coffee (Mail in 90d): kein neuer Reminder bis 90 Tage
--     vergangen sind
--
-- Datum: 2026-05-13
-- ============================================================================

create table if not exists public.rating_reminder_log (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  coffee_id   uuid not null references public.coffees(id)   on delete cascade,
  order_id    uuid          references public.orders(id)    on delete set null,
  sent_at     timestamptz not null default now()
);

comment on table public.rating_reminder_log is
  'Log fuer per-(customer,coffee)-Cooldown der Bewertungs-Mails. '
  'Cron-Job /api/cron/rating-reminders prueft ob in den letzten 90 Tagen '
  'schon ein Eintrag fuer (customer,coffee) existiert; wenn ja → Coffee '
  'wird aus dem Mail-Inhalt gefiltert.';

-- Index fuer schnellen Lookup im Cron (most-recent-first per customer+coffee)
create index if not exists rating_reminder_log_lookup_idx
  on public.rating_reminder_log(customer_id, coffee_id, sent_at desc);

-- RLS: nur Service-Role schreibt + liest (kein User-Zugang)
alter table public.rating_reminder_log enable row level security;

-- Customer darf seine eigenen Eintraege LESEN (fuer evtl. Self-Service-
-- Anzeige "Du hast schon eine Bewertungs-Erinnerung bekommen"). Insert
-- ist nur fuer Service-Client erlaubt (default deny).
create policy "rating_reminder_log_self_select"
  on public.rating_reminder_log for select
  to authenticated
  using (
    customer_id in (
      select id from public.customers where auth_user_id = auth.uid()
    )
  );
