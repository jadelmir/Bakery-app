import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InventoryItemCreateDialog } from "./InventoryItemCreateDialog";

afterEach(cleanup);

describe("InventoryItemCreateDialog", () => {
  it("creates either an ingredient or retail supply with a clear zero-stock starting point", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<InventoryItemCreateDialog isOpen onClose={onClose} onSubmit={onSubmit} />);

    expect(screen.getByTitle(/Minimum level is your reorder alert threshold/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Inventory item name"), { target: { value: "Paper bags" } });
    fireEvent.click(screen.getByRole("radio", { name: "Retail supply" }));
    fireEvent.change(screen.getByLabelText("Inventory package quantity"), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText("Inventory package price"), { target: { value: "17" } });
    fireEvent.change(screen.getByLabelText("Inventory minimum level"), { target: { value: "25" } });
    fireEvent.click(screen.getByRole("button", { name: "Add item" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: "Paper bags", kind: "packaging", unit: "g", packageQuantity: 100, packagePrice: 17, minLevel: 25 }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Default unit cost:/)).toBeInTheDocument();
    expect(screen.getByText(/New items start at zero on hand/)).toBeInTheDocument();
  });
});
