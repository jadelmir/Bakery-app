import type { AuthChangeEvent, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import type { Database } from "../../lib/supabase/database.types";

export interface AuthSession {
  user: {
    id: string;
    email: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends LoginCredentials {
  passwordConfirmation: string;
}

export interface AuthAdapter {
  signIn(credentials: LoginCredentials): Promise<AuthSession>;
  signUp(credentials: SignupCredentials): Promise<AuthSession>;
  signOut(): Promise<void>;
  updatePassword(password: string): Promise<void>;
  getSession(): Promise<AuthSession | null>;
  onAuthStateChange(
    callback: (session: AuthSession | null, event: AuthChangeEvent) => void,
  ): () => void;
}

export type LoginErrors = Partial<Record<keyof LoginCredentials, string>>;
export type SignupErrors = Partial<Record<keyof SignupCredentials, string>>;

export class AuthConfirmationRequiredError extends Error {
  constructor() {
    super("Check your email to verify your account, then log in.");
    this.name = "AuthConfirmationRequiredError";
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin(credentials: LoginCredentials): LoginErrors {
  const errors: LoginErrors = {};
  if (!EMAIL_PATTERN.test(credentials.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (!credentials.password) {
    errors.password = "Enter your password.";
  }
  return errors;
}

export function validateSignup(credentials: SignupCredentials): SignupErrors {
  const errors: SignupErrors = { ...validateLogin(credentials) };
  if (credentials.password && credentials.password.length < 8) {
    errors.password = "Use at least 8 characters.";
  }
  if (!credentials.passwordConfirmation) {
    errors.passwordConfirmation = "Confirm your password.";
  } else if (credentials.passwordConfirmation !== credentials.password) {
    errors.passwordConfirmation = "Passwords do not match.";
  }
  return errors;
}

const wait = (delayMs: number) => new Promise(resolve => setTimeout(resolve, delayMs));

export function createMockAuthAdapter(delayMs = 150): AuthAdapter {
  let currentSession: AuthSession | null = null;
  const listeners = new Set<
    (session: AuthSession | null, event: AuthChangeEvent) => void
  >();
  const publish = (event: AuthChangeEvent) =>
    listeners.forEach(listener => listener(currentSession, event));
  const authenticate = async (email: string): Promise<AuthSession> => {
    await wait(delayMs);
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail.startsWith("error@")) {
      throw new Error("We couldn't authenticate that account. Please try again.");
    }
    currentSession = {
      user: {
        id: "mock-owner",
        email: normalizedEmail,
      },
    };
    publish("SIGNED_IN");
    return currentSession;
  };

  return {
    signIn: ({ email }) => authenticate(email),
    signUp: ({ email }) => authenticate(email),
    signOut: async () => {
      await wait(delayMs);
      currentSession = null;
      publish("SIGNED_OUT");
    },
    updatePassword: async () => {
      await wait(delayMs);
      if (!currentSession) {
        throw new Error("Password recovery session is no longer active.");
      }
      publish("USER_UPDATED");
    },
    getSession: async () => currentSession,
    onAuthStateChange: callback => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
  };
}

export const mockAuthAdapter = createMockAuthAdapter();

function mapSession(
  session: { user: { id: string; email?: string | null } } | null,
): AuthSession | null {
  if (!session?.user.email) return null;
  return { user: { id: session.user.id, email: session.user.email } };
}

function getEmailRedirectTo(): string {
  return new URL(import.meta.env.BASE_URL, window.location.origin).toString();
}

export function createSupabaseAuthAdapter(
  client: SupabaseClient<Database> = getSupabaseBrowserClient(),
): AuthAdapter {
  return {
    async signIn({ email, password }) {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw new Error(error.message);
      const session = mapSession(data.session);
      if (!session) throw new Error("Sign in did not return an active session.");
      return session;
    },
    async signUp({ email, password }) {
      const { data, error } = await client.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: getEmailRedirectTo(),
        },
      });
      if (error) throw new Error(error.message);
      const session = mapSession(data.session);
      if (!session) {
        throw new AuthConfirmationRequiredError();
      }
      return session;
    },
    async signOut() {
      const { error } = await client.auth.signOut();
      if (error) throw new Error(error.message);
    },
    async updatePassword(password) {
      const { error } = await client.auth.updateUser({ password });
      if (error) throw new Error(error.message);
    },
    async getSession() {
      const { data, error } = await client.auth.getSession();
      if (error) throw new Error(error.message);
      return mapSession(data.session);
    },
    onAuthStateChange(callback) {
      const { data } = client.auth.onAuthStateChange((event, session) => {
        callback(mapSession(session), event);
      });
      return () => data.subscription.unsubscribe();
    },
  };
}

export const supabaseAuthAdapter: AuthAdapter = {
  signIn: credentials => createSupabaseAuthAdapter().signIn(credentials),
  signUp: credentials => createSupabaseAuthAdapter().signUp(credentials),
  signOut: () => createSupabaseAuthAdapter().signOut(),
  updatePassword: password => createSupabaseAuthAdapter().updatePassword(password),
  getSession: () => createSupabaseAuthAdapter().getSession(),
  onAuthStateChange: callback => createSupabaseAuthAdapter().onAuthStateChange(callback),
};
