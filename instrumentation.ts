// Server-Side Registration Hook fuer Sentry.
//
// Next.js ruft register() einmal beim Boot des Servers auf — wir dispatchen
// hier auf den passenden Runtime-Config-File. Client-Init laeuft separat
// via instrumentation-client.ts (Next.js laedt das automatisch).
//
// onRequestError = Sentry.captureRequestError automatisiert das Fangen
// aller ungefangenen Server-Side-Request-Errors (Server-Components,
// Route-Handlers, Server-Actions). Braucht @sentry/nextjs >= 8.28.0.

import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
