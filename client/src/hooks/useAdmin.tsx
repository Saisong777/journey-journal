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

interface AdminStatus {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  platformRole: string;
  permissions: Record<string, boolean> | null;
}

export function useIsAdmin() {
  const { user } = useAuth();

  return useQuery<AdminStatus>({
    queryKey: ["isAdmin", user?.id],
    queryFn: async () => {
      if (!user?.id) return { isAdmin: false, isSuperAdmin: false, platformRole: "member", permissions: null };

      const response = await fetch("/api/is-admin", {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!response.ok) return { isAdmin: false, isSuperAdmin: false, platformRole: "member", permissions: null };
      return response.json();
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
  place: string | null;
  scripture: string | null;
  reflection: string | null;
  action: string | null;
  prayer: string | null;
  lifeQuestion: string | null;
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

// ===== Attractions =====

export interface AdminAttraction {
  id: string;
  tripId: string;
  dayNo: number;
  seq: number;
  nameZh: string;
  nameEn: string | null;
  nameAlt: string | null;
  country: string | null;
  date: string | null;
  modernLocation: string | null;
  ancientToponym: string | null;
  gps: string | null;
  openingHours: string | null;
  admission: string | null;
  duration: string | null;
  scriptureRefs: string | null;
  bibleBooks: string | null;
  storySummary: string | null;
  keyFigures: string | null;
  historicalEra: string | null;
  theologicalSignificance: string | null;
  lifeApplication: string | null;
  discussionQuestions: string | null;
  archaeologicalFindings: string | null;
  historicalStrata: string | null;
  accuracyRating: string | null;
  keyArtifacts: string | null;
  tourRoutePosition: string | null;
  bestTime: string | null;
  dressCode: string | null;
  photoRestrictions: string | null;
  crowdLevels: string | null;
  safetyNotes: string | null;
  accessibility: string | null;
  nearbyDining: string | null;
  accommodation: string | null;
  nearbyBiblicalSites: string | null;
  localProducts: string | null;
  recommendationScore: string | null;
  physicalComment: string | null;
}

export function useAdminAttractions(tripId: string | null) {
  return useQuery<AdminAttraction[]>({
    queryKey: ["admin-attractions", tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const response = await fetch(`/api/admin/trips/${tripId}/attractions`, {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch attractions");
      return response.json();
    },
    enabled: !!tripId,
  });
}

export function useAttractionMutations(tripId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateAttraction = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AdminAttraction> & { id: string }) => {
      const response = await fetch(`/api/admin/attractions/${id}`, {
        method: "PATCH",
        headers: getAuthHeadersWithJson(),
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update attraction");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-attractions", tripId] });
      toast({ title: "景點已更新" });
    },
    onError: (error: Error) => {
      toast({ title: "更新失敗", description: error.message, variant: "destructive" });
    },
  });

  const deleteAttraction = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/attractions/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to delete attraction");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-attractions", tripId] });
      toast({ title: "景點已刪除" });
    },
    onError: (error: Error) => {
      toast({ title: "刪除失敗", description: error.message, variant: "destructive" });
    },
  });

  const importAttractions = useMutation({
    mutationFn: async (items: Record<string, any>[]) => {
      const response = await fetch(`/api/admin/trips/${tripId}/attractions/import`, {
        method: "POST",
        headers: getAuthHeadersWithJson(),
        credentials: "include",
        body: JSON.stringify(items),
      });
      if (!response.ok) throw new Error("Failed to import attractions");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-attractions", tripId] });
      toast({ title: `成功匯入 ${data.count} 個景點` });
    },
    onError: (error: Error) => {
      toast({ title: "匯入失敗", description: error.message, variant: "destructive" });
    },
  });

  const importMdContent = useMutation({
    mutationFn: async (files: { filename: string; content: string }[]) => {
      const response = await fetch(`/api/admin/trips/${tripId}/attractions/import-md`, {
        method: "POST",
        headers: getAuthHeadersWithJson(),
        credentials: "include",
        body: JSON.stringify(files),
      });
      if (!response.ok) throw new Error("Failed to import md content");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-attractions", tripId] });
      toast({ title: `深度資料匯入完成`, description: `比對成功 ${data.matched} 筆，略過 ${data.skipped} 筆（共 ${data.total} 個檔案）` });
    },
    onError: (error: Error) => {
      toast({ title: "匯入失敗", description: error.message, variant: "destructive" });
    },
  });

  return { updateAttraction, deleteAttraction, importAttractions, importMdContent };
}

// ===== Bible Library Modules =====

