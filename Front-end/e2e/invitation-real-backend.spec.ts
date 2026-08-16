import { expect, test } from "@playwright/test";

const inviterEmail = process.env.E2E_INVITER_EMAIL ?? "admin@jadorebakery.com";
const inviterPassword = process.env.E2E_INVITER_PASSWORD ?? "password123";

test("sends a real invitation and reports duplicate pending requests", async ({ page }) => {
  const inviteeEmail = `browser-invite-${Date.now()}@example.com`;
  await page.goto("/");
  await page.getByLabel("Email address").fill(inviterEmail);
  await page.getByLabel("Password", { exact: true }).fill(inviterPassword);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("heading", { name: "Select a bakery" })).toBeVisible();
  await page.getByRole("button", { name: "Enter bakery" }).click();
  await expect(page.getByRole("button", { name: /^Orders/ }).first()).toBeVisible();

  if ((page.viewportSize()?.width ?? 1280) < 1024) {
    await page.getByRole("button", { name: "More" }).click();
  }
  await page.getByRole("button", { name: /Settings App & notifications/i }).or(page.getByRole("button", { name: "Settings", exact: true })).filter({ visible: true }).click();
  await expect(page.getByRole("heading", { name: "Team access" })).toBeVisible();

  const inviteEmail = page.getByLabel("Email address");
  await inviteEmail.fill(inviteeEmail);
  await page.getByRole("button", { name: "Invite" }).click();
  await expect(page.getByRole("status")).toContainText(`Invitation sent to ${inviteeEmail}`);
  await expect(page.getByText(inviteeEmail, { exact: true })).toBeVisible();

  await inviteEmail.fill(inviteeEmail);
  await page.getByRole("button", { name: "Invite" }).click();
  await expect(page.getByRole("alert")).toContainText("pending invitation already exists");

  await page.getByRole("button", { name: "Revoke" }).last().click();
  await expect(page.getByRole("status")).toContainText("Invitation revoked");
});
