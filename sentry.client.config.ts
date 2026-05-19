// Sentry-Init fuer Browser-Code (App-Router Pages, Client-Components).
//
// Aktiviert sich NUR wenn NEXT_PUBLIC_SENTRY_DSN gesetzt ist — sonst
// kompletter Skip, kein Performance-Hit fuer Dev/Preview.
//
// Sample-Rates konservativ: 100 % Errors, 10 % Performance-Traces.
// Hochziehen wenn das Production-Volumen das vertraegt.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0,
    debug: false,
  });
}
