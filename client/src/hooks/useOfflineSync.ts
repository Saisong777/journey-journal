import { useState, useEffect, useCallback, useRef } from "react";
import { useNetworkStatus } from "./useNetworkStatus";
import { useToast } from "./use-toast";
import { getQueue, removeFromQueue, getQueueCount } from "@/lib/offlineQueue";
import { getAuthToken } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export function useOfflineSync() {
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();
  const [pendingCount, setPendingCount] = useState(0);
  const isSyncingRef = useRef(false);

  const refreshCount = useCallback(async () => {
    const count = await getQueueCount();
    setPendingCount(count);
  }, []);

  useEffect(() => {
    refreshCount();
    const interval = setInterval(refreshCount, 5000);
    return () => clearInterval(interval);
  }, [refreshCount]);

  const syncQueue = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      const queue = await getQueue();
      if (queue.length === 0) return;

      let synced = 0;

      for (const item of queue) {
        try {
          const token = getAuthToken();
          const headers: HeadersInit = { "Content-Type": "application/json" };
          if (token) headers["Authorization"] = `Bearer ${token}`;

          const response = await fetch(item.endpoint, {
            method: item.method,
            headers,
            credentials: "include",
            body: JSON.stringify(item.data),
          });

          if (response.ok) {
            await removeFromQueue(item.id);
            synced++;
          } else {
            break;
          }
        } catch {
          break;
        }
      }

      if (synced > 0) {
        queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
        queryClient.invalidateQueries({ queryKey: ["devotional-entries"] });
        queryClient.invalidateQueries({ queryKey: ["evening-reflection"] });

        toast({
          title: "同步完成",
          description: `已同步 ${synced} 筆離線資料`,
        });
      }

      await refreshCount();
    } finally {
      isSyncingRef.current = false;
    }
  }, [toast, refreshCount]);

  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      syncQueue();
    }
  }, [isOnline, pendingCount, syncQueue]);

  return { pendingCount, refreshCount };
}
