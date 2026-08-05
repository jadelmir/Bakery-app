import {
  createClient,
  type AuthChangeEvent,
  type Session,
  type SupabaseClient,
  type SupabaseClientOptions,
} from "@supabase/supabase-js";
import type { Database } from "./database.types";

export interface SupabasePublicConfig {
  url: string;
  publishableKey: string;
}

export const PASSWORD_RECOVERY_PATH = "/auth/reset-password";

export function getPasswordRecoveryRedirect(
  location: Pick<Location, "origin"> = window.location,
): string {
  return new URL(PASSWORD_RECOVERY_PATH, location.origin).toString();
}

export function readSupabasePublicConfig(
  env: Pick<
    ImportMetaEnv,
    "VITE_SUPABASE_URL" | "VITE_SUPABASE_PUBLISHABLE_KEY"
  > = import.meta.env,
): SupabasePublicConfig {
  const url = env.VITE_SUPABASE_URL?.trim();
  const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url) {
    throw new Error(
      "Missing VITE_SUPABASE_URL. Copy .env.example to .env.local and add the project URL.",
    );
  }

  if (!publishableKey) {
    throw new Error(
      "Missing VITE_SUPABASE_PUBLISHABLE_KEY. Add the project's publishable key to .env.local.",
    );
  }

  return { url, publishableKey };
}

export function createSupabaseBrowserClient(
  config = readSupabasePublicConfig(),
  options?: SupabaseClientOptions<"public">,
): SupabaseClient<Database> {
  const mergedOptions: SupabaseClientOptions<"public"> = {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      ...options?.auth,
    },
    ...options,
  };
  return createClient<Database>(config.url, config.publishableKey, mergedOptions);
}

let browserClient: SupabaseClient<Database> | undefined;

export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  browserClient ??= createSupabaseBrowserClient();
  return browserClient;
}

export async function initializeAuthSession(
  client: SupabaseClient<Database> = getSupabaseBrowserClient(),
): Promise<Session | null> {
  const { data, error } = await client.auth.getSession();
  if (error) {
    throw error;
  }
  return data.session;
}

export function subscribeToAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
  client: SupabaseClient<Database> = getSupabaseBrowserClient(),
): () => void {
  const { data } = client.auth.onAuthStateChange(callback);
  return () => {
    data.subscription?.unsubscribe();
  };
}

export async function requestPasswordReset(
  email: string,
  _redirectTo?: string,
  client: SupabaseClient<Database> = getSupabaseBrowserClient(),
): Promise<void> {
  const { error } = await client.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: getPasswordRecoveryRedirect(),
  });
  if (error) {
    throw new Error(error.message);
  }
}
