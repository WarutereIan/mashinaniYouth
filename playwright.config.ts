import { defineConfig, devices } from "@playwright/test";

/**
 * E2E smoke tests for MashinaniVote.
 *
 * Prerequisites:
 *   1. Dev server running (npm run dev) — default http://localhost:8080
 *   2. Copy e2e/.env.example → e2e/.env.local and fill admin credentials
 *   3. VITE_USE_SUPABASE_BACKEND=true in project .env
 *
 * Run:
 *   npx playwright test
 *   npx playwright test --project=chromium
 *   npx playwright test e2e/smoke/admin.spec.ts
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:8080";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "e2e-report" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Do not auto-start the server — the app needs .env + Supabase.
  // Start separately: npm run dev
});
