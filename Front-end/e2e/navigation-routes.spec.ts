import { expect, test, type Page } from "@playwright/test";

const primaryRoutes = [
  { path: "/home", screen: /Today's Tasks/ },
  { path: "/orders", screen: /^Orders$/ },
  { path: "/invoices", screen: /^Invoices$/ },
  { path: "/storefront", screen: /^Online Storefront$/ },
  { path: "/production", screen: /^Production Workspace$/ },
  { path: "/recipes", screen: /^Recipe Management$/ },
  { path: "/inventory", screen: /^Inventory$/ },
  { path: "/customers", screen: /^Customer Directory$/ },
  { path: "/finances", screen: /^Finances$/ },
  { path: "/settings", screen: /^Team access$/ },
] as const;

async function logInAndEnterBakery(page: Page, path = "/home") {
  await page.goto(path);
  const email = page.getByLabel("Email address");
  const selector = page.getByRole("heading", { name: "Select a bakery" });
  const workspaceHome = page.getByRole("button", { name: "Home", exact: true }).first();
  await expect.poll(async () => (
    await email.isVisible().catch(() => false)
    || await selector.isVisible().catch(() => false)
    || await workspaceHome.isVisible().catch(() => false)
  ), { timeout: 10000 }).toBe(true);
  if (await email.isVisible().catch(() => false)) {
    await email.fill("owner@example.com");
    await page.getByLabel("Password", { exact: true }).fill("password");
    await page.getByRole("button", { name: "Log in" }).click();
  }
  await expect.poll(async () => (
    await selector.isVisible().catch(() => false)
    || await workspaceHome.isVisible().catch(() => false)
  ), { timeout: 10000 }).toBe(true);
  if (await selector.isVisible().catch(() => false)) {
    await page.getByRole("button", { name: "Enter bakery" }).click();
  }
  await expect(page).toHaveURL(new RegExp(`${path.replace("/", "\\/")}$`));
  await expect(workspaceHome).toBeVisible();
}

async function expectScreen(page: Page, name: string | RegExp) {
  await expect(page.getByRole("heading", { name }).first()).toBeVisible();
}

test("opens every canonical workspace URL after authentication and bakery selection", async ({ page }) => {
  for (const route of primaryRoutes) {
    await logInAndEnterBakery(page, route.path);
    await expectScreen(page, route.screen);
    await expect(page).toHaveURL(new RegExp(`${route.path}$`));

    // The mock auth adapter is intentionally in-memory, so start each direct-entry
    // journey with a fresh page load rather than treating it as persisted auth.
  }
});

test("updates the URL and active navigation control on desktop and mobile", async ({ page }) => {
  await logInAndEnterBakery(page);

  const mobile = (page.viewportSize()?.width ?? 1280) < 1024;
  if (mobile) {
    const orders = page.getByRole("button", { name: /^Orders/ }).filter({ visible: true }).first();
    await orders.click();
    await expect(page).toHaveURL(/\/orders$/);
    await expect(orders).toHaveAttribute("aria-current", "page");

    await page.getByRole("button", { name: "More", exact: true }).click();
    await expect(page).toHaveURL(/\/more$/);
    await expect(page.getByRole("button", { name: "More", exact: true })).toHaveAttribute("aria-current", "page");
    await page.getByRole("button", { name: /^Invoices/ }).filter({ visible: true }).click();
    await expect(page).toHaveURL(/\/invoices$/);
    await expectScreen(page, /^Invoices$/);
  } else {
    const orders = page.getByRole("button", { name: /^Orders/ }).filter({ visible: true }).first();
    await orders.click();
    await expect(page).toHaveURL(/\/orders$/);
    await expect(orders).toHaveAttribute("aria-current", "page");

    const invoices = page.getByRole("button", { name: "Invoices", exact: true });
    await invoices.click();
    await expect(page).toHaveURL(/\/invoices$/);
    await expect(invoices).toHaveAttribute("aria-current", "page");
  }
});

test("retains a direct workspace URL through a refresh and renewed mock session", async ({ page }) => {
  await logInAndEnterBakery(page, "/orders");
  await expectScreen(page, /^Orders$/);

  await page.reload();
  await expect(page).toHaveURL(/\/orders$/);
  const email = page.getByLabel("Email address");
  if (await email.isVisible().catch(() => false)) {
    await email.fill("owner@example.com");
    await page.getByLabel("Password", { exact: true }).fill("password");
    await page.getByRole("button", { name: "Log in" }).click();
    const selector = page.getByRole("button", { name: "Enter bakery" });
    if (await selector.isVisible().catch(() => false)) await selector.click();
  }
  await expect(page).toHaveURL(/\/orders$/);
  await expectScreen(page, /^Orders$/);
});

test("supports browser Back and Forward between workspace destinations", async ({ page }) => {
  await logInAndEnterBakery(page);
  const mobile = (page.viewportSize()?.width ?? 1280) < 1024;

  await page.getByRole("button", { name: /^Orders/ }).filter({ visible: true }).first().click();
  await expect(page).toHaveURL(/\/orders$/);
  if (mobile) {
    await page.getByRole("button", { name: "Production", exact: true }).filter({ visible: true }).click();
  } else {
    await page.getByRole("button", { name: "Production", exact: true }).filter({ visible: true }).click();
  }
  await expect(page).toHaveURL(/\/production$/);
  await expectScreen(page, /^Production Workspace$/);

  await page.goBack();
  await expect(page).toHaveURL(/\/orders$/);
  await expectScreen(page, /^Orders$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/production$/);
  await expectScreen(page, /^Production Workspace$/);
});

test("redirects legacy routes and provides a safe unknown-workspace fallback", async ({ page }) => {
  await logInAndEnterBakery(page, "/app/orders");
  await expect(page).toHaveURL(/\/orders$/);
  await expectScreen(page, /^Orders$/);

  await page.getByRole("button", { name: "Home", exact: true }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/home$/);
  await page.evaluate(() => window.history.pushState({}, "", "/workspace-missing"));
  await page.evaluate(() => window.dispatchEvent(new PopStateEvent("popstate")));
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await page.getByRole("link", { name: "Return to Home" }).click();
  await expect(page).toHaveURL(/\/home$/);
});

test("keeps public and authentication URLs outside workspace routing", async ({ page }) => {
  await page.goto("/auth/login");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Orders/ }).filter({ visible: true })).toHaveCount(0);

  await page.goto("/invoice/tok_sample_123");
  await expect(page.getByText("Secure Public Invoice Portal")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Orders/ }).filter({ visible: true })).toHaveCount(0);

  await page.goto("/store/jadore-bakery");
  await expect(page.getByRole("heading", { name: "Fresh Bakery Menu" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Orders/ }).filter({ visible: true })).toHaveCount(0);
});
