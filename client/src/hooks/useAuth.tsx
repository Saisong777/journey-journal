import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getAuthToken, clearAuthToken } from "@/lib/queryClient";

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
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const token = getAuthToken();
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await fetch("/api/auth/session", {
        credentials: "include",
        headers,
      });
      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error("Session check failed:", error);
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
