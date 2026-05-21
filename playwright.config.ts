import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright-Konfiguration fuer P9 — HTTP-E2E der drei API-Routes
 * (quiz/submit, recommendation/next, rating/submit) sowie der Edge-Cases
 * im Recommender (Hartfilter-Cascade).
 *
 * Tests laufen gegen einen lokal gestarteten dev-server. Wenn der dev-
 * server schon laeuft, wird der vorhandene wiederverwendet (reuseExistingServer).
 *
 * Auth-Strategie: e2e/global-setup.ts legt einen Test-User via service_role
 * an, loggt sich ein und persistiert die Session-Cookies in
 * playwright/.auth/user.json. Alle Tests laden diesen storageState — kein
 * Re-Login pro Test.
 *
 * Lokal:
 *   npm run test:e2e:install    # einmalig — Chromium runterladen
 *   npm run test:e2e
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,           // unsere Tests teilen sich einen Test-User
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,                     // sequentiell — vermeidet Test-User-Race-Conditions
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/user.json",
      },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
    stderr: "pipe",
    timeout: 120_000,
  },
});
