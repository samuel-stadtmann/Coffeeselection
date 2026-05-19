// Sentry-Init fuer Edge-Runtime (Middleware, Edge-API-Routes).
// Kein includeLocalVariables — Edge-Runtime unterstuetzt das nicht.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    sendDefaultPii: true,
    tracesSampleRate:
      process.env.NODE_ENV === "development" ? 1.0 : 0.1,
    enableLogs: true,
    debug: false,
  });
}
