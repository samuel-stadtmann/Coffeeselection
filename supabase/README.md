# Coffee Selection — Datenbank

> Stand: April 2026 — erste produktive Datenschicht: **Kaffee-Datenbank** (Röster, Kaffees, Stammdaten-Kataloge).

Diese Anleitung ist auf Deutsch und bewusst einfach gehalten — du sollst sie auch in 6 Monaten ohne Hilfe verstehen können.

---

## Was ist gebaut

12 Tabellen im `public`-Schema deines Supabase-Projekts:

### Stammdaten-Kataloge (kontrolliertes Vokabular)
| Tabelle | Inhalt |
|---|---|
| `flavor_notes_catalog` | Aromen (Schoki, Beeren, Zitrus, Nüsse, …) — orientiert am SCA Flavor Wheel |
| `brewing_methods_catalog` | Zubereitungsmethoden (Espresso, V60, AeroPress, …) |
| `origins_catalog` | Herkunftsländer (Äthiopien, Kolumbien, Brasilien, …) |
| `varieties_catalog` | Kaffee-Varietäten (Bourbon, Geisha, Typica, SL28, …) |
| `processing_methods_catalog` | Aufbereitung (washed, natural, honey, anaerobic, …) |
| `certifications_catalog` | Bio Knospe, Fairtrade, Direct Trade, … |

### Geschäftsdaten
| Tabelle | Inhalt |
|---|---|
| `roasters` | Röster-Stammdaten — öffentlich lesbar |
| `roasters_payout` | IBAN, Provision, Vertrag — **nur** `service_role` |
| `coffees` | Haupttabelle: ein Datensatz pro Kaffee |
| `coffee_flavor_notes` | n:m — welcher Kaffee schmeckt nach was, mit Intensität 1–5 |
| `coffee_brewing_methods` | n:m — welche Brüh-Methoden empfohlen sind |
| `coffee_certifications` | n:m — welche Zertifikate ein Kaffee hat |

---

## Wie führst du eine Migration aus?

**Eine Migration ist eine SQL-Datei** im Ordner `supabase/migrations/`. Jede Datei beschreibt **einen** Änderungsschritt am Schema.

1. Browser → https://supabase.com/dashboard → dein Projekt anklicken.
2. Linkes Menü → **SQL Editor** (Symbol mit `{ }`).
3. Oben rechts **„+ New query"**.
4. Auf GitHub die Migrations-Datei öffnen (`supabase/migrations/...`) → „Raw" → Inhalt kopieren.
5. In den SQL Editor einfügen → **„Run"** (oder Cmd/Ctrl + Enter).
6. Erwartet: `Success. No rows returned`.

**Wichtig:** Migrationen in der **Reihenfolge der Dateinamen** ausführen (sie sind mit Zeitstempel versehen, sortieren sich alphabetisch korrekt).

### Frische Datenbank von Grund auf aufbauen
1. Im SQL Editor laufen lassen, in dieser Reihenfolge:
   1. `20260430120000_extensions_and_helpers.sql`
   2. `20260430120100_catalogs.sql`
   3. `20260430120200_roasters.sql`
   4. `20260430120300_coffees.sql`
2. Optional Beispieldaten: `seed.sql`

---

## Wie erstellst du eine **neue** Migration?

Wenn du das Schema später erweitern willst (z.B. neue Spalte, neue Tabelle):

1. **Niemals direkt im Studio** klicken. Das ist die wichtigste Regel.
2. Lege eine neue SQL-Datei im Ordner `supabase/migrations/` an.
3. Dateiname: `YYYYMMDDHHMMSS_kurz_beschreibung.sql`
   - Beispiel: `20260515093000_add_coffee_tags.sql`
   - Der Zeitstempel sorgt dafür, dass die Datei nach den bestehenden sortiert wird.
4. Inhalt: nur die **Änderung** (z.B. `alter table public.coffees add column tags text[];`).
5. Datei committen und pushen:
   ```
   git add supabase/migrations/20260515093000_add_coffee_tags.sql
   git commit -m "feat(db): tags-Feld an coffees ergaenzen"
   git push
   ```
6. Im Supabase SQL Editor die neue Migration ausführen.

So bleibt das Schema **reproduzierbar** — jede neue Umgebung (Staging, Tests, neuer Entwickler) kann von 0 auf den aktuellen Stand kommen, indem alle Migrationen der Reihe nach laufen.

---

## Konventionen (gelten für alle Tabellen)

Diese Regeln stammen aus dem Playbook (`Coffee_Selection_Kunden_DB_Playbook.docx`) und gelten **nicht verhandelbar** auch für die spätere Kunden-DB:

