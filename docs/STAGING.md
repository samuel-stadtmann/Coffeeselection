# Staging — Stabiler Admin-Test-Workflow

**Letzte Aktualisierung: 2026-05-12**

Diese Doc ist die _Single Source of Truth_ für Staging. Bei jeder
Unsicherheit ("welche URL?", "warum funktioniert XY nicht?") zuerst hier
nachschauen.

---

## 1) Die EINE URL die du nutzt

```
https://staging.coffeeselection.ch
```

**Bookmarke diese URL.** Sie zeigt immer den letzten Commit auf dem
`staging`-Branch. Custom-Domain seit 2026-05-12 (vorher die hässliche
`coffeeselection-git-staging-...vercel.app`-URL).

**Nicht** verwenden:
- `coffeeselection-<hash>-...vercel.app` (Deploy-spezifische Snapshots,
  andere Domain → Cookies werden nicht geteilt, du bist da nicht eingeloggt)
- `coffeeselection.ch` (Apex/Production) — aktuell **nicht aktiv**, weil
  `main`-Branch hinter `staging` ist. Wird erst beim echten Launch
  reaktiviert.

---

## 2) Login-Flow (3 Schritte)

1. **Browser-Login**:
   `https://staging.coffeeselection.ch/login` → mit deiner Admin-E-Mail einloggen.
2. **Re-Auth**:
   Klick auf einen Admin-Link (Footer: "Admin · Metriken") → leitet auf
   `/admin/reauth` → Passwort erneut eingeben.
3. **Drin**:
   Du landest auf `/admin/metrics`. Tabs oben: Metriken · Coffees · Röster · System.

**Sliding-Expiry:** Solange du innerhalb 30 Min eine Admin-Aktion machst
(Tab-Wechsel, Speichern, etc.), bleibt das Re-Auth-Cookie frisch. Erst
bei 30 Min Inaktivität wirst du wieder nach Passwort gefragt.

---

## 3) System-Health-Seite (wichtig!)

Wenn irgendwas seltsam wirkt, **immer zuerst**:

```
https://staging.coffeeselection.ch/admin/health
```

Diese Seite zeigt live:

- ✓/✗ Alle Env-Variablen gesetzt (Supabase, Admin)
- ✓/✗ Supabase erreichbar (echter Query gegen `coffees`)
- ✓/✗ Dein eingeloggter User ist in `ADMIN_EMAILS`
- Deploy-Info: Commit-SHA, Branch, Environment, Region

Wenn dort alles grün ist → Bug ist im Code. Wenn rot → Hint folgen
(meistens fehlt eine Env-Var oder du musst Redeployen).

---

## 4) Required Env-Variablen auf Vercel

In Vercel → Project → Settings → Environment Variables. **Wichtig**:
für jede Variable müssen alle 3 Scopes gesetzt sein (Production, Preview,
Development), sonst greift sie auf der Staging-Preview nicht.

| Variable | Beispielwert | Wofür |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase-Client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` | Anon-Reads, Auth |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` | Service-Reads (Admin) |
| `ADMIN_REAUTH_SECRET` | 32-Hex-String (min 16 Zeichen) | HMAC für Reauth-Cookie |
| `ADMIN_EMAILS` | `samuel@cs.ch,mattia@cs.ch` | Komma-getrennte Whitelist |
| `NEXT_PUBLIC_SITE_URL` | `https://staging.coffeeselection.ch` | Redirect-Target in Invite-Mails |
| `STRIPE_SECRET_KEY` | `sk_test_...` (testmode) bzw. `sk_live_...` (prod) | Server-seitige Stripe-API-Calls. **Privat — nie an Browser leaken.** |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Webhook-Signatur-Validierung (eines pro Endpoint!) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` bzw. `pk_live_...` | Browser-seitiger Stripe-JS-Client. Public-safe. |

**Nicht auf Vercel** (sondern als Secrets im Supabase-Dashboard →
Edge Functions → Manage Secrets):

- `OPENAI_API_KEY_COFFEESELECTION` — für Embedding-Generierung
- `RESEND_API_KEY` — für Re-Klassifikations- und Invite-Mails
- `RESEND_FROM_EMAIL` — z.B. `Coffee Selection <hello@coffeeselection.ch>`

Die laufen serverless auf Supabase-Seite, NICHT in der Next.js-App.

**Reauth-Secret generieren** (lokal in Node):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Nach JEDER Env-Änderung in Vercel**: Deployments → letzter Deploy →
"⋯" → "Redeploy". Sonst hat die App den alten Wert im Bundle.

---

## 5) Troubleshooting — "Wenn X, dann Y"

### "Admin-Link fehlt im Footer"

→ Du bist nicht eingeloggt **auf dieser Domain**. Geh zurück auf die
   Stable-URL (Punkt 1).

→ Falls Stable-URL und trotzdem kein Link: F12 → Network →
   `/api/admin/check` aufrufen. Antwort `{isAdmin: false}` heißt:
   entweder nicht eingeloggt oder E-Mail nicht in `ADMIN_EMAILS`.
   `/admin/health` zeigt dir das eindeutig.

### "Re-Auth fehlgeschlagen"

1. `ADMIN_REAUTH_SECRET` auf Vercel gesetzt? → `/admin/health` checken
2. Tippfehler im Secret? → Wert neu setzen, **Redeploy**, nochmal versuchen
3. Passwort wirklich richtig? → Inkognito-Tab + `/login` direkt testen

### "Coffee-Liste leer"

→ `/admin/health` öffnen: Supabase-Check rot? Service-Role-Key fehlt
   oder das Supabase-Projekt ist pausiert.

### "Hab gepusht, aber Staging zeigt alten Stand"

→ Vercel-Dashboard → Deployments → letzter Deploy. Status `Ready`?

→ `Ready` aber Stable-URL zeigt alt: Browser-Cache. `Strg+Shift+R`.

→ `/admin/health` zeigt unter "Commit" den SHA, der wirklich live ist.
   Vergleich mit `git rev-parse origin/staging` lokal.

### "MIDDLEWARE_INVOCATION_FAILED" (500-Fehler)

→ Fehlende Env-Var bei `NEXT_PUBLIC_SUPABASE_URL` oder
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Auf allen 3 Scopes setzen + Redeploy.

### "Invite-Mail kommt nicht an"

→ Resend-Domain `coffeeselection.ch` verifiziert? Resend Dashboard →
   Domains → Status muss "Verified" sein (grün).

→ `RESEND_FROM_EMAIL` als Supabase-Edge-Function-Secret gesetzt
   (Format: `Coffee Selection <hello@coffeeselection.ch>`).

→ Spam-Ordner des Empfängers prüfen.

---

## 6) Workflow bei Code-Änderungen

```
Feature-Branch (claude/implement-loop-XYZ)
   ↓ Push
   ↓ PR auf staging
   ↓ Merge
