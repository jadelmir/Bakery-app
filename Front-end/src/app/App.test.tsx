import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter, useLocation } from "react-router";
import type { AuthChangeEvent } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { BakeryWorkspace } from "./BakeryWorkspace";
import { createMockAuthAdapter, type AuthAdapter, type AuthSession } from "./auth";
import { createMockWorkspaceAdapter } from "./workspace";

function CurrentRoute() {
  const location = useLocation();
  return <output data-testid="current-route" hidden>{location.pathname}</output>;
}

function renderWithRouter(ui: ReactElement, initialEntry = window.location.pathname) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      {ui}
      <CurrentRoute />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  window.history.replaceState({}, "", "/");
});

function createControlledRecoveryAdapter(options: { delaySession?: boolean } = {}) {
  let listener:
    | ((session: AuthSession | null, event: AuthChangeEvent) => void)
    | undefined;
  let resolveSession: ((session: AuthSession | null) => void) | undefined;
  const sessionPromise = options.delaySession
    ? new Promise<AuthSession | null>(resolve => {
        resolveSession = resolve;
      })
    : Promise.resolve(null);
  const adapter: AuthAdapter = {
    ...createMockAuthAdapter(0),
    getSession: vi.fn(() => sessionPromise),
    onAuthStateChange: vi.fn(callback => {
      listener = callback;
      return () => undefined;
    }),
    updatePassword: vi.fn(async () => undefined),
    signOut: vi.fn(async () => undefined),
  };
  return {
    adapter,
    emit(event: AuthChangeEvent, session: AuthSession | null) {
      listener?.(session, event);
    },
    resolveSession(session: AuthSession | null) {
      resolveSession?.(session);
    },
  };
}

