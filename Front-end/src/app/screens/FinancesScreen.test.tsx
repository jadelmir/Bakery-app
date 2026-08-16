import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FIXTURE_BAKERY_IDS, fixtureSnapshotFor } from "../domain/fixtures";
import { FinancesScreen } from "./FinancesScreen";

afterEach(() => cleanup());

describe("FinancesScreen", () => {
  it("renders active bakery metrics and derived product options", () => {
    const snapshot = fixtureSnapshotFor(FIXTURE_BAKERY_IDS.EARLS);
    if (!snapshot) throw new Error("Expected fixture snapshot.");

    render(<FinancesScreen snapshot={snapshot} />);

    expect(screen.getByText("Finances")).toBeInTheDocument();
    expect(screen.getByText("$138.00")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Sourdough Loaf" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Focaccia" })).toBeInTheDocument();
    expect(screen.queryByText("23% vs June")).not.toBeInTheDocument();
  });

  it("updates metrics and product performance when filters change", () => {
    const snapshot = fixtureSnapshotFor(FIXTURE_BAKERY_IDS.EARLS);
    if (!snapshot) throw new Error("Expected fixture snapshot.");

    render(<FinancesScreen snapshot={snapshot} />);
    fireEvent.change(screen.getByLabelText("Report product filter"), { target: { value: "Sourdough Loaf" } });

    expect(screen.getAllByText("$98.00").length).toBeGreaterThan(0);
    expect(screen.queryByText("Sourdough Loaf detail")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Sourdough Loaf/ }));
    expect(screen.getByText("Sourdough Loaf detail")).toBeInTheDocument();
  });

  it("opens unpaid detail and navigates to Orders", () => {
    const snapshot = fixtureSnapshotFor(FIXTURE_BAKERY_IDS.EARLS);
    if (!snapshot) throw new Error("Expected fixture snapshot.");
    const onNavigate = vi.fn();

    render(<FinancesScreen snapshot={snapshot} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole("button", { name: /The Reed Family/ }));

    expect(screen.getByText("order-026 details")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Open Orders/ }));
    expect(onNavigate).toHaveBeenCalledWith("orders");
  });
});
