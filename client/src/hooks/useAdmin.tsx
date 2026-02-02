import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export function useIsAdmin() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["isAdmin", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;

      const response = await fetch("/api/is-admin", {
        credentials: "include",
      });
      if (!response.ok) return false;
      const data = await response.json();
      return data.isAdmin === true;
    },
    enabled: !!user?.id,
  });
}

export function useAllTrips() {
  return useQuery({
    queryKey: ["admin-trips"],
    queryFn: async () => {
      const response = await fetch("/api/admin/trips", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch trips");
      }
      return response.json();
    },
  });
}

export function useAllProfiles() {
  return useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const response = await fetch("/api/admin/profiles", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch profiles");
      }
      return response.json();
    },
  });
}

export function useAllUserRoles() {
  return useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const response = await fetch("/api/admin/user-roles", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch user roles");
      }
      return response.json();
    },
  });
}

export function useAllGroups() {
  return useQuery({
    queryKey: ["admin-groups"],
    queryFn: async () => {
      const response = await fetch("/api/admin/groups", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch groups");
      }
      return response.json();
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
      startDate: string;
      endDate: string;
      coverImageUrl?: string;
    }) => {
      const response = await fetch("/api/admin/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(trip),
      });
      if (!response.ok) throw new Error("Failed to create trip");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trips"] });
      toast({ title: "旅程已建立" });
    },
    onError: (error: Error) => {
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
      startDate?: string;
      endDate?: string;
      coverImageUrl?: string;
    }) => {
      const response = await fetch(`/api/admin/trips/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update trip");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trips"] });
      toast({ title: "旅程已更新" });
    },
    onError: (error: Error) => {
      toast({ title: "更新失敗", description: error.message, variant: "destructive" });
    },
  });

  const deleteTrip = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/trips/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete trip");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trips"] });
      toast({ title: "旅程已刪除" });
    },
    onError: (error: Error) => {
      toast({ title: "刪除失敗", description: error.message, variant: "destructive" });
    },
  });

  return { createTrip, updateTrip, deleteTrip };
}

export function useGroupMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createGroup = useMutation({
    mutationFn: async (group: { name: string; tripId: string }) => {
      const response = await fetch("/api/admin/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(group),
      });
      if (!response.ok) throw new Error("Failed to create group");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-groups"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({ title: "小組已建立" });
    },
    onError: (error: Error) => {
      toast({ title: "建立失敗", description: error.message, variant: "destructive" });
    },
  });

  const updateGroup = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const response = await fetch(`/api/admin/groups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error("Failed to update group");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-groups"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({ title: "小組已更新" });
    },
    onError: (error: Error) => {
      toast({ title: "更新失敗", description: error.message, variant: "destructive" });
    },
  });

  const deleteGroup = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/groups/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete group");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-groups"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({ title: "小組已刪除" });
    },
    onError: (error: Error) => {
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
      userId,
      tripId,
      role,
    }: {
      userId: string;
      tripId: string | null;
      role: "admin" | "leader" | "guide" | "member";
    }) => {
      const response = await fetch("/api/admin/user-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId, tripId, role }),
      });
      if (!response.ok) throw new Error("Failed to assign role");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast({ title: "角色已更新" });
    },
    onError: (error: Error) => {
      toast({ title: "更新失敗", description: error.message, variant: "destructive" });
    },
  });

  const removeFromTrip = useMutation({
    mutationFn: async ({ userId, tripId }: { userId: string; tripId: string }) => {
      const response = await fetch("/api/admin/user-roles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId, tripId }),
      });
      if (!response.ok) throw new Error("Failed to remove from trip");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast({ title: "已從旅程中移除" });
    },
    onError: (error: Error) => {
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
      profileId,
      groupId,
    }: {
      profileId: string;
      groupId: string | null;
    }) => {
      const response = await fetch(`/api/admin/profiles/${profileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ groupId }),
      });
      if (!response.ok) throw new Error("Failed to update profile");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast({ title: "小組已更新" });
    },
    onError: (error: Error) => {
      toast({ title: "更新失敗", description: error.message, variant: "destructive" });
    },
  });

  return { updateProfileGroup };
}
