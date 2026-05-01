-- =============================================================================
-- Migration 009 — Engagement & Support
-- =============================================================================
-- Bindung, Wachstum, Service. Diese Tabellen sind nicht Pflicht fuer Phase 1
-- (MVP), werden aber gebraucht sobald wir Loyalty-Programm, Empfehlungs-
-- Marketing und Customer-Service Tools live nehmen.
--
--   * loyalty_points         — Punkte-Buchungen (append-only, double-entry style)
--   * referrals              — Kunde wirbt Kunde
--   * email_events           — E-Mail-Lifecycle (sent/opened/clicked/bounced)
--   * support_tickets        — Anfragen, Beschwerden, Ruecksendungen
--   * agent_conversations    — KI-Agent-Chats (Kunden-facing AI Assistant)
--
-- Append-Only-Pattern bei loyalty_points: jede Buchung ist eine eigene Zeile,
-- der "Saldo" ergibt sich aus SUM(points). UPDATE/DELETE per Trigger blockiert.
-- =============================================================================


-- 1) loyalty_points (append-only) ---------------------------------------------
-- Buchhaltung der Treuepunkte. Eine Zeile = eine Bewegung.
-- Saldo = sum(points) where customer_id = X.
-- Negativ-Buchungen erlaubt (Einloesen, Verfall, Korrektur).
create table public.loyalty_points (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid not null references public.customers(id) on delete restrict,

  -- Punktebewegung (positiv = Gutschrift, negativ = Belastung)
  points          integer not null,

  -- Grund der Buchung
  reason          text not null
                  check (reason in (
                    'order_purchase',          -- Kauf
                    'subscription_active',     -- Aktives Abo (monatlich)
                    'review_written',          -- Bewertung geschrieben
                    'referral_signup',         -- Geworbener hat sich registriert
                    'referral_purchase',       -- Geworbener hat gekauft
                    'birthday_bonus',          -- Geburtstags-Gutschrift
                    'campaign_bonus',          -- Marketing-Aktion
                    'customer_service_bonus',  -- Kulanz
                    'redemption',              -- Einloesen (negativ)
                    'expiration',              -- Verfall (negativ)
                    'correction',              -- manuelle Korrektur (kann beides)
                    'refund_reversal'          -- Refund: Punkte zurueckziehen (negativ)
                  )),

  -- Bezugs-Objekte (optional)
  order_id        uuid references public.orders(id) on delete set null,
  referral_id     uuid,                                          -- FK kommt unten nachdem referrals existiert

  -- Verfallsdatum (NULL = unbegrenzt gueltig)
  expires_on      date,

  -- Freitext / Anzeige
  description     text,                                          -- z.B. 'Bestellung CS-2026-001234'
  description_de  text,                                          -- mehrsprachig (optional)

  -- Wer hat gebucht?
  created_by      uuid references auth.users(id) on delete set null,

  created_at      timestamptz not null default now()
);

create index loyalty_points_customer_idx
  on public.loyalty_points(customer_id, created_at desc);
create index loyalty_points_reason_idx
  on public.loyalty_points(reason);
create index loyalty_points_expires_idx
  on public.loyalty_points(expires_on) where expires_on is not null;
create index loyalty_points_order_idx
  on public.loyalty_points(order_id) where order_id is not null;

alter table public.loyalty_points enable row level security;

-- Kunde sieht eigene Buchungen (read-only).
create policy "loyalty_points_self_select"
  on public.loyalty_points for select
  to authenticated
  using (customer_id = public.current_customer_id());

-- Schreiben nur via service_role (Backend bucht).
create policy "loyalty_points_all_service"
  on public.loyalty_points for all
  to service_role
  using (true) with check (true);

-- Append-Only-Trigger (analog customer_consents).
create trigger trg_loyalty_points_no_update
  before update on public.loyalty_points
  for each row execute function public.prevent_consent_modify();
-- (Wiederverwendung der prevent_consent_modify-Funktion — ja, der Name passt
--  nicht ideal, aber der Mechanismus ist identisch und die Fehlermeldung
--  ist generisch genug. Alternative: separate Funktion, hier nicht noetig.)

create trigger trg_loyalty_points_no_delete
  before delete on public.loyalty_points
  for each row execute function public.prevent_consent_modify();


