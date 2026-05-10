import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/queryClient";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: React.ReactNode;
  skipTripCheck?: boolean;
  skipSetupCheck?: boolean;
}

async function fetchJsonWithTimeout(url: string, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  const token = getAuthToken();

  try {
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return response.json();
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function ProtectedRoute({ children, skipTripCheck = false, skipSetupCheck = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  const {
    data: tripStatus,
    isLoading: tripStatusLoading,
    isFetching: tripStatusFetching,
    isError: tripStatusError,
    refetch: refetchTripStatus,
  } = useQuery({
    queryKey: ["trip-status", user?.id],
    queryFn: () => fetchJsonWithTimeout("/api/check-trip-status"),
    enabled: !!user && !skipTripCheck,
    retry: 1,
  });

  const {
    data: setupStatus,
    isLoading: setupStatusLoading,
    isFetching: setupStatusFetching,
    isError: setupStatusError,
    refetch: refetchSetupStatus,
  } = useQuery({
    queryKey: ["profile-setup", user?.id],
    queryFn: () => fetchJsonWithTimeout("/api/auth/needs-profile-setup"),
    enabled: !!user && !skipTripCheck && !skipSetupCheck,
    retry: 1,
  });

  const routeCheckFailed = (!skipTripCheck && tripStatusError) || (!skipTripCheck && !skipSetupCheck && setupStatusError);
  const retrying = tripStatusFetching || setupStatusFetching;

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

  if (routeCheckFailed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-5">
        <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 text-center shadow-card">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-title font-semibold text-foreground">連線不穩，暫時無法確認旅程</h1>
          <p className="mt-2 text-body text-muted-foreground">
            可能是網路太慢或伺服器正在回應。請重試；如果在移動中，可以先回到上一頁稍後再試。
          </p>
          <Button
            className="mt-5 w-full"
            onClick={() => {
              if (!skipTripCheck) refetchTripStatus();
              if (!skipTripCheck && !skipSetupCheck) refetchSetupStatus();
            }}
            disabled={retrying}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${retrying ? "animate-spin" : ""}`} />
            {retrying ? "重新確認中..." : "重新確認"}
          </Button>
        </div>
      </div>
    );
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

  if (!skipTripCheck && tripStatus?.needsVerification) {
    if (tripStatus?.isAdmin && !location.pathname.startsWith("/admin")) {
      return <Navigate to="/admin" replace />;
    }
    if (!tripStatus?.isAdmin && location.pathname !== "/verify-trip") {
      return <Navigate to="/verify-trip" replace />;
    }
  }

  if (!skipTripCheck && !skipSetupCheck && !setupStatusLoading && setupStatus?.needsSetup && location.pathname !== "/settings") {
    return <Navigate to="/settings?setup=1" replace />;
  }

  return <>{children}</>;
}
