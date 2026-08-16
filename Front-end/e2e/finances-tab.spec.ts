import { expect, test } from "@playwright/test";

async function logInAndOpenFinances(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByLabel("Email address").fill("owner@example.com");
  await page.getByLabel("Password", { exact: true }).fill("password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("heading", { name: "Select a bakery" })).toBeVisible();
  await page.getByRole("button", { name: "Enter bakery" }).click();

  if ((page.viewportSize()?.width ?? 1280) < 1024) {
    await page.getByRole("button", { name: "More" }).click();
  }
  await page.getByRole("button", { name: /^Finances/ }).filter({ visible: true }).click();
  await expect(page.getByRole("heading", { name: "Finances", exact: true })).toBeVisible();
}

test.describe("Finance tab", () => {
  test("filters the report, opens product detail, and downloads the visible report", async ({ page }) => {
    await logInAndOpenFinances(page);

    await expect(page.getByRole("paragraph").filter({ hasText: "Revenue" }).first()).toBeVisible();
    await page.getByLabel("Report product filter").selectOption({ label: "Focaccia" });
    await page.getByRole("button", { name: /Focaccia/ }).last().click();
    await expect(page.getByText("Focaccia detail", { exact: true })).toBeVisible();

    await page.getByLabel("Report date range").selectOption("custom");
    await expect(page.getByLabel("Report start date")).toBeVisible();
    await page.getByLabel("Report start date").fill("2026-07-01");
    await page.getByLabel("Report end date").fill("2026-08-31");

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export CSV" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^bakery-finance-report-.*\.csv$/);
    await expect(page.getByRole("status")).toContainText("Report export is ready");
  });
});
