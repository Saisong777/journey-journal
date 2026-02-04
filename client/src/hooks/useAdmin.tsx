import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { getAuthToken } from "@/lib/queryClient";

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

function getAuthHeadersWithJson(): HeadersInit {
  return {
    ...getAuthHeaders(),
    "Content-Type": "application/json",
  };
}

export function useIsAdmin() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["isAdmin", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;

      const response = await fetch("/api/is-admin", {
        credentials: "include",
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
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
        headers: getAuthHeadersWithJson(),
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
        headers: getAuthHeadersWithJson(),
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
        headers: getAuthHeaders(),
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
        headers: getAuthHeadersWithJson(),
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
        headers: getAuthHeadersWithJson(),
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
        headers: getAuthHeaders(),
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
        headers: getAuthHeadersWithJson(),
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
        headers: getAuthHeadersWithJson(),
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
        headers: getAuthHeadersWithJson(),
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

export interface TripDay {
  id: string;
  tripId: string;
  dayNo: number;
  date: string;
  cityArea: string | null;
  title: string | null;
  highlights: string | null;
  attractions: string | null;
  bibleRefs: string | null;
  breakfast: string | null;
  lunch: string | null;
  dinner: string | null;
  lodging: string | null;
  lodgingLevel: string | null;
  transport: string | null;
  freeTimeFlag: boolean | null;
  shoppingFlag: boolean | null;
  mustKnow: string | null;
  notes: string | null;
}

export function useTripDays(tripId: string | null) {
  return useQuery<TripDay[]>({
    queryKey: ["admin-trip-days", tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const response = await fetch(`/api/admin/trips/${tripId}/days`, {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch trip days");
      }
      return response.json();
    },
    enabled: !!tripId,
  });
}

export function useTripDayMutations(tripId: string | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createTripDay = useMutation({
    mutationFn: async (tripDay: Omit<TripDay, "id" | "tripId">) => {
      if (!tripId) throw new Error("Trip ID is required");
      const response = await fetch(`/api/admin/trips/${tripId}/days`, {
        method: "POST",
        headers: getAuthHeadersWithJson(),
        credentials: "include",
        body: JSON.stringify(tripDay),
      });
      if (!response.ok) throw new Error("Failed to create trip day");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trip-days", tripId] });
      toast({ title: "每日行程已建立" });
    },
    onError: (error: Error) => {
      toast({ title: "建立失敗", description: error.message, variant: "destructive" });
    },
  });

  const updateTripDay = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TripDay> & { id: string }) => {
      const response = await fetch(`/api/admin/trip-days/${id}`, {
        method: "PATCH",
        headers: getAuthHeadersWithJson(),
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update trip day");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trip-days", tripId] });
      toast({ title: "每日行程已更新" });
    },
    onError: (error: Error) => {
      toast({ title: "更新失敗", description: error.message, variant: "destructive" });
    },
  });

  const deleteTripDay = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/trip-days/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to delete trip day");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trip-days", tripId] });
      toast({ title: "每日行程已刪除" });
    },
    onError: (error: Error) => {
      toast({ title: "刪除失敗", description: error.message, variant: "destructive" });
    },
  });

  return { createTripDay, updateTripDay, deleteTripDay };
}

export interface TripInvitation {
  id: string;
  tripId: string;
  code: string;
  description: string | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export function useTripInvitations(tripId: string | null) {
  return useQuery<TripInvitation[]>({
    queryKey: ["admin-trip-invitations", tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const response = await fetch(`/api/admin/trips/${tripId}/invitations`, {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch trip invitations");
      }
      return response.json();
    },
    enabled: !!tripId,
  });
}

export function useTripInvitationMutations(tripId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createInvitation = useMutation({
    mutationFn: async (data: { description: string | null; maxUses: number | null; expiresAt: string | null }) => {
      const response = await fetch(`/api/admin/trips/${tripId}/invitations`, {
        method: "POST",
        headers: getAuthHeadersWithJson(),
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create invitation");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trip-invitations", tripId] });
      toast({ title: "邀請碼已建立" });
    },
    onError: (error: Error) => {
      toast({ title: "建立失敗", description: error.message, variant: "destructive" });
    },
  });

  const updateInvitation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TripInvitation> & { id: string }) => {
      const response = await fetch(`/api/admin/trip-invitations/${id}`, {
        method: "PATCH",
        headers: getAuthHeadersWithJson(),
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update invitation");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trip-invitations", tripId] });
      toast({ title: "邀請碼已更新" });
    },
    onError: (error: Error) => {
      toast({ title: "更新失敗", description: error.message, variant: "destructive" });
    },
  });

  const deleteInvitation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/trip-invitations/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to delete invitation");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trip-invitations", tripId] });
      toast({ title: "邀請碼已刪除" });
    },
    onError: (error: Error) => {
      toast({ title: "刪除失敗", description: error.message, variant: "destructive" });
    },
  });

  return { createInvitation, updateInvitation, deleteInvitation };
}

export interface DevotionalCourse {
  id: string;
  tripId: string;
  dayNo: number | null;
  title: string;
  scripture: string | null;
  reflection: string | null;
  action: string | null;
  prayer: string | null;
}

export function useDevotionalCourses(tripId: string | null) {
  return useQuery<DevotionalCourse[]>({
    queryKey: ["admin-devotional-courses", tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const response = await fetch(`/api/admin/trips/${tripId}/devotional-courses`, {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch devotional courses");
      }
      return response.json();
    },
    enabled: !!tripId,
  });
}

export function useDevotionalCourseMutations(tripId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createDevotionalCourse = useMutation({
    mutationFn: async (course: Omit<DevotionalCourse, "id" | "tripId">) => {
      const response = await fetch(`/api/admin/trips/${tripId}/devotional-courses`, {
        method: "POST",
        headers: getAuthHeadersWithJson(),
        credentials: "include",
        body: JSON.stringify(course),
      });
      if (!response.ok) throw new Error("Failed to create devotional course");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-devotional-courses", tripId] });
      toast({ title: "靈修課程已建立" });
    },
    onError: (error: Error) => {
      toast({ title: "建立失敗", description: error.message, variant: "destructive" });
    },
  });

  const updateDevotionalCourse = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DevotionalCourse> & { id: string }) => {
      const response = await fetch(`/api/admin/devotional-courses/${id}`, {
        method: "PATCH",
        headers: getAuthHeadersWithJson(),
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update devotional course");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-devotional-courses", tripId] });
      toast({ title: "靈修課程已更新" });
    },
    onError: (error: Error) => {
      toast({ title: "更新失敗", description: error.message, variant: "destructive" });
    },
  });

  const deleteDevotionalCourse = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/devotional-courses/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to delete devotional course");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-devotional-courses", tripId] });
      toast({ title: "靈修課程已刪除" });
    },
    onError: (error: Error) => {
      toast({ title: "刪除失敗", description: error.message, variant: "destructive" });
    },
  });

  return { createDevotionalCourse, updateDevotionalCourse, deleteDevotionalCourse };
}
