import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

export function useTrip() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["trip", user?.id],
    queryFn: async () => {
      const response = await fetch("/api/trip", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch trip");
      }
      return response.json();
    },
    enabled: !!user?.id,
  });
}
