import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RequestStateView } from "./RequestState";

afterEach(cleanup);

describe("shared request-state presentations", () => {
  it("renders accessible idle, pending, empty, error, offline, and ready outcomes", () => {
    const { rerender } = render(<RequestStateView state={{ status: "idle" }}>Content</RequestStateView>);
    expect(screen.getByRole("status")).toHaveTextContent("Ready to load.");

    rerender(<RequestStateView state={{ status: "loading", message: "Loading orders…" }}>Content</RequestStateView>);
    expect(screen.getByRole("status")).toHaveTextContent("Loading orders…");

    rerender(<RequestStateView state={{ status: "empty", title: "No orders", message: "Create an order to begin." }}>Content</RequestStateView>);
    expect(screen.getByRole("status")).toHaveTextContent("No orders");

    rerender(<RequestStateView state={{ status: "error", title: "Request failed", message: "Try again." }}>Content</RequestStateView>);
    expect(screen.getByRole("alert")).toHaveTextContent("Request failed");
    expect(screen.getByRole("alert")).not.toHaveTextContent("Connection lost");

    rerender(<RequestStateView state={{ status: "offline", connectivity: "adapter-connection-failure" }}>Content</RequestStateView>);
    expect(screen.getByRole("alert")).toHaveTextContent("Connection lost");

    rerender(<RequestStateView state={{ status: "ready" }}><p>Loaded content</p></RequestStateView>);
    expect(screen.getByText("Loaded content")).toBeInTheDocument();
  });

  it("offers retry only when the supplied operation is safe to retry", async () => {
    const retry = vi.fn(async () => undefined);
    const { rerender } = render(
      <RequestStateView state={{ status: "error", retry }}>Content</RequestStateView>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(retry).toHaveBeenCalledOnce());

    rerender(<RequestStateView state={{ status: "offline", connectivity: "browser-offline" }}>Content</RequestStateView>);
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  });
});
