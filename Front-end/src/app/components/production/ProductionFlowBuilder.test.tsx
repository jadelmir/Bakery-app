import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_FLOWS } from "../../production";
import { ProductionFlowBuilder } from "./ProductionFlowBuilder";

const flow = structuredClone(DEFAULT_FLOWS[0]);

afterEach(cleanup);

function renderBuilder(overrides: Partial<React.ComponentProps<typeof ProductionFlowBuilder>> = {}) {
  const props = {
    isOpen: true,
    flow,
    recipeName: flow.recipe,
    onSave: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  return { ...render(<ProductionFlowBuilder {...props} />), props };
}

describe("ProductionFlowBuilder", () => {
  it("presents a timeline and focused step details for editing", () => {
    renderBuilder();

    expect(screen.getByRole("heading", { name: "Edit production flow" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Flow timeline" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Step details" })).toBeInTheDocument();
    expect(screen.getAllByText("2 days before pickup at 9:00 AM · about 15 min")).toHaveLength(2);
    expect(screen.getByLabelText("Step name")).toHaveValue("Check starter and inventory");
  });

  it("starts a new flow empty and adds the first step without a prerequisite", () => {
    const onSave = vi.fn();
    renderBuilder({ flow: undefined, recipeName: "Focaccia", onSave });

    expect(screen.getByRole("heading", { name: "Build Production Flow" })).toBeInTheDocument();
    expect(screen.getByText("No steps yet")).toBeInTheDocument();
    expect(screen.queryByText("Check starter and inventory")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add first step" }));
    fireEvent.change(screen.getByLabelText("Step name"), { target: { value: "Starter rise" } });
    fireEvent.change(screen.getByLabelText("Baker instructions"), { target: { value: "Let the starter rise until active." } });

    expect(screen.getByLabelText("Start after")).toHaveValue("");
    fireEvent.click(screen.getByRole("button", { name: "Save Production Flow" }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      recipe: "Focaccia",
      steps: [expect.objectContaining({ name: "Starter rise", dependsOn: undefined })],
    }));
  });

  it("imports an existing flow into a new draft with copied step identities", () => {
    const source = structuredClone(DEFAULT_FLOWS[0]);
    const onSave = vi.fn();
    renderBuilder({ flow: undefined, recipeName: "Focaccia", availableFlows: [source], onSave });

    fireEvent.change(screen.getByLabelText("Import from existing flow"), { target: { value: source.id } });

    expect(screen.getByLabelText("Flow name")).toHaveValue(`${source.name} Copy`);
    expect(screen.getByLabelText("Recipe")).toHaveValue(source.recipe);
    expect(screen.getByText("Check starter and inventory")).toBeInTheDocument();
    expect(screen.getByText("Standard Sourdough Loaf imported. Review the copied steps before saving.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Import from existing flow"), { target: { value: "" } });
    expect(screen.getByText("No steps yet")).toBeInTheDocument();
    expect(screen.queryByText("Check starter and inventory")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Flow name")).toHaveValue("Custom Focaccia Flow");
    expect(screen.getByLabelText("Recipe")).toHaveValue("Focaccia");

    fireEvent.change(screen.getByLabelText("Import from existing flow"), { target: { value: source.id } });
    expect(screen.getByRole("button", { name: "Save Production Flow" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save Production Flow" }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      name: `${source.name} Copy`,
      steps: expect.arrayContaining([
        expect.objectContaining({ id: expect.not.stringMatching(new RegExp(`^${source.steps[0].id}$`)) }),
      ]),
    }));
  });

  it("imports organized JSON from the AI prompt panel and populates the flow", () => {
    const onSave = vi.fn();
    renderBuilder({ flow: undefined, recipeName: "Sourdough Loaf", onSave });

    fireEvent.click(screen.getByRole("button", { name: "Import JSON" }));
    expect(screen.getByRole("dialog", { name: "Import a flow with AI assistance" })).toBeInTheDocument();
    expect(screen.getByText("AI organizer prompt")).toBeInTheDocument();
    expect(screen.getByLabelText("Organized flow JSON")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Organized flow JSON"), {
      target: {
        value: JSON.stringify({
          name: "Weekend Sourdough",
          recipe: "Sourdough Loaf",
          steps: [
            { id: "prep", name: "Prepare starter", category: "prep", dayOffset: -1, time: "08:00", duration: 15, instructions: "Prepare the starter.", enabled: true },
            { id: "mix", name: "Mix dough", category: "mixing", dayOffset: -1, time: "14:00", duration: 20, instructions: "Mix until incorporated.", enabled: true, dependsOn: "prep" },
          ],
        }),
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add JSON to flow" }));

    expect(screen.getByLabelText("Flow name")).toHaveValue("Weekend Sourdough");
    expect(screen.getByText("Prepare starter")).toBeInTheDocument();
    expect(screen.getByText("Mix dough")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save Production Flow" }));

    const savedFlow = onSave.mock.calls[0][0];
    expect(savedFlow.name).toBe("Weekend Sourdough");
    expect(savedFlow.steps).toHaveLength(2);
    expect(savedFlow.steps[1].dependsOn).toBe(savedFlow.steps[0].id);
  });

  it("supports adding and duplicating steps in the draft", () => {
    renderBuilder();

    fireEvent.click(screen.getByRole("button", { name: "Duplicate" }));
    expect(screen.getByText("Check starter and inventory copy")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add step" }));
    expect(screen.getByText("New step")).toBeInTheDocument();
    expect(screen.getByText("New step added. Add its instructions before saving.")).toBeInTheDocument();
    expect(document.activeElement).toHaveTextContent("New step");
  });

  it("shows validation feedback and prevents an invalid flow from saving", () => {
    const onSave = vi.fn();
    renderBuilder({
      flow: { ...flow, name: "", steps: [{ ...flow.steps[0], instructions: "" }] },
      onSave,
    });

    fireEvent.click(screen.getByRole("button", { name: "Save Production Flow" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Give this flow a name before saving.");
    expect(screen.getAllByText("Add instructions so the baker knows what to do.")).toHaveLength(2);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("confirms deletion and offers undo for a removed step", () => {
    renderBuilder();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = screen.getByRole("alertdialog", { name: "Delete this step?" });
    expect(dialog).toHaveTextContent("remove the prerequisite link");

    fireEvent.click(within(dialog).getByRole("button", { name: "Delete step" }));
    expect(screen.getByRole("status")).toHaveTextContent("deleted");
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getByText("Check starter and inventory")).toBeInTheDocument();
  });

  it("protects reset-to-default behind the same discard confirmation", () => {
    const onResetDefault = vi.fn();
    renderBuilder({ onResetDefault });

    fireEvent.change(screen.getByLabelText("Flow name"), { target: { value: "Edited default" } });
    fireEvent.click(screen.getByRole("button", { name: "Reset to default" }));
    const dialog = screen.getByRole("alertdialog", { name: "Reset this flow?" });
    expect(dialog).toHaveTextContent("Your edits will be replaced by the default flow.");

    fireEvent.click(within(dialog).getByRole("button", { name: "Reset flow" }));
    expect(onResetDefault).toHaveBeenCalledTimes(1);
  });

  it("keeps step actions and the saved payload compatible with the existing boundary", async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    renderBuilder({ onSave, onClose });

    expect(screen.queryByRole("button", { name: "Disable" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Enable" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Move Check starter and inventory down" }));
    fireEvent.click(screen.getByRole("button", { name: "Save Production Flow" }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ id: flow.id, recipe: flow.recipe, steps: expect.any(Array) }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("keeps the draft open and shows a persistence failure", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("Could not persist flow."));
    const onClose = vi.fn();
    renderBuilder({ onSave, onClose });

    fireEvent.click(screen.getByRole("button", { name: "Save Production Flow" }));

    await waitFor(() => expect(screen.getByText("Could not persist flow.")).toBeInTheDocument());
    expect(screen.getByRole("heading", { name: "Edit production flow" })).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("requires an explicit discard before closing a changed draft", () => {
    const onClose = vi.fn();
    renderBuilder({ onClose });

    fireEvent.click(screen.getByRole("button", { name: "Add step" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    const dialog = screen.getByRole("alertdialog", { name: "Discard unsaved changes?" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Discard changes" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
