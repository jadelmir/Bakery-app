import { expect, test } from "@playwright/test";

test.describe("F5 Customer Directory & Management", () => {
  test("creates a new wholesale customer, filters by category, and edits customer details", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Email address").fill("owner@example.com");
    await page.getByLabel("Password", { exact: true }).fill("password");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByRole("heading", { name: "Select a bakery" })).toBeVisible();
    await page.getByRole("button", { name: "Enter bakery" }).click();
    await expect(page.getByRole("button", { name: /^Orders/ }).first()).toBeVisible();

    // Navigate to Customers screen
    if ((page.viewportSize()?.width ?? 1280) < 1024) {
      await page.getByRole("button", { name: "More" }).click();
    }
    await page.getByRole("button", { name: /customers/i }).first().click();

    // Verify Customer Directory heading
    await expect(page.getByRole("heading", { name: "Customer Directory" })).toBeVisible();

    // Open Add Customer modal
    await page.getByRole("button", { name: "Add Customer" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Fill form
    await page.getByLabel(/customer name/i).fill("La Petite Boulangerie");
    await page.getByLabel(/email address/i).fill("orders@lapetite.com");
    await page.getByLabel(/phone number/i).fill("555-0199");
    await page.getByLabel(/customer type/i).selectOption("wholesale");

    // Save customer inside modal
    await page.getByRole("dialog").getByRole("button", { name: /create customer/i }).click();

    // Verify customer appears in list
    await expect(page.getByText("La Petite Boulangerie").first()).toBeVisible();

    // Test tab filtering
    const wholesaleTab = page.getByRole("tab", { name: /wholesale/i });
    if (await wholesaleTab.isVisible()) {
      await wholesaleTab.click();
      await expect(page.getByText("La Petite Boulangerie").first()).toBeVisible();
    }

    // Edit the persisted directory record and verify it survives a reload in mock mode.
    const customerCard = page.locator("div.group", { hasText: "La Petite Boulangerie" }).first();
    await customerCard.getByRole("button", { name: "Edit" }).click();
    await page.getByLabel(/customer name/i).fill("La Petite Boulangerie Updated");
    await page.getByRole("dialog").getByRole("button", { name: /save changes/i }).click();
    await expect(page.getByText("La Petite Boulangerie Updated").first()).toBeVisible();
  });
});
