import { expect, test } from "@playwright/test";

async function logInToSelector(
  page: import("@playwright/test").Page,
  email = "owner@example.com",
  password = "password",
) {
  await page.goto("/");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("heading", { name: "Select a bakery" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Orders/ })).toHaveCount(0);
}

async function logIn(page: import("@playwright/test").Page) {
  await logInToSelector(page);
  await page.getByRole("button", { name: "Enter bakery" }).click();
  await expect(page.getByRole("button", { name: /^Orders/ }).first()).toBeVisible();
}

test("shows an existing bakery without starting duplicate default onboarding", async ({ page }) => {
  await logInToSelector(page, "admin@jadorebakery.com", "password123");

  const availableBakeries = page.getByRole("radio", { name: /J'adore Bakery/ });
  await expect(availableBakeries).toHaveCount(1);
  await expect(availableBakeries).toBeVisible();
  await expect(page.getByRole("heading", { name: "Create your bakery" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Add new bakery" })).toBeVisible();
});

test("creates a second bakery while retaining and entering the new workspace", async ({ page }) => {
  const secondBakeryName = "J'adore Bakery Annex";
  await logInToSelector(page, "admin@jadorebakery.com", "password123");

  await expect(page.getByRole("radio", { name: /J'adore Bakery/ })).toBeVisible();
  await page.getByRole("button", { name: "Add new bakery" }).click();
  await page.getByLabel("New bakery name").fill(secondBakeryName);
  await page.getByRole("button", { name: "Create & Enter Bakery" }).click();

  await expect(page.getByRole("heading", { name: new RegExp(secondBakeryName) })).toBeVisible();
  await expect(page.getByText("owner · active bakery").filter({ visible: true }).first()).toBeVisible();

  const activeBakery = page.locator('select[aria-label="Switch active bakery"]:visible').first();
  await expect(activeBakery.locator("option")).toContainText(["J'adore Bakery", secondBakeryName]);
  await expect(activeBakery).toHaveValue(/dev-bakery-/);
});

test("navigates to Orders from the primary navigation", async ({ page }) => {
  await logIn(page);
  await page.getByRole("button", { name: /^Orders/ }).first().click();

  await expect(page.getByRole("heading", { name: "Orders", exact: true })).toBeVisible();
});

test("completes the Add Order workflow", async ({ page }) => {
  await logIn(page);
  await page.getByRole("button", { name: /new order|add order/i }).first().click();
  await page.getByRole("button", { name: /Sarah Mitchell/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Add", exact: true }).first().click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Review Order" }).click();

  await expect(page.getByText("Ready to create")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create Order" })).toBeVisible();
});

test("advances a manual order sequentially", async ({ page }) => {
  await logIn(page);
  await page.getByRole("button", { name: /^Orders/ }).filter({ visible: true }).click();
  await expect(page.getByRole("heading", { name: "Orders", exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/orders$/);
  await page.getByRole("button", { name: /Open order .* for James Okonkwo/ }).click();
  await expect(page.getByLabel("Order detail").getByRole("heading", { name: "James Okonkwo" })).toBeVisible();
  await page.getByRole("button", { name: "Start Production" }).click();
  await page.getByRole("button", { name: "Mark Ready" }).click();
  await page.getByRole("button", { name: "Mark Completed" }).click();
  await expect(page.getByRole("button", { name: /Start Production|Mark Ready|Mark Completed/ })).toHaveCount(0);
});

test("signs up and logs out from desktop and mobile layouts", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("bakery-mock-scenario", "empty"));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await page.getByRole("button", { name: "Sign up" }).click();
  await page.getByLabel("Email address").fill("new-owner@example.com");
  await page.getByLabel("Password", { exact: true }).fill("password");
  await page.getByLabel("Confirm password").fill("password");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByRole("heading", { name: "Create your bakery" })).toBeVisible();
  await page.getByLabel("Bakery name").fill("Sunrise Bakery");
  await page.getByRole("button", { name: "Create bakery" }).click();
  await expect(page.getByRole("button", { name: /^Orders/ }).first()).toBeVisible();
  if ((page.viewportSize()?.width ?? 1280) < 1024) {
    await page.getByRole("button", { name: "More" }).click();
  }
  await page.getByRole("button", { name: "Log out" }).filter({ visible: true }).click();

  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Orders/ })).toHaveCount(0);
});

test("switches stores, clears the prior view, and manages the active bakery team", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("bakery-mock-scenario", "multiple"));
  await logIn(page);
  await page.getByRole("button", { name: /^Orders/ }).first().click();
  await expect(page.getByRole("heading", { name: "Orders", exact: true })).toBeVisible();

  await page.getByLabel("Switch active bakery").filter({ visible: true }).first().selectOption("bakery-south");
  await expect(page.getByText("manager · active bakery").filter({ visible: true }).first()).toBeVisible();
  const currentDateLabel = await page.evaluate(() => new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
  }).format(new Date()));
  await expect(page.getByRole("heading", { name: new RegExp(`${currentDateLabel} · South Bakery`) })).toBeVisible();

  if ((page.viewportSize()?.width ?? 1280) < 1024) {
    await page.getByRole("button", { name: "More" }).click();
  }
  await page.getByRole("button", { name: /Settings App & notifications/i }).or(page.getByRole("button", { name: "Settings", exact: true })).filter({ visible: true }).click();
  await expect(page.getByRole("heading", { name: "Team access" })).toBeVisible();
  await page.getByLabel("Email address").fill("staff@example.com");
  await page.getByRole("button", { name: "Invite" }).click();
  await expect(page.getByRole("status")).toContainText("Invitation sent");
  await expect(page.getByText("staff@example.com", { exact: true })).toBeVisible();
});

test("authenticates through an invitation landing and accepts access", async ({ page }) => {
  await page.goto("/?invitation=opaque-browser-test-token");
  await page.getByLabel("Email address").fill("invitee@example.com");
  await page.getByLabel("Password", { exact: true }).fill("password1");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("heading", { name: "Join this store?" })).toBeVisible();
  await page.getByRole("button", { name: "Accept invitation" }).click();
  await expect(page.getByRole("status")).toContainText("Invitation accepted");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Select a bakery" })).toBeVisible();
});

test("confirms an atomic ownership transfer from team management", async ({ page }) => {
  await logIn(page);
  if ((page.viewportSize()?.width ?? 1280) < 1024) {
    await page.getByRole("button", { name: "More" }).click();
  }
  await page.getByRole("button", { name: /Settings App & notifications/i }).or(page.getByRole("button", { name: "Settings", exact: true })).filter({ visible: true }).click();
  await expect(page.getByText("Bakery Staff")).toBeVisible();
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Transfer ownership" }).click();
  await expect(page.getByRole("status")).toContainText("Ownership transferred");
});
