import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTrip } from "./useTrip";
import { useToast } from "./use-toast";
import { getAuthToken } from "@/lib/queryClient";
import { addToQueue } from "@/lib/offlineQueue";
import type { PhotoWithMeta } from "@/lib/photoUtils";

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
    latitude: number | null;
    longitude: number | null;
  }>;
}

function getHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export function useJournalEntries(date?: string) {
  const { data: trip } = useTrip();

  return useQuery({
    queryKey: ["journal-entries", trip?.id, date],
    queryFn: async () => {
      const url = date ? `/api/journal-entries?date=${date}` : "/api/journal-entries";
      const response = await fetch(url, {
        credentials: "include",
        headers: getHeaders(),
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
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (entry: {
      title: string;
      content: string;
      location: string;
      photos: PhotoWithMeta[];
      entryDate?: string;
    }) => {
      const payload = {
        title: entry.title,
        content: entry.content,
        location: entry.location,
        photos: entry.photos,
        entryDate: entry.entryDate,
      };

      try {
        const response = await fetch("/api/journal-entries", {
          method: "POST",
          headers: getHeaders(),
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Journal entry creation failed:", errorText);
          throw new Error("Failed to create journal entry");
        }

        return response.json();
      } catch (error) {
        if (error instanceof TypeError) {
          await addToQueue({
            type: "journal",
            endpoint: "/api/journal-entries",
            method: "POST",
            data: { ...payload, photos: [] },
          });
          return { offline: true, hadPhotos: entry.photos.length > 0 };
        }
        throw error;
      }
    },
    retry: false,
    onSuccess: (result) => {
      if (result?.offline) {
        toast({
          title: "已儲存至本機",
          description: result.hadPhotos
            ? "文字內容已儲存，連線後將自動同步（照片需連線後重新添加）"
            : "連線後將自動同步日誌",
        });
      } else {
        toast({
          title: "成功",
          description: "日誌已儲存",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
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

export function useUpdateJournalEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      title,
      content,
      location,
      photos,
    }: {
      id: string;
      title?: string;
      content?: string;
      location?: string;
      photos?: PhotoWithMeta[];
    }) => {
      const response = await fetch(`/api/journal-entries/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: getHeaders(),
        body: JSON.stringify({ title, content, location, photos }),
      });

      if (!response.ok) {
        throw new Error("Failed to update journal entry");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      toast({
        title: "成功",
        description: "日誌已更新",
      });
    },
    onError: (error) => {
      console.error("Error updating journal entry:", error);
      toast({
        title: "錯誤",
        description: "更新日誌時發生錯誤",
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
        headers: getHeaders(),
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
