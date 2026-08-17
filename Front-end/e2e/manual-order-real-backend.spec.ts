import { expect, test } from "@playwright/test";

const ownerEmail = process.env.E2E_OWNER_EMAIL ?? "admin@jadorebakery.com";
const ownerPassword = process.env.E2E_OWNER_PASSWORD ?? "password123";

test("persists a manual order through immediate display and reload", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Email address").fill(ownerEmail);
  await page.getByLabel("Password", { exact: true }).fill(ownerPassword);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("heading", { name: "Select a bakery" })).toBeVisible();
  await page.getByRole("button", { name: "Enter bakery" }).click();
  await expect(page.getByRole("button", { name: /^Orders/ }).first()).toBeVisible();

  await page.getByRole("button", { name: /new order|add order/i }).first().click();
  const today = await page.evaluate(() => {
    const value = new Date();
    return [value.getFullYear(), String(value.getMonth() + 1).padStart(2, "0"), String(value.getDate()).padStart(2, "0")].join("-");
  });
  const customerOption = page.locator('button[aria-pressed="false"]').first();
  const customerName = (await customerOption.locator("p").first().innerText()).trim();
  await customerOption.click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Add", exact: true }).first().click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.locator('input[type="date"]')).toHaveValue(today);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Review Order" }).click();
  await page.getByRole("button", { name: "Create Order" }).click();

  await expect(page.getByRole("heading", { name: "Orders", exact: true })).toBeVisible();
  await expect(page.getByText(customerName, { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Open order .* for / }).first()).toBeVisible();
  await page.getByRole("button", { name: /Open order .* for / }).first().click();
  await expect(page.getByRole("region", { name: "Production progress" })).toContainText(/tasks/);

  await page.reload();
  await expect(page.getByRole("heading", { name: "Orders", exact: true })).toBeVisible();
  await expect(page.getByText(customerName, { exact: true }).first()).toBeVisible();
  const createdOrder = page.getByRole("button", { name: new RegExp(`Open order .* for ${customerName}`) }).first();
  await createdOrder.click();
  await page.getByRole("button", { name: "Delete order" }).click();
  const confirmation = page.getByRole("alertdialog", { name: "Delete this order?" });
  await confirmation.getByRole("button", { name: "Delete order" }).click();
  await expect(page.getByRole("button", { name: new RegExp(`Open order .* for ${customerName}`) })).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole("heading", { name: "Orders", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: new RegExp(`Open order .* for ${customerName}`) })).toHaveCount(0);
});