| Regel | Beispiel |
|---|---|
| **UUIDs** statt Auto-Inkrement | `id uuid primary key default gen_random_uuid()` |
| **snake_case**, Tabellen Plural | `coffee_flavor_notes`, `flavor_notes_catalog` |
| **Zeitspalten enden auf `_at`** | `created_at`, `updated_at`, `deleted_at` |
| **Geld ist `numeric(10,2)`** mit `_chf`-Suffix — NIE float | `price_chf numeric(10,2)` |
| **Booleans beginnen mit `is_`** | `is_decaf`, `is_blend` |
| **Soft-Delete** statt physisch löschen (Geschäftsdaten) | `deleted_at timestamptz` |
| **`active boolean`** statt `deleted_at` (Stammdaten) | `flavor_notes_catalog.active` |
| **Enums als TEXT mit CHECK** — kein Postgres-ENUM-Typ | `status text check (status in (…))` |
| **RLS auf jeder Tabelle aktivieren** | `alter table … enable row level security` |
| **`updated_at` per Trigger** automatisch | siehe Migration 001, Funktion `set_updated_at()` |

---

## Beispiel-Queries

Sechs typische Queries für den Alltag liegen in **`supabase/example_queries.sql`**:

| Q | Zweck |
|---|---|
| Q1 | Alle Kaffees eines Rösters |
| Q2 | Alle Kaffees mit einem bestimmten Aroma |
| Q3 | Top-bewertete Kaffees nach Herkunftsland (SCA-Score) |
| Q4 | Alle Kaffees, die für eine Brüh-Methode empfohlen sind |
| Q5 | Vollständige Detailansicht eines Kaffees |
| Q6 | Bestand-Dashboard pro Röster |

Einfach in den SQL Editor kopieren, Werte anpassen, Run.

---

## Wichtige Sicherheits-Hinweise

### RLS (Row Level Security) ist überall an
Jede Tabelle hat RLS aktiviert. Ohne explizite Policy darf **niemand** lesen oder schreiben — außer `service_role` (Server-Code), die RLS umgeht.

**Standard-Policies pro Tabelle:**
- **Stammdaten-Kataloge:** anon + authenticated lesen aktive Einträge.
- **`roasters`:** anon + authenticated lesen aktive, nicht gelöschte Röster.
- **`coffees`:** anon + authenticated lesen aktive, nicht gelöschte Kaffees im Sichtbarkeitsfenster (`visible_from`/`visible_until`).
- **Junction-Tables:** anon + authenticated dürfen lesen (sind ohne den Coffee/Roaster nutzlos).
- **`roasters_payout`:** **nur** service_role. Niemals von der Webseite abfragen.

### Keine sensiblen Daten in `roasters`
Bankverbindung, Provision, Vertragsdetails liegen ausschließlich in `roasters_payout` — diese Tabelle ist nicht öffentlich abfragbar. Selbst ein versehentliches `select *` liefert für anon/authenticated 0 Zeilen.

### Service-Role-Key ist der „Master-Schlüssel"
Im Supabase Dashboard unter **Settings → API** findest du den `service_role`-Key. Der **darf niemals ins Frontend** (Webseite, App). Nur Server-Code (Edge Functions, Backend-API). Wenn er leakt → sofort rotieren.

---

## Was kommt als nächstes?

Sobald die Kaffee-DB stabil läuft, baut Phase 2 die **Kunden-DB** mit:
- `customers`, `customer_addresses`, `customer_consents`
- `taste_profiles`, `flavor_preferences`, `taste_quiz_responses`
- `subscriptions`, `subscription_items`
- `orders`, `order_items` (mit Snapshot von Kaffee-Name/Preis)
- `payments`, `shipments`
- `coffee_ratings`, `recommendation_history`
- … und mehr (siehe `Coffee_Selection_Kunden_DB_Schema.xlsx` → 28 Tabellen)

Die Kaffee-DB ist deren Vorbedingung — alle Verknüpfungen aus der Kunden-DB zu Kaffees/Röstern referenzieren die hier angelegten Tabellen.

---

## Bei Problemen

- **Fehlercode `42P07: relation already exists`** → Tabelle ist schon da. Migration nicht erneut ausführen, oder prüfen ob sich das bestehende Schema vom erwarteten unterscheidet.
- **Fehlercode `42P01: relation does not exist`** → Vorgänger-Migration wurde nicht ausgeführt. In Reihenfolge nachholen.
- **Fehlercode `42501: permission denied`** → RLS-Policy blockiert den Zugriff. Prüfen, mit welcher Rolle du angemeldet bist (im Studio bist du `service_role`, in der App `authenticated`/`anon`).
- **Erweiterung `vector` fehlt** → im Dashboard unter **Database → Extensions** manuell aktivieren.

Wenn etwas hängt: keine destruktiven Befehle (`drop`, `truncate`) ohne Backup. Erstmal hier im Repo-Wiki oder bei Mattia nachfragen.

---

## Dateiübersicht in diesem Ordner

```
supabase/
├── README.md                                          ← du bist hier
├── example_queries.sql                                ← häufige Queries
├── seed.sql                                           ← Beispieldaten (3 Röster, 8 Kaffees)
└── migrations/
    ├── 20260430120000_extensions_and_helpers.sql     ← Migration 001
    ├── 20260430120100_catalogs.sql                    ← Migration 002
    ├── 20260430120200_roasters.sql                    ← Migration 003
    └── 20260430120300_coffees.sql                     ← Migration 004
```
