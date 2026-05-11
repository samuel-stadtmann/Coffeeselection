# Staging — Stabiler Admin-Test-Workflow

**Letzte Aktualisierung: 2026-05-11**

Diese Doc ist die _Single Source of Truth_ für Staging. Bei jeder
Unsicherheit ("welche URL?", "warum funktioniert XY nicht?") zuerst hier
nachschauen.

---

## 1) Die EINE URL die du nutzt

```
https://coffeeselection-git-staging-samuelstadtmann-4931s-projects.vercel.app
```

**Bookmarke diese URL.** Sie zeigt immer den letzten Commit auf dem
`staging`-Branch.

**Nicht** verwenden:
- `coffeeselection-h6xwocebo-...vercel.app` o.ä. (Hash-URLs sind
  Deploy-spezifische Snapshots, andere Domain → Cookies werden nicht
  geteilt, du bist auf dieser URL nicht eingeloggt).
- Vercel-Production-Domain (gibt's auf `main`-Branch).

---

## 2) Login-Flow (3 Schritte)

1. **Browser-Login**:
   `https://...staging.../login` → mit deiner Admin-E-Mail einloggen.
2. **Re-Auth**:
   Klick auf einen Admin-Link (z.B. Footer der Homepage "Admin · Metriken")
   → leitet auf `/admin/reauth` weiter → Passwort erneut eingeben.
3. **Drin**:
   Du landest auf `/admin/metrics`. Tabs oben: Metriken · Coffees · System.

**Sliding-Expiry:** Solange du innerhalb 30 Min eine Admin-Aktion machst
(Tab-Wechsel, Speichern, etc.), bleibt das Re-Auth-Cookie frisch. Erst
bei 30 Min Inaktivität wirst du wieder nach Passwort gefragt.

---

## 3) System-Health-Seite (wichtig!)

Wenn irgendwas seltsam wirkt, **immer zuerst**:

```
/admin/health
```

Diese Seite zeigt live:

- ✓/✗ Alle Env-Variablen gesetzt (Supabase, OpenAI, Resend, Admin)
- ✓/✗ Supabase erreichbar (echter Query gegen `coffees`)
- ✓/✗ OpenAI API erreichbar (echter HEAD-Request)
- ✓/✗ Dein eingeloggter User ist in `ADMIN_EMAILS`
- Deploy-Info: Commit-SHA, Branch, Environment, Region

Wenn dort alles grün ist → Bug ist im Code. Wenn rot → Hint folgen
(meistens fehlt eine Env-Var oder du musst Redeployen).

---

## 4) Required Env-Variablen auf Vercel

In Vercel → Project → Settings → Environment Variables. **Wichtig**:
für jede Variable müssen alle 3 Scopes gesetzt sein (Production, Preview,
Development), sonst greift sie auf der Staging-Preview nicht.

| Variable | Beispielwert | Wofür | Min-Länge |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase-Client | — |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` | Anon-Reads, Auth | 40+ |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` | Service-Reads (Admin) | 40+ |
| `ADMIN_REAUTH_SECRET` | 32-Hex-String | HMAC für Reauth-Cookie | 16+ |
| `ADMIN_EMAILS` | `samuel@cs.ch,mattia@cs.ch` | Komma-getrennte Whitelist | — |

**Nicht auf Vercel** (sondern als Secrets im Supabase-Dashboard →
Edge Functions → Manage Secrets):

- `OPENAI_API_KEY_COFFEESELECTION` — für Embedding-Generierung
- `RESEND_API_KEY` — für Re-Klassifikations-Mails

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

→ Du bist nicht eingeloggt **auf dieser Domain**. Hash-URLs haben
   eigene Cookies. Geh zurück auf die Stable-URL (Punkt 1).

→ Falls Stable-URL und trotzdem kein Link: F12 → Network →
   `/api/admin/check` aufrufen. Antwort `{isAdmin: false}` heißt:
   entweder nicht eingeloggt oder E-Mail nicht in `ADMIN_EMAILS`.
   `/admin/health` zeigt dir das eindeutig.

### "Re-Auth fehlgeschlagen — Versuch's nochmal"

Reihenfolge zum Diagnosen:

1. `ADMIN_REAUTH_SECRET` auf Vercel gesetzt? → `/admin/health` checken.
2. Tippfehler im Secret? → Wert neu setzen, **Redeploy**, nochmal versuchen.
3. Passwort wirklich richtig? → Inkognito-Tab + `/login` direkt testen.

### "Tab-Klick führt auf Startseite"

→ War ein Bug (Logo-Overlay klaute Klicks). Fix wurde in PR #9 gemerged.
   Falls neuer Vercel-Deploy noch nicht durch ist: 1–2 Min warten,
   dann `Strg+Shift+R` (Hard-Reload) auf der Seite.

### "Coffee-Liste leer"

→ `/admin/health` öffnen: Supabase-Check rot? Service-Role-Key fehlt
   oder das Supabase-Projekt ist pausiert.

→ Supabase-Check grün, Liste trotzdem leer? Echter Datenbank-Zustand:
   wirklich keine Coffees vorhanden. Über Supabase-Dashboard → Table
   Editor → `coffees` nachschauen.

### "Hab gepusht, aber Staging zeigt alten Stand"

→ Vercel-Dashboard → Deployments → letzter Deploy. Status `Ready`?
   Wenn `Failed` → Build-Logs lesen.

→ `Ready` aber Stable-URL zeigt alt: Browser-Cache. `Strg+Shift+R`
   (Hard-Reload).

→ `/admin/health` zeigt unter "Commit" den SHA, der wirklich live ist.
   Vergleich mit `git rev-parse origin/staging` lokal.

### "MIDDLEWARE_INVOCATION_FAILED" (500-Fehler)

→ Fehlende Env-Var bei `NEXT_PUBLIC_SUPABASE_URL` oder
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Auf allen 3 Scopes setzen + Redeploy.

---

## 6) Workflow bei Code-Änderungen

```
Feature-Branch (z.B. claude/implement-loop-XYZ)
   ↓ Push
   ↓ PR auf staging
   ↓ Merge
staging-Branch
   ↓ Vercel auto-deploys
Stable-URL (Punkt 1)
```

**Bei jedem Merge nach staging:**
1. Warten bis Vercel "Ready" zeigt (1–3 Min).
2. `/admin/health` öffnen → Commit-SHA matched mit Merge-Commit?
3. Smoke-Test: Login → Metrics → Coffees → einen Coffee öffnen.

**Nur bei "alles grün" weitermachen.**

---

## 7) Was kommt noch (für später)

- **Baustein C — automatisches Smoke-Test-Skript**:
  `npm run smoke:staging` läuft Playwright durch Login → /admin/coffees
  → /admin/coffees/new → Form ausfüllen → Speichern. Fängt Regressions
  ab bevor du sie merkst. Wird in separater Session gebaut, sobald
  A + B stabil laufen.
- **Vercel Production Domain** (Hostpoint) — siehe PRE_GO_LIVE.md P11.
- **Roaster-Self-Service** — P13 in PRE_GO_LIVE.md.
