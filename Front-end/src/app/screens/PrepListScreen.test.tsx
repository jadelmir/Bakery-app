import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FIXTURE_BAKERY_IDS, fixtureSnapshotFor } from "../domain/fixtures";
import { PrepListScreen } from "./PrepListScreen";

describe("PrepListScreen", () => {
  it("filters by prep date and shows products, material groups, and shortages", () => {
    const snapshot = fixtureSnapshotFor(FIXTURE_BAKERY_IDS.EARLS);
    if (!snapshot) throw new Error("Fixture snapshot unavailable");

    render(<PrepListScreen snapshot={snapshot} />);
    expect(screen.getByRole("heading", { name: "Prep List" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View prep for 2026-07-29" })).toBeInTheDocument();
    expect(screen.getByText("Sourdough Loaf")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Ingredients/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Packaging & supplies/ })).toBeInTheDocument();
    expect(screen.getByText(/Short 2,200g/)).toBeInTheDocument();
  });

  it("shows an empty state for a date without eligible prep work", () => {
    const snapshot = fixtureSnapshotFor(FIXTURE_BAKERY_IDS.EARLS);
    if (!snapshot) throw new Error("Fixture snapshot unavailable");

    render(<PrepListScreen snapshot={{ ...snapshot, ordersById: {}, orderItemsById: {} }} />);
    expect(screen.getByText(/No confirmed, in-production, or ready orders need prep/)).toBeInTheDocument();
  });
});
