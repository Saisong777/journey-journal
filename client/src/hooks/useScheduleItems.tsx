import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/queryClient";

export interface ScheduleItem {
  id: string;
  tripId: string;
  dayNo: number;
  seq: number;
  time: string;
  type: "meal" | "activity" | "boarding" | "gathering" | "accommodation" | "free_time" | "custom";
  title: string;
  location: string | null;
  notes: string | null;
  attractionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleItemsResponse {
  items: ScheduleItem[];
  canManage: boolean;
}

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export function useScheduleItems(dayNo: number | null | undefined) {
  return useQuery<ScheduleItemsResponse>({
    queryKey: ["schedule-items", dayNo],
    queryFn: async () => {
      const res = await fetch(`/api/schedule-items?dayNo=${dayNo}`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) return { items: [], canManage: false };
      return res.json();
    },
    enabled: dayNo != null,
  });
}

export function useCreateScheduleItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      dayNo: number;
      time: string;
      type: string;
      title: string;
      location?: string;
      notes?: string;
      seq?: number;
    }) => {
      const res = await fetch("/api/schedule-items", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create schedule item");
      return res.json() as Promise<ScheduleItem>;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["schedule-items", vars.dayNo] });
    },
  });
}

export function useUpdateScheduleItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dayNo, ...data }: {
      id: string;
      dayNo: number;
      time?: string;
      type?: string;
      title?: string;
      location?: string | null;
      notes?: string | null;
      seq?: number;
    }) => {
      const res = await fetch(`/api/schedule-items/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update schedule item");
      return { item: await res.json() as ScheduleItem, dayNo };
    },
    onSuccess: ({ dayNo }) => {
      qc.invalidateQueries({ queryKey: ["schedule-items", dayNo] });
    },
  });
}

export function useDeleteScheduleItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dayNo }: { id: string; dayNo: number }) => {
      const res = await fetch(`/api/schedule-items/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete schedule item");
      return dayNo;
    },
    onSuccess: (dayNo) => {
      qc.invalidateQueries({ queryKey: ["schedule-items", dayNo] });
    },
  });
}

export function useSeedScheduleItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dayNo: number) => {
      const res = await fetch(`/api/schedule-items/seed/${dayNo}`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to seed schedule items");
      }
      return { items: await res.json() as ScheduleItem[], dayNo };
    },
    onSuccess: ({ dayNo }) => {
      qc.invalidateQueries({ queryKey: ["schedule-items", dayNo] });
    },
  });
}
