import { describe, expect, it, vi } from "vitest";
import { createSupabaseWorkspaceAdapter } from "./workspace";

function clientForInvoke(result: { data: unknown; error: unknown }) {
  return {
    functions: { invoke: vi.fn(async () => result) },
  } as never;
}

describe("Supabase workspace invitation errors", () => {
  it("surfaces the Edge Function's actionable error body", async () => {
    const adapter = createSupabaseWorkspaceAdapter(
      clientForInvoke({
        data: null,
        error: {
          message: "Edge Function returned a non-2xx status code",
          context: new Response(JSON.stringify({ error: "A pending invitation already exists for this email." }), {
            status: 409,
            headers: { "content-type": "application/json" },
          }),
        },
      }),
    );

    await expect(adapter.inviteMember("bakery-1", "person@example.com", "staff"))
      .rejects.toThrow("A pending invitation already exists for this email.");
  });

  it("falls back to the SDK error when the function response is not JSON", async () => {
    const adapter = createSupabaseWorkspaceAdapter(
      clientForInvoke({
        data: null,
        error: {
          message: "Edge Function returned a non-2xx status code",
          context: new Response("not-json", { status: 500 }),
        },
      }),
    );

    await expect(adapter.inviteMember("bakery-1", "person@example.com", "staff"))
      .rejects.toThrow("Edge Function returned a non-2xx status code");
  });
});
