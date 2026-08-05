import { describe, expect, it } from "vitest";
import { FIXTURE_BAKERY_IDS, createFixtureSnapshots, fixtureSnapshotFor } from "./fixtures";
import { createSessionLocalBakeryDomainAdapter } from "./localAdapter";

describe("bakery domain fixtures", () => {
  it("provides deterministic, distinct snapshots for two bakeries", () => {
    const snapshots = createFixtureSnapshots();
    const earls = snapshots[FIXTURE_BAKERY_IDS.EARLS];
    const marina = snapshots[FIXTURE_BAKERY_IDS.MARINA];

    expect(earls.bakeryId).toBe(FIXTURE_BAKERY_IDS.EARLS);
    expect(marina.bakeryId).toBe(FIXTURE_BAKERY_IDS.MARINA);
    expect(Object.keys(earls.ordersById)).not.toEqual(Object.keys(marina.ordersById));
    expect(fixtureSnapshotFor(FIXTURE_BAKERY_IDS.EARLS)).toEqual(earls);
  });

  it("labels the fixture adapter as session-local", () => {
    expect(createSessionLocalBakeryDomainAdapter().source.durability).toBe("session-local");
  });
});