-- Convenience: Saldo-Funktion --------------------------------------------------
create or replace function public.customer_loyalty_balance(p_customer_id uuid)
returns integer
language sql
stable
as $$
  select coalesce(sum(points), 0)::integer
  from public.loyalty_points
  where customer_id = p_customer_id
    and (expires_on is null or expires_on >= current_date);
$$;

comment on function public.customer_loyalty_balance(uuid) is
  'Aktueller Punkte-Saldo des Kunden, Verfall beruecksichtigt.';


-- 2) referrals ----------------------------------------------------------------
-- Kunde wirbt Kunde. referrer_customer_id wirbt mit referral_code,
-- referee_customer_id ist der geworbene Kunde (NULL bis Registrierung).
create table public.referrals (
  id                      uuid primary key default gen_random_uuid(),

  referrer_customer_id    uuid not null references public.customers(id) on delete cascade,
  referee_customer_id     uuid references public.customers(id) on delete set null,

  -- Eindeutiger Code, den der Werber teilt
  referral_code           text unique not null,

  -- Eingeloeste Belohnungen (CHF-Gutschein oder Punkte)
  reward_referrer_chf     numeric(10,2) not null default 0 check (reward_referrer_chf >= 0),
  reward_referee_chf      numeric(10,2) not null default 0 check (reward_referee_chf >= 0),
  reward_referrer_points  integer not null default 0 check (reward_referrer_points >= 0),
  reward_referee_points   integer not null default 0 check (reward_referee_points >= 0),

  -- Status der Empfehlung
  status                  text not null default 'pending'
                          check (status in (
                            'pending',     -- Code generiert, noch nicht eingeloest
                            'signed_up',   -- Geworbener hat sich registriert
                            'qualified',   -- Geworbener hat erste Bestellung abgeschlossen
                            'rewarded',    -- Belohnung an beide ausgezahlt
                            'expired',     -- Code abgelaufen
                            'cancelled'    -- z.B. wegen Missbrauch
                          )),

  -- Erste qualifizierende Bestellung (loest Auszahlung aus)
  qualifying_order_id     uuid references public.orders(id) on delete set null,

  signed_up_at            timestamptz,
  qualified_at            timestamptz,
  rewarded_at             timestamptz,
  expires_at              timestamptz,

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  -- Selbst-Empfehlung verhindern (NULL-safe)
  constraint referrals_no_self_referral
    check (referee_customer_id is null or referee_customer_id <> referrer_customer_id)
);

create index referrals_referrer_idx       on public.referrals(referrer_customer_id, created_at desc);
create index referrals_referee_idx        on public.referrals(referee_customer_id) where referee_customer_id is not null;
create index referrals_status_idx         on public.referrals(status);
create index referrals_qualifying_idx     on public.referrals(qualifying_order_id) where qualifying_order_id is not null;

create trigger trg_referrals_updated_at
  before update on public.referrals
  for each row execute function public.set_updated_at();

alter table public.referrals enable row level security;

-- Kunde sieht eigene Empfehlungen (sowohl als Werber als auch als Geworbener).
create policy "referrals_self_select"
  on public.referrals for select
  to authenticated
  using (
    referrer_customer_id = public.current_customer_id()
    or referee_customer_id = public.current_customer_id()
  );

create policy "referrals_all_service"
  on public.referrals for all
  to service_role
  using (true) with check (true);

-- Jetzt FK auf loyalty_points.referral_id nachreichen (referrals existiert nun).
alter table public.loyalty_points
  add constraint loyalty_points_referral_fk
  foreign key (referral_id) references public.referrals(id) on delete set null;


-- 3) email_events (bigserial) -------------------------------------------------
-- E-Mail-Lifecycle vom ESP (z.B. Postmark, SendGrid, Resend) via Webhook.
-- Hohe Frequenz, daher bigserial PK.
create table public.email_events (
  id              bigserial primary key,
  customer_id     uuid references public.customers(id) on delete set null,

  -- Externe Referenzen
  message_id      text,                                          -- ESP-eigene Message-ID
  template        text,                                          -- z.B. 'order_confirmation','welcome','abo_reminder'
  campaign_id     text,                                          -- bei Marketing-Mails

  -- Event
  event_type      text not null
                  check (event_type in (
                    'queued','sent','delivered',
                    'opened','clicked','unsubscribed',
                    'bounced','complained','dropped','deferred'
                  )),

  -- Empfaenger (kann von customer abweichen — z.B. Geschenk-E-Mail an Dritte)
  recipient_email citext,

  -- Klick-Details (bei event_type='clicked')
  link_url        text,

  -- Bounce/Complaint-Details
  failure_reason  text,

  -- Roh-Payload vom ESP
  payload         jsonb,

  occurred_at     timestamptz not null default now()
);

