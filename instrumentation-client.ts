// Sentry-Init fuer Browser-Code (App-Router Pages + Client-Components).
//
// Aktiviert sich nur wenn NEXT_PUBLIC_SENTRY_DSN gesetzt ist — sonst
// kein Bundle-Overhead und keine Init-Versuche.
//
// PERFORMANCE-ENTSCHEIDUNG:
//   Session Replay ist standardmaessig AUS. Es lud ~50 kB extra Client-JS
//   und zeichnete bei 10% aller Sessions kontinuierlich das DOM auf —
//   spuerbarer CPU-/Netzwerk-Overhead, der die Seite verlangsamt hat.
//   Error-Monitoring + Tracing reichen fuer den Produktiv-Start. Wer
//   Replay temporaer fuer einen schwer reproduzierbaren Bug braucht,
//   setzt NEXT_PUBLIC_SENTRY_REPLAY=1 als Vercel-Env-Var.
//
//   - tracesSampleRate: 10% in Prod, 100% in Dev
//   - sendDefaultPii: Request-Kontext fuer User-Korrelation
//   - enableLogs: Sentry-Logs-Produkt

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const replayEnabled = process.env.NEXT_PUBLIC_SENTRY_REPLAY === "1";

if (dsn) {
  Sentry.init({
    dsn,
    sendDefaultPii: true,
    tracesSampleRate:
      process.env.NODE_ENV === "development" ? 1.0 : 0.1,
    enableLogs: true,
    // Replay nur wenn explizit eingeschaltet — sonst leeres Integrations-
    // Array, der schwere Replay-Chunk wird gar nicht geladen.
    integrations: replayEnabled ? [Sentry.replayIntegration()] : [],
    ...(replayEnabled
      ? { replaysSessionSampleRate: 0.1, replaysOnErrorSampleRate: 1.0 }
      : {}),
    debug: false,
  });
}

// App-Router Navigation-Transitionen instrumentieren — Client-Navigation
// wird zu eigenen Spans, Performance-Daten fliessen pro Page-Wechsel rein.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
