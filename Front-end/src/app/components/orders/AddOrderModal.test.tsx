import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createCustomer: vi.fn() }));

vi.mock("../../state/provider", () => ({
  useBakeryDomain: () => ({
    bakeryId: "bakery-test",
    state: {},
    commands: { createCustomer: mocks.createCustomer },
  }),
}));

import { AddOrderModal } from "./AddOrderModal";
import type { Customer } from "../../types";

afterEach(cleanup);
afterEach(() => vi.useRealTimers());
beforeEach(() => mocks.createCustomer.mockReset());

function renderModal(customers: Customer[] = [], recipes: { id: string; name: string; yield: string; sellingPrice: number }[] = []) {
  return render(<AddOrderModal onClose={vi.fn()} onCreatePlan={vi.fn()} customers={customers} recipes={recipes} />);
}

function fillCustomer() {
  fireEvent.change(screen.getByLabelText(/customer name/i), { target: { value: "Fresh Customer" } });
  fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "fresh@example.test" } });
}

describe("AddOrderModal customer creation", () => {
  it("opens the existing customer editor and selects the authoritative created customer", async () => {
    mocks.createCustomer.mockResolvedValue({
      ok: true,
      data: {
        kind: "customer-mutated",
        operationId: "operation-1",
        changes: {
          customers: [{
            id: "customer-1",
            bakeryId: "bakery-test",
            name: "Fresh Customer",
            email: "fresh@example.test",
            phone: "",
            type: "retail",
            address: "",
            notes: "",
          }],
        },
      },
    });

    renderModal();
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /add new customer/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fillCustomer();
    fireEvent.click(screen.getByRole("button", { name: /create customer/i }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(mocks.createCustomer).toHaveBeenCalledTimes(1);
    expect(mocks.createCustomer).toHaveBeenCalledWith(expect.objectContaining({
      bakeryId: "bakery-test",
      name: "Fresh Customer",
      email: "fresh@example.test",
      type: "retail",
    }));
    const selectedCustomer = screen.getByRole("button", { name: /Fresh Customer.*fresh@example\.test/i });
    expect(selectedCustomer).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled();
    expect(screen.getByText("New Order")).toBeInTheDocument();
  });

  it("keeps the editor open when customer persistence fails", async () => {
    mocks.createCustomer.mockResolvedValue({
      ok: false,
      error: { kind: "connection", message: "Customer could not be saved.", retryable: true },
    });

    renderModal();
    fireEvent.click(screen.getByRole("button", { name: /add new customer/i }));
    fillCustomer();
    fireEvent.click(screen.getByRole("button", { name: /create customer/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Customer could not be saved.");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });

  it("cancels customer creation without invoking persistence", () => {
    renderModal();
    fireEvent.click(screen.getByRole("button", { name: /add new customer/i }));
    fireEvent.click(screen.getByRole("button", { name: /close dialog/i }));

    expect(mocks.createCustomer).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("New Order")).toBeInTheDocument();
  });
});

describe("AddOrderModal pickup date", () => {
  it("defaults a newly opened order to today's local date and keeps it editable", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 17, 9, 0));
    renderModal(
      [{ id: "customer-1", name: "Yuri", email: "yuri@example.test", phone: "", address: "", notes: "", orders: 0, totalSpent: 0, balance: 0, favorites: [] }],
      [{ id: "recipe-1", name: "Loaf", yield: "1 loaf", sellingPrice: 9 }],
    );

    fireEvent.click(screen.getByRole("button", { name: /Yuri.*yuri@example\.test/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    fireEvent.click(screen.getByRole("button", { name: "Add", exact: true }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    expect(screen.getByDisplayValue("2026-08-17")).toBeInTheDocument();
    fireEvent.change(screen.getByDisplayValue("2026-08-17"), { target: { value: "2026-08-20" } });
    expect(screen.getByDisplayValue("2026-08-20")).toBeInTheDocument();
  });
});
