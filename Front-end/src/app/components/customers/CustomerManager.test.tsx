import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CustomerManager } from "./CustomerManager";

afterEach(cleanup);

const formValues = () => {
  fireEvent.click(screen.getByRole("button", { name: /add customer/i }));
  fireEvent.change(screen.getByLabelText(/customer name/i), { target: { value: "Authoritative Bakery" } });
  fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "orders@authoritative.test" } });
};

describe("CustomerManager persistence handoff", () => {
  it("renders the backend customer and closes only after the add resolves", async () => {
    let resolveSave: ((value: { ok: true; data: { changes: { customers: unknown[] } } }) => void) | undefined;
    const onAddCustomer = vi.fn(() => new Promise((resolve) => {
      resolveSave = resolve;
    }));

    render(<CustomerManager customers={[]} onAddCustomer={onAddCustomer} />);
    formValues();
    fireEvent.click(screen.getByRole("button", { name: /create customer/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();

    resolveSave?.({
      ok: true,
      data: { changes: { customers: [{ id: "backend-customer-id", name: "Authoritative Bakery", email: "orders@authoritative.test", type: "retail" }] } },
    });

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText("Authoritative Bakery")).toBeInTheDocument();
  });

  it("keeps the form open and shows a failure from the parent", async () => {
    const onAddCustomer = vi.fn(async () => ({
      ok: false as const,
      error: { message: "Customer could not be saved." },
    }));

    render(<CustomerManager customers={[]} onAddCustomer={onAddCustomer} />);
    formValues();
    fireEvent.click(screen.getByRole("button", { name: /create customer/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Customer could not be saved.");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Authoritative Bakery")).toBeInTheDocument();
  });
});
