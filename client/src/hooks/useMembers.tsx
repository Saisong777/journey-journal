import { useQuery } from "@tanstack/react-query";
import { useTrip } from "./useTrip";

export interface MemberDB {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  dietary_restrictions: string | null;
  medical_notes: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  group_id: string | null;
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
      });
      if (!response.ok) {
        throw new Error("Failed to fetch groups");
      }
      return response.json();
    },
    enabled: !!trip?.id,
  });
}
