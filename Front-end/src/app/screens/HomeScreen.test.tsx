import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FIXTURE_BAKERY_IDS, fixtureSnapshotFor } from "../domain/fixtures";
import { selectDashboard, selectFinances } from "../state/selectors";
import { HomeScreen } from "./HomeScreen";

afterEach(() => cleanup());

describe("HomeScreen", () => {
  it("renders operational metrics and prep from the active snapshot", () => {
    const snapshot = fixtureSnapshotFor(FIXTURE_BAKERY_IDS.EARLS);
    if (!snapshot) throw new Error("Expected Earl's Bakery fixture snapshot.");

    const dashboard = selectDashboard(snapshot);
    const finances = selectFinances(snapshot);
    const margin = Math.round((finances.profit / finances.revenue) * 100);

    render(<HomeScreen bakeryName="Earl's Bakery" snapshot={snapshot} onOpenPrepList={() => undefined} />);

    expect(screen.getByText(`${dashboard.activeOrders.length} active orders in queue`)).toBeInTheDocument();
    expect(screen.getByText(`$${finances.revenue}`, { exact: true })).toBeInTheDocument();
    expect(screen.getByText(`$${finances.profit}`, { exact: true })).toBeInTheDocument();
    expect(screen.getByText(`${margin}% margin`, { exact: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Today's Prep List" })).toBeInTheDocument();
    expect(screen.queryByText("Daily Production Progress")).not.toBeInTheDocument();
    expect(screen.queryByText("Today's Tasks")).not.toBeInTheDocument();
    expect(screen.queryByText("Tomorrow's Prep")).not.toBeInTheDocument();
    expect(screen.queryByText("Starter Alert", { exact: true })).not.toBeInTheDocument();
    expect(screen.queryByText("Action Needed", { exact: true })).not.toBeInTheDocument();
    expect(screen.queryByText("Overdue production tasks", { exact: true })).not.toBeInTheDocument();
    expect(screen.queryByText("$172", { exact: true })).not.toBeInTheDocument();
    expect(screen.queryByText("+18% this week", { exact: true })).not.toBeInTheDocument();
  });
});
