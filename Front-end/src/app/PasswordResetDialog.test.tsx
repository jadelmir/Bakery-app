import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMockAuthAdapter, type AuthAdapter } from "./auth";
import { PasswordResetDialog } from "./PasswordResetDialog";

afterEach(cleanup);

function createRecoveryAdapter(overrides: Partial<AuthAdapter> = {}): AuthAdapter {
  return {
    ...createMockAuthAdapter(0),
    updatePassword: vi.fn(async () => undefined),
    signOut: vi.fn(async () => undefined),
    ...overrides,
  };
}

function submitReplacement() {
  fireEvent.change(screen.getByLabelText("New password"), {
    target: { value: "replacement-password" },
  });
  fireEvent.change(screen.getByLabelText("Confirm new password"), {
    target: { value: "replacement-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Update password" }));
}

describe("PasswordResetDialog", () => {
  it("requests a reset without exposing a generic update-password tab", async () => {
    const onRequestPasswordReset = vi.fn(async () => undefined);
    render(
      <PasswordResetDialog
        isOpen
        onClose={() => undefined}
        onRequestPasswordReset={onRequestPasswordReset}
      />,
    );

    expect(screen.queryByRole("button", { name: "Update Password" })).toBeNull();
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "owner@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() => expect(onRequestPasswordReset).toHaveBeenCalledWith("owner@example.com"));
    expect(screen.getByRole("status").textContent).toContain("Check your inbox");
  });

  it("updates the password before ending the recovery session", async () => {
    const order: string[] = [];
    const onSuccess = vi.fn();
    const adapter = createRecoveryAdapter({
      updatePassword: vi.fn(async () => {
        order.push("update");
      }),
      signOut: vi.fn(async () => {
        order.push("sign-out");
      }),
    });
    render(
      <PasswordResetDialog
        isOpen
        onClose={() => undefined}
        authAdapter={adapter}
        initialMode="update"
        onSuccess={onSuccess}
      />,
    );

    submitReplacement();

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(order).toEqual(["update", "sign-out"]);
    expect(screen.getByRole("status").textContent).toContain("Password updated successfully");
  });

  it("keeps the recovery session active when the password update fails", async () => {
    const signOut = vi.fn(async () => undefined);
    const adapter = createRecoveryAdapter({
      updatePassword: vi.fn(async () => {
        throw new Error("Recovery link is expired or already used.");
      }),
      signOut,
    });
    render(
      <PasswordResetDialog
        isOpen
        onClose={() => undefined}
        authAdapter={adapter}
        initialMode="update"
      />,
    );

    submitReplacement();

    expect((await screen.findByRole("alert")).textContent).toContain("expired or already used");
    expect(signOut).not.toHaveBeenCalled();
  });

  it("reports sign-out failure and does not finish recovery", async () => {
    const onSuccess = vi.fn();
    const adapter = createRecoveryAdapter({
      signOut: vi.fn(async () => {
        throw new Error("network unavailable");
      }),
    });
    render(
      <PasswordResetDialog
        isOpen
        onClose={() => undefined}
        authAdapter={adapter}
        initialMode="update"
        onSuccess={onSuccess}
      />,
    );

    submitReplacement();

    expect((await screen.findByRole("alert")).textContent).toContain(
      "couldn't end the recovery session",
    );
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
