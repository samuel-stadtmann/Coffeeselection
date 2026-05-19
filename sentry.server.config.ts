// Sentry-Init fuer Server-Code (Route Handlers, Server Components, Middleware).
//
// Aktiviert sich NUR wenn NEXT_PUBLIC_SENTRY_DSN (oder SENTRY_DSN als
// Server-only) gesetzt ist.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    debug: false,
  });
}
