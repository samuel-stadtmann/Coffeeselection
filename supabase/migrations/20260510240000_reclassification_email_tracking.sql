-- ============================================================================
-- Reklassifikations-E-Mail-Versand (Playbook 6.5)
--
-- Der Lern-Worker setzt seit M5c `reclassification_suggested_at` +
-- `reclassification_suggested_type` wenn der Centroid-Check anschlaegt.
-- Dieses Feld zeigt aber nicht ob die "magst du das Quiz nochmal machen?"-
-- E-Mail tatsaechlich rausgegangen ist. Wir ergaenzen daher
-- `reclassification_email_sent_at` als Versand-Timestamp.
--
-- Worker-Logik (Edge Function send-reclassification-emails):
--   WHERE reclassification_suggested_at IS NOT NULL
--     AND (
--       reclassification_email_sent_at IS NULL
--       OR reclassification_email_sent_at < reclassification_suggested_at
--     )
--
-- Damit werden:
--   - Erstvorschlaege gesendet (sent_at IS NULL).
--   - Wiederholte Vorschlaege gesendet wenn der Worker den Suggested-At
--     nach 30 Tagen wieder hochsetzt (sent_at < suggested_at).
-- ============================================================================

alter table public.customers
  add column if not exists reclassification_email_sent_at timestamptz;

comment on column public.customers.reclassification_email_sent_at is
  'Wann die letzte Reklassifikations-Vorschlags-E-Mail an den Kunden raus ist. NULL = noch nie gesendet.';

-- Partial Index fuer den Worker — nur Pending-Kandidaten lesen.
create index if not exists customers_pending_reclassification_email_idx
  on public.customers(reclassification_suggested_at desc)
  where reclassification_suggested_at is not null
    and (reclassification_email_sent_at is null
         or reclassification_email_sent_at < reclassification_suggested_at);
