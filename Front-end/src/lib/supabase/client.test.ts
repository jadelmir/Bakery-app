import { describe, expect, it } from "vitest";
import {
  createSupabaseBrowserClient,
  readSupabasePublicConfig,
} from "./client";

describe("Supabase public configuration", () => {
  it("normalizes valid public values", () => {
    expect(
      readSupabasePublicConfig({
        VITE_SUPABASE_URL: " https://example.supabase.co ",
        VITE_SUPABASE_PUBLISHABLE_KEY: " sb_publishable_example ",
      }),
    ).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "sb_publishable_example",
    });
  });

  it("reports a missing project URL", () => {
    expect(() =>
      readSupabasePublicConfig({
        VITE_SUPABASE_URL: "",
        VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
      }),
    ).toThrow("Missing VITE_SUPABASE_URL");
  });

  it("reports a missing publishable key", () => {
    expect(() =>
      readSupabasePublicConfig({
        VITE_SUPABASE_URL: "https://example.supabase.co",
        VITE_SUPABASE_PUBLISHABLE_KEY: "",
      }),
    ).toThrow("Missing VITE_SUPABASE_PUBLISHABLE_KEY");
  });

  it("creates a typed browser client from explicit public configuration", () => {
    const client = createSupabaseBrowserClient({
      url: "https://example.supabase.co",
      publishableKey: "sb_publishable_example",
    });

    expect(client).toBeDefined();
  });
});
