import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InventoryAdjustModal, type InventoryCommand } from "./InventoryAdjustModal";

const item = { id: "flour", name: "Flour", unit: "g", onHand: 8000 };
const editableItem = { ...item, kind: "ingredient" as const, minLevel: 1000, packageQuantity: 10000, packagePrice: 17 };
afterEach(cleanup);

describe("InventoryAdjustModal", () => {
  it("converts received packages to a base-unit command", async () => {
    const onCommand = vi.fn().mockResolvedValue(undefined);
    render(<InventoryAdjustModal isOpen onClose={vi.fn()} items={[item]} onCommand={onCommand} />);
    fireEvent.change(screen.getByLabelText("Package count"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Package base-unit quantity"), { target: { value: "25000" } });
    fireEvent.click(screen.getByRole("button", { name: "Record entry" }));
    await waitFor(() => expect(onCommand).toHaveBeenCalledWith(expect.objectContaining({ type: "receive", baseQuantity: 75000 })));
    expect(await screen.findByRole("status")).toHaveTextContent("Purchase received");
  });

  it("validates physical counts and sends a relative adjustment", async () => {
    const onCommand = vi.fn().mockResolvedValue(undefined);
    render(<InventoryAdjustModal isOpen onClose={vi.fn()} items={[item]} onCommand={onCommand} />);
    fireEvent.click(screen.getByRole("radio", { name: "Physical count" }));
    fireEvent.click(screen.getByRole("button", { name: "Record entry" }));
    expect(screen.getByRole("alert")).toHaveTextContent("physical count");
    fireEvent.click(screen.getByRole("radio", { name: "Relative adjustment" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Relative adjustment" }), { target: { value: "-500" } });
    fireEvent.click(screen.getByRole("button", { name: "Record entry" }));
    await waitFor(() => expect(onCommand).toHaveBeenCalledWith(expect.objectContaining({ type: "relative-adjustment", quantityChange: -500 })));
  });

  it("keeps the form open and exposes a retry-safe mutation error", async () => {
    render(<InventoryAdjustModal isOpen onClose={vi.fn()} items={[item]} onCommand={vi.fn().mockRejectedValue(new Error("Network unavailable"))} />);
    fireEvent.change(screen.getByLabelText("Package count"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Package base-unit quantity"), { target: { value: "1000" } });
    fireEvent.click(screen.getByRole("button", { name: "Record entry" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Network unavailable");
  });

  it("opens directly on item editing and submits updated details", async () => {
    const onCommand = vi.fn().mockResolvedValue(undefined);
    render(<InventoryAdjustModal isOpen onClose={vi.fn()} items={[editableItem]} initialAction="edit-item" onCommand={onCommand} />);
    fireEvent.change(screen.getByLabelText("Editable inventory item name"), { target: { value: "Whole wheat flour" } });
    fireEvent.change(screen.getByLabelText("Editable inventory minimum level"), { target: { value: "2000" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(onCommand).toHaveBeenCalledWith(expect.objectContaining({ type: "edit-item", name: "Whole wheat flour", minLevel: 2000 })));
    expect(await screen.findByRole("status")).toHaveTextContent("Inventory item updated");
  });

  it("requires confirmation before deleting an item and closes after success", async () => {
    const onCommand = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<InventoryAdjustModal isOpen onClose={onClose} items={[editableItem]} initialAction="edit-item" onCommand={onCommand} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete item" }));
    expect(screen.getByText("Its stock and purchase history will be preserved.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete item" }));
    await waitFor(() => expect(onCommand).toHaveBeenCalledWith({ type: "delete-item", itemId: "flour" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
