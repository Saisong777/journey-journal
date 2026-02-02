import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { useTrip } from "./useTrip";
import { useToast } from "./use-toast";

export interface JournalEntryDB {
  id: string;
  title: string;
  content: string | null;
  location: string | null;
  entryDate: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  tripId: string;
  photos?: Array<{
    id: string;
    photoUrl: string;
    caption: string | null;
  }>;
}

export function useJournalEntries(date?: string) {
  const { data: trip } = useTrip();

  return useQuery({
    queryKey: ["journal-entries", trip?.id, date],
    queryFn: async () => {
      const url = date ? `/api/journal-entries?date=${date}` : "/api/journal-entries";
      const response = await fetch(url, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch journal entries");
      }
      return response.json() as Promise<JournalEntryDB[]>;
    },
    enabled: !!trip?.id,
  });
}

export function useCreateJournalEntry() {
  const { user } = useAuth();
  const { data: trip } = useTrip();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (entry: {
      title: string;
      content: string;
      location: string;
      photos: string[];
    }) => {
      if (!user?.id || !trip?.id) {
        throw new Error("User or trip not found");
      }

      const response = await fetch("/api/journal-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        throw new Error("Failed to create journal entry");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      toast({
        title: "成功",
        description: "日誌已儲存",
      });
    },
    onError: (error) => {
      console.error("Error creating journal entry:", error);
      toast({
        title: "錯誤",
        description: "儲存日誌時發生錯誤",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteJournalEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (entryId: string) => {
      const response = await fetch(`/api/journal-entries/${entryId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete journal entry");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      toast({
        title: "成功",
        description: "日誌已刪除",
      });
    },
    onError: (error) => {
      console.error("Error deleting journal entry:", error);
      toast({
        title: "錯誤",
        description: "刪除日誌時發生錯誤",
        variant: "destructive",
      });
    },
  });
}
