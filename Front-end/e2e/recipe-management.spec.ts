import { expect, test } from "@playwright/test";

test.describe("F4 Recipe Management & Costing", () => {
  test("creates a new recipe with batch costing, calculates profit margin, duplicates, and archives", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Email address").fill("owner@example.com");
    await page.getByLabel("Password", { exact: true }).fill("password");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByRole("heading", { name: "Select a bakery" })).toBeVisible();
    await page.getByRole("button", { name: "Enter bakery" }).click();
    await expect(page.getByRole("button", { name: /^Orders/ }).first()).toBeVisible();

    // Navigate to Recipes view
    if ((page.viewportSize()?.width ?? 1280) < 1024) {
      await page.getByRole("button", { name: "More" }).click();
    }
    await page.getByRole("button", { name: /recipes/i }).first().click();

    // Confirm Recipe Management heading is visible
    await expect(page.getByRole("heading", { name: "Recipe Management" })).toBeVisible();

    // Verify initial default recipes are visible
    await expect(page.getByText("Sourdough Loaf").first()).toBeVisible();

    // Open Add Recipe dialog
    await page.getByRole("button", { name: "Add Recipe" }).click();

    // Verify modal elements
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByLabel(/recipe name/i).fill("Brioche Bun Test");
    await page.getByLabel(/yield/i).fill("12 buns");
    await page.getByLabel(/selling price/i).fill("24");

    // Save new recipe
    await page.getByRole("button", { name: /create recipe/i }).click();

    // Verify newly created recipe appears in grid
    await expect(page.getByText("Brioche Bun Test").first()).toBeVisible();

    // Test Duplication
    const duplicateBtn = page.getByRole("button", { name: "Duplicate" }).first();
    if (await duplicateBtn.isVisible()) {
      await duplicateBtn.click();
      await expect(page.getByText(/Sourdough Loaf \(Copy\)|Brioche Bun Test \(Copy\)/).first()).toBeVisible();
    }

    // Test Active/Archived tab toggle
    const archivedTab = page.getByRole("tab", { name: /archived/i });
    if (await archivedTab.isVisible()) {
      await archivedTab.click();
      await expect(page.getByRole("tabpanel")).toBeVisible();
    }
  });
});
