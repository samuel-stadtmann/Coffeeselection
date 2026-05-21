# Test-Dokumentation — Coffee Selection (Staging)

Diese Anleitung führt durch alle wichtigen Abläufe. Teste auf
**staging.coffeeselection.ch**. Bei Fehlern bitte notieren:
**(1)** welche Seite/URL, **(2)** was du erwartet hast, **(3)** was passiert ist,
**(4)** Screenshot + falls möglich DevTools → Network → fehlgeschlagener
Request (Status-Code + Response).

> Tipp: Für Test-Bestellungen Stripe-Test-Karte `4242 4242 4242 4242`,
> beliebiges zukünftiges Datum, beliebiger CVC.

---

## 1. Konto & Login

### 1.1 Konto erstellen
1. Inkognito-Tab → `/login` → Tab „Konto erstellen"
2. E-Mail + Passwort (min. 8 Zeichen) + Vorname/Nachname + Newsletter-Checkbox
3. Klick „Konto erstellen"
- ✅ Browser bietet Passwort-Speichern an (autocomplete)
- ✅ Bei aktiver E-Mail-Bestätigung: „Bestätigungs-Mail geschickt", Formular leert sich
- ✅ Link in der Mail führt auf staging (nicht 404)

### 1.2 Login
1. `/login` → Tab „Einloggen" → Mail + Passwort
- ✅ Nach Login Weiterleitung ins Konto-Dashboard

### 1.3 Eingeloggt bleiben
1. Eingeloggt → Person-Icon oben rechts klicken
- ✅ Landet direkt auf `/account/dashboard`, **KEINE** erneute Anmeldemaske

### 1.4 Passwort vergessen
1. `/login` → „Passwort vergessen?" → Mail eingeben
- ✅ Reset-Mail kommt an, Link funktioniert

---

## 2. Quiz & Match

### 2.1 Quiz als neuer Besucher
1. Home → „Quiz starten" → 12 Fragen durchklicken
- ✅ Nach letzter Frage: Lade-Animation → Anmeldemaske (Quiz speichern)
- ✅ Nach Anmeldung: `/match-result` mit deinem Geschmackstyp + Match-Kaffee

### 2.2 Quiz als eingeloggter User (Wiederholung)
1. Eingeloggt → „Quiz wiederholen"
- ✅ **KEINE** erneute Anmeldemaske — direkt zum Match-Result
- ✅ Neuer Geschmackstyp wird gespeichert (alter überschrieben)

### 2.3 Match-Result Bestelltyp
- ✅ Drei Optionen: **Abo** / **Discovery** / **Einmal**
- ✅ Discovery-Badge zeigt „−10 %" (nicht „Neu")

---

## 3. Shop & Coffee-Detail

### 3.1 Coffee-Detailseite (`/coffee/<slug>`)
- ✅ Kurzer Beschreibungstext direkt unter dem Bild
- ✅ Aromen lesbar in Umgangssprache (z.B. „Milchschokolade", nicht „choco_milk")
- ✅ Kauf-Tabs: **Einmalig | Abo | Discovery**, Discovery + Abo zeigen „−10 %"

### 3.2 Discovery-Funnel-Auto-Vorauswahl
1. Home → Section „Discovery Box" → CTA → Quiz → Match-Result
- ✅ „Discovery" ist vorausgewählt
2. `/coffee/<slug>` direkt aufrufen (ohne Funnel)
- ✅ Discovery ist NICHT automatisch vorgewählt

---

## 4. Warenkorb & Checkout

### 4.1 Einmalkauf
1. Coffee → „Einmalig" → Menge/Gewicht → in den Warenkorb → Cart → Checkout
- ✅ Bei eingeloggtem User: E-Mail + Name + Adresse vorausgefüllt
- ✅ Stepper zeigt 3 Schritte (Warenkorb / Checkout / Bestätigung)
- ✅ „Bezahlen"-Button deaktiviert solange Pflichtfelder leer
2. Bezahlen mit Test-Karte
- ✅ Nach Bezahlung: Erfolgsseite, **Warenkorb ist leer**
- ✅ Bestellung erscheint in `/account/order-history`

### 4.2 Abo bestellen
1. Coffee → „Abo" → Intervall wählen → Warenkorb → Checkout → bezahlen
- ✅ Abo erscheint in `/account/subscription` + Dashboard
- ✅ Bestätigungs-Mail

### 4.3 Discovery-Abo
1. Coffee → „Discovery" → bezahlen
- ✅ In der DB: `subscriptions.discovery_mode = true`
- ✅ Bei jeder Folgelieferung neuer Coffee aus dem Geschmackstyp (testbar nur über Zeit / Renewal)

### 4.4 Stripe-Abbruch
1. Im Stripe-Checkout auf „Zurück"
- ✅ Landet auf `/checkout/review?canceled=1` mit Hinweisbox, Warenkorb bleibt

### 4.5 Promo-Code
1. Im Checkout einen Kampagnen-Code aus `/admin/rewards` eingeben
- ✅ Rabatt wird abgezogen

---

## 5. Konto-Bereich

### 5.1 Dashboard
- ✅ Zeigt **deine** Zahlen (Bestellungen, Umsatz, Abos) — nicht die von anderen
- ✅ Ohne Abo: „Kein aktives Abo"-CTA statt Fake-Daten

### 5.2 Geschmacksprofil (`/account/taste-profile`)
- ✅ Profil-Reife-Box mit Prozent + Label (Frisch / Aufbau / Solide / Sehr ausgereift)
- ✅ Quiz-Antworten werden angezeigt

### 5.3 Favoriten
1. Auf Coffee-Detail + Röster-Seite das Herz klicken → `/account/favorites`
- ✅ Beide erscheinen (Kaffees MIT Herkunft + Röster, Röster mit Stadt)

