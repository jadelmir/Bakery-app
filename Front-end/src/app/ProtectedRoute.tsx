import { useEffect, type ReactNode } from "react";
import type { AuthAdapter, AuthSession } from "./auth";
import { LoginScreen } from "./LoginScreen";

export const REDIRECT_STORAGE_KEY = "bakery_return_path";

export function getPreservedReturnPath(): string | null {
  try {
    return sessionStorage.getItem(REDIRECT_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setPreservedReturnPath(path: string): void {
  try {
    if (path && path !== "/auth/login" && path !== "/auth/reset-password") {
      sessionStorage.setItem(REDIRECT_STORAGE_KEY, path);
    }
  } catch {
    // Ignore storage errors
  }
}

export function clearPreservedReturnPath(): void {
  try {
    sessionStorage.removeItem(REDIRECT_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export interface ProtectedRouteProps {
  session: AuthSession | null;
  loading?: boolean;
  authAdapter: AuthAdapter;
  children: ReactNode;
  fallbackRoute?: string;
  onAuthenticated: (session: AuthSession) => void;
  onForgotPassword?: () => void;
}

export function ProtectedRoute({
  session,
  loading = false,
  authAdapter,
  children,
  onAuthenticated,
  onForgotPassword,
}: ProtectedRouteProps) {
  useEffect(() => {
    if (!session && !loading) {
      const currentPath = window.location.pathname + window.location.search + window.location.hash;
      if (currentPath && currentPath !== "/" && !currentPath.startsWith("/auth")) {
        setPreservedReturnPath(currentPath);
      }
    }
  }, [session, loading]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FBF8F3]" role="status">
        Restoring your session…
      </main>
    );
  }

  if (!session) {
    const handleAuthenticated = (newSession: AuthSession) => {
      const returnPath = getPreservedReturnPath();
      if (returnPath) {
        clearPreservedReturnPath();
        try {
          window.history.replaceState({}, "", returnPath);
        } catch {
          // ignore history errors
        }
      }
      onAuthenticated(newSession);
    };

    return (
      <LoginScreen
        adapter={authAdapter}
        onAuthenticated={handleAuthenticated}
        onForgotPassword={onForgotPassword}
      />
    );
  }

  return <>{children}</>;
}
