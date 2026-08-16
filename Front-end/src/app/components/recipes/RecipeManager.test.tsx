import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RecipeManager, type DomainRecipeItem } from "./RecipeManager";

afterEach(cleanup);

const unassignedRecipe: DomainRecipeItem = {
  id: "recipe-unassigned",
  name: "Baguette",
  yield: "1 loaf",
  batchCost: 2,
  sellingPrice: 8,
  flowId: null,
  ingredients: [{ inventoryItemId: "flour", quantity: 500, cost: 1 }],
};

describe("RecipeManager later production flow assignment", () => {
  it("opens a fresh flow builder and assigns the saved flow to an unassigned recipe", async () => {
    const onUpdateRecipe = vi.fn();
    render(
      <RecipeManager
        recipes={[unassignedRecipe]}
        inventoryItems={[{ id: "flour", name: "Flour", unit: "g", unitCost: 0.002 }]}
        productionFlows={[]}
        onUpdateRecipe={onUpdateRecipe}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit Production Flow" }));
    expect(await screen.findByRole("heading", { name: "Build Production Flow" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add first step" }));
    fireEvent.change(screen.getByLabelText("Baker instructions"), { target: { value: "Let the starter rise." } });
    fireEvent.click(screen.getByRole("button", { name: "Save Production Flow" }));

    await waitFor(() => expect(onUpdateRecipe).toHaveBeenCalledWith(
      "recipe-unassigned",
      expect.objectContaining({ flowId: expect.stringMatching(/^flow-/) })
    ));
    expect(screen.getByText(/Flow$/)).toBeInTheDocument();
  });
});
