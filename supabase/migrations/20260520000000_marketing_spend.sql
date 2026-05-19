-- ============================================================================
-- Marketing-Spend Tracking
-- ============================================================================
--
-- Coffee Selection traegt selbst ein, was wo investiert wird:
--   - Social-Media-Ad (Instagram-Promotion)
--   - Influencer-Partnerschaft
--   - Print-Anzeige
--   - Event/Sponsoring
--   - Suchmaschinen-Werbung
--   - PR / Editorial
--   - Andere
--
-- Diese Daten fliessen in die Dashboard-CAC-Berechnung ein:
--   CAC = Sum(marketing_spend.spent_chf) / count(neue Customers im Zeitraum)
--
-- Abgrenzung zu marketing_campaigns:
--   - marketing_campaigns: Promo-CODES die User einloesen koennen
--     (WELCOME10 etc.) → wirkt auf customer_credits
--   - marketing_spend: WAS WIR AUSGEBEN fuer Marketing, ohne Code-Bezug
--     (Influencer-Honorar, Instagram-Ads etc.)
-- ============================================================================

create table if not exists public.marketing_spend (
  id              uuid primary key default gen_random_uuid(),

  -- Oberbegriff / Channel. Frei text aber per CHECK auf ein
  -- Standard-Vokabular eingeengt — sonst kann der CAC-Report nicht
  -- sinnvoll gruppieren.
  category        text not null check (category in (
    'social_media',
    'paid_ads',
    'influencer',
    'pr_editorial',
    'event_sponsoring',
    'print',
    'seo_content',
    'email_marketing',
    'other'
  )),

  -- Name der einzelnen Kampagne ("Instagram-Promo Maerz", "Influencer
  -- Lina @lina_coffee", "Tagi-Inserat Q2"). Freitext.
  name            text not null check (length(name) >= 2),
  description     text,

  -- Geplant + tatsaechlich. spent_chf zaehlt fuer CAC, budget_chf
  -- zeigt im Reporting den Spread (Over/Underspending).
  budget_chf      numeric(10,2) not null check (budget_chf >= 0),
  spent_chf       numeric(10,2) not null default 0 check (spent_chf >= 0),

  -- Zeitraum. Wenn ends_at null ist, laeuft die Aktivitaet weiter
  -- (z.B. dauerhafter SEO-Aufwand).
  starts_at       date not null,
  ends_at         date,

  -- Optional: Notizen, Performance-Metriken aus der Plattform
  -- (Klicks, Impressions etc.). Frei strukturiertes JSON.
  metadata        jsonb,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create index if not exists marketing_spend_category_idx
  on public.marketing_spend(category) where deleted_at is null;
create index if not exists marketing_spend_starts_idx
  on public.marketing_spend(starts_at desc) where deleted_at is null;

create trigger trg_marketing_spend_updated_at
  before update on public.marketing_spend
  for each row execute function public.set_updated_at();

alter table public.marketing_spend enable row level security;

-- Admin/Service-Role lesen+schreiben alles. Andere Rollen: kein Zugriff.
-- Wir haben kein "Admin"-Role-Konzept in postgres, das wird in Next.js
-- via getAdminUser() abgebildet. RLS blockt also Anon/Authenticated
-- komplett, Reads laufen ueber service-role aus Next.js.
drop policy if exists "marketing_spend_all_service" on public.marketing_spend;
create policy "marketing_spend_all_service"
  on public.marketing_spend for all
  to service_role
  using (true) with check (true);

comment on table public.marketing_spend is
  'Marketing-Aktivitaeten mit Budget. Fuellt CAC-Berechnung im Admin-Dashboard. Abgrenzung zu marketing_campaigns: dieses Table = was WIR AUSGEBEN, marketing_campaigns = Promo-Codes die User einloesen.';
