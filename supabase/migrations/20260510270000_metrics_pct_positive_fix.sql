-- ============================================================================
-- Hotfix Metriken-Dashboard — pct_positive Nenner war count(*) statt
-- count(cr.id), wodurch der LEFT JOIN auf coffee_ratings die Zahl
-- aufblies (Customers ohne Bewertung zaehlten in den Nenner mit).
--
-- Beispiel: "Der Klassiker" hatte 4 Kunden, davon 1 mit 4★-Bewertung.
-- Alt:    count(*) = 4, count >= 4 = 1, pct = 1/4*100 = 25 %.
-- Neu:    count(cr.id) = 1, count(cr.id) filter (>= 4) = 1, pct = 100 %.
--
-- Zusatz: Bei Typen ohne Bewertungen liefert count(cr.id) = 0 →
-- nullif macht den Bruch NULL → das UI rendert dann "—" statt "0.0%".
-- ============================================================================

create or replace view public.metrics_avg_rating_per_type as
select
  tt.id                                                       as taste_type_id,
  tt.name_de                                                  as taste_type_name,
  count(cr.id)                                                as num_ratings,
  round(avg(cr.rating)::numeric, 2)                           as avg_rating,
  round(
    count(cr.id) filter (where cr.rating >= 4)::numeric
    / nullif(count(cr.id), 0)::numeric * 100,
    1
  )                                                           as pct_positive
from public.taste_types tt
left join public.customers   c  on c.taste_type_id = tt.id
left join public.coffee_ratings cr
       on cr.customer_id = c.id
      and cr.created_at > now() - interval '90 days'
group by tt.id, tt.name_de
order by avg_rating desc nulls last;

-- Berechtigungen erneut setzen (CREATE OR REPLACE behaelt sie zwar, aber sicher ist sicher).
revoke all  on public.metrics_avg_rating_per_type from anon, authenticated;
grant select on public.metrics_avg_rating_per_type to service_role;
