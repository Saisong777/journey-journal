import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { useTrip } from "./useTrip";
import { useToast } from "./use-toast";
import { getAuthToken } from "@/lib/queryClient";
import { addToQueue } from "@/lib/offlineQueue";

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export interface DevotionalEntryDB {
  id: string;
  userId: string;
  tripId: string;
  entryDate: string;
  scriptureReference: string;
  reflection: string | null;
  prayer: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DevotionalCourseDB {
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

export interface BibleLookupResult {
  reference: string;
  bookName: string;
  chapter: number;
  verses: { number: number; text: string }[];
}

export function useTripDevotionalCourses() {
  return useQuery<DevotionalCourseDB[]>({
    queryKey: ["/api/trips/current/devotional-courses"],
  });
}

export function useBibleLookup(ref: string | null | undefined) {
  return useQuery<BibleLookupResult>({
    queryKey: ["/api/bible/lookup", ref],
    queryFn: async () => {
      if (!ref) throw new Error("No reference");
      const response = await fetch(`/api/bible/lookup?ref=${encodeURIComponent(ref)}`, {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error("Failed to lookup scripture");
      }
      return response.json();
    },
    enabled: !!ref && ref.trim().length > 0,
    staleTime: Infinity,
  });
}

export function useDevotionalEntries(date?: string) {
  const { data: trip } = useTrip();

  return useQuery({
    queryKey: ["devotional-entries", trip?.id, date],
    queryFn: async () => {
      const url = date ? `/api/devotional-entries?date=${date}` : "/api/devotional-entries";
      const response = await fetch(url, {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch devotional entries");
      }
      return response.json() as Promise<DevotionalEntryDB[]>;
    },
    enabled: !!trip?.id,
  });
}

export function useMyDevotionalEntry(date: string) {
  const { user } = useAuth();
  const { data: entries, isLoading } = useDevotionalEntries(date);

  const data = useMemo(() => {
    if (!entries || !user?.id) return null;
    return entries.find((e) => e.userId === user.id) || null;
  }, [entries, user?.id]);

  return { data, isLoading };
}

export function useSaveDevotional() {
  const { user } = useAuth();
  const { data: trip } = useTrip();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (entry: {
      scriptureReference: string;
      reflection: string;
      prayer: string;
      date?: string;
      id?: string;
    }) => {
      if (!user?.id || !trip?.id) {
        throw new Error("User or trip not found");
      }

      const entryDate = entry.date || new Date().toISOString().split("T")[0];
      const url = entry.id ? `/api/devotional-entries/${entry.id}` : "/api/devotional-entries";
      const method = entry.id ? "PATCH" : "POST";

      const payload = {
        scriptureReference: entry.scriptureReference || "",
        reflection: entry.reflection || "",
        prayer: entry.prayer || "",
        entryDate,
      };

      try {
        const response = await fetch(url, {
          method,
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error("Failed to save devotional entry");
        }

        return response.json();
      } catch (error) {
        if (error instanceof TypeError) {
          await addToQueue({
            type: "devotional",
            endpoint: url,
            method: method as "POST" | "PATCH",
            data: payload,
          });
          return { offline: true };
        }
        throw error;
      }
    },
    retry: false,
    onSuccess: (result) => {
      if (result?.offline) {
        toast({
          title: "已儲存至本機",
          description: "連線後將自動同步靈修記錄",
        });
      } else {
        toast({
          title: "成功",
          description: "靈修記錄已儲存",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["devotional-entries"] });
    },
    onError: (error) => {
      console.error("Error saving devotional:", error);
      toast({
        title: "錯誤",
        description: "儲存靈修記錄時發生錯誤",
        variant: "destructive",
      });
    },
  });
}
