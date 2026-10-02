import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL
  ?? process.env.E2E_STAGING_BASE_URL
  ?? "https://jadelmir.github.io/Bakery-app/";

if (!baseURL.startsWith("https://")) {
  throw new Error("E2E_BASE_URL must be an HTTPS hosted staging URL.");
}

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.staging.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 5"] } },
  ],
});
