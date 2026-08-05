import type { SupabaseClient } from "@supabase/supabase-js";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import {
  getPasswordRecoveryRedirect,
  initializeAuthSession,
  requestPasswordReset,
  subscribeToAuthStateChange,
} from "../lib/supabase/client";
import type { Database } from "../lib/supabase/database.types";
import { AuthProvider, useAuth } from "./AuthProvider";
import {
  createMockAuthAdapter,
  createSupabaseAuthAdapter,
  validateLogin,
  validateSignup,
} from "./auth";

describe("authentication validation", () => {
  it("requires a valid email and login password", () => {
    expect(validateLogin({ email: "not-an-email", password: "" })).toEqual({
      email: "Enter a valid email address.",
      password: "Enter your password.",
    });
  });

  it("requires a qualifying matching signup password", () => {
    expect(validateSignup({
      email: "owner@example.com",
      password: "short",
      passwordConfirmation: "different",
    })).toEqual({
      password: "Use at least 8 characters.",
      passwordConfirmation: "Passwords do not match.",
    });
  });

  it("accepts valid login and signup values", () => {
    expect(validateLogin({ email: "owner@example.com", password: "password" })).toEqual({});
    expect(validateSignup({
      email: "owner@example.com",
      password: "password",
      passwordConfirmation: "password",
    })).toEqual({});
  });
});

describe("mock authentication adapter", () => {
  it("returns a normalized memory-only session", async () => {
    const adapter = createMockAuthAdapter(0);
    await expect(adapter.signIn({
      email: " Owner@Example.com ",
      password: "password",
    })).resolves.toEqual({
      user: { id: "mock-owner", email: "owner@example.com" },
    });
  });

  it("provides a deterministic request failure", async () => {
    const adapter = createMockAuthAdapter(0);
    await expect(adapter.signUp({
      email: "error@example.com",
      password: "password",
      passwordConfirmation: "password",
    })).rejects.toThrow("couldn't authenticate");
  });

  it("restores and clears sessions through the adapter contract", async () => {
    const adapter = createMockAuthAdapter(0);
    expect(await adapter.getSession()).toBeNull();
    await adapter.signIn({ email: "owner@example.com", password: "password" });
    expect((await adapter.getSession())?.user.email).toBe("owner@example.com");
    await adapter.signOut();
    expect(await adapter.getSession()).toBeNull();
  });
});

describe("Supabase authentication adapter", () => {
  it("restores sessions, observes Auth changes, and performs real sign out", async () => {
    const session = { user: { id: "user-1", email: "owner@example.com" } };
    const unsubscribe = vi.fn();
    let authChange: ((event: string, nextSession: typeof session | null) => void) | undefined;
    const signOut = vi.fn(async () => ({ error: null }));
    const updateUser = vi.fn(async () => ({ data: {}, error: null }));
    const client = {
      auth: {
        getSession: vi.fn(async () => ({ data: { session }, error: null })),
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signOut,
        updateUser,
        onAuthStateChange: vi.fn((callback: (event: string, nextSession: typeof session | null) => void) => {
          authChange = callback;
          return { data: { subscription: { unsubscribe } } };
        }),
      },
    } as unknown as SupabaseClient<Database>;
    const adapter = createSupabaseAuthAdapter(client);

    expect(await adapter.getSession()).toEqual({
      user: { id: "user-1", email: "owner@example.com" },
    });
    const listener = vi.fn();
    const stop = adapter.onAuthStateChange(listener);
    authChange?.("SIGNED_OUT", null);
    expect(listener).toHaveBeenCalledWith(null, "SIGNED_OUT");
    stop();
    expect(unsubscribe).toHaveBeenCalledOnce();
    await adapter.signOut();
    expect(signOut).toHaveBeenCalledOnce();
    await adapter.updatePassword("replacement-password");
    expect(updateUser).toHaveBeenCalledWith({ password: "replacement-password" });
  });

  it("maps Supabase login errors without exposing credentials", async () => {
    const client = {
      auth: {
        signInWithPassword: vi.fn(async () => ({
          data: { session: null },
          error: { message: "Invalid login credentials" },
        })),
      },
    } as unknown as SupabaseClient<Database>;
    const adapter = createSupabaseAuthAdapter(client);
    await expect(adapter.signIn({
      email: "owner@example.com",
      password: "secret-password",
    })).rejects.toThrow("Invalid login credentials");
  });
});

describe("Supabase Auth client helpers", () => {
  it("builds the fixed recovery callback from the current application origin", () => {
    expect(getPasswordRecoveryRedirect({ origin: "http://localhost:5173" })).toBe(
      "http://localhost:5173/auth/reset-password",
    );
    expect(getPasswordRecoveryRedirect({ origin: "http://127.0.0.1:5173" })).toBe(
      "http://127.0.0.1:5173/auth/reset-password",
    );
  });

  it("initializes auth session from client", async () => {
    const session = { user: { id: "u-1", email: "test@example.com" } };
    const client = {
      auth: {
        getSession: vi.fn(async () => ({ data: { session }, error: null })),
      },
    } as unknown as SupabaseClient<Database>;

    await expect(initializeAuthSession(client)).resolves.toEqual(session);
  });

  it("subscribes and unsubscribes from auth state changes", () => {
    const unsubscribe = vi.fn();
    let callback: ((event: string, session: unknown) => void) | undefined;
    const client = {
      auth: {
        onAuthStateChange: vi.fn((cb) => {
          callback = cb;
          return { data: { subscription: { unsubscribe } } };
        }),
      },
    } as unknown as SupabaseClient<Database>;

    const listener = vi.fn();
    const cleanup = subscribeToAuthStateChange(listener, client);
    callback?.("TOKEN_REFRESHED", null);
    expect(listener).toHaveBeenCalledWith("TOKEN_REFRESHED", null);
    cleanup();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it("requests password reset for normalized email with only the trusted callback", async () => {
    const resetPasswordForEmail = vi.fn(async () => ({ data: {}, error: null }));
    const client = {
      auth: { resetPasswordForEmail },
    } as unknown as SupabaseClient<Database>;

    await requestPasswordReset(" Owner@Example.com ", "https://attacker.example/reset", client);
    expect(resetPasswordForEmail).toHaveBeenCalledWith("owner@example.com", {
      redirectTo: getPasswordRecoveryRedirect(),
    });
  });
});

describe("AuthProvider context provider", () => {
  it("throws error when useAuth is consumed outside AuthProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => renderHook(() => useAuth())).toThrow("useAuth must be used within an AuthProvider");
    spy.mockRestore();
  });

  it("initializes session and exposes authenticated user", async () => {
    const adapter = createMockAuthAdapter(0);
    await adapter.signIn({ email: "owner@example.com", password: "password" });

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(AuthProvider, { adapter }, children);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toEqual({ id: "mock-owner", email: "owner@example.com" });
    expect(result.current.session?.user.email).toBe("owner@example.com");
  });

  it("handles login, signup, logout, and resetPassword workflows", async () => {
    const adapter = createMockAuthAdapter(0);
    const onResetPassword = vi.fn(async () => undefined);

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(AuthProvider, { adapter, onResetPassword }, children);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login({ email: "newuser@example.com", password: "password123" });
    });

    expect(result.current.user?.email).toBe("newuser@example.com");
    expect(result.current.session?.user.id).toBe("mock-owner");

    await act(async () => {
      await result.current.resetPassword("newuser@example.com", "https://example.com/callback");
    });
    expect(onResetPassword).toHaveBeenCalledWith("newuser@example.com", "https://example.com/callback");

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
  });
});

