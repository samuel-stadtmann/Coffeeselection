# Coffee Selection — Skripte

Test- und Wartungs-Skripte fuer den Matching-Algorithmus.

## Setup (einmalig)

```bash
cd scripts
npm install
cp .env.example .env
# .env oeffnen und SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY eintragen
```

Die Werte findest du im Supabase-Dashboard unter **Settings -> API**:
- `Project URL` -> `SUPABASE_URL`
- `service_role` (geheim) -> `SUPABASE_SERVICE_ROLE_KEY`

> **Sicherheits-Hinweis:** Der `service_role`-Key umgeht alle RLS-Policies.
> NIE ins Frontend einbauen. Nicht in Git committen (`.env` ist in `.gitignore`).

## Verfuegbare Skripte

### `test_classifier.js` — Klassifikator-Test (Schritt 9.6)

Laeuft alle goldenen Test-Profile aus `public.test_quiz_profiles` durch
`simulate_classification()` und vergleicht das Ergebnis mit den
Erwartungen.

```bash
node test_classifier.js
# oder
npm run test:classifier
```

Exit-Codes:
- `0` — alle Tests bestanden
- `1` — mindestens ein Test fehlgeschlagen (Algorithmus NICHT deployen)
- `2` — Konfigurationsfehler

Beispiel-Ausgabe (alles ok):
```
Coffee Selection — Klassifikator-Test
Supabase: https://xxx.supabase.co

Gefundene Profile: 8

PASS  Standard-Vollautomat-Trinker
       Typ: 1 (Klassiker)  Conf: 0.812  Score: 92/100  Coverage: 1.00
PASS  Skandinavischer Filter-Purist
       Typ: 2 (Fruchtfreund)  Conf: 0.847  Score: 96/100  Coverage: 1.00
...

Zusammenfassung
  Passed: 8
  Failed: 0
  Total:  8

ALLE TESTS OK
```

## Goldene Regel

Jedes Mal, wenn das Quiz-Scoring (`public.quiz_scoring`) geaendert wird,
muessen alle Test-Profile gruen sein, BEVOR der Algorithmus deployed wird.
Im Zweifel: Aenderung zurueckrollen und neu kalibrieren.
