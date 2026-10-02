import { describe, expect, it } from "vitest";
import { appPath, appUrl, browserRoutePath } from "./appUrl";

describe("application URL helpers", () => {
  it("keeps local paths rooted at the origin", () => {
    expect(appPath("/store/jadore-bakery", "/")).toBe("/store/jadore-bakery");
    expect(appUrl("/invoice/tok_123", "http://localhost:5173", "/")).toBe(
      "http://localhost:5173/invoice/tok_123",
    );
  });

  it("adds and removes the hosted deployment base path", () => {
    expect(appPath("/store/jadore-bakery", "/Bakery-app/")).toBe(
      "/Bakery-app/store/jadore-bakery",
    );
    expect(appUrl("/invoice/tok_123", "https://jadelmir.github.io", "/Bakery-app/")).toBe(
      "https://jadelmir.github.io/Bakery-app/invoice/tok_123",
    );
    expect(browserRoutePath("/Bakery-app/store/jadore-bakery", "/Bakery-app/")).toBe(
      "/store/jadore-bakery",
    );
    expect(browserRoutePath("/Bakery-app/auth/reset-password", "/Bakery-app/")).toBe(
      "/auth/reset-password",
    );
  });

  it("does not strip a similarly named path outside the deployment base", () => {
    expect(browserRoutePath("/store/jadore-bakery", "/Bakery-app/")).toBe(
      "/store/jadore-bakery",
    );
  });
});
