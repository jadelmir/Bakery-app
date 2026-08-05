import { act, render, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { FIXTURE_BAKERY_IDS } from "../domain/fixtures";
import { createSessionLocalBakeryDomainAdapter } from "../domain/localAdapter";
import { BakeryDomainProvider, useBakeryDomain, useBakeryDomainSelector } from "./provider";
import { selectSnapshot } from "./selectors";

const earls = FIXTURE_BAKERY_IDS.EARLS;

describe("BakeryDomainProvider selectors", () => {
  it("does not re-render a stable selection for an unrelated domain update", async () => {
    const adapter = createSessionLocalBakeryDomainAdapter();
    let commands: ReturnType<typeof useBakeryDomain>["commands"] | undefined;
    let renders = 0;

    function StableOrdersProbe() {
      const ordersById = useBakeryDomainSelector((state) => selectSnapshot(state)?.ordersById);
      renders += 1;
      return <output>{Object.keys(ordersById ?? {}).length}</output>;
    }

    function CommandsProbe() {
      commands = useBakeryDomain().commands;
      return null;
    }

    render(
      <BakeryDomainProvider adapter={adapter} bakeryId={earls}>
        <StableOrdersProbe />
        <CommandsProbe />
      </BakeryDomainProvider>,
    );

    await waitFor(() => expect(commands).toBeDefined());
    await waitFor(() => expect(renders).toBe(2));
    const rendersAfterLoad = renders;

    await act(async () => {
      await commands?.updateTask({
        bakeryId: earls,
        operationId: "provider-stable-orders",
        taskId: "order-025-1-mix",
        patch: { status: "completed" },
      });
    });

    expect(renders).toBe(rendersAfterLoad);
  });

  it("never exposes the previous bakery snapshot while switching bakeries", async () => {
    const adapter = createSessionLocalBakeryDomainAdapter();
    let snapshot: ReturnType<typeof selectSnapshot>;

    function SnapshotProbe() {
      snapshot = useBakeryDomainSelector(selectSnapshot);
      return null;
    }

    function Harness({ bakeryId }: { bakeryId: typeof earls }) {
      return <BakeryDomainProvider adapter={adapter} bakeryId={bakeryId}><SnapshotProbe /></BakeryDomainProvider>;
    }

    const { rerender } = render(<Harness bakeryId={earls} />);
    await waitFor(() => expect(snapshot?.bakeryId).toBe(earls));
    rerender(<Harness bakeryId={FIXTURE_BAKERY_IDS.MARINA} />);

    expect(snapshot).toBeUndefined();
    await waitFor(() => expect(snapshot?.bakeryId).toBe(FIXTURE_BAKERY_IDS.MARINA));
    expect(snapshot?.ordersById["order-024"]).toBeUndefined();
  });
});
