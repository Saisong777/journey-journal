import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export function useIsAdmin() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["isAdmin", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;

      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      if (error) {
        console.error("Error checking admin status:", error);
        return false;
      }

      return data === true;
    },
    enabled: !!user?.id,
  });
}

export function useAllTrips() {
  return useQuery({
    queryKey: ["admin-trips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useAllProfiles() {
  return useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          group:groups(id, name, trip_id)
        `)
        .order("name");

      if (error) throw error;
      return data || [];
    },
  });
}

export function useAllUserRoles() {
  return useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*");

      if (error) throw error;
      return data || [];
    },
  });
}

export function useAllGroups() {
  return useQuery({
    queryKey: ["admin-groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("groups")
        .select("*, trip:trips(id, title)")
        .order("name");

      if (error) throw error;
      return data || [];
    },
  });
}

export function useTripMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createTrip = useMutation({
    mutationFn: async (trip: {
      title: string;
      destination: string;
      start_date: string;
      end_date: string;
      cover_image_url?: string;
    }) => {
      const { data, error } = await supabase
        .from("trips")
        .insert(trip)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trips"] });
      toast({ title: "旅程已建立" });
    },
    onError: (error) => {
      toast({ title: "建立失敗", description: error.message, variant: "destructive" });
    },
  });

  const updateTrip = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      title?: string;
      destination?: string;
      start_date?: string;
      end_date?: string;
      cover_image_url?: string;
    }) => {
      const { data, error } = await supabase
        .from("trips")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trips"] });
      toast({ title: "旅程已更新" });
    },
    onError: (error) => {
      toast({ title: "更新失敗", description: error.message, variant: "destructive" });
    },
  });

  const deleteTrip = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("trips").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trips"] });
      toast({ title: "旅程已刪除" });
    },
    onError: (error) => {
      toast({ title: "刪除失敗", description: error.message, variant: "destructive" });
    },
  });

  return { createTrip, updateTrip, deleteTrip };
}

export function useGroupMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createGroup = useMutation({
    mutationFn: async (group: { name: string; trip_id: string }) => {
      const { data, error } = await supabase
        .from("groups")
        .insert(group)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-groups"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({ title: "小組已建立" });
    },
    onError: (error) => {
      toast({ title: "建立失敗", description: error.message, variant: "destructive" });
    },
  });

  const updateGroup = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase
        .from("groups")
        .update({ name })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-groups"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({ title: "小組已更新" });
    },
    onError: (error) => {
      toast({ title: "更新失敗", description: error.message, variant: "destructive" });
    },
  });

  const deleteGroup = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-groups"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({ title: "小組已刪除" });
    },
    onError: (error) => {
      toast({ title: "刪除失敗", description: error.message, variant: "destructive" });
    },
  });

  return { createGroup, updateGroup, deleteGroup };
}

export function useUserRoleMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const assignRole = useMutation({
    mutationFn: async ({
      user_id,
      trip_id,
      role,
    }: {
      user_id: string;
      trip_id: string;
      role: "admin" | "leader" | "guide" | "member";
    }) => {
      // First check if role exists
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", user_id)
        .eq("trip_id", trip_id)
        .single();

      if (existing) {
        // Update existing role
        const { data, error } = await supabase
          .from("user_roles")
          .update({ role })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new role
        const { data, error } = await supabase
          .from("user_roles")
          .insert({ user_id, trip_id, role })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast({ title: "角色已更新" });
    },
    onError: (error) => {
      toast({ title: "更新失敗", description: error.message, variant: "destructive" });
    },
  });

  const removeFromTrip = useMutation({
    mutationFn: async ({ user_id, trip_id }: { user_id: string; trip_id: string }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", user_id)
        .eq("trip_id", trip_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast({ title: "已從旅程中移除" });
    },
    onError: (error) => {
      toast({ title: "移除失敗", description: error.message, variant: "destructive" });
    },
  });

  return { assignRole, removeFromTrip };
}

export function useProfileMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateProfileGroup = useMutation({
    mutationFn: async ({
      profile_id,
      group_id,
    }: {
      profile_id: string;
      group_id: string | null;
    }) => {
      const { data, error } = await supabase
        .from("profiles")
        .update({ group_id })
        .eq("id", profile_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast({ title: "小組已更新" });
    },
    onError: (error) => {
      toast({ title: "更新失敗", description: error.message, variant: "destructive" });
    },
  });

  return { updateProfileGroup };
}
