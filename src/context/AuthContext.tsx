import { createContext, ReactNode, useContext, useEffect, useState } from "react";

type User = { id: string; name: string; email: string };

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, password: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// Placeholder delay. Replace each function body with your real API calls.
const wait = (ms = 800) => new Promise((r) => setTimeout(r as any, ms));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore a saved session here (e.g. react-native-keychain or MMKV token check).
    wait(300).then(() => setLoading(false));
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    signIn: async (email) => {
      await wait();
      setUser({ id: "1", name: "Demo", email });
    },
    signUp: async (name, email) => {
      await wait();
      setUser({ id: "1", name, email });
    },
    requestPasswordReset: async () => {
      await wait();
    },
    resetPassword: async () => {
      await wait();
    },
    signOut: () => setUser(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}