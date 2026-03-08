import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getAuthToken, setAuthToken, clearAuthToken } from "@/lib/queryClient";

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  session: { user: User } | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authToken = params.get("authToken");
    if (authToken) {
      setAuthToken(authToken);
      params.delete("authToken");
      const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
      window.history.replaceState({}, "", newUrl);
    }
    checkSession();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "auth_token" && e.newValue) {
        checkSession();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const checkSession = async () => {
    try {
      const token = getAuthToken();
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // M10: Add timeout to prevent blocking first render
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch("/api/auth/session", {
        credentials: "include",
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Session check failed:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const token = getAuthToken();
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers,
      });
      clearAuthToken();
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session: user ? { user } : null, 
      user, 
      loading, 
      signOut,
      refreshSession: checkSession,
      setUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
