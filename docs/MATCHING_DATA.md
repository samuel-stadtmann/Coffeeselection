# Matching-Daten: Was der Algorithmus von einem Coffee braucht

Dieses Dokument klärt, **welche Coffee-Felder das Empfehlungs-System
verwendet** und welche aus diesem Grund im Roster-Form Pflicht sind.

Datum: 2026-05-12. Stand nach dem Pflicht-Sweep.

---

## Pflicht-Felder (Form blockiert Submit ohne diese)

Aus `validateCoffee()` in `lib/coffee/form-helpers.ts`:

| Feld | Pflicht weil | Konsequenz wenn fehlt |
|---|---|---|
| `name` | Identität + Embedding-Text | — |
| `slug` | URL + DB-Constraint | — |
| `roaster_id` | FK + RLS | — |
| `flavor_description` ≥ 100 Zeichen | **Embedding-Text-Input #1** (Edge Function `generate-coffee-embedding`) | Embedding ist semantisch leer → Cosine-Similarity-Score ist Rauschen |
| `aroma_families` ≥ 1 Eintrag | Soft-Scoring (`compute_scoring_score`) + Embedding-Text | Kunden mit Aroma-Quiz-Antworten bekommen diesen Coffee nicht passend gerankt |
| Alle 5 Sensorik-Achsen aktiv eingestellt (`sensory_touched`) | Manhattan-Distance-Scoring + Embedding-Text + Soft-Score | Defaults (alles Median 6/10) sabotieren das Distance-Scoring — alle Coffees mit Defaults sehen identisch aus, kein Matching möglich |
| `price_chf > 0` | Hartfilter `get_eligible_coffees` (Preisvergleich) | Coffee wird ausgefiltert (Division durch undefined) |
| `weight_g > 0` | Hartfilter (Preis-Normalisierung auf 250 g) | Wie oben |

## Empfohlen (warn — Submit erlaubt, aber Score-Penalty)

- **`is_decaf` + `decaf_method`-Konsistenz** — Decaf-Kunden bekommen sonst keinen Treffer
- **Konsistenz-Plausibilitäten** (Light + hohe Bitterkeit, Dunkel + max Säure, …) — UX-Hilfe, nicht algorithmisch
- **`roast_profile`** (espresso / filter / omni) — wird seit Migration `20260512100000` direkt vom Algo gelesen für Brewing-Match-Bonus. Default 'omni' bekommt immer Bonus, sonst nur bei Match zur Kunden-Bruehmethode aus Quiz Frage 1.
- **`acidity`** — wird seit Migration `20260512200000` zusätzlich genutzt für Low-Acidity-Bonus: Kunden mit Quiz-Antwort `often`/`always` auf Frage 9 (Magen-Empfindlichkeit) bekommen einen linearen Bonus (max +10) für Coffees mit acidity ≤ 2. Säurearme Coffees ranken bei diesen Kunden also höher, ohne dass säurereiche ausgeschlossen werden.

## Score-Boni (Form lässt durch, aber `data_quality_score` sinkt)

Aus dem DB-Trigger `compute_coffee_quality_score()`:

- Herkunft: `origin_id`, `region`, `processing_method_id`, `variety_id` (je +5)
- Bonus: `altitude_m_min`, `harvest_year`, `sca_score ≥ 80` (je +5)
- Konsistenz: 4 Plausibilitäts-Checks (Röst×Bitterkeit etc.)
- Embedding generiert (+5 nach Save automatisch)

→ Score ≥ 75 = vom Algorithmus voll empfohlen.
Score < 75 = Coffee braucht entweder mehr Daten ODER manuellen Override
(`/admin/coffees` → "Manuell freigeben").

## Was die Pipeline wirklich liest

### Embedding-Generator (`supabase/functions/generate-coffee-embedding`)

Konkatenierter Text aus:
- `name`
- `flavor_description` (Fallback: `tasting_summary` → `description` → `short_description`)
- `region`, `farm`, `producer`
- `roast_level` (1–5, mapped auf "light/medium/dark")
- `is_decaf`
- Sensorik-Achsen (acidity, body, sweetness, bitterness, complexity)
- `aroma_families`

Dieser Text geht durch OpenAI `text-embedding-3-small` → 1536-dim Vektor
landet in `coffees.flavor_embedding`.

### Hartfilter (`get_eligible_coffees`)

Disqualifiziert Coffees mit:
- `status != 'active'`
- `stock_status NOT IN ('in_stock', 'low_stock')` ODER `stock_kg < 0.25`
- Preis pro 250 g über Kunden-Maximum
- Allergene/Zertifikate matchen nicht zu Kundenwünschen
- Cooldown: kürzlich an diesen Kunden geliefert
- Kunde will Decaf aber Coffee ist nicht Decaf (oder umgekehrt)

### Soft-Score (`compute_scoring_score`)

7-Dimensions-Score (Playbook 5.3):
1–5. **Sensorik-Achsen** (Manhattan-Distanz vom Kunden-Profil)
6. **Aroma-Match** über `aroma_families`
7. **Vector-Similarity** (Cosine zwischen Customer-Embedding und Coffee-Embedding)

Ohne Sensorik = 5 Achsen zappeln auf Default → kein Signal.
Ohne Aroma = Achse 6 ist neutral 0 → keine Information.
Ohne Embedding = Achse 7 fällt aus → komplettes Scoring degradiert.

---

## Operativer Schluss

Für einen Coffee, der im Matching **perfekt performt**, brauchen wir:

✓ Name, Slug, Röster, Preis, Gewicht (Identität + Hartfilter)
✓ Sensorik aktiv gesetzt — alle 5 Achsen
✓ ≥ 1 Aroma-Familie
✓ Flavor-Description ≥ 100 Zeichen (semantisch dichter Text)
✓ Embedding-Generator läuft automatisch nach Save (Webhook)

Alles weitere (Herkunft, Aroma-Noten, Brühmethoden, Bild) erhöht
Quality-Score + Frontend-Anzeige, ist aber nicht algorithm-blockierend.
