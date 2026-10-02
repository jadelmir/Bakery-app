import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OnboardingScreen } from "./OnboardingScreen";

afterEach(() => cleanup());

describe("OnboardingScreen", () => {
  it("presents a clear first step and a skippable path", () => {
    render(
      <OnboardingScreen
        bakeryName="Sunrise Bakery"
        progress={{ product: false, materials: false, order: false, completedCount: 0, isComplete: false }}
        onNavigate={vi.fn()}
        onSkip={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Let’s get your bakery ready." })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add your first product/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Skip for now" })).toBeInTheDocument();
    expect(screen.getByLabelText("Step 1 of 3")).toBeInTheDocument();
    expect(screen.queryByText("Review your Prep List")).not.toBeInTheDocument();
  });
});
