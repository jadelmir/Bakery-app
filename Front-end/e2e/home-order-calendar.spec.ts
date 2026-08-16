import { expect, test } from "@playwright/test";

async function logInAndEnterBakery(page: import("@playwright/test").Page) {
  await page.goto("/home");
  const email = page.getByLabel("Email address");
  const selector = page.getByRole("heading", { name: "Select a bakery" });
  const home = page.getByRole("button", { name: "Home", exact: true }).first();
  await expect.poll(async () => (
    await email.isVisible().catch(() => false)
    || await selector.isVisible().catch(() => false)
    || await home.isVisible().catch(() => false)
  ), { timeout: 10000 }).toBe(true);
  if (await email.isVisible().catch(() => false)) {
    await email.fill("owner@example.com");
    await page.getByLabel("Password", { exact: true }).fill("password");
    await page.getByRole("button", { name: "Log in" }).click();
  }
  await expect.poll(async () => (
    await selector.isVisible().catch(() => false)
    || await home.isVisible().catch(() => false)
  ), { timeout: 10000 }).toBe(true);
  if (await selector.isVisible().catch(() => false)) {
    await page.getByRole("button", { name: "Enter bakery" }).click();
  }
  await expect(home).toBeVisible();
}

test("renders the today-first Home order calendar responsively", async ({ page }) => {
  await logInAndEnterBakery(page);

  await expect(page.getByRole("heading", { name: "Upcoming Orders", exact: true })).toBeVisible();
  await expect(page.getByText("No upcoming orders")).toBeVisible();
  await expect(page.getByRole("button", { name: /new order|add order/i }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Open order/ })).toHaveCount(0);
});
