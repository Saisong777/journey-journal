import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/queryClient";

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export interface MemberLocation {
  id: string;
  userId: string;
  tripId: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
  profile?: {
    id: string;
    userId: string;
    name: string;
    email?: string;
    avatarUrl?: string | null;
    groupId?: string | null;
  };
}

export function useLocations() {
  return useQuery<MemberLocation[]>({
    queryKey: ["locations"],
    queryFn: async () => {
      const response = await fetch("/api/locations", {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch locations");
      }
      return response.json();
    },
    refetchInterval: 60000, // M3: Reduced from 30s to 60s
  });
}

export function useMyLocation() {
  return useQuery({
    queryKey: ["my-location"],
    queryFn: async () => {
      const response = await fetch("/api/my-location", {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch my location");
      }
      return response.json();
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (coords: { latitude: number; longitude: number }) => {
      const response = await fetch("/api/locations", {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(coords),
      });
      if (!response.ok) {
        throw new Error("Failed to update location");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["my-location"] });
    },
  });
}
