# Supabase Auth E-Mail-Templates (Coffee Selection CI)

Diese HTML-Dateien ersetzen die englischen Supabase-Default-Mails. Sie werden
**nicht automatisch deployed** — sie müssen **manuell** im Supabase-Dashboard
eingefügt werden, weil Supabase Auth-Mails serverseitig rendert (kein Repo-Pfad).

## Wo einfügen

Supabase Dashboard → **Authentication → Emails → Templates**. Pro Template:
1. Subject (Betreff) setzen (siehe Tabelle unten).
2. Den HTML-Inhalt der jeweiligen Datei in das „Message body (HTML)"-Feld kopieren.
3. Speichern.

| Datei | Dashboard-Template | Betreff (de-CH) |
|-------|--------------------|-----------------|
| `01-confirm-signup.html` | Confirm signup | Bestätige deine Anmeldung bei Coffee Selection |
| `02-magic-link.html` | Magic Link | Dein Login-Link für Coffee Selection |
| `03-reset-password.html` | Reset Password | Passwort zurücksetzen |
| `04-change-email.html` | Change Email Address | Bestätige deine neue E-Mail-Adresse |
| `05-invite.html` | Invite user | Du wurdest zu Coffee Selection eingeladen |

## WICHTIG — Platzhalter nicht verändern

Die `{{ .ConfirmationURL }}` / `{{ .Email }}` / `{{ .NewEmail }}` / `{{ .SiteURL }}`
sind GoTrue-Variablen, die Supabase beim Versand ersetzt. **Werden sie entfernt
oder umbenannt, funktionieren die Links nicht mehr.** Texte/Styles drumherum
sind frei anpassbar.

## Logo

Die Templates referenzieren `https://coffeeselection.ch/logo.png`. Das Bild ist
erst sichtbar, wenn die Domain live ist und `logo.png` ausliefert. Bis dahin
zeigen Mail-Clients den alt-Text „Coffee Selection". Auf Staging ggf. die
URL in den Dateien temporär auf die Staging-Domain ändern.

## Voraussetzungen für korrekte Links

- Supabase → Authentication → URL Configuration → **Site URL** auf die finale
  Domain setzen (sonst zeigen `{{ .ConfirmationURL }}`-Links auf localhost).
- Redirect-URLs entsprechend pflegen.
</content>
