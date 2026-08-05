import { expect, test } from "@playwright/test";

const mockEmail = "owner@example.com";
const mockPassword = "password123";

async function signInAndEnterBakery(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByLabel("Email address").fill(mockEmail);
  await page.getByLabel("Password", { exact: true }).fill(mockPassword);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Select a bakery" })).toBeVisible();
  await page.getByRole("button", { name: "Enter bakery" }).click();
  await expect(page.getByRole("button", { name: "Home", exact: true }).first()).toBeVisible();
}

test.describe("F2 Authentication & Account Experience", () => {
  test("requires login credentials and presents the complete signup form", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Log in", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await expect(page.getByText("Enter a valid email address.")).toBeVisible();
    await expect(page.getByText("Enter your password.")).toBeVisible();
    await page.getByLabel("Email address").fill("error@example.com");
    await page.getByLabel("Password", { exact: true }).fill(mockPassword);
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("couldn't authenticate");

    await page.getByRole("button", { name: "Sign up", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Create your bakery account" })).toBeVisible();
    await expect(page.getByLabel("Confirm password")).toBeVisible();
    await page.getByLabel("Email address").fill("new-owner@example.com");
    await page.getByLabel("Password", { exact: true }).fill(mockPassword);
    await page.getByLabel("Confirm password").fill(mockPassword);
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Select a bakery" })).toBeVisible();
  });

  test("shows the required recovery request UI and confirmation", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Forgot password?" }).click();

    await expect(page.getByRole("dialog", { name: "Reset your password" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Send reset link" })).toBeVisible();
    await page.getByLabel("Email address").last().fill(mockEmail);
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByRole("status")).toContainText(/password reset email sent/i);
  });

  test("opens account settings and logs out from the mobile navigation", async ({ page }) => {
    // Account management is intentionally exposed in the compact More menu.
    // Force the compact layout so this journey remains exercised in every configured browser.
    await page.setViewportSize({ width: 390, height: 844 });
    await signInAndEnterBakery(page);

    await page.getByRole("button", { name: "More", exact: true }).click();
    await expect(page.getByRole("heading", { name: "More" })).toBeVisible();
    await page.getByRole("button", { name: /Account & Profile/ }).click();
    await expect(page.getByRole("heading", { name: "Account & Profile" })).toBeVisible();
    await expect(page.getByLabel("Current Password")).toBeVisible();
    await expect(page.getByLabel("New Password", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Log out", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });

  test("logs out from the full workspace navigation", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await signInAndEnterBakery(page);
    await page.getByRole("button", { name: "Log out", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });
});
