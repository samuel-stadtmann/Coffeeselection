// Sentry-Init fuer Browser-Code (App-Router Pages + Client-Components).
//
// Aktiviert sich nur wenn NEXT_PUBLIC_SENTRY_DSN gesetzt ist — sonst
// kein Bundle-Overhead und keine Init-Versuche.
//
// Konfigurationsdetails:
//   - tracesSampleRate: 10% in Prod, 100% in Dev fuer einfacheres Debugging
//   - replaysSessionSampleRate: 10% aller Sessions
//   - replaysOnErrorSampleRate: 100% wenn ein Error passiert (wichtigster Fall)
//   - sendDefaultPii: true → Request-Headers + IP attached fuer User-Korrelation
//   - enableLogs: true → Sentry-Logs-Produkt aktiv (Sentry.logger.*)

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    sendDefaultPii: true,
    tracesSampleRate:
      process.env.NODE_ENV === "development" ? 1.0 : 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    enableLogs: true,
    integrations: [Sentry.replayIntegration()],
    debug: false,
  });
}

// App-Router Navigation-Transitionen instrumentieren — Client-Navigation
// wird zu eigenen Spans, Performance-Daten fliessen pro Page-Wechsel rein.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
