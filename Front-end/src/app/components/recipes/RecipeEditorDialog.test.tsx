import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RecipeEditorDialog } from "./RecipeEditorDialog";

afterEach(cleanup);

const baseProps = {
  onClose: vi.fn(),
  inventoryItems: [{ id: "flour", name: "Flour", unit: "g", unitCost: 0.002 }],
  productionFlows: [
    { id: "flow-sourdough", name: "Sourdough Flow" },
    { id: "flow-focaccia", name: "Focaccia Flow" },
  ],
};

describe("RecipeEditorDialog production flow assignment", () => {
  it("creates a recipe without assigning a production flow", () => {
    const onSave = vi.fn();
    render(<RecipeEditorDialog {...baseProps} onSave={onSave} />);

    expect(screen.getByLabelText("Production Flow")).toHaveValue("");
    fireEvent.change(screen.getByLabelText("Recipe Name *"), { target: { value: "Baguette" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Recipe" }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: "Baguette", flowId: null, ingredients: [] }));
    expect(screen.queryByLabelText("Batch Yield")).not.toBeInTheDocument();
  });

  it("starts with no default ingredients and can create the first inventory item", async () => {
    const onCreateInventoryItem = vi.fn().mockResolvedValue({ id: "sugar", name: "Sugar", unit: "g", kind: "ingredient", unitCost: 0 });
    const view = render(<RecipeEditorDialog {...baseProps} inventoryItems={[]} onCreateInventoryItem={onCreateInventoryItem} onSave={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Add Ingredient" }));
    fireEvent.change(screen.getByLabelText("Inventory item name"), { target: { value: "Sugar" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.change(screen.getByLabelText("Inventory package quantity"), { target: { value: "5000" } });
    fireEvent.change(screen.getByLabelText("Inventory package price"), { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: "Add item" }));

    await waitFor(() => expect(onCreateInventoryItem).toHaveBeenCalledWith(expect.objectContaining({ name: "Sugar", kind: "ingredient" })));
    expect(screen.getByRole("option", { name: "Sugar (g)" })).toBeInTheDocument();

    view.rerender(<RecipeEditorDialog {...baseProps} inventoryItems={[{ id: "sugar", name: "Sugar", unit: "g", kind: "ingredient", unitCost: 0 }]} onCreateInventoryItem={onCreateInventoryItem} onSave={vi.fn()} />);
    expect(screen.getAllByRole("option", { name: "Sugar (g)" })).toHaveLength(1);
  });

  it("offers inventory-item creation from an ingredient row", () => {
    const onCreateInventoryItem = vi.fn();
    render(<RecipeEditorDialog {...baseProps} onCreateInventoryItem={onCreateInventoryItem} onSave={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Add Ingredient" }));
    const ingredientSelect = screen.getByRole("option", { name: "+ Create new inventory item" }).parentElement;
    if (!ingredientSelect) throw new Error("Expected the ingredient selector.");
    fireEvent.change(ingredientSelect, { target: { value: "__create_inventory_item__" } });

    expect(screen.getByLabelText("Inventory item name")).toBeInTheDocument();
  });

  it("preserves an assigned flow when saving", () => {
    const onSave = vi.fn();
    render(<RecipeEditorDialog {...baseProps} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText("Production Flow"), { target: { value: "flow-focaccia" } });
    fireEvent.change(screen.getByLabelText("Recipe Name *"), { target: { value: "Focaccia" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Recipe" }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ flowId: "flow-focaccia" }));
  });

  it("keeps an existing unassigned recipe ready for later assignment", () => {
    render(
      <RecipeEditorDialog
        {...baseProps}
        recipe={{ id: "recipe-1", name: "Baguette", yield: "1 loaf", sellingPrice: 8, flowId: null, ingredients: [] }}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Production Flow")).toHaveValue("");
    expect(screen.getByRole("option", { name: "Assign later" })).toBeInTheDocument();
  });

  it("keeps the editor open and reports a persistence failure", async () => {
    const onClose = vi.fn();
    const onSave = vi.fn().mockRejectedValue(new Error("Recipe save failed"));
    render(<RecipeEditorDialog {...baseProps} onClose={onClose} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText("Recipe Name *"), { target: { value: "Baguette" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Recipe" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Recipe save failed");
    expect(onClose).not.toHaveBeenCalled();
  });
});
