import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useTrip() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["trip", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get the user's trip via user_roles
      const { data: userRole, error: roleError } = await supabase
        .from("user_roles")
        .select("trip_id, role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (roleError) throw roleError;
      if (!userRole) return null;

      // Get the trip details
      const { data: trip, error: tripError } = await supabase
        .from("trips")
        .select("*")
        .eq("id", userRole.trip_id)
        .maybeSingle();

      if (tripError) throw tripError;

      return {
        ...trip,
        userRole: userRole.role,
      };
    },
    enabled: !!user?.id,
  });
}