### 5.4 Einstellungen (`/account/settings`)
- ✅ Stammdaten (Name, Sprache) speicherbar
- ✅ **Standard-Lieferadresse** editierbar
- ✅ Newsletter-Toggle spiegelt Anmelde-Wahl, Änderung synct mit Resend
- ✅ Passwort ändern funktioniert
- ✅ Daten-Export + Konto löschen

### 5.5 Abo verwalten (`/account/subscription`)
- ✅ Pausieren / Fortsetzen / Kündigen

---

## 6. Newsletter & Kontakt

### 6.1 Footer-Newsletter
1. Home → Footer → E-Mail eingeben → Pfeil
- ✅ „✓ Danke — du bist dabei", Kontakt erscheint in Resend-Audience

### 6.2 Kontaktformular (`/contact`)
1. Formular ausfüllen + senden
- ✅ Success-Meldung, Mail kommt an `CONTACT_INBOX_EMAIL` an

### 6.3 Footer Social-Icons
- ✅ Instagram / Facebook / LinkedIn Icons (verlinken aktuell auf `#` — Accounts noch nicht live)

---

## 7. Admin-Bereich (`/admin`)

> Zugang nur für berechtigte Admin-Accounts (Sam + Mattia).

### 7.1 Dashboard
- ✅ 9 KPIs + Charts (Tag/Woche/Monat/Jahr umschaltbar)
- ✅ CAC/CPO zeigen Werte (sobald Marketing-Aktivitäten erfasst), sonst „—"
- ✅ Churn-Chart zeigt Kündigungen (nach diesem Fix)

### 7.2 Kunden (`/admin/customers`)
- ✅ Suche nach Name/E-Mail, Sortierung, Filter
- ✅ Klick auf Namen → Detail-Seite
- **Detail-Seite:**
  - ✅ Stammdaten + Adresse editierbar
  - ✅ Gutschrift/Marketing-Code zuweisen
  - ✅ Konto soft-löschen
  - ✅ Abos: Status-Buttons (Pause/Fortsetzen/Kündigen) + „Bearbeiten" (Intervall/Menge/Gewicht)
  - ✅ Bestellungen mit Coffee-Namen + „Rechnung ↓"-Button
  - ✅ Guthaben-Bewegungen

### 7.3 Soft-Delete + Neu-Registrierung (wichtig!)
1. Test-User im Admin löschen
- ✅ In Supabase → Authentication → Users ist er weg
- ✅ Gleiche E-Mail kann sich frisch registrieren → sauberes neues Profil
- ✅ Alte Bestellungen bleiben (anonymisiert) in der DB

### 7.4 Coffees (`/admin/coffees`)
- ✅ Suche nach Name/Röster/Slug
- ✅ Klick auf Namen → Bearbeiten-Seite (NICHT Shop), ↗ = Shop-Ansicht
- ✅ Neuen Coffee anlegen funktioniert (auch mit Umlauten im Namen)
- ✅ Einkaufspreise nachpflegen (`/admin/coffees/wholesale`)

### 7.5 Marketing (`/admin/marketing`)
- ✅ Aktivität anlegen (Kanal, Name, Budget, Spent, Datum)
- ✅ Spent inline updaten, löschen
- ✅ Fliesst in Dashboard-CAC

### 7.6 Röster (`/admin/roasters`)
- ✅ Röster anlegen/bearbeiten
- ✅ **Auszahlungs-Daten** (IBAN, BIC, UID) im Edit-Panel
- ✅ **Auszahlungs-Report** (Button): Wholesale pro Röster pro Monat + CSV-Export

### 7.7 Rewards (`/admin/rewards`)
- ✅ Kampagnen anlegen
- ✅ Marketing-Aufwand-Report (30 Tage) + CSV

---

## 8. Bekannte offene Punkte (NICHT als Bug melden)

Diese sind bekannt und teils noch in Klärung — bitte nicht doppelt melden:

- **Abo „Bearbeiten" (Menge/Intervall):** Änderung wirkt nur auf die DB
  (zukünftige Renewals), die Stripe-Subscription wird NICHT umgebogen.
  Stripe zieht weiter den ursprünglichen Betrag ein. Bewusste Limitierung —
  finale Lösung braucht Produktentscheid.
- **Discovery-Renewal:** wenn alle Coffees des Geschmackstyps in den letzten
  6 Lieferungen waren, kommt vorübergehend wieder der Initial-Coffee.
- **Stripe Live:** läuft noch im Test-Modus. Echte Zahlungen erst nach
  Live-Key-Umstellung.
- **Domain:** noch auf staging, Production-Domain folgt.
- **AGB/Datenschutz:** Platzhalter, anwaltliche Version folgt.
- **Zug-Stadtbild:** generisches Alpen/See-Foto (kein spezifisches Zug-Bild
  auf Pexels gefunden).
- **Allergen-Filter bei System-Fehler:** falls die Empfehlungs-RPC ausfällt,
  greift ein Fallback ohne Allergen-Filter (Edge-Case, wird beobachtet).

---

## 9. Wenn du einen Bug findest

Schick mir bitte:
1. **URL** der Seite
2. **Was du getan hast** (Schritte)
3. **Was du erwartet hast** vs. **was passiert ist**
4. **Screenshot**
5. Falls Fehlermeldung: DevTools (F12) → Tab **Network** → den roten/fehlgeschlagenen
   Eintrag anklicken → Tab **Response** → Text kopieren
6. Falls die Seite ganz crasht: DevTools → Tab **Console** → Fehlertext kopieren

Damit kann der Fehler gezielt + schnell behoben werden.
