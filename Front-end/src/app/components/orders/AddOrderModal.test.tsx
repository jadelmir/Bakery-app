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

afterEach(cleanup);
beforeEach(() => mocks.createCustomer.mockReset());

function renderModal() {
  return render(<AddOrderModal onClose={vi.fn()} onCreatePlan={vi.fn()} customers={[]} recipes={[]} />);
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