describe("Bakery frontend prototype", () => {
  it("renders the primary navigation", () => {
    renderWithRouter(<BakeryWorkspace />, "/home");

    expect(screen.getAllByText("Home").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Orders").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Production").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Recipes").length).toBeGreaterThan(0);
  });

  it("preserves an invitation token and reloads memberships after acceptance", async () => {
    const auth = createMockAuthAdapter(0);
    await auth.signIn({ email: "invitee@example.com", password: "password1" });
    const workspaces = createMockWorkspaceAdapter([]);
    const memberships = [{
      id: "accepted-membership",
      bakeryId: "invited-bakery",
      bakeryName: "Invited Bakery",
      role: "staff" as const,
      isDefault: false,
    }];
    vi.spyOn(workspaces, "listMemberships")
      .mockResolvedValueOnce([])
      .mockResolvedValue(memberships);
    window.history.replaceState({}, "", "/?invitation=opaque-token");

    renderWithRouter(<App authAdapter={auth} workspaceAdapter={workspaces} />);

    expect(await screen.findByRole("heading", { name: "Join this store?" })).toBeTruthy();
    fireEvent.click(await screen.findByRole("button", { name: "Accept invitation" }));
    expect((await screen.findByRole("status")).textContent).toContain("Invitation accepted");
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByRole("heading", { name: "Select a bakery" })).toBeTruthy();
  });

  it("opens the order workflow from the accessible mobile action", () => {
    renderWithRouter(<BakeryWorkspace />, "/home");

    fireEvent.click(screen.getByRole("button", { name: "Add order" }));

    expect(screen.getByRole("heading", { name: "New Order" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Sarah Mitchell/ })).toBeTruthy();
  });

  it("uses the aligned catalog and describes confirmation as an order save", async () => {
    renderWithRouter(<BakeryWorkspace />, "/home");

    fireEvent.click(screen.getByRole("button", { name: "Add order" }));
    fireEvent.click(screen.getByRole("button", { name: /Sarah Mitchell/ }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect((await screen.findAllByText("Sourdough Loaf")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Focaccia").length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole("button", { name: "Add" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Review Order" }));

    expect(screen.getByText("Ready to create")).toBeTruthy();
    expect(screen.getByText(/order will be saved/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create Order" })).toBeTruthy();
  });

  it("shows a traceable production plan in order details", async () => {
    renderWithRouter(<BakeryWorkspace />, "/home");

    fireEvent.click(screen.getAllByRole("button", { name: "Orders" })[0]);
    await screen.findByRole("heading", { name: "Orders" });
    await screen.findByText("James Okonkwo");
    fireEvent.click(screen.getByRole("button", { name: /Open order #025 for James Okonkwo/ }));
    expect(await screen.findByLabelText("Production progress")).toBeTruthy();
    expect(screen.getByRole("progressbar", { name: "Production tasks completed" })).toBeTruthy();
    expect(screen.getByText("View task history")).toBeTruthy();
  });

  it("supports calendar navigation and shared task actions", async () => {
    renderWithRouter(<BakeryWorkspace />, "/home");

    fireEvent.click(screen.getAllByRole("button", { name: "Production" })[0]);
    await screen.findByRole("heading", { name: "Production Workspace" });
    fireEvent.click(await screen.findByRole("button", { name: "calendar" }));

    expect(screen.getByLabelText("Select production day")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Actions & notes" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Toggle details" })[0]);
    const note = screen.getAllByPlaceholderText("Add a production note")[0];
    fireEvent.change(note, { target: { value: "Use the blue tray" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Save note" })[0]);

    expect(screen.getAllByText("Note: Use the blue tray").length).toBeGreaterThan(0);
    const reason = screen.getAllByPlaceholderText("Reason required")[0];
    fireEvent.change(reason, { target: { value: "Starter not ready" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Skip" })[0]);
    expect(screen.getAllByText("Skipped").length).toBeGreaterThan(0);
  });

  it("shows the flow builder and Tomorrow schedule", async () => {
    renderWithRouter(<BakeryWorkspace />, "/home");

    fireEvent.click(screen.getAllByRole("button", { name: "Production" })[0]);
    await screen.findByRole("heading", { name: "Production Workspace" });
    fireEvent.click(await screen.findByRole("button", { name: "Flow Builder" }));
    fireEvent.click(screen.getByRole("button", { name: /Standard Sourdough Loaf/ }));
    expect(screen.getByDisplayValue("Standard Sourdough Loaf")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "Add flow" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Import from existing flow" }), { target: { value: "flow-sourdough" } });
    expect(screen.getByDisplayValue("Standard Sourdough Loaf Copy")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "Schedule" }));
    fireEvent.click(screen.getByRole("button", { name: "tomorrow" }));
    expect(screen.getByText(/Bakery timezone/)).toBeTruthy();
  });

  it("filters reporting, exports results, and opens notifications", async () => {
    renderWithRouter(<BakeryWorkspace />, "/home");
    fireEvent.click(screen.getAllByRole("button", { name: "Finances" })[0]);
    fireEvent.change(await screen.findByLabelText("Report product filter"), { target: { value: "Focaccia" } });
    fireEvent.click(screen.getByRole("button", { name: "Export CSV" }));
    expect(screen.getByText(/Report export is ready/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Report date range"), { target: { value: "empty" } });
    expect(screen.getByText(/No records match these filters/)).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Home" })[0]);
    fireEvent.click(await screen.findByRole("button", { name: "View notifications" }));
    expect(screen.getByLabelText("Notifications")).toBeTruthy();
  });

  it("shows calculated inventory requirements and shopping list", async () => {
    renderWithRouter(<BakeryWorkspace />, "/home");

    fireEvent.click(screen.getAllByRole("button", { name: /Inventory/ })[0]);
    expect(await screen.findByRole("heading", { name: /Inventory/ })).toBeTruthy();
    expect(screen.getAllByText(/Required/).length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText("Inventory order filter"), { target: { value: "#025" } });
    expect(screen.getByDisplayValue("#025")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Shopping list/ }));
    expect(await screen.findByRole("heading", { name: "Shopping list" })).toBeTruthy();
  });
});

describe("Authenticated workspace routes", () => {
  it("keeps a canonical direct entry behind authentication and bakery selection", async () => {
    window.history.replaceState({}, "", "/orders");

    renderWithRouter(<App authAdapter={createMockAuthAdapter(0)} />);

    expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Orders" })).toBeNull();
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "owner@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password" } });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("heading", { name: "Select a bakery" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Orders" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Enter bakery" }));

    expect(await screen.findByRole("heading", { name: "Orders" })).toBeTruthy();
    expect(screen.getByTestId("current-route").textContent).toBe("/orders");
  });

  it.each([
    ["/storefront", "Online Storefront"],
    ["/settings/account", "Account & Profile"],
  ])("renders the utility/configuration route %s", async (path, heading) => {
    const authAdapter = createMockAuthAdapter(0);
    const session: AuthSession = { user: { id: "route-user", email: "owner@example.com" } };

    renderWithRouter(
      <BakeryWorkspace session={session} authAdapter={authAdapter} />,
      path,
    );

    expect(await screen.findByRole("heading", { name: heading })).toBeTruthy();
    expect(screen.getByTestId("current-route").textContent).toBe(path);
  });

  it("routes invoice utility callbacks through guarded workspace navigation", async () => {
    renderWithRouter(<BakeryWorkspace />, "/invoices");

    fireEvent.click(await screen.findByRole("button", { name: "Payment Settings" }));
    expect(await screen.findByRole("heading", { name: "Payment Settings" })).toBeTruthy();
    expect(screen.getByTestId("current-route").textContent).toBe("/invoices/payment-settings");

    fireEvent.click(screen.getByTitle("Back"));
    expect(await screen.findByRole("heading", { name: "Invoices" })).toBeTruthy();
    expect(screen.getByTestId("current-route").textContent).toBe("/invoices");
  });

  it.each([
    ["/invoice/tok_sample_123", "Earl's Bakery"],
    ["/store/jadore-bakery", "J'adore Bakery"],
  ])("preserves the public route %s outside the workspace", async (path, heading) => {
    window.history.replaceState({}, "", path);

    renderWithRouter(<App authAdapter={createMockAuthAdapter(0)} />);

    expect(await screen.findByRole("heading", { name: heading })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Orders/ })).toBeNull();
    expect(window.location.pathname).toBe(path);
  });
});

describe("Frontend authentication shell", () => {
  it("denies direct reset-path entry and offers a new recovery request", async () => {
    window.history.replaceState({}, "", "/auth/reset-password");
    const recovery = createControlledRecoveryAdapter();

    renderWithRouter(<App authAdapter={recovery.adapter} />);

    expect((await screen.findByRole("alert")).textContent).toContain("invalid or has expired");
    expect(screen.getByRole("heading", { name: "Reset your password" })).toBeTruthy();
    expect(screen.queryByLabelText("New password")).toBeNull();
    expect(screen.queryByRole("button", { name: /^Orders/ })).toBeNull();
  });

  it("keeps a recovery event valid when it arrives before session restoration", async () => {
    window.history.replaceState({}, "", "/auth/reset-password");
    const recovery = createControlledRecoveryAdapter({ delaySession: true });
    const recoverySession: AuthSession = {
      user: { id: "recovering-user", email: "owner@example.com" },
    };

    renderWithRouter(<App authAdapter={recovery.adapter} />);
    act(() => recovery.emit("PASSWORD_RECOVERY", recoverySession));

    expect(await screen.findByRole("heading", { name: "Set new password" })).toBeTruthy();
    act(() => recovery.resolveSession(null));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Set new password" })).toBeTruthy();
    });
    expect(screen.queryByRole("button", { name: /^Orders/ })).toBeNull();
  });

  it("signs out a completed recovery and returns to login with confirmation", async () => {
    window.history.replaceState({}, "", "/auth/reset-password");
    const recovery = createControlledRecoveryAdapter({ delaySession: true });
    const recoverySession: AuthSession = {
      user: { id: "recovering-user", email: "owner@example.com" },
    };

    renderWithRouter(<App authAdapter={recovery.adapter} />);
    act(() => recovery.emit("PASSWORD_RECOVERY", recoverySession));
    await screen.findByRole("heading", { name: "Set new password" });
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "replacement-password" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "replacement-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));

    expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("Log in with your new password");
    expect(recovery.adapter.updatePassword).toHaveBeenCalledWith("replacement-password");
    expect(recovery.adapter.signOut).toHaveBeenCalledOnce();
    expect(window.location.pathname).toBe("/auth/login");
  });

  it("keeps the workspace hidden and switches between login and signup", async () => {
    renderWithRouter(<App authAdapter={createMockAuthAdapter(0)} />);

    expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeTruthy();
    const loginHeader = screen.getByText("Production Studio").parentElement!;
    expect(loginHeader.textContent).not.toContain("Earl's Bakery");
    expect(screen.queryByRole("button", { name: /^Orders/ })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));
    expect(screen.getByRole("heading", { name: "Create your bakery account" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByText("Enter a valid email address.")).toBeTruthy();
    expect(screen.getByText("Enter your password.")).toBeTruthy();
    expect(screen.getByText("Confirm your password.")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password" } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "different" } });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(screen.getByText("Passwords do not match.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeTruthy();
  });

  it("shows pending and request failure states without exposing the workspace", async () => {
    renderWithRouter(<App authAdapter={createMockAuthAdapter(25)} />);
    await screen.findByRole("heading", { name: "Welcome back" });
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "error@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password" } });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect((screen.getByRole("button", { name: "Please wait…" }) as HTMLButtonElement).disabled).toBe(true);
    expect((await screen.findByRole("alert")).textContent).toContain("couldn't authenticate");
    expect(screen.queryByRole("button", { name: /^Orders/ })).toBeNull();
  });

  it("gates bakery data behind explicit selection and clears it on logout", async () => {
    renderWithRouter(<App authAdapter={createMockAuthAdapter(0)} />);
    await screen.findByRole("heading", { name: "Welcome back" });
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "owner@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password" } });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("heading", { name: "Select a bakery" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Orders/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Enter bakery" }));
    await waitFor(() => expect(screen.getAllByText("Home").length).toBeGreaterThan(0));
    await waitFor(() => expect(screen.getByTestId("current-route").textContent).toBe("/home"));
    fireEvent.click(screen.getAllByRole("button", { name: "Log out" })[0]);
    await waitFor(() => expect(screen.getByRole("heading", { name: "Welcome back" })).toBeTruthy());
    expect(screen.queryByRole("button", { name: /^Orders/ })).toBeNull();
  });

  it("returns to bakery selection without signing out", async () => {
    renderWithRouter(<App authAdapter={createMockAuthAdapter(0)} />);
    await screen.findByRole("heading", { name: "Welcome back" });
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "owner@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password" } });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("heading", { name: "Select a bakery" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Enter bakery" }));
    await waitFor(() => expect(screen.getAllByText("Home").length).toBeGreaterThan(0));

    sessionStorage.setItem("bakery:mock-owner", "bakery-a");
    fireEvent.click(screen.getAllByRole("button", { name: /Return to bakery selection from/ })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Return to bakery selection" }));

    expect(await screen.findByRole("heading", { name: "Select a bakery" })).toBeTruthy();
    expect(sessionStorage.getItem("bakery:mock-owner")).toBeNull();
    expect(screen.queryByRole("button", { name: /^Orders/ })).toBeNull();
  });

  it("preselects the default bakery and clears the prior view when switching", async () => {
    const workspaces = createMockWorkspaceAdapter([
      { id: "m-a", bakeryId: "bakery-a", bakeryName: "North Bakery", role: "owner", isDefault: false },
      { id: "m-b", bakeryId: "bakery-b", bakeryName: "South Bakery", role: "manager", isDefault: true },
    ]);
    renderWithRouter(<App authAdapter={createMockAuthAdapter(0)} workspaceAdapter={workspaces} />);
    await screen.findByRole("heading", { name: "Welcome back" });
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "owner@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password" } });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    const south = await screen.findByRole("radio", { name: /South Bakery/ });
    expect(south.getAttribute("aria-checked")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Enter bakery" }));
    expect(await screen.findAllByText(/manager · active bakery/)).not.toHaveLength(0);

    fireEvent.click(screen.getAllByRole("button", { name: "Orders" })[0]);
    fireEvent.change(screen.getAllByLabelText("Switch active bakery")[0], { target: { value: "bakery-a" } });
    expect(await screen.findAllByText("owner · active bakery")).not.toHaveLength(0);
    expect(screen.getAllByText("Home").length).toBeGreaterThan(0);
  });

  it("restores only a remembered bakery that remains accessible to the restored user", async () => {
    const auth = createMockAuthAdapter(0);
    await auth.signIn({ email: "owner@example.com", password: "password" });
    sessionStorage.setItem("bakery:mock-owner", "bakery-b");
    const workspaces = createMockWorkspaceAdapter([
      { id: "m-a", bakeryId: "bakery-a", bakeryName: "North Bakery", role: "owner", isDefault: true },
      { id: "m-b", bakeryId: "bakery-b", bakeryName: "South Bakery", role: "manager", isDefault: false },
    ]);
    const { unmount } = renderWithRouter(<App authAdapter={auth} workspaceAdapter={workspaces} />);
    expect(await screen.findAllByText("manager · active bakery")).not.toHaveLength(0);
    unmount();

    sessionStorage.setItem("bakery:mock-owner", "inaccessible-bakery");
    renderWithRouter(<App authAdapter={auth} workspaceAdapter={workspaces} />);
    expect(await screen.findByRole("heading", { name: "Select a bakery" })).toBeTruthy();
    expect(sessionStorage.getItem("bakery:mock-owner")).toBeNull();
  });

  it("shows an existing accessible bakery before onboarding", async () => {
    const workspaces = createMockWorkspaceAdapter([
      { id: "m-existing", bakeryId: "bakery-existing", bakeryName: "Existing Bakery", role: "owner", isDefault: true },
    ]);
    renderWithRouter(<App authAdapter={createMockAuthAdapter(0)} workspaceAdapter={workspaces} />);
    await screen.findByRole("heading", { name: "Welcome back" });
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "owner@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password" } });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("radio", { name: /Existing Bakery/ })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Create your bakery" })).toBeNull();
  });

  it("uses idempotent default creation only when onboarding has no memberships", async () => {
    const workspaces = createMockWorkspaceAdapter([]);
    const createDefaultBakery = vi.spyOn(workspaces, "createDefaultBakery");
    const createAdditionalBakery = vi.spyOn(workspaces, "createAdditionalBakery");
    renderWithRouter(<App authAdapter={createMockAuthAdapter(0)} workspaceAdapter={workspaces} />);
    await screen.findByRole("heading", { name: "Welcome back" });
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "owner@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password" } });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    await screen.findByRole("heading", { name: "Create your bakery" });

    fireEvent.click(screen.getByRole("button", { name: "Create bakery" }));

    await screen.findByText("My Bakery");
    expect(createDefaultBakery).toHaveBeenCalledWith("My Bakery");
    expect(createAdditionalBakery).not.toHaveBeenCalled();
  });

  it("retains the original bakery and immediately enters a newly created bakery", async () => {
    const workspaces = createMockWorkspaceAdapter([
      { id: "m-original", bakeryId: "bakery-original", bakeryName: "Original Bakery", role: "owner", isDefault: true },
    ]);
    const createDefaultBakery = vi.spyOn(workspaces, "createDefaultBakery");
    const createAdditionalBakery = vi.spyOn(workspaces, "createAdditionalBakery");
    renderWithRouter(<App authAdapter={createMockAuthAdapter(0)} workspaceAdapter={workspaces} />);
    await screen.findByRole("heading", { name: "Welcome back" });
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "owner@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password" } });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    await screen.findByRole("radio", { name: /Original Bakery/ });

    fireEvent.click(screen.getByRole("button", { name: "Add new bakery" }));
    fireEvent.change(screen.getByLabelText("New bakery name"), { target: { value: "Second Bakery" } });
    fireEvent.click(screen.getByRole("button", { name: "Create & Enter Bakery" }));

    expect(await screen.findAllByText(/Second Bakery/)).not.toHaveLength(0);
    expect(screen.getAllByText(/owner · active bakery/)).not.toHaveLength(0);
    fireEvent.click(screen.getAllByRole("button", { name: "Orders" })[0]);
    const switcher = screen.getAllByLabelText("Switch active bakery")[0];
    expect((switcher as HTMLSelectElement).value).toMatch(/^dev-bakery-/);
    expect(Array.from((switcher as HTMLSelectElement).options).map(option => option.text)).toEqual(
      expect.arrayContaining(["Original Bakery", "Second Bakery"]),
    );
    expect(createAdditionalBakery).toHaveBeenCalledWith("Second Bakery");
    expect(createDefaultBakery).not.toHaveBeenCalled();
  });
});
