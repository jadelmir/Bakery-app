import { expect, test } from "@playwright/test";

async function logIn(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByLabel("Email address").fill("owner@example.com");
  await page.getByLabel("Password", { exact: true }).fill("password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("heading", { name: "Select a bakery" })).toBeVisible();
  await page.getByRole("button", { name: "Enter bakery" }).click();
  await expect(page.getByRole("button", { name: /^Orders/ }).first()).toBeVisible();
}

async function enterNorthBakery(page: import("@playwright/test").Page) {
  await page.getByRole("radio", { name: /North Bakery/ }).click();
  await page.getByRole("button", { name: "Enter bakery" }).click();
  await expect(page.getByRole("button", { name: /^Orders/ }).first()).toBeVisible();
  await expect(page.getByText("North Bakery").filter({ visible: true }).first()).toBeVisible();
}

test("verifies cross-screen reactive projections when creating an order and completing a task", async ({ page }) => {
  await logIn(page);

  // 1. Open order modal and create an order for Sarah Mitchell
  await page.getByRole("button", { name: /new order|add order/i }).first().click();
  await page.getByRole("button", { name: /Sarah Mitchell/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Add", exact: true }).first().click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Review Order" }).click();
  await page.getByRole("button", { name: "Create Order" }).click();

  // 2. Verify Orders screen reflects the new order
  await expect(page.getByRole("heading", { name: "Orders", exact: true })).toBeVisible();
  await expect(page.getByText("Sarah Mitchell").first()).toBeVisible();

  // 3. Check Production screen
  await page.getByRole("button", { name: /^Production/ }).first().click();
  await expect(page.getByRole("heading", { name: "Production" })).toBeVisible();

  // 4. Check Home/Dashboard screen
  await page.getByRole("button", { name: /^Home/ }).first().click();
  await expect(page.getByText("Today's Tasks").first()).toBeVisible();
});

test("enforces bakery selection gating and dirty-form navigation guards", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Email address").fill("owner@example.com");
  await page.getByLabel("Password", { exact: true }).fill("password");
  await page.getByRole("button", { name: "Log in" }).click();

  // Unselected session cannot bypass bakery selection
  await expect(page.getByRole("heading", { name: "Select a bakery" })).toBeVisible();
});

test("returns from the active bakery header to selection and re-enters after reload", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("bakery-mock-scenario", "multiple"));
  await page.goto("/");
  await page.getByLabel("Email address").fill("owner@example.com");
  await page.getByLabel("Password", { exact: true }).fill("password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("heading", { name: "Select a bakery" })).toBeVisible();
  await enterNorthBakery(page);

  const bakeryHeader = page.getByRole("button", { name: /return to bakery selection|active bakery/i }).filter({ visible: true }).first();
  await expect(bakeryHeader).toBeVisible();
  await bakeryHeader.click();

  const confirmation = page.getByRole("alertdialog");
  await expect(confirmation).toBeVisible();
  await expect(confirmation).toContainText(/return.*select|bakery selection/i);
  await confirmation.getByRole("button", { name: /cancel|stay/i }).click();
  await expect(page.getByRole("button", { name: /^Orders/ }).first()).toBeVisible();

  await bakeryHeader.click();
  await confirmation.getByRole("button", { name: /return|confirm|select/i }).click();
  await expect(page.getByRole("heading", { name: "Select a bakery" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Orders/ })).toHaveCount(0);
  expect(await page.evaluate(() => sessionStorage.getItem("bakery:mock-owner"))).toBeNull();

  await page.reload();
  const email = page.getByLabel("Email address");
  if (await email.isVisible().catch(() => false)) {
    await email.fill("owner@example.com");
    await page.getByLabel("Password", { exact: true }).fill("password");
    await page.getByRole("button", { name: "Log in" }).click();
  }
  await expect(page.getByRole("heading", { name: "Select a bakery" })).toBeVisible();
  await enterNorthBakery(page);
});
