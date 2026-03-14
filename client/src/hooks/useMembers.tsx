import { useQuery } from "@tanstack/react-query";
import { useTrip } from "./useTrip";
import { getAuthToken } from "@/lib/queryClient";

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export interface MemberDB {
  id: string;
  userId: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  birthday: string | null;
  dietaryRestrictions: string | null;
  medicalNotes: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  groupId: string | null;
  group?: {
    id: string;
    name: string;
  } | null;
  role?: "admin" | "leader" | "guide" | "member";
}

export function useMembers() {
  const { data: trip } = useTrip();

  return useQuery({
    queryKey: ["members", trip?.id],
    queryFn: async () => {
      const response = await fetch("/api/members", {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch members");
      }
      return response.json() as Promise<MemberDB[]>;
    },
    enabled: !!trip?.id,
  });
}

export function useGroups() {
  const { data: trip } = useTrip();

  return useQuery({
    queryKey: ["groups", trip?.id],
    queryFn: async () => {
      const response = await fetch("/api/groups", {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch groups");
      }
      return response.json();
    },
    enabled: !!trip?.id,
  });
}
