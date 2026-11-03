import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AuthUser, tokenStorage } from "../services/tokenStorage";
import { profileService } from "../services/profileService";
import { restoreSession, setAuthFailureHandler } from "../services/apiClient";
import { authService } from "../services/authService";

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string, remember?: boolean) => Promise<void>;
  signUp: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const session = await tokenStorage.load();
    if (!session) return;

    const gen = tokenStorage.generation();
    const profile = await profileService.get();
    if (gen !== tokenStorage.generation()) return;

    const updated: AuthUser = {
      ...session.user,
      email: profile.email ?? session.user.email,
      user_metadata: {
        ...session.user.user_metadata,
        full_name: profile.full_name ?? undefined,
        avatar_url: profile.avatar_url ?? undefined,
      },
    };
    const latest = (await tokenStorage.load()) ?? session;
    await tokenStorage.save({ ...latest, user: updated });
    setUser(updated);
  }, []);

  useEffect(() => {
    setAuthFailureHandler(() => setUser(null));
    let active = true;

    (async () => {
      const session = await restoreSession();
      if (!active) return;
      setUser(session?.user ?? null);
      setLoading(false);
      if (session) refreshUser().catch(() => undefined);
    })();

    return () => {
      active = false;
      setAuthFailureHandler(null);
    };
  }, [refreshUser]);

  const signIn = useCallback(async (email: string, password: string, remember = true) => {
    const { user: u, session } = await authService.login(email, password);
    await tokenStorage.save({ ...session, user: u }, { persist: remember });
    setUser(u);
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const { user: u, session } = await authService.signUp(name, email, password);
    if (session) {
      await tokenStorage.save({ ...session, user: u }, { persist: true });
      setUser(u);
      return { needsConfirmation: false };
    }
    return { needsConfirmation: true };
  }, []);

  const signOut = useCallback(async () => {
    await Promise.race([
      authService.logout().catch(() => undefined),
      new Promise((r) => setTimeout(r as any, 3000)),
    ]);
    await tokenStorage.clear();
    setUser(null);
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    await authService.forgotPassword(email);
  }, []);

  const resetPassword = useCallback(async (email: string, code: string, password: string) => {
    await authService.resetPassword(email, code, password);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn,
      signUp,
      signOut,
      requestPasswordReset,
      resetPassword,
      refreshUser,
    }),
    [user, loading, signIn, signUp, signOut, requestPasswordReset, resetPassword, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
