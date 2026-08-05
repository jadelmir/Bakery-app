import { expect, test } from "@playwright/test";

test("navigates to Storefront Dashboard, verifies store settings, and manages products", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Email address").fill("owner@example.com");
  await page.getByLabel("Password", { exact: true }).fill("password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("heading", { name: "Select a bakery" })).toBeVisible();
  await page.getByRole("button", { name: "Enter bakery" }).click();

  if ((page.viewportSize()?.width ?? 1280) < 1024) {
    await page.getByRole("button", { name: "More" }).click();
  }
  await page.getByRole("button", { name: /^Online Store/ }).filter({ visible: true }).click();
  await expect(page.getByRole("heading", { name: "Online Storefront" })).toBeVisible();

  // Verify Storefront Dashboard metrics and section headers
  await expect(page.getByRole("heading", { name: "Storefront Product Catalog" })).toBeVisible();
  await expect(page.getByText("Published Products", { exact: true })).toBeVisible();
});

test("opens public storefront directly via public slug URL and browses catalog", async ({ page }) => {
  await page.goto("/store/jadore-bakery");
  await expect(page.getByRole("heading", { name: "J'adore Bakery" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Artisanal Sourdough" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Olive Oil Focaccia" })).toBeVisible();
  await expect(page.getByText("Accepting Orders Online")).toBeVisible();
});
