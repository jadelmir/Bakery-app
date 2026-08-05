import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TeamManagement } from "./TeamManagement";
import { createMockWorkspaceAdapter, createSupabaseWorkspaceAdapter } from "./workspace";

afterEach(cleanup);

describe("bakery workspace adapters and team controls", () => {
  it("keeps the default mock workspace fixture free of runtime-check bakeries", async () => {
    const memberships = await createMockWorkspaceAdapter().listMemberships("mock-owner");
    const bakeryNames = memberships.map(membership => membership.bakeryName);

    expect(bakeryNames).toContain("J'adore Bakery");
    expect(bakeryNames).not.toContain("Runtime Check Bakery");
  });

  it("creates one deterministic default bakery for empty onboarding", async () => {
    const adapter = createMockWorkspaceAdapter([]);
    expect(await adapter.listMemberships("mock-owner")).toEqual([]);
    const bakeryId = await adapter.createDefaultBakery("Sunrise Bakery");
    const retryBakeryId = await adapter.createDefaultBakery("Different Bakery");
    const memberships = await adapter.listMemberships("mock-owner");
    expect(bakeryId).toContain("dev-bakery-");
    expect(retryBakeryId).toBe(bakeryId);
    expect(memberships).toHaveLength(1);
    expect(memberships[0]).toMatchObject({
      bakeryName: "Sunrise Bakery",
      role: "owner",
      isDefault: true,
    });
  });

  it("adds an explicit bakery without replacing existing memberships or the default", async () => {
    const adapter = createMockWorkspaceAdapter();
    const initialMemberships = await adapter.listMemberships("mock-owner");
    expect(initialMemberships).toHaveLength(1);

    const secondId = await adapter.createAdditionalBakery("Artisan Boulangerie");
    const updatedMemberships = await adapter.listMemberships("mock-owner");
    expect(updatedMemberships).toHaveLength(2);
    expect(updatedMemberships.find(m => m.bakeryId === secondId)).toMatchObject({
      bakeryName: "Artisan Boulangerie",
      role: "owner",
      isDefault: false,
    });
    expect(updatedMemberships.find(m => m.bakeryId === initialMemberships[0].bakeryId)?.isDefault).toBe(true);
  });

  it("maps accessible Supabase memberships and returns the created bakery ID", async () => {
    const membershipQuery = Promise.resolve({
      data: [{
        id: "membership-earls",
        bakery_id: "bakery-earls",
        role: "owner",
        bakeries: { name: "J'adore Bakery" },
      }],
      error: null,
    });
    const profileQuery = Promise.resolve({
      data: { default_bakery_id: "bakery-earls" },
      error: null,
    });
    const rpc = vi.fn(async () => ({ data: "bakery-new", error: null }));
    const client = {
      from: (table: string) => {
        if (table === "bakery_memberships") {
          return {
            select: () => ({
              eq: () => ({
                order: () => membershipQuery,
              }),
            }),
          };
        }
        return {
          select: () => ({
            eq: () => ({ maybeSingle: () => profileQuery }),
          }),
        };
      },
      rpc,
    } as unknown as Parameters<typeof createSupabaseWorkspaceAdapter>[0];
    const adapter = createSupabaseWorkspaceAdapter(client);

    await expect(adapter.listMemberships("user-owner")).resolves.toEqual([{
      id: "membership-earls",
      bakeryId: "bakery-earls",
      bakeryName: "J'adore Bakery",
      role: "owner",
      isDefault: true,
    }]);
    await expect(adapter.createDefaultBakery("Second Bakery")).resolves.toBe("bakery-new");
    expect(rpc).toHaveBeenCalledWith("create_default_bakery", { bakery_name: "Second Bakery" });
    await expect(adapter.createAdditionalBakery("Third Bakery")).resolves.toBe("bakery-new");
    expect(rpc).toHaveBeenCalledWith("create_additional_bakery", { bakery_name: "Third Bakery" });
  });

  it("rejects a successful create response without a bakery ID", async () => {
    const client = {
      rpc: vi.fn(async () => ({ data: null, error: null })),
    } as unknown as Parameters<typeof createSupabaseWorkspaceAdapter>[0];

    await expect(createSupabaseWorkspaceAdapter(client).createDefaultBakery("Unnamed Bakery"))
      .rejects.toThrow("Bakery creation did not return an ID.");
  });

  it("deletes a bakery store from accessible memberships", async () => {
    const adapter = createMockWorkspaceAdapter();
    const secondId = await adapter.createAdditionalBakery("Temporary Bakery");
    expect(await adapter.listMemberships("mock-owner")).toHaveLength(2);

    await adapter.deleteBakery(secondId);
    const remaining = await adapter.listMemberships("mock-owner");
    expect(remaining).toHaveLength(1);
    expect(remaining.some(m => m.bakeryId === secondId)).toBe(false);
  });

  it("lets an owner invite once and announces duplicate errors", async () => {
    const adapter = createMockWorkspaceAdapter();
    render(
      <TeamManagement
        membership={{
          id: "membership-earls",
          bakeryId: "dev-bakery-earls",
          bakeryName: "Earl's Bakery",
          role: "owner",
          isDefault: true,
        }}
        adapter={adapter}
      />,
    );

    await screen.findByText("Bakery Owner");
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "staff@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Invite" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Invitation sent");
    expect(await screen.findByText("staff@example.com")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "staff@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Invite" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("already exists"));
  });

  it("limits manager invitation choices to Staff and hides all controls for Staff", async () => {
    const adapter = createMockWorkspaceAdapter();
    const { rerender } = render(
      <TeamManagement
        membership={{
          id: "manager",
          bakeryId: "dev-bakery-earls",
          bakeryName: "Earl's Bakery",
          role: "manager",
          isDefault: false,
        }}
        adapter={adapter}
      />,
    );
    expect(await screen.findByLabelText("Role")).toHaveValue("staff");
    expect(screen.getByLabelText("Role").querySelectorAll("option")).toHaveLength(1);

    rerender(
      <TeamManagement
        membership={{
          id: "staff",
          bakeryId: "dev-bakery-earls",
          bakeryName: "Earl's Bakery",
          role: "staff",
          isDefault: false,
        }}
        adapter={adapter}
      />,
    );
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Invite someone" })).toBeNull());
  });
});