create index email_events_customer_idx
  on public.email_events(customer_id, occurred_at desc) where customer_id is not null;
create index email_events_message_idx
  on public.email_events(message_id, event_type);
create index email_events_template_time_idx
  on public.email_events(template, occurred_at desc);
create index email_events_campaign_idx
  on public.email_events(campaign_id) where campaign_id is not null;
create index email_events_type_time_idx
  on public.email_events(event_type, occurred_at desc);

alter table public.email_events enable row level security;

-- Kunde sieht eigene E-Mail-Events (Privacy-by-Design).
create policy "email_events_self_select"
  on public.email_events for select
  to authenticated
  using (customer_id = public.current_customer_id());

-- Schreiben nur via service_role (ESP-Webhook-Handler).
create policy "email_events_all_service"
  on public.email_events for all
  to service_role
  using (true) with check (true);


-- 4) support_tickets ----------------------------------------------------------
create table public.support_tickets (
  id                  uuid primary key default gen_random_uuid(),
  customer_id         uuid not null references public.customers(id) on delete restrict,

  -- Ticket-Identifikation (sichtbar fuer Kunden)
  ticket_number       text unique not null default ('CS-T-' || to_char(now(), 'YYYY') || '-' ||
                       lpad(floor(random()*1000000)::text, 6, '0')),

  -- Klassifikation
  category            text not null
                      check (category in (
                        'order_issue','shipping_issue','product_quality',
                        'subscription','payment','account','feedback','other'
                      )),
  priority            text not null default 'normal'
                      check (priority in ('low','normal','high','urgent')),

  -- Bezugs-Objekte (optional)
  order_id            uuid references public.orders(id) on delete set null,
  subscription_id     uuid references public.subscriptions(id) on delete set null,

  -- Inhalt
  subject             text not null,
  description         text not null,                            -- Erst-Beschreibung des Kunden

  -- Status
  status              text not null default 'open'
                      check (status in ('open','in_progress','waiting_customer','resolved','closed')),

  -- Zuweisung
  assigned_to         uuid references auth.users(id) on delete set null,

  -- Sprache fuer Bearbeitung
  language            text not null default 'de-CH'
                      check (language in ('de-CH','fr-CH','it-CH','en')),

  -- Zeitstempel
  first_response_at   timestamptz,
  resolved_at         timestamptz,
  closed_at           timestamptz,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index support_tickets_customer_idx  on public.support_tickets(customer_id, created_at desc);
create index support_tickets_status_idx    on public.support_tickets(status);
create index support_tickets_assigned_idx  on public.support_tickets(assigned_to) where assigned_to is not null;
create index support_tickets_priority_idx
  on public.support_tickets(priority, created_at) where status in ('open','in_progress');

create trigger trg_support_tickets_updated_at
  before update on public.support_tickets
  for each row execute function public.set_updated_at();

alter table public.support_tickets enable row level security;

-- Kunde sieht/erstellt eigene Tickets, kann aber Status nicht selbst aendern
-- (Vereinfachung: hier alle eigenen Felder erlaubt — Schutz vor Status-Manipulation
--  via App-Logik / Triggers in Phase 4).
create policy "support_tickets_self_select"
  on public.support_tickets for select
  to authenticated
  using (customer_id = public.current_customer_id());

create policy "support_tickets_self_insert"
  on public.support_tickets for insert
  to authenticated
  with check (customer_id = public.current_customer_id());

create policy "support_tickets_all_service"
  on public.support_tickets for all
  to service_role
  using (true) with check (true);


-- 5) support_ticket_messages --------------------------------------------------
-- Konversation innerhalb eines Tickets. Kunden- und Agent-Nachrichten gemischt.
create table public.support_ticket_messages (
  id              uuid primary key default gen_random_uuid(),
  ticket_id       uuid not null references public.support_tickets(id) on delete cascade,

  -- Wer schreibt? Kunde oder Agent?
  sender_type     text not null check (sender_type in ('customer','agent','system')),
  sender_user_id  uuid references auth.users(id) on delete set null,

  body            text not null,

  -- Interne Notiz? (Nur fuer Agent-Sicht — vor Kunden verbergen)
  is_internal     boolean not null default false,

  -- Anhaenge (URLs zu Supabase Storage)
  attachments     jsonb,                                        -- z.B. [{"url":"...","filename":"..."}]

  created_at      timestamptz not null default now()
);

