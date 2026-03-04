import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTrip } from "./useTrip";
import { useToast } from "./use-toast";
import { getAuthToken } from "@/lib/queryClient";
import { addToQueue } from "@/lib/offlineQueue";

export interface EveningReflectionDB {
  id: string;
  userId: string;
  tripId: string;
  gratitude: string | null;
  highlight: string | null;
  prayerForTomorrow: string | null;
  entryDate: string;
  createdAt: string;
  updatedAt: string;
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

export function useEveningReflection(date: string) {
  const { data: trip } = useTrip();

  return useQuery({
    queryKey: ["evening-reflection", trip?.id, date],
    queryFn: async () => {
      const response = await fetch(`/api/evening-reflections?date=${date}`, {
        credentials: "include",
        headers: getHeaders(),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch evening reflection");
      }
      return response.json() as Promise<EveningReflectionDB | null>;
    },
    enabled: !!trip?.id && !!date,
  });
}

export function useSaveEveningReflection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      gratitude: string;
      highlight: string;
      prayerForTomorrow: string;
      entryDate?: string;
    }) => {
      const payload = {
        gratitude: data.gratitude,
        highlight: data.highlight,
        prayerForTomorrow: data.prayerForTomorrow,
        entryDate: data.entryDate || new Date().toISOString().split("T")[0],
      };

      try {
        const response = await fetch("/api/evening-reflections", {
          method: "POST",
          headers: getHeaders(),
          credentials: "include",
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          throw new Error("Failed to save evening reflection");
        }
        return response.json();
      } catch (error) {
        if (error instanceof TypeError) {
          await addToQueue({
            type: "evening",
            endpoint: "/api/evening-reflections",
            method: "POST",
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
          description: "連線後將自動同步晚間感恩",
        });
      } else {
        toast({
          title: "成功",
          description: "晚間感恩已儲存",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["evening-reflection"] });
    },
    onError: (error) => {
      console.error("Error saving evening reflection:", error);
      toast({
        title: "錯誤",
        description: "儲存晚間感恩時發生錯誤",
        variant: "destructive",
      });
    },
  });
}
