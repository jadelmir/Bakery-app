import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AccountProfileScreen,
  changeAccountPassword,
  CurrentPasswordVerificationError,
  type AccountPasswordChangeOperation,
} from "./AccountProfileScreen";
import { getSupabaseBrowserClient } from "../lib/supabase/client";

vi.mock("../lib/supabase/client", () => ({
  getSupabaseBrowserClient: vi.fn(),
}));

const session = {
  user: {
    id: "owner-1",
    email: "owner@example.com",
  },
};

const mockedGetSupabaseBrowserClient = vi.mocked(getSupabaseBrowserClient);

function renderScreen(changePassword: AccountPasswordChangeOperation = vi.fn()) {
  render(<AccountProfileScreen session={session} changePassword={changePassword} />);
  return changePassword;
}

function fillPasswordForm({
  current = "current-password",
  replacement = "replacement-password",
  confirmation = replacement,
}: {
  current?: string;
  replacement?: string;
  confirmation?: string;
} = {}) {
  fireEvent.change(screen.getByLabelText("Current Password"), {
    target: { value: current },
  });
  fireEvent.change(screen.getByLabelText("New Password"), {
    target: { value: replacement },
  });
  fireEvent.change(screen.getByLabelText("Confirm New Password"), {
    target: { value: confirmation },
  });
}

function submitPasswordForm() {
  fireEvent.click(screen.getByRole("button", { name: "Update Password" }));
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("changeAccountPassword", () => {
  it("verifies the current credential before updating the password", async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({ error: null });
    const updateUser = vi.fn().mockResolvedValue({ error: null });
    mockedGetSupabaseBrowserClient.mockReturnValue({
      auth: { signInWithPassword, updateUser },
    } as never);

    await changeAccountPassword({
      email: "owner@example.com",
      currentPassword: "current-password",
      newPassword: "replacement-password",
    });

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "owner@example.com",
      password: "current-password",
    });
    expect(updateUser).toHaveBeenCalledWith({ password: "replacement-password" });
    expect(signInWithPassword.mock.invocationCallOrder[0]).toBeLessThan(
      updateUser.mock.invocationCallOrder[0],
    );
  });

  it("does not update when Supabase rejects the current credential", async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({
      error: new Error("Invalid login credentials"),
    });
    const updateUser = vi.fn();
    mockedGetSupabaseBrowserClient.mockReturnValue({
      auth: { signInWithPassword, updateUser },
    } as never);

    await expect(
      changeAccountPassword({
        email: "owner@example.com",
        currentPassword: "wrong-password",
        newPassword: "replacement-password",
      }),
    ).rejects.toBeInstanceOf(CurrentPasswordVerificationError);
    expect(updateUser).not.toHaveBeenCalled();
  });
});

describe("AccountProfileScreen password change", () => {
  it("requires the current password before invoking the operation", () => {
    const changePassword = vi.fn();
    renderScreen(changePassword);
    fillPasswordForm({ current: "" });

    submitPasswordForm();

    expect(screen.getByRole("alert")).toHaveTextContent("Enter your current password.");
    expect(changePassword).not.toHaveBeenCalled();
  });

  it.each([
    {
      name: "weak replacement",
      values: { replacement: "short", confirmation: "short" },
      message: "New password must be at least 8 characters long.",
    },
    {
      name: "mismatched replacement",
      values: { replacement: "replacement-password", confirmation: "different-password" },
      message: "New passwords do not match.",
    },
  ])("rejects a $name before invoking the operation", ({ values, message }) => {
    const changePassword = vi.fn();
    renderScreen(changePassword);
    fillPasswordForm(values);

    submitPasswordForm();

    expect(screen.getByRole("alert")).toHaveTextContent(message);
    expect(changePassword).not.toHaveBeenCalled();
  });

  it("keeps a valid replacement entered when the current password is incorrect", async () => {
    const changePassword = vi
      .fn<AccountPasswordChangeOperation>()
      .mockRejectedValue(new CurrentPasswordVerificationError());
    renderScreen(changePassword);
    fillPasswordForm({ current: "wrong-password" });

    submitPasswordForm();

    expect(await screen.findByRole("alert")).toHaveTextContent("Current password is incorrect.");
    expect(screen.getByLabelText("New Password")).toHaveValue("replacement-password");
    expect(screen.getByLabelText("Confirm New Password")).toHaveValue("replacement-password");
  });

  it("shows pending and success states, clears credentials, and keeps the account mounted", async () => {
    let resolveChange: (() => void) | undefined;
    const changePassword = vi.fn<AccountPasswordChangeOperation>(
      () => new Promise<void>((resolve) => {
        resolveChange = resolve;
      }),
    );
    renderScreen(changePassword);
    fillPasswordForm();

    submitPasswordForm();

    const pendingButton = screen.getByRole("button", { name: /Updating password/ });
    expect(pendingButton).toBeDisabled();
    expect(pendingButton.closest("form")).toHaveAttribute("aria-busy", "true");
    expect(changePassword).toHaveBeenCalledWith({
      email: "owner@example.com",
      currentPassword: "current-password",
      newPassword: "replacement-password",
    });

    resolveChange?.();

    expect(await screen.findByRole("status")).toHaveTextContent("Password changed successfully.");
    expect(screen.getByLabelText("Current Password")).toHaveValue("");
    expect(screen.getByLabelText("New Password")).toHaveValue("");
    expect(screen.getByLabelText("Confirm New Password")).toHaveValue("");
    expect(screen.getByRole("heading", { name: "Account & Profile" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("owner@example.com")).toBeInTheDocument();
  });

  it("shows backend update failures accessibly without clearing credentials", async () => {
    const changePassword = vi
      .fn<AccountPasswordChangeOperation>()
      .mockRejectedValue(new Error("Password update is temporarily unavailable."));
    renderScreen(changePassword);
    fillPasswordForm();

    submitPasswordForm();

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Password update is temporarily unavailable.",
      );
    });
    expect(screen.getByLabelText("Current Password")).toHaveValue("current-password");
    expect(screen.getByLabelText("New Password")).toHaveValue("replacement-password");
  });
});
