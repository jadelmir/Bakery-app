import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { InvitationLanding } from "./InvitationLanding";
import { createMockWorkspaceAdapter } from "./workspace";

afterEach(cleanup);

function renderInvitation(error?: string) {
  const adapter = createMockWorkspaceAdapter();
  adapter.acceptInvitation = error
    ? async () => { throw new Error(error); }
    : async () => "dev-bakery-earls";
  render(
    <InvitationLanding
      token="opaque-token"
      adapter={adapter}
      userEmail="invitee@example.com"
      onAccepted={async () => undefined}
      onFinished={() => undefined}
    />,
  );
}

describe("invitation landing outcomes", () => {
  it("announces successful acceptance", async () => {
    renderInvitation();
    fireEvent.click(screen.getByRole("button", { name: "Accept invitation" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Invitation accepted");
  });

  for (const message of [
    "Sign in with the invited email address.",
    "This invitation has expired.",
    "This invitation is invalid or has already been used.",
  ]) {
    it(`keeps the landing available for: ${message}`, async () => {
      renderInvitation(message);
      fireEvent.click(screen.getByRole("button", { name: "Accept invitation" }));
      expect(await screen.findByRole("alert")).toHaveTextContent(message);
      expect(screen.getByRole("button", { name: "Accept invitation" })).toBeTruthy();
    });
  }

  it("announces a declined invitation", async () => {
    const adapter = createMockWorkspaceAdapter();
    render(
      <InvitationLanding
        token="opaque-token"
        adapter={adapter}
        userEmail="invitee@example.com"
        onAccepted={async () => undefined}
        onFinished={() => undefined}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Decline" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Invitation declined");
  });
});
