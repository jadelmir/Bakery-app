import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InventoryItemCreateDialog } from "./InventoryItemCreateDialog";

afterEach(cleanup);

describe("InventoryItemCreateDialog", () => {
  it("creates a retail supply with an opening stock balance", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<InventoryItemCreateDialog isOpen onClose={onClose} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Inventory item name"), { target: { value: "Paper bags" } });
    fireEvent.click(screen.getByRole("radio", { name: "Retail supply" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByTitle(/Minimum level is your reorder alert threshold/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Inventory initial on-hand quantity"), { target: { value: "250" } });
    fireEvent.change(screen.getByLabelText("Inventory package quantity"), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText("Inventory package price"), { target: { value: "17" } });
    fireEvent.change(screen.getByLabelText("Inventory minimum level"), { target: { value: "25" } });
    fireEvent.click(screen.getByRole("button", { name: "Add item" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: "Paper bags", kind: "packaging", unit: "g", initialOnHand: 250, packageQuantity: 100, packagePrice: 17, minLevel: 25 }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Default unit cost:/)).toBeInTheDocument();
    expect(screen.getByText(/Opening stock: 250 g/)).toBeInTheDocument();
  });

  it("retains item details when moving back from stock setup", () => {
    render(<InventoryItemCreateDialog isOpen onClose={vi.fn()} onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Inventory item name"), { target: { value: "Bread flour" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.change(screen.getByLabelText("Inventory initial on-hand quantity"), { target: { value: "5000" } });
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByLabelText("Inventory item name")).toHaveValue("Bread flour");
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByLabelText("Inventory initial on-hand quantity")).toHaveValue(5000);
  });
});
