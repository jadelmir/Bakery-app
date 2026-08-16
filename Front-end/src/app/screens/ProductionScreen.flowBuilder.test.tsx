import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_FLOWS } from "../production";
import { FlowBuilder } from "./ProductionScreen";

afterEach(cleanup);

describe("Production FlowBuilder entry point", () => {
  it("shows a larger Add flow card first and opens the full builder from a flow card", () => {
    render(<FlowBuilder flows={structuredClone(DEFAULT_FLOWS)} onSaveFlow={vi.fn()} />);

    const cards = screen.getByLabelText("Production flows");
    expect(cards).toHaveClass("grid");
    expect(within(cards).getByRole("button", { name: "Add flow" })).toHaveClass("min-h-[180px]");
    expect(within(cards).getByRole("button", { name: /Standard Sourdough Loaf/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText("Assigned recipe:")).not.toBeInTheDocument();

    fireEvent.click(within(cards).getByRole("button", { name: /Focaccia/ }));

    const builder = screen.getByRole("dialog", { name: /production flow/i });
    expect(within(builder).getByDisplayValue("Standard Focaccia")).toBeInTheDocument();
    expect(within(builder).getByRole("heading", { name: "Edit production flow" })).toBeInTheDocument();
  });

  it("opens New flow as an empty builder and saves a recipe-specific first step", () => {
    const onSaveFlow = vi.fn();
    render(<FlowBuilder flows={[structuredClone(DEFAULT_FLOWS[0])]} onSaveFlow={onSaveFlow} />);

    fireEvent.click(screen.getByRole("button", { name: "Add flow" }));
    const builder = screen.getByRole("dialog", { name: /production flow/i });
    expect(within(builder).getByRole("heading", { name: "Build Production Flow" })).toBeInTheDocument();
    expect(within(builder).getByText("No steps yet")).toBeInTheDocument();

    fireEvent.change(within(builder).getByLabelText("Flow name"), { target: { value: "Focaccia Flow" } });
    fireEvent.change(within(builder).getByLabelText("Recipe"), { target: { value: "Focaccia" } });
    fireEvent.click(within(builder).getByRole("button", { name: "Add first step" }));
    fireEvent.change(within(builder).getByLabelText("Step name"), { target: { value: "Starter rise" } });
    fireEvent.change(within(builder).getByLabelText("Baker instructions"), { target: { value: "Let the starter rise." } });
    fireEvent.click(within(builder).getByRole("button", { name: "Save Production Flow" }));

    expect(onSaveFlow).toHaveBeenCalledWith(expect.objectContaining({
      name: "Focaccia Flow",
      recipe: "Focaccia",
      steps: [expect.objectContaining({ name: "Starter rise" })],
    }));
  });
});
