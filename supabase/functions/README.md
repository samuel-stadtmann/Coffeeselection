# Supabase Edge Functions — Coffee Selection

Edge Functions fuer den Matching-Algorithmus (Schritt 9.7 / Playbook Kap. 5.5).

## Vorhandene Functions

| Name | Zweck |
|---|---|
| `generate-coffee-embedding`   | Berechnet `coffees.flavor_embedding` (1536-dim) aus Kaffee-Daten |
| `generate-customer-embedding` | Berechnet `customers.taste_embedding` aus Geschmackstyp + Lern-Tags |

Beide nutzen OpenAI `text-embedding-3-small` und schreiben das Resultat
zurueck in die DB (Service-Role).

## Voraussetzungen

1. **Supabase CLI** lokal installiert
   ```bash
   npm install -g supabase
   ```

2. **OpenAI API Key**
   Erstelle in [OpenAI Dashboard](https://platform.openai.com/api-keys) einen Key.

3. **Supabase Projekt verlinken** (einmalig)
   ```bash
   cd supabase
   supabase login
   supabase link --project-ref <DEIN_PROJECT_REF>
   ```
   `<DEIN_PROJECT_REF>` ist der Teil aus `https://<ref>.supabase.co`.

4. **Secrets setzen** (einmalig)
   ```bash
   supabase secrets set OPENAI_API_KEY=sk-...
   ```
   `SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY` werden automatisch
   bereitgestellt.

## Deployen

```bash
# Beide Functions deployen
supabase functions deploy generate-coffee-embedding
supabase functions deploy generate-customer-embedding
```

## Aufruf-Beispiele

### Coffee-Embedding fuer einen Kaffee
```bash
curl -X POST \
  "https://<ref>.supabase.co/functions/v1/generate-coffee-embedding" \
  -H "Authorization: Bearer <ANON_OR_SERVICE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"coffee_id": "c0000001-0000-0000-0000-000000000000"}'
```

### Alle Kaffees ohne Embedding (max 100)
```bash
curl -X POST \
  "https://<ref>.supabase.co/functions/v1/generate-coffee-embedding" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"all_missing": true}'
```

### Customer-Embedding
```bash
curl -X POST \
  "https://<ref>.supabase.co/functions/v1/generate-customer-embedding" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"customer_id": "<uuid>"}'
```

### Antwort-Format
```json
{
  "ok": true,
  "processed": 8,
  "tokens_used": 1234,
  "errors": []
}
```

## Ablauf-Empfehlung

**Kaffees:**
- Sofort nach Anlage/Aenderung (Trigger via DB-Webhook oder Admin-UI)
- Batchlauf `all_missing=true` als Reparatur

**Kunden:**
- Direkt nach Quiz-Submit (in `/api/quiz/submit`)
- Nach jedem Lern-Worker-Lauf (Schritt 9.9), wenn sich Tags geaendert haben
- Cron-Job `all_missing=true` fuer den Fall, dass etwas haengen blieb

## Lokal testen

```bash
supabase functions serve generate-coffee-embedding --env-file ./.env.local
```

`.env.local` muss enthalten:
```
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
```

> Niemals ins Git committen.
