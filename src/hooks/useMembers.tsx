import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
      if (!trip?.id) return [];

      // Get all groups for this trip
      const { data: groups, error: groupsError } = await supabase
        .from("groups")
        .select("*")
        .eq("trip_id", trip.id);

      if (groupsError) throw groupsError;

      const groupIds = groups?.map((g) => g.id) || [];

      // Get all profiles in these groups
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("group_id", groupIds);

      if (profilesError) throw profilesError;

      // Get user roles for this trip
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("trip_id", trip.id);

      if (rolesError) throw rolesError;

      // Map roles to profiles
      const roleMap = new Map(userRoles?.map((r) => [r.user_id, r.role]) || []);
      const groupMap = new Map(groups?.map((g) => [g.id, g]) || []);

      return (profiles || []).map((profile) => ({
        ...profile,
        group: profile.group_id ? groupMap.get(profile.group_id) : null,
        role: roleMap.get(profile.user_id) || "member",
      })) as MemberDB[];
    },
    enabled: !!trip?.id,
  });
}

export function useGroups() {
  const { data: trip } = useTrip();

  return useQuery({
    queryKey: ["groups", trip?.id],
    queryFn: async () => {
      if (!trip?.id) return [];

      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .eq("trip_id", trip.id)
        .order("name");

      if (error) throw error;
      return data || [];
    },
    enabled: !!trip?.id,
  });
}
