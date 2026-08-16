import { expect, test, type Page } from "@playwright/test";
import { FIXTURE_PRODUCTION_TEST_DATE } from "../src/app/domain/fixtures";

const CHECK_STARTER_DAY = "2026-07-29";

async function logInAndOpenProduction(page: Page) {
  await page.goto("/");
  await page.getByLabel("Email address").fill("owner@example.com");
  await page.getByLabel("Password", { exact: true }).fill("password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("heading", { name: "Select a bakery" })).toBeVisible();
  await page.getByRole("button", { name: "Enter bakery" }).click();
  await page.getByRole("button", { name: /^Production/i }).first().click();
  await expect(page.getByRole("heading", { name: "Production Workspace" })).toBeVisible();
}

async function selectCalendarDay(page: Page, day: string) {
  await page.getByRole("button", { name: "calendar", exact: true }).click();
  await page.getByLabel("Select production day").fill(day);
  await expect(page.getByText(day, { exact: true })).toBeVisible();
}

async function expectGroupedProducts(block: ReturnType<Page["getByRole"]>) {
  await expect(block.getByText(/Sourdough Loaf/)).toBeVisible();
  await expect(block.getByText(/Focaccia/)).toBeVisible();
}

test.describe("Production time-block timeline", () => {
  test("opens on Today and keeps Tomorrow selectable with its own day state", async ({ page }) => {
    await logInAndOpenProduction(page);

    await expect(page.getByRole("button", { name: "today", exact: true })).toHaveClass(/text-white/);
    await page.getByRole("button", { name: "tomorrow", exact: true }).click();
    await expect(page.getByRole("button", { name: "tomorrow", exact: true })).toHaveClass(/text-white/);
    const tomorrow = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(Date.now() + 24 * 60 * 60 * 1000));
    await expect(page.getByText(tomorrow, { exact: true })).toBeVisible();
    await expect(page.getByText("No tasks in this view")).toBeVisible();
  });

  test("shows grouped check-starter work for both fixture products", async ({ page }) => {
    await logInAndOpenProduction(page);
    await selectCalendarDay(page, CHECK_STARTER_DAY);

    const block = page.getByRole("article", { name: /Check starter and inventory production block/ });
    await expect(block).toBeVisible();
    await expectGroupedProducts(block);
  });

  test("shows and completes the grouped Build Starter block", async ({ page }) => {
    await logInAndOpenProduction(page);
    await selectCalendarDay(page, FIXTURE_PRODUCTION_TEST_DATE);

    const block = page.getByRole("article", { name: /Build Starter production block/ });
    await expect(block).toBeVisible();
    await expectGroupedProducts(block);
    await expect(block.getByText("Starter preparation")).toBeVisible();

    const complete = block.getByRole("button", { name: "Complete 2 tasks" });
    await expect(complete).toBeVisible();
    await complete.click();
    await expect(block.getByText("2 of 2 completed")).toBeVisible();
    await expect(block.getByRole("button", { name: /Complete/ })).toHaveCount(0);
  });

  test("keeps the grouped action accessible at every viewport", async ({ page }) => {
    await logInAndOpenProduction(page);
    await selectCalendarDay(page, FIXTURE_PRODUCTION_TEST_DATE);

    const block = page.getByRole("article", { name: /Build Starter production block/ });
    await expect(block.getByRole("button", { name: "Complete 2 tasks" })).toBeVisible();
  });
});
