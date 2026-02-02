import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { useTrip } from "./useTrip";
import { useToast } from "./use-toast";

export interface DevotionalEntryDB {
  id: string;
  user_id: string;
  trip_id: string;
  entry_date: string;
  scripture_reference: string;
  reflection: string | null;
  prayer: string | null;
  created_at: string;
  updated_at: string;
}

export function useDevotionalEntries(date?: string) {
  const { data: trip } = useTrip();

  return useQuery({
    queryKey: ["devotional-entries", trip?.id, date],
    queryFn: async () => {
      const url = date ? `/api/devotional-entries?date=${date}` : "/api/devotional-entries";
      const response = await fetch(url, {
        credentials: "include",
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
  const { data: entries } = useDevotionalEntries(date);

  return useQuery({
    queryKey: ["my-devotional", date, user?.id],
    queryFn: async () => {
      if (!entries || !user?.id) return null;
      return entries.find((e) => e.user_id === user.id) || null;
    },
    enabled: !!entries && !!user?.id,
  });
}

export function useSaveDevotional() {
  const { user } = useAuth();
  const { data: trip } = useTrip();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (entry: {
      scripture_reference: string;
      reflection: string;
      prayer: string;
      date?: string;
    }) => {
      if (!user?.id || !trip?.id) {
        throw new Error("User or trip not found");
      }

      const entryDate = entry.date || new Date().toISOString().split("T")[0];

      const response = await fetch("/api/devotional-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          scriptureReference: entry.scripture_reference,
          reflection: entry.reflection,
          prayer: entry.prayer,
          entryDate,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save devotional entry");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devotional-entries"] });
      queryClient.invalidateQueries({ queryKey: ["my-devotional"] });
      toast({
        title: "成功",
        description: "靈修記錄已儲存",
      });
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
