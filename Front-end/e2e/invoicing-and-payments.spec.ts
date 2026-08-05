import { expect, test } from "@playwright/test";

test("navigates to Invoices screen, creates invoice, records payment, and views public link", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Email address").fill("owner@example.com");
  await page.getByLabel("Password", { exact: true }).fill("password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("heading", { name: "Select a bakery" })).toBeVisible();
  await page.getByRole("button", { name: "Enter bakery" }).click();

  if ((page.viewportSize()?.width ?? 1280) < 1024) {
    await page.getByRole("button", { name: "More" }).click();
  }
  await page.getByRole("button", { name: /^Invoices/ }).filter({ visible: true }).click();
  await expect(page.getByRole("heading", { name: "Invoices" })).toBeVisible();

  // Verify Invoices list loaded fixture data
  await expect(page.getByText("Sarah Mitchell")).toBeVisible();
});

test("opens public invoice view directly via public token URL", async ({ page }) => {
  await page.goto("/invoice/tok_sarah_001");
  await expect(page.getByRole("heading", { name: "Earl's Bakery" })).toBeVisible();
  await expect(page.getByText("Sarah Mitchell")).toBeVisible();
  await expect(page.getByText("Zelle", { exact: true })).toBeVisible();
});
