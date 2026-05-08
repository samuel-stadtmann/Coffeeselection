# Go-Live Checklist

Diese Liste enthält alles, was vor dem Production-Launch von Development/Test- auf Production-Werte umgestellt werden muss.

## Supabase

- [ ] **Email-Templates**: Aktuell auf Development-Texten. In Supabase → Authentication → Email Templates die finalen Texte (de-CH) für Confirmation-, Magic-Link-, Password-Reset- und Email-Change-Mails einfügen.
- [ ] **SMTP-Provider**: Standard Supabase-Sender hat Rate-Limits (~30 Mails/h). Vor Launch eigenen SMTP (Resend / Postmark / SendGrid) in Supabase → Authentication → Email Settings konfigurieren.
- [ ] **Site URL & Redirect URLs**: Auf finale Production-Domain umstellen (Authentication → URL Configuration). Dev-URLs (`localhost:3000`, Vercel-Preview-URLs) entfernen oder behalten (jeweils mit Begründung).
- [ ] **Email-Confirmation Required**: Aktuell prüfen ob aktiv. Vor Launch sicherstellen dass User Email bestätigen müssen, bevor Login möglich ist.
- [ ] **RLS-Policies prüfen**: `rls_status`-View laufen lassen, alle Tables mit User-Daten müssen RLS aktiv haben.

## Stripe / Shopify

- [ ] Test-Keys → Live-Keys (in Vercel Env-Vars).
- [ ] Webhook-URLs auf Production-Domain umstellen.

## Domain & DNS

- [ ] Custom Domain in Vercel verifizieren.
- [ ] SSL-Zertifikat aktiv.
- [ ] `next.config.ts` `images.remotePatterns` auf finalen Image-Host (Supabase Storage / CDN) erweitern.

## Analytics & Monitoring

- [ ] Google Analytics / Plausible Tracking-ID einbauen.
- [ ] Sentry o.ä. für Error-Tracking.
- [ ] Vercel Analytics aktivieren.

## SEO

- [ ] `app/sitemap.ts` mit finalen Routen.
- [ ] `app/robots.ts` von `noindex` auf `index, follow` umstellen.
- [ ] OpenGraph-Bilder pro wichtiger Page.
- [ ] Strukturierte Daten (Schema.org Product/Organization).

## Content

- [ ] Logo-PNG ohne transparente Ränder zuschneiden (`public/logo.png`).
- [ ] Echte Schweizer Röstereien + Coffees in DB einpflegen (statt Mock-Daten).
- [ ] City-SEO-Pages mit echten Stadt-Fotos (statt Coffee-Placeholder in `lib/images.ts`).
- [ ] AGB & Datenschutzerklärung schreiben (aktuell Stub-Links).

## Auth & Account

- [ ] Mock-Daten in Account-Pages durch echte DB-Queries ersetzen (Phase 2 der Supabase-Anbindung).
