import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  supabaseAuthAdapter,
  type AuthAdapter,
  type AuthSession,
  type LoginCredentials,
  type SignupCredentials,
} from "./auth";
import { requestPasswordReset } from "../../lib/supabase/client";

export interface AuthContextType {
  session: AuthSession | null;
  user: AuthSession["user"] | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthSession>;
  signup: (credentials: SignupCredentials) => Promise<AuthSession>;
  logout: () => Promise<void>;
  resetPassword: (email: string, redirectTo?: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
  children: ReactNode;
  adapter?: AuthAdapter;
  onResetPassword?: (email: string, redirectTo?: string) => Promise<void>;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  adapter = supabaseAuthAdapter,
  onResetPassword = requestPasswordReset,
}) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    adapter
      .getSession()
      .then((initialSession) => {
        if (mounted) {
          setSession(initialSession);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setSession(null);
          setLoading(false);
        }
      });

    const unsubscribe = adapter.onAuthStateChange((nextSession) => {
      if (mounted) {
        setSession(nextSession);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [adapter]);

  const login = async (credentials: LoginCredentials): Promise<AuthSession> => {
    setLoading(true);
    try {
      const activeSession = await adapter.signIn(credentials);
      setSession(activeSession);
      return activeSession;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (credentials: SignupCredentials): Promise<AuthSession> => {
    setLoading(true);
    try {
      const activeSession = await adapter.signUp(credentials);
      setSession(activeSession);
      return activeSession;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await adapter.signOut();
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (
    email: string,
    redirectTo?: string,
  ): Promise<void> => {
    await onResetPassword(email, redirectTo);
  };

  const value = useMemo<AuthContextType>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      login,
      signup,
      logout,
      resetPassword,
    }),
    [session, loading, adapter, onResetPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
