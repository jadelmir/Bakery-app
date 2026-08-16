import * as React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DirtyFormGuardProvider, UnsavedChangesDialog, useDirtyFormGuard, useDirtyFormRegistration } from "./dirtyFormGuard";
import { isWorkspacePath, resolveWorkspaceRoute, workspacePath, workspaceRouteRegistry } from "./routeRegistry";
import { WorkspaceRoutes } from "./WorkspaceRoutes";
import { SIDEBAR_NAV, Sidebar } from "./Sidebar";
import type { BakeryMembership } from "../workspace";

afterEach(cleanup);

function RouteView() {
  return <WorkspaceRoutes renderRoute={(route) => <h1>{route.label}</h1>} />;
}

function HistoryControls() {
  const navigate = useNavigate();
  return <>
    <button onClick={() => navigate(-1)}>Back</button>
    <button onClick={() => navigate(1)}>Forward</button>
  </>;
}

describe("workspace route registry", () => {
  it("defines every canonical primary and utility path", () => {
    expect(workspaceRouteRegistry.filter((route) => route.kind === "primary").map((route) => route.path)).toEqual([
      "/home", "/orders", "/invoices", "/storefront", "/production",
      "/recipes", "/inventory", "/customers", "/finances", "/settings",
    ]);
    expect(workspacePath("payment-settings")).toBe("/invoices/payment-settings");
    expect(workspacePath("account")).toBe("/settings/account");
    expect(workspacePath("more")).toBe("/more");
  });

  it("keeps the sidebar items in the requested workspace order", () => {
    expect(SIDEBAR_NAV.map((item) => item.label)).toEqual([
      "Home",
      "Orders",
      "Recipes",
      "Inventory",
      "Customers",
      "Production",
      "Finances",
      "Invoices",
      "Online Store",
      "Settings",
    ]);
  });

  it("resolves explicit legacy aliases to their canonical route without claiming public paths", () => {
    expect(resolveWorkspaceRoute("/app/home")).toMatchObject({ canonicalPath: "/home", isAlias: true });
    expect(resolveWorkspaceRoute("/app/settings/store")).toMatchObject({ canonicalPath: "/storefront", isAlias: true });
    expect(resolveWorkspaceRoute("/app/payment-settings")).toMatchObject({ canonicalPath: "/invoices/payment-settings", isAlias: true });
    expect(resolveWorkspaceRoute("/app/not-a-page")).toBeUndefined();
    expect(isWorkspacePath("/invoice/public-token")).toBe(false);
    expect(isWorkspacePath("/store/harbor-bakery")).toBe(false);
    expect(isWorkspacePath("/auth/sign-in")).toBe(false);
  });

  it("renders a direct entry and keeps the URL route aligned with back and forward history", () => {
    render(
      <MemoryRouter initialEntries={["/home", "/orders"]} initialIndex={1}>
        <HistoryControls />
        <RouteView />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Orders" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("heading", { name: "Home" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Forward" }));
    expect(screen.getByRole("heading", { name: "Orders" })).toBeInTheDocument();
  });

  it("redirects aliases and offers a safe fallback for unknown workspace paths", async () => {
    const { unmount } = render(<MemoryRouter initialEntries={["/app/home"]}><RouteView /></MemoryRouter>);
    expect(await screen.findByRole("heading", { name: "Home" })).toBeInTheDocument();
    unmount();

    render(<MemoryRouter initialEntries={["/workspace-missing"]}><RouteView /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return to Home" })).toHaveAttribute("href", "/home");
  });
});

function DirtyFormHarness({ onProceed, discard }: { onProceed: () => void; discard: () => void }) {
  useDirtyFormRegistration({ id: "order-draft", isDirty: true, discard });
  const { requestExit } = useDirtyFormGuard();
  return <>
    <button onClick={() => requestExit("navigation", onProceed)}>Leave page</button>
    <UnsavedChangesDialog />
  </>;
}

const testMembership: BakeryMembership = {
  id: "membership-1",
  bakeryId: "bakery-1",
  bakeryName: "Harbor Bakery",
  role: "owner",
  isDefault: true,
};

describe("dirty-form guard", () => {
  it("keeps a dirty draft on stay and discards it before continuing", async () => {
    const proceed = vi.fn();
    const discard = vi.fn();
    render(<DirtyFormGuardProvider><DirtyFormHarness onProceed={proceed} discard={discard} /></DirtyFormGuardProvider>);

    fireEvent.click(screen.getByRole("button", { name: "Leave page" }));
    expect(screen.getByRole("heading", { name: "Discard unsaved changes?" })).toBeInTheDocument();
    expect(proceed).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Stay" }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Discard unsaved changes?" })).not.toBeInTheDocument());
    expect(discard).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Leave page" }));
    fireEvent.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(discard).toHaveBeenCalledOnce();
    expect(proceed).toHaveBeenCalledOnce();
  });

  it("warns the browser before unloading while a registered form is dirty", () => {
    render(<DirtyFormGuardProvider><DirtyFormHarness onProceed={vi.fn()} discard={vi.fn()} /></DirtyFormGuardProvider>);
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it("opens and cancels the bakery selector confirmation without leaving", async () => {
    const onManageStores = vi.fn();
    render(
      <MemoryRouter>
        <DirtyFormGuardProvider>
          <Sidebar bakeryName="Harbor Bakery" activeMembership={testMembership} onManageStores={onManageStores} onAddOrder={vi.fn()} onLogout={vi.fn()} />
        </DirtyFormGuardProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Return to bakery selection from Harbor Bakery" }));
    expect(screen.getByRole("heading", { name: "Return to bakery selection?" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Return to bakery selection?" })).not.toBeInTheDocument());
    expect(onManageStores).not.toHaveBeenCalled();
  });

  it("shows the active upcoming order count in the Orders navigation item", () => {
    render(
      <MemoryRouter>
        <DirtyFormGuardProvider>
          <Sidebar
            bakeryName="Harbor Bakery"
            activeMembership={testMembership}
            upcomingOrderCount={4}
            onAddOrder={vi.fn()}
            onLogout={vi.fn()}
          />
        </DirtyFormGuardProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: "Orders" })).toHaveAccessibleDescription("4 upcoming orders");
    expect(screen.getByRole("button", { name: "Orders" })).toHaveTextContent("4");
  });

  it("routes confirmation through the dirty-form guard before returning", () => {
    const onManageStores = vi.fn();
    const discard = vi.fn();
    function Harness() {
      useDirtyFormRegistration({ id: "order-draft", isDirty: true, discard });
      return <Sidebar bakeryName="Harbor Bakery" activeMembership={testMembership} onManageStores={onManageStores} onAddOrder={vi.fn()} onLogout={vi.fn()} />;
    }

    render(<MemoryRouter><DirtyFormGuardProvider><Harness /><UnsavedChangesDialog /></DirtyFormGuardProvider></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Return to bakery selection from Harbor Bakery" }));
    fireEvent.click(screen.getByRole("button", { name: "Return to bakery selection" }));
    expect(screen.getByRole("heading", { name: "Discard unsaved changes?" })).toBeInTheDocument();
    expect(onManageStores).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(discard).toHaveBeenCalledOnce();
    expect(onManageStores).toHaveBeenCalledOnce();
  });
});