staging-Branch
   ↓ Vercel auto-deploys
https://staging.coffeeselection.ch
```

**Bei jedem Merge nach staging:**
1. Warten bis Vercel "Ready" zeigt (1–3 Min)
2. `/admin/health` öffnen → Commit-SHA matched mit Merge-Commit?
3. **Falls neue Migration im PR**: SQL Editor → ausführen (siehe Punkt 7)
4. Smoke-Test: Login → Metriken → Coffees → einen Coffee öffnen

---

## 7) DB-Migrations nach Vercel-Deploy

**Wichtig:** Vercel deployed nur den Next.js-Code, **nicht** Supabase-
Migrations. Wenn ein PR eine neue `supabase/migrations/*.sql` enthält,
musst du sie manuell im Supabase SQL Editor ausführen.

**Schritte:**
1. `supabase/migrations/<timestamp>_*.sql` öffnen, Inhalt kopieren
2. Supabase Dashboard → SQL Editor → neuer Query → einfügen → Run
3. Bei Erfolg: keine Fehler. Idempotent (`IF NOT EXISTS`) — kein Schaden
   bei Re-Run

**Status der jüngsten Migrations** (Stand 2026-05-12):

| Migration | Inhalt | Run? |
|---|---|---|
| `20260510280000_coffee_verification.sql` | Verifikations-Felder | ⚠ Bitte prüfen |
| `20260510290000_wholesale_price.sql` | Einkaufspreis-Spalte | ⚠ Bitte prüfen |
| `20260511120000_roaster_users.sql` | Roaster-Portal (P13/P15) | ⚠ Bitte prüfen |
| `20260512000000_canonicalize_coffees_columns.sql` | flavor_description + stock_kg | ⚠ Bitte prüfen |
| `20260512100000_brewing_match_score.sql` | Brewing-Match-Bonus + rank-Funktion | ❌ **Pending** |
| `20260512200000_low_acidity_preference.sql` | Säure-Präferenz (Frage 9) | ❌ **Pending** |
| `20260512300000_quiz_remaining_preferences.sql` | Body/Complexity/Exploration (Fragen 10/11/12) | ❌ **Pending** |

⚠ = "Bitte einmal SQL-Editor öffnen, Inhalt einkopieren, Run. Wenn alles
schon drin ist, kommen 0 rows affected — kein Schaden."

❌ = "Definitiv noch nicht ausgeführt, weil neu seit dem letzten Merge."

**Reihenfolge (wichtig — neuere Migrations bauen auf älteren auf):**
Genau in der oben gelisteten Reihenfolge ausführen. Speziell die drei
`20260512_*` Migrations modifizieren alle `rank_coffees_for_customer` —
nur die letzte gewinnt, aber sie sind aufeinander aufbauend (`brewing →
+acidity → +body/complexity/exploration`).

Falls du sicher gehen willst dass alles drin ist:
```sql
-- Diese Query zeigt welche Spalten existieren:
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'customers'
  AND column_name IN (
    'prefers_low_acidity', 'preferred_body',
    'preferred_complexity', 'exploration_level'
  );
```
Erwartet: 4 Zeilen. Wenn weniger → entsprechende Migration nachholen.

---

## 8) Resend (E-Mail-Versand)

Stand 2026-05-12: Domain `coffeeselection.ch` ist via DNS in Resend
authentifiziert. Sender ist `hello@coffeeselection.ch`.

**Was funktioniert jetzt:**
- Invite-Mails (Admin lädt Röster ein)
- Password-Reset-Mails (jeder Empfänger, nicht nur verifizierte)
- Reklassifikations-Mails (über Edge Function)

**Vor jedem echten Versand prüfen:**
- Resend Dashboard → Domains → `coffeeselection.ch` zeigt "Verified" (grün)
- Supabase Edge Function Secret `RESEND_FROM_EMAIL` ist gesetzt

---

## 9) Was kommt noch (für später)

- **Baustein C — Playwright Smoke-Test**: `npm run smoke:staging` läuft
  Login → Coffees → Form → Speichern automatisiert
- **Production-Launch**: `coffeeselection.ch` (Apex) wieder zu Vercel
  hinzufügen, `staging → main` mergen, Migrations auf Production-DB
- **Roaster-Onboarding-PDF**: Skalen-Beispiele für die 1–10-Sensorik