export interface BibleLibraryModuleType {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  iconName: string | null;
  coverImageUrl: string | null;
  sortOrder: number;
  isBuiltin: boolean;
  moduleType: string;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BibleLibraryItemType {
  id: string;
  moduleId: string;
  title: string;
  content: string | null;
  imageUrl: string | null;
  fileUrl: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export function useBibleLibraryModules() {
  return useQuery<BibleLibraryModuleType[]>({
    queryKey: ["admin-bible-modules"],
    queryFn: async () => {
      const response = await fetch("/api/admin/bible-library/modules", {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch modules");
      return response.json();
    },
  });
}

export function useBibleLibraryModuleMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createModule = useMutation({
    mutationFn: async (data: { slug: string; title: string; description?: string; iconName?: string; coverImageUrl?: string; sortOrder?: number; moduleType?: string }) => {
      const response = await fetch("/api/admin/bible-library/modules", {
        method: "POST",
        headers: getAuthHeadersWithJson(),
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create module");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bible-modules"] });
      toast({ title: "模組已建立" });
    },
    onError: (error: Error) => {
      toast({ title: "建立失敗", description: error.message, variant: "destructive" });
    },
  });

  const updateModule = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BibleLibraryModuleType> & { id: string }) => {
      const response = await fetch(`/api/admin/bible-library/modules/${id}`, {
        method: "PATCH",
        headers: getAuthHeadersWithJson(),
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update module");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bible-modules"] });
      toast({ title: "模組已更新" });
    },
    onError: (error: Error) => {
      toast({ title: "更新失敗", description: error.message, variant: "destructive" });
    },
  });

  const deleteModule = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/bible-library/modules/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to delete module");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bible-modules"] });
      toast({ title: "模組已刪除" });
    },
    onError: (error: Error) => {
      toast({ title: "刪除失敗", description: error.message, variant: "destructive" });
    },
  });

  return { createModule, updateModule, deleteModule };
}

export function useBibleLibraryItems(moduleId: string | null) {
  return useQuery<BibleLibraryItemType[]>({
    queryKey: ["admin-bible-items", moduleId],
    queryFn: async () => {
      if (!moduleId) return [];
      const response = await fetch(`/api/admin/bible-library/modules/${moduleId}/items`, {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch items");
      return response.json();
    },
    enabled: !!moduleId,
  });
}

export function useBibleLibraryItemMutations(moduleId: string | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createItem = useMutation({
    mutationFn: async (data: { title: string; content?: string; imageUrl?: string; fileUrl?: string; sortOrder?: number }) => {
      const response = await fetch(`/api/admin/bible-library/modules/${moduleId}/items`, {
        method: "POST",
        headers: getAuthHeadersWithJson(),
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create item");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bible-items", moduleId] });
      toast({ title: "項目已建立" });
    },
    onError: (error: Error) => {
      toast({ title: "建立失敗", description: error.message, variant: "destructive" });
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BibleLibraryItemType> & { id: string }) => {
      const response = await fetch(`/api/admin/bible-library/items/${id}`, {
        method: "PATCH",
        headers: getAuthHeadersWithJson(),
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update item");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bible-items", moduleId] });
      toast({ title: "項目已更新" });
    },
    onError: (error: Error) => {
      toast({ title: "更新失敗", description: error.message, variant: "destructive" });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/bible-library/items/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to delete item");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bible-items", moduleId] });
      toast({ title: "項目已刪除" });
    },
    onError: (error: Error) => {
      toast({ title: "刪除失敗", description: error.message, variant: "destructive" });
    },
  });

  return { createItem, updateItem, deleteItem };
}

export function useModuleTrips(moduleId: string | null) {
  return useQuery<{ id: string; moduleId: string; tripId: string }[]>({
    queryKey: ["admin-module-trips", moduleId],
    queryFn: async () => {
      if (!moduleId) return [];
      const response = await fetch(`/api/admin/bible-library/modules/${moduleId}/trips`, {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch module trips");
      return response.json();
    },
    enabled: !!moduleId,
  });
}

export function useModuleTripMutations(moduleId: string | null) {
  const queryClient = useQueryClient();

  const assignTrip = useMutation({
    mutationFn: async (tripId: string) => {
      const response = await fetch(`/api/admin/bible-library/modules/${moduleId}/trips`, {
        method: "POST",
        headers: getAuthHeadersWithJson(),
        credentials: "include",
        body: JSON.stringify({ tripId }),
      });
      if (!response.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-module-trips", moduleId] });
    },
  });

  const unassignTrip = useMutation({
    mutationFn: async (tripId: string) => {
      const response = await fetch(`/api/admin/bible-library/modules/${moduleId}/trips/${tripId}`, {
        method: "DELETE",
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-module-trips", moduleId] });
    },
  });

  return { assignTrip, unassignTrip };
}
