import { expect, test } from "@playwright/test";
import { FIXTURE_PRODUCTION_TEST_DATE } from "../src/app/domain/fixtures";

async function logIn(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByLabel("Email address").fill("owner@example.com");
  await page.getByLabel("Password", { exact: true }).fill("password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("heading", { name: "Select a bakery" })).toBeVisible();
  await page.getByRole("button", { name: "Enter bakery" }).click();
  await expect(page.getByRole("button", { name: /^Orders/ }).first()).toBeVisible();
}

async function showActionableProductionDate(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "calendar", exact: true }).click();
  await page.getByLabel("Select production day").fill(FIXTURE_PRODUCTION_TEST_DATE);
  await expect(page.getByText(FIXTURE_PRODUCTION_TEST_DATE, { exact: true })).toBeVisible();
}

test.describe("Production Task Workspace & Execution", () => {
  test("navigates to Production screen and verifies category tabs & workspace UI", async ({ page }) => {
    await logIn(page);
    await page.getByRole("button", { name: /^Production/i }).first().click();

    await expect(page.getByRole("heading", { name: /Production/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Flow Builder" })).toBeVisible();
    await expect(page.getByRole("button", { name: "mixing", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "baking", exact: true })).toBeVisible();
  });

  test("starts and pauses a task live execution timer", async ({ page }) => {
    await logIn(page);
    await page.getByRole("button", { name: /^Production/i }).first().click();
    await showActionableProductionDate(page);

    const startTimerBtn = page.getByRole("button", { name: /Start Timer/i }).first();
    await expect(startTimerBtn).toBeVisible();
    await startTimerBtn.click();

    // Verify pause timer button and active timers overview banner
    await expect(page.getByRole("button", { name: /Pause Timer/i }).first()).toBeVisible();
    await expect(page.getByText(/Active Live Timers|Kitchen Execution/i).first()).toBeVisible();

    // Pause timer
    await page.getByRole("button", { name: /Pause Timer/i }).first().click();
    await expect(page.getByRole("button", { name: /Resume Timer|Start Timer/i }).first()).toBeVisible();
  });

  test("runs multiple task timers through the shared production clock", async ({ page }) => {
    await logIn(page);
    await page.getByRole("button", { name: /^Production/i }).first().click();
    await showActionableProductionDate(page);

    await page.getByRole("button", { name: /Start Timer/i }).nth(0).click();
    await page.getByRole("button", { name: /Start Timer/i }).nth(0).click();

    await expect(page.getByText("Active Live Timers (2)")).toBeVisible();
    await page.getByRole("button", { name: "Pause All" }).click();
    await expect(page.getByText(/Active Live Timers/)).toHaveCount(0);
  });

  test("postpones a task using the delay modal option (+15m)", async ({ page }) => {
    await logIn(page);
    await page.getByRole("button", { name: /^Production/i }).first().click();
    await showActionableProductionDate(page);

    const delayBtn = page.getByRole("button", { name: "Delay" }).first();
    await expect(delayBtn).toBeVisible();
    await delayBtn.click();

    await expect(page.getByText("Postpone / Delay Task")).toBeVisible();
    await page.getByRole("button", { name: "+15 Minutes" }).click();

    await expect(page.getByText("+15m Delayed").first()).toBeVisible();
  });

  test("checks prerequisite warning badge and displays pending step badge", async ({ page }) => {
    await logIn(page);
    await page.getByRole("button", { name: /^Production/i }).first().click();
    await showActionableProductionDate(page);

    const prereqBadge = page.getByText(/Prerequisite Pending/i).first();
    await expect(prereqBadge).toBeVisible();
  });
});
