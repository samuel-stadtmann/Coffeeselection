// Sentry-Init fuer Server-Runtime (Server-Components, Route-Handlers,
// Server-Actions, API-Routes auf Node).
//
// includeLocalVariables: zeigt Werte lokaler Variablen im Stacktrace —
// massive Debug-Hilfe wenn eine Server-Action umkippt. Schaltbar
// falls Privacy/Performance-Bedenken aufkommen.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    sendDefaultPii: true,
    tracesSampleRate:
      process.env.NODE_ENV === "development" ? 1.0 : 0.1,
    includeLocalVariables: true,
    enableLogs: true,
    debug: false,
  });
}
