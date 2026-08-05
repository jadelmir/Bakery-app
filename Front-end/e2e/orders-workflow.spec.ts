import { expect, test, type Page } from "@playwright/test";

async function logInAndOpenOrders(page: Page) {
  await page.goto("/");
  await page.getByLabel("Email address").fill("owner@example.com");
  await page.getByLabel("Password", { exact: true }).fill("password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("heading", { name: "Select a bakery" })).toBeVisible();
  await page.getByRole("button", { name: "Enter bakery" }).click();
  await page.getByRole("button", { name: /^Orders/ }).first().click();
  await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible();
  await expect(page).toHaveURL(/\/orders$/);
}

test("defaults to the Current queue and supports stage filtering", async ({ page }) => {
  await logInAndOpenOrders(page);

  const currentTab = page.getByRole("tab", { name: /^Current/ });
  const completedTab = page.getByRole("tab", { name: /^Completed/ });
  await expect(currentTab).toHaveAttribute("aria-selected", "true");
  await expect(completedTab).toHaveAttribute("aria-selected", "false");
  await expect(currentTab).toContainText("3");
  await expect(completedTab).toContainText("1");

  const stages = page.getByLabel("Current order stages");
  await expect(stages.getByRole("button", { name: /Confirmed/ })).toContainText("1");
  await expect(stages.getByRole("button", { name: /In Production/ })).toContainText("1");
  await expect(stages.getByRole("button", { name: /Ready for Pickup/ })).toContainText("1");

  await stages.getByRole("button", { name: /Confirmed/ }).click();
  await expect(page.getByText("current orders (1)", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: /Open order .* for James Okonkwo/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Open order .* for Sarah Mitchell/ })).toHaveCount(0);

  await completedTab.click();
  await expect(completedTab).toHaveAttribute("aria-selected", "true");
  const completedOrder = page.getByRole("button", { name: /Open order .* for Priya Nair/ });
  await expect(completedOrder).toBeVisible();
  await expect(completedOrder).toContainText("Fulfilled at");
  await expect(completedOrder).not.toContainText("Overdue");
  await expect(page.getByRole("button", { name: /Open order .* for James Okonkwo/ })).toHaveCount(0);
});

test("communicates queue context and responsive order detail", async ({ page }) => {
  await logInAndOpenOrders(page);

  const sarahOrder = page.getByRole("button", { name: /Open order .* for Sarah Mitchell/ });
  await expect(sarahOrder).toContainText(/Overdue|Today|Upcoming/);
  await expect(sarahOrder).toContainText("Sarah Mitchell");
  await expect(sarahOrder).toContainText("Status: In Production");
  await expect(sarahOrder).toContainText("Payment: Paid");
  await sarahOrder.click();

  const orderDetail = page.getByLabel("Order detail");
  const lifecycle = orderDetail.getByRole("list", { name: "Order lifecycle. Current status: In Production" });
  await expect(orderDetail.getByRole("heading", { name: "Sarah Mitchell" })).toBeVisible();
  await expect(lifecycle).toBeVisible();
  await expect(lifecycle.getByRole("listitem").filter({ hasText: "In Production" })).toHaveAttribute("aria-current", "step");
  await expect(page.getByRole("region", { name: "Pickup summary" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Payment summary" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Production progress" })).toContainText(/\d+ of \d+ tasks complete/);
  await expect(page.getByRole("progressbar", { name: "Production tasks completed" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Mark Ready" })).toBeVisible();

  const backButton = page.getByRole("button", { name: "Back to orders" });
  if ((page.viewportSize()?.width ?? 1280) < 1024) {
    await expect(backButton).toBeVisible();
    await expect(page.getByLabel("Orders queue")).toBeHidden();
    await backButton.click();
    await expect(page.getByLabel("Orders queue")).toBeVisible();
    await expect(page.getByRole("button", { name: /Open order .* for Sarah Mitchell/ })).toBeVisible();
  } else {
    await expect(backButton).toBeHidden();
    await expect(page.getByLabel("Orders queue")).toBeVisible();
    await expect(orderDetail).toBeVisible();
  }
});

test("marks an outstanding order balance paid from order detail", async ({ page }) => {
  await logInAndOpenOrders(page);

  await page.getByRole("button", { name: /Open order .* for James Okonkwo/ }).click();
  const payment = page.getByRole("region", { name: "Payment summary" });
  await expect(payment).toContainText("$12.00 due");
  await payment.getByRole("button", { name: "Mark as Paid" }).click();
  await expect(payment).toContainText("Paid in full");
  await expect(payment.getByRole("button", { name: "Mark as Paid" })).toHaveCount(0);
  await expect(page.getByRole("list", { name: "Order lifecycle. Current status: Confirmed" })).toBeVisible();
});

test("moves a confirmed order through completion and into Completed", async ({ page }) => {
  await logInAndOpenOrders(page);

  await page.getByRole("button", { name: /Open order .* for James Okonkwo/ }).click();
  await expect(page.getByRole("list", { name: "Order lifecycle. Current status: Confirmed" })).toBeVisible();
  await page.getByRole("button", { name: "Start Production" }).click();
  await expect(page.getByRole("list", { name: "Order lifecycle. Current status: In Production" })).toBeVisible();
  await page.getByRole("button", { name: "Mark Ready" }).click();
  await expect(page.getByRole("list", { name: "Order lifecycle. Current status: Ready" })).toBeVisible();
  await page.getByRole("button", { name: "Mark Completed" }).click();
  await expect(page.getByRole("list", { name: "Order lifecycle. Current status: Completed" })).toBeVisible();
  await expect(page.getByLabel("Order action")).toContainText("No further lifecycle action is needed.");

  if ((page.viewportSize()?.width ?? 1280) < 1024) {
    await page.getByRole("button", { name: "Back to orders" }).click();
  }

  await expect(page.getByRole("tab", { name: /^Current/ })).toContainText("2");
  const completedTab = page.getByRole("tab", { name: /^Completed/ });
  await expect(completedTab).toContainText("2");
  await completedTab.click();
  await expect(completedTab).toHaveAttribute("aria-selected", "true");
  const completedOrder = page.getByRole("button", { name: /Open order .* for James Okonkwo/ });
  await expect(completedOrder).toBeVisible();
  await expect(completedOrder).toContainText("Status: Completed");
});