create index support_ticket_messages_ticket_idx
  on public.support_ticket_messages(ticket_id, created_at);

alter table public.support_ticket_messages enable row level security;

-- Kunde sieht nicht-interne Nachrichten zu seinen Tickets.
create policy "support_ticket_messages_self_select"
  on public.support_ticket_messages for select
  to authenticated
  using (
    is_internal = false
    and exists (
      select 1 from public.support_tickets t
      where t.id = support_ticket_messages.ticket_id
        and t.customer_id = public.current_customer_id()
    )
  );

-- Kunde kann zu eigenen Tickets antworten (nicht-intern).
create policy "support_ticket_messages_self_insert"
  on public.support_ticket_messages for insert
  to authenticated
  with check (
    sender_type = 'customer'
    and is_internal = false
    and exists (
      select 1 from public.support_tickets t
      where t.id = support_ticket_messages.ticket_id
        and t.customer_id = public.current_customer_id()
    )
  );

create policy "support_ticket_messages_all_service"
  on public.support_ticket_messages for all
  to service_role
  using (true) with check (true);


-- 6) agent_conversations (KI-Agent / Concierge-Chat) -------------------------
-- Speichert Chat-Verlaeufe mit dem KI-Assistenten ("Welcher Kaffee passt zu mir?").
-- Eine Zeile = eine Konversation; Nachrichten als JSONB-Array (oder
-- separate Tabelle, falls Volumen wachsen sollte — Phase 4-Entscheidung).
create table public.agent_conversations (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid references public.customers(id) on delete cascade,
  -- NULLable: anonyme Konversationen vor Login moeglich
  session_id      text,

  -- Welcher Agent / welches Modell?
  agent_type      text not null default 'concierge'
                  check (agent_type in ('concierge','support','onboarding','recommendation')),
  model           text not null default 'claude-sonnet-4-6',

  -- Sprachsetting
  language        text not null default 'de-CH'
                  check (language in ('de-CH','fr-CH','it-CH','en')),

  -- Nachrichten als JSONB-Array. Format: [{"role":"user|assistant","content":"...","timestamp":"..."}]
  messages        jsonb not null default '[]',

  -- Aggregat-Felder (fuer schnelle Listenansicht ohne JSONB-Parse)
  message_count   integer not null default 0 check (message_count >= 0),
  last_message_at timestamptz,

  -- Outcome (was wurde aus dem Chat?)
  outcome         text check (outcome is null or outcome in
                  ('purchase','subscription_started','no_action','escalated_to_support','abandoned')),
  outcome_order_id uuid references public.orders(id) on delete set null,

  -- Token-Kosten (Telemetrie)
  tokens_input    integer check (tokens_input is null or tokens_input >= 0),
  tokens_output   integer check (tokens_output is null or tokens_output >= 0),

  started_at      timestamptz not null default now(),
  ended_at        timestamptz,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index agent_conversations_customer_idx
  on public.agent_conversations(customer_id, started_at desc) where customer_id is not null;
create index agent_conversations_session_idx
  on public.agent_conversations(session_id) where session_id is not null;
create index agent_conversations_agent_type_idx
  on public.agent_conversations(agent_type, started_at desc);
create index agent_conversations_outcome_idx
  on public.agent_conversations(outcome) where outcome is not null;
create index agent_conversations_messages_idx
  on public.agent_conversations using gin(messages);

create trigger trg_agent_conversations_updated_at
  before update on public.agent_conversations
  for each row execute function public.set_updated_at();

alter table public.agent_conversations enable row level security;

-- Kunde sieht eigene Konversationen.
create policy "agent_conversations_self_select"
  on public.agent_conversations for select
  to authenticated
  using (customer_id = public.current_customer_id());

-- Kunde kann eigene Konversation starten/aktualisieren (App schreibt direkt).
create policy "agent_conversations_self_modify"
  on public.agent_conversations for all
  to authenticated
  using (customer_id = public.current_customer_id())
  with check (customer_id = public.current_customer_id());

create policy "agent_conversations_all_service"
  on public.agent_conversations for all
  to service_role
  using (true) with check (true);
