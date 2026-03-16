import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export interface RollCallAttendanceWithProfile {
  id: string;
  rollCallId: string;
  userId: string;
  status: string;
  checkedInBy: string | null;
  checkedInAt: string | null;
  name: string;
  avatarUrl?: string | null;
  groupName?: string | null;
}

export interface RollCallWithCounts {
  id: string;
  tripId: string;
  date: string;
  location: string | null;
  note: string | null;
  createdBy: string;
  selfCheckInEnabled: boolean;
  closedAt: string | null;
  createdAt: string;
  presentCount: number;
  totalCount: number;
}

export interface RollCallDetail extends RollCallWithCounts {
  attendances: RollCallAttendanceWithProfile[];
  myRole?: string;
}

export function useRollCalls() {
  return useQuery<RollCallWithCounts[]>({
    queryKey: ["roll-calls"],
    queryFn: async () => {
      const res = await fetch("/api/roll-calls", {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
  });
}

export interface ActiveRollCallResponse {
  active: false;
  myRole: string;
}

export function useActiveRollCall() {
  return useQuery<RollCallDetail | ActiveRollCallResponse | null>({
    queryKey: ["roll-call-active"],
    queryFn: async () => {
      const res = await fetch("/api/roll-calls/active", {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: 5000,
  });
}

/** Helper: check if the response is an active roll call (not the "no active" response) */
export function isActiveRollCall(data: RollCallDetail | ActiveRollCallResponse | null | undefined): data is RollCallDetail {
  return data != null && !("active" in data && data.active === false);
}

export function useRollCallDetail(id: string | null) {
  return useQuery<RollCallDetail | null>({
    queryKey: ["roll-call", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await fetch(`/api/roll-calls/${id}`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!id,
    refetchInterval: 5000,
  });
}

export function useRollCallMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createRollCall = useMutation({
    mutationFn: async (data: { date?: string; location?: string; note?: string; selfCheckInEnabled?: boolean }) => {
      const res = await fetch("/api/roll-calls", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roll-calls"] });
      queryClient.invalidateQueries({ queryKey: ["roll-call-active"] });
      toast({ title: "點名已開始" });
    },
    onError: (error: Error) => {
      toast({ title: "無法建立點名", description: error.message, variant: "destructive" });
    },
  });

  const toggleAttendance = useMutation({
    mutationFn: async ({ rollCallId, userId, status }: { rollCallId: string; userId: string; status: string }) => {
      const res = await fetch(`/api/roll-calls/${rollCallId}/attendance/${userId}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["roll-call-active"] });
      queryClient.invalidateQueries({ queryKey: ["roll-call", variables.rollCallId] });
    },
  });

  const selfCheckIn = useMutation({
    mutationFn: async (rollCallId: string) => {
      const res = await fetch(`/api/roll-calls/${rollCallId}/self-check-in`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roll-call-active"] });
      toast({ title: "簽到成功" });
    },
    onError: (error: Error) => {
      toast({ title: "簽到失敗", description: error.message, variant: "destructive" });
    },
  });

  const closeRollCall = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/roll-calls/${id}/close`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to close");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roll-calls"] });
      queryClient.invalidateQueries({ queryKey: ["roll-call-active"] });
      toast({ title: "點名已結束" });
    },
  });

  const deleteRollCall = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/roll-calls/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roll-calls"] });
      queryClient.invalidateQueries({ queryKey: ["roll-call-active"] });
      toast({ title: "點名紀錄已刪除" });
    },
  });

  return { createRollCall, toggleAttendance, selfCheckIn, closeRollCall, deleteRollCall };
}
