import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InventoryScreen } from "./InventoryScreen";

afterEach(cleanup);
const props = {
  tasks: [], builds: [], transactions: [],
  inventoryItems: [
    { id: "flour", name: "Flour", current: 5000, onHand: 5000, reserved: 4000, unit: "g", minLevel: 0, upcoming: 0, status: "in-stock" as const, kind: "ingredient" as const, required: 2000 },
    { id: "bag", name: "Bread bags", current: -2, onHand: -2, unit: "unit", minLevel: 0, upcoming: 0, status: "out-of-stock" as const, kind: "packaging" as const },
    { id: "loaf", name: "Sourdough loaf", current: 12, onHand: 12, allocated: 10, unit: "unit", minLevel: 0, upcoming: 0, status: "in-stock" as const, kind: "finished_good" as const },
  ],
};

describe("InventoryScreen", () => {
  it("shows reservations, available stock, demand shortage, and negative-stock warnings", () => {
    render(<InventoryScreen {...props} />);
    expect(screen.getByText("Ingredients")).toBeInTheDocument();
    expect(screen.getByText("Retail supplies")).toBeInTheDocument();
    expect(screen.getByText("Finished goods (production output)")).toBeInTheDocument();
    expect(screen.getAllByText(/Reserved/).length).toBeGreaterThan(0);
    expect(screen.getByText("Shortage is from scheduled demand after reservations.")).toBeInTheDocument();
    expect(screen.getByText(/Negative stock: production can continue/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Starter" })).not.toBeInTheDocument();
  });

  it("excludes allocated finished goods from availability", () => {
    render(<InventoryScreen {...props} />);
    expect(screen.getByText("Production output")).toBeInTheDocument();
    expect(screen.getAllByText("2unit").length).toBeGreaterThan(0);
  });

  it("explains shopping-list shortages using available stock after reservations", () => {
    render(<InventoryScreen {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /Shopping list/ }));
    expect(screen.getByText(/Available stock already excludes reservations/)).toBeInTheDocument();
    expect(screen.getByText(/Scheduled demand after reservations causes this shortage/)).toBeInTheDocument();
  });

  it("opens the simple add-item form", () => {
    render(<InventoryScreen {...props} onCreateInventoryItem={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Add item" }));
    expect(screen.getByRole("heading", { name: "Add inventory item" })).toBeInTheDocument();
    expect(screen.getByText("Ingredient")).toBeInTheDocument();
    expect(screen.getByText("Retail supply")).toBeInTheDocument();
  });

  it("opens an inventory item directly in the edit-and-stock modal", () => {
    render(<InventoryScreen {...props} onUpdateInventoryItem={vi.fn()} />);
    fireEvent.click(screen.getByTitle("Edit Flour or add stock"));
    expect(screen.getByRole("heading", { name: "Edit inventory item" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Receive purchase" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });
});
