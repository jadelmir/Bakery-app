import { describe, expect, it } from "vitest";
import { localDateKey } from "./constants";

describe("localDateKey", () => {
  it("formats the local calendar date without a UTC conversion", () => {
    expect(localDateKey(new Date(2026, 7, 17, 23, 59))).toBe("2026-08-17");
    expect(localDateKey(new Date(2026, 7, 18, 0, 1))).toBe("2026-08-18");
  });
});
