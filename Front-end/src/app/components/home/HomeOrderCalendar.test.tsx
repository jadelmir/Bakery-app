import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FIXTURE_BAKERY_IDS, fixtureSnapshotFor } from "../../domain/fixtures";
import type { BakeryDomainSnapshot } from "../../domain/types";
import { HomeOrderCalendar } from "./HomeOrderCalendar";

const referenceDate = new Date("2026-08-15T16:00:00.000Z");

function snapshotWithTodayOrder(): BakeryDomainSnapshot {
  const source = fixtureSnapshotFor(FIXTURE_BAKERY_IDS.EARLS);
  if (!source) throw new Error("Expected fixture snapshot.");
  return {
    ...source,
    ordersById: {
      ...source.ordersById,
      "order-024": { ...source.ordersById["order-024"], pickupDate: "2026-08-15" },
    },
  };
}

afterEach(() => {
  cleanup();
});

describe("HomeOrderCalendar", () => {
  it("shows day counts, compact product summaries, and persisted order details", async () => {
    render(<HomeOrderCalendar snapshot={snapshotWithTodayOrder()} referenceDate={referenceDate} onNavigate={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Today" })).toBeInTheDocument();
    expect(screen.getByText("1 order")).toBeInTheDocument();
    expect(screen.getByText("2 Sourdough Loaf · 2 Focaccia")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Open order order-024/ }));

    expect(await screen.findByRole("heading", { name: "Sarah Mitchell" })).toBeInTheDocument();
    expect(screen.getByText("sarah.m@email.com")).toBeInTheDocument();
    expect(screen.getByText("14 Birch Lane, Mill Valley")).toBeInTheDocument();
    expect(screen.getByText("Please slice one loaf")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Sarah Mitchell" })).not.toBeInTheDocument());
  });

  it("shows loading and empty states without fixture order cards", () => {
    const { rerender } = render(<HomeOrderCalendar referenceDate={referenceDate} />);

    expect(screen.getByRole("region", { name: "Upcoming orders" })).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByRole("button", { name: /Open order/ })).not.toBeInTheDocument();

    const source = fixtureSnapshotFor(FIXTURE_BAKERY_IDS.EARLS);
    if (!source) throw new Error("Expected fixture snapshot.");
    rerender(<HomeOrderCalendar snapshot={source} referenceDate={referenceDate} />);

    expect(screen.getByText("No upcoming orders")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Open order/ })).not.toBeInTheDocument();
  });

  it("handles an order whose customer has no contact details", async () => {
    const source = snapshotWithTodayOrder();
    const customer = source.customersById["customer-sarah"];
    if (!customer) throw new Error("Expected Sarah customer fixture.");

    render(
      <HomeOrderCalendar
        snapshot={{ ...source, customersById: { ...source.customersById, [customer.id]: { ...customer, phone: undefined, email: "", address: undefined } } }}
        referenceDate={referenceDate}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Open order order-024/ }));
    expect(await screen.findByText("No contact details provided.")).toBeInTheDocument();
  });
});
