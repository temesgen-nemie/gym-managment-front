"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import { AuthSession, readStoredSession, writeStoredSession } from "@/lib/auth";

type AuthContextValue = {
  session: AuthSession | null;
  isReady: boolean;
  token: string | null;
  login: (session: AuthSession) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedSession = readStoredSession();
    setSession(storedSession);
    setIsReady(true);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isReady,
      token: session?.token ?? null,
      login: (nextSession) => {
        setSession(nextSession);
        writeStoredSession(nextSession);
      },
      logout: () => {
        setSession(null);
        writeStoredSession(null);
      }
    }),
    [isReady, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
