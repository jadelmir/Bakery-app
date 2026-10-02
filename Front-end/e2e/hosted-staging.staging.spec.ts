import { expect, test, type Page } from "@playwright/test";

const email = process.env.E2E_STAGING_EMAIL;
const password = process.env.E2E_STAGING_PASSWORD;
const activeBakeryName = process.env.E2E_STAGING_ACTIVE_BAKERY_NAME ?? "J'adore";

if (!email || !password) {
  throw new Error(
    "Hosted staging E2E requires E2E_STAGING_EMAIL and E2E_STAGING_PASSWORD for the currently authorized staging identity.",
  );
}

const workspaceRoutes = [
  { path: "/home", heading: /Today's Tasks/ },
  { path: "/orders", heading: /^Orders$/ },
  { path: "/invoices", heading: /^Invoices$/ },
  { path: "/storefront", heading: /^Online Storefront$/ },
  { path: "/production", heading: /^Production Workspace$/ },
  { path: "/recipes", heading: /^Recipe Management$/ },
  { path: "/inventory", heading: /^Inventory$/ },
  { path: "/customers", heading: /^Customer Directory$/ },
  { path: "/finances", heading: /^Finances$/ },
  { path: "/settings", heading: /^Team access$/ },
] as const;

async function enterCurrentBakery(page: Page, path: string) {
  await page.goto(path);
  const loginEmail = page.getByLabel("Email address");

  await expect.poll(async () => (
    await loginEmail.isVisible().catch(() => false)
    || await page.getByRole("heading", { name: "Select a bakery" }).isVisible().catch(() => false)
    || await page.getByRole("button", { name: "Home", exact: true }).isVisible().catch(() => false)
  ), { timeout: 15000 }).toBe(true);

  if (await loginEmail.isVisible().catch(() => false)) {
    await loginEmail.fill(email!);
    await page.getByLabel("Password", { exact: true }).fill(password!);
    await page.getByRole("button", { name: "Log in", exact: true }).click();
  }

  const selector = page.getByRole("heading", { name: "Select a bakery" });
  if (await selector.isVisible().catch(() => false)) {
    await page.getByRole("button", { name: "Enter bakery" }).first().click();
  }

  await expect(page.getByRole("button", { name: new RegExp(`Return to bakery selection from ${activeBakeryName}`, "i") })).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`${path.replace("/", "\\/")}$`));
}

test("opens every canonical workspace route in the current hosted staging bakery", async ({ page }) => {
  for (const route of workspaceRoutes) {
    await enterCurrentBakery(page, route.path);
    await expect(page.getByRole("heading", { name: route.heading }).first()).toBeVisible();
  }
});

test("keeps hosted staging navigation under the deployed base path", async ({ page }) => {
  await enterCurrentBakery(page, "/home");
  const baseURL = test.info().project.use.baseURL;
  expect(baseURL).toBeTruthy();
  const deployedBasePath = new URL(baseURL!).pathname.replace(/\/?$/, "/");
  const escapedHomePath = `${deployedBasePath}home`.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  await expect(page).toHaveURL(new RegExp(`${escapedHomePath}$`));

  await page.getByRole("button", { name: /^Orders/ }).first().click();
  const escapedOrdersPath = `${deployedBasePath}orders`.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  await expect(page).toHaveURL(new RegExp(`${escapedOrdersPath}$`));
  await expect(page.getByRole("heading", { name: /^Orders$/ })).toBeVisible();
});
