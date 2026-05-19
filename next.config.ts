import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "source.unsplash.com" },
    ],
  },
  async redirects() {
    return [
      // /quiz (no path) → start
      { source: "/quiz", destination: "/quiz/start", permanent: false },
      // New strategic sitemap → existing routes (until full rebuild)
      { source: "/dashboard", destination: "/account/dashboard", permanent: false },
      { source: "/insights", destination: "/account/taste-profile", permanent: false },
      { source: "/account", destination: "/account/dashboard", permanent: false },
      { source: "/recommendation/result", destination: "/match-result", permanent: false },
      { source: "/recommendation/why-this-match", destination: "/match-result", permanent: false },
      { source: "/recommendation/discovery-box", destination: "/subscription/discovery", permanent: false },
      { source: "/recommendation/subscription-upgrade", destination: "/subscription/discovery", permanent: false },
      { source: "/atelier", destination: "/subscription/discovery", permanent: false },
      { source: "/subscription", destination: "/subscription/discovery", permanent: false },
      { source: "/subscription/how-it-works", destination: "/subscription/discovery", permanent: false },
      { source: "/subscription/discovery-subscription", destination: "/subscription/discovery", permanent: false },
      { source: "/subscription/plans", destination: "/subscription/discovery", permanent: false },
      { source: "/subscription/classic-subscription", destination: "/subscription/discovery", permanent: false },
      { source: "/roaster-portal/:path*", destination: "/roaster", permanent: false },
      { source: "/reviews", destination: "/insights", permanent: false },
      { source: "/partner-with-us", destination: "/contact", permanent: false },
      { source: "/privacy", destination: "/", permanent: false },
      // /checkout/shipping + /review werden NICHT mehr nach /payment umgeleitet —
      // mit C-6 (Customer-facing Checkout) sind sie eigenstaendige Steps.
    ];
  },
};

// Sentry-Wrapper — laedt Source-Maps fuer bessere Stacktraces hoch (wenn
// SENTRY_AUTH_TOKEN + SENTRY_ORG + SENTRY_PROJECT in Vercel-Env gesetzt),
// instrumentiert Next.js-internals fuer automatisches Tracing.
// Hat keinen Side-Effect wenn DSN fehlt — config-Aufrufe sind no-op.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Suppress Build-Logs lokal, in CI sichtbar lassen (per Skill-Empfehlung).
  silent: !process.env.CI,
  widenClientFileUpload: true,
  // Tunnel route umgeht Ad-Blocker, die Sentry-Requests filtern.
  tunnelRoute: "/monitoring",
  disableLogger: true,
});
