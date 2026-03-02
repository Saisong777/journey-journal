import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  skipTripCheck?: boolean;
}

export function ProtectedRoute({ children, skipTripCheck = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  const { data: tripStatus, isLoading: tripStatusLoading } = useQuery({
    queryKey: ["trip-status", user?.id],
    queryFn: async () => {
      const token = getAuthToken();
      const response = await fetch("/api/check-trip-status", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to check trip status");
      return response.json();
    },
    enabled: !!user && !skipTripCheck,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-body text-muted-foreground">載入中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/welcome" state={{ from: location }} replace />;
  }

  if (!skipTripCheck && tripStatusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-body text-muted-foreground">載入中...</p>
        </div>
      </div>
    );
  }

  if (!skipTripCheck && tripStatus?.needsVerification && location.pathname !== "/verify-trip") {
    return <Navigate to="/verify-trip" replace />;
  }

  return <>{children}</>;
}
