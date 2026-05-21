-- ============================================================================
-- order_items.roaster_id — Snapshot des Roesters zum Verkaufszeitpunkt
-- ============================================================================
--
-- Entscheidung (Reseller-Abrechnung): Der Roester-Auszahlungs-Report soll
-- jeden verkauften Coffee dem Roester ZUM VERKAUFSZEITPUNKT zuordnen, nicht
-- dem heute hinterlegten. Sonst wuerde bei einem Roester-Wechsel eines
-- Coffees historischer Umsatz rueckwirkend dem neuen Roester gutgeschrieben
-- → Buchhaltung der Vergangenheit kaputt.
--
-- Loesung: roaster_id direkt auf order_items snapshotten (analog
-- roaster_name_snapshot, das schon existiert). Der Report gruppiert dann
-- ueber order_items.roaster_id statt ueber den Live-coffee->roaster-Join.
--
-- Backfill: bestehende Zeilen bekommen den AKTUELLEN Roester ihres Coffees
-- (beste verfuegbare Naeherung fuer Alt-Daten).
-- ============================================================================

alter table public.order_items
  add column if not exists roaster_id uuid references public.roasters(id) on delete set null;

create index if not exists order_items_roaster_idx
  on public.order_items(roaster_id);

-- Backfill aus dem aktuellen Coffee->Roaster-Mapping.
update public.order_items oi
set roaster_id = c.roaster_id
from public.coffees c
where oi.coffee_id = c.id
  and oi.roaster_id is null;

comment on column public.order_items.roaster_id is
  'Snapshot des Roesters zum Verkaufszeitpunkt (Reseller-Auszahlungs-Report). Wird beim Order-Create + Renewal-Webhook aus coffees.roaster_id gesetzt. Aenderungen am Coffee danach (Roester-Wechsel) beeinflussen historische Auszahlungen NICHT.';
