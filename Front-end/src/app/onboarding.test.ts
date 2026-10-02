import { describe, expect, it } from "vitest";
import { FIXTURE_BAKERY_IDS, fixtureSnapshotFor } from "./domain/fixtures";
import { deriveOnboardingProgress } from "./onboarding";

describe("onboarding progress", () => {
  it("derives product, material, and order readiness from the bakery snapshot", () => {
    const snapshot = fixtureSnapshotFor(FIXTURE_BAKERY_IDS.EARLS);
    expect(snapshot).toBeDefined();
    const progress = deriveOnboardingProgress(snapshot);

    expect(progress.product).toBe(true);
    expect(progress.materials).toBe(true);
    expect(progress.order).toBe(true);
    expect(progress.completedCount).toBe(3);
  });

  it("reports completion when the three setup steps are ready", () => {
    const snapshot = fixtureSnapshotFor(FIXTURE_BAKERY_IDS.EARLS);
    const progress = deriveOnboardingProgress(snapshot);

    expect(progress.isComplete).toBe(true);
    expect(progress.completedCount).toBe(3);
  });
});
