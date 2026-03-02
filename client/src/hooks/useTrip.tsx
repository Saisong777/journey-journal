import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { getAuthToken } from "@/lib/queryClient";

export function useTrip(tripId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["trip", tripId || "current"],
    queryFn: async () => {
      const url = tripId ? `/api/trips/${tripId}` : "/api/trips/current";
      const headers: HeadersInit = {};
      const token = getAuthToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await fetch(url, {
        credentials: "include",
        headers,
      });
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Failed to fetch trip");
      }
      return response.json();
    },
    enabled: !!user?.id,
  });
}
