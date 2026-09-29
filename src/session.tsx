import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export interface User {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

interface Session {
  user: User | null;
  loading: boolean;
  /** Re-reads the session from the API; resolves to the signed-in user or null. */
  refresh: () => Promise<User | null>;
  signOut: () => Promise<void>;
}

/** Neon's auth client is most of the bundle: load it after first paint, not with the landing page. */
export const loadAuth = () => import("./auth").then((m) => m.authClient);

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    let next: User | null = null;
    try {
      const { data } = await (await loadAuth()).getSession();
      next = (data?.user as User | undefined) ?? null;
    } catch {
      // API or sign-in service unreachable: behave as signed out
    }
    setUser(next);
    setLoading(false);
    return next;
  }, []);

  const signOut = useCallback(async () => {
    await (await loadAuth()).signOut().catch(() => undefined);
    setUser(null);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return <SessionContext.Provider value={{ user, loading, refresh, signOut }}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession must be used inside <SessionProvider>");
  return session;
}
