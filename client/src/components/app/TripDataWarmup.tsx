import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getAuthToken } from "@/lib/queryClient";
import {
  TRIP_DATA_PACK_REFRESH_EVENT,
  writeTripDataPackMeta,
  type TripDataPackMeta,
} from "@/lib/tripDataPack";

const WARMUP_STALE_TIME = 5 * 60 * 1000;
const WARMUP_GC_TIME = 60 * 60 * 1000;

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJson(endpoint: string) {
  const response = await fetch(endpoint, {
    credentials: "include",
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error(`Warmup failed: ${endpoint}`);
  return response.json();
}

export function TripDataWarmup() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    const warmup = async () => {
      if (navigator.onLine === false) {
        writeTripDataPackMeta({
          status: "offline",
          successful: 0,
          total: 8,
          failedLabels: ["目前離線"],
        });
        return;
      }

      writeTripDataPackMeta({
        status: "refreshing",
        successful: 0,
        total: 8,
        failedLabels: [],
      });

      const trip = await queryClient
        .fetchQuery({
          queryKey: ["trip", "current"],
          queryFn: () => fetchJson("/api/trips/current"),
          staleTime: WARMUP_STALE_TIME,
          gcTime: WARMUP_GC_TIME,
        })
        .catch(() => null);

      if (cancelled) return;

      const tripId = trip?.id;
      const queries = [
        { label: "每日行程", key: ["/api/trip-days"], endpoint: "/api/trip-days" },
        { label: "今日行程", key: ["/api/trip-days/today"], endpoint: "/api/trip-days/today" },
        { label: "景點地圖", key: ["/api/schedule-locations"], endpoint: "/api/schedule-locations" },
        { label: "每日靈修", key: ["/api/trips/current/devotional-courses"], endpoint: "/api/trips/current/devotional-courses" },
        { label: "注意事項", key: ["/api/trips/current/notes"], endpoint: "/api/trips/current/notes" },
        { label: "使用說明", key: ["/api/app-settings/help-content"], endpoint: "/api/app-settings/help-content" },
        { label: "小組資料", key: ["/api/groups"], endpoint: "/api/groups" },
        { label: "團員通訊錄", key: ["/api/members"], endpoint: "/api/members" },
      ];

      const results = await Promise.allSettled(
        queries.map((item) =>
          queryClient.fetchQuery({
            queryKey: item.key,
            queryFn: () => fetchJson(item.endpoint),
            staleTime: WARMUP_STALE_TIME,
            gcTime: WARMUP_GC_TIME,
          })
        )
      );

      if (cancelled || !tripId) return;

      const groups = results[6].status === "fulfilled" ? results[6].value : undefined;
      const members = results[7].status === "fulfilled" ? results[7].value : undefined;
      if (groups) queryClient.setQueryData(["groups", tripId], groups);
      if (members) queryClient.setQueryData(["members", tripId], members);

      const failedLabels = results
        .map((result, index) => (result.status === "rejected" ? queries[index].label : null))
        .filter(Boolean) as string[];
      const successful = results.length - failedLabels.length;
      const meta: TripDataPackMeta = {
        status: failedLabels.length === 0 ? "ready" : successful > 0 ? "partial" : "failed",
        tripId,
        tripTitle: trip?.title,
        updatedAt: Date.now(),
        successful,
        total: queries.length,
        failedLabels,
      };
      writeTripDataPackMeta(meta);
    };

    warmup();
    window.addEventListener(TRIP_DATA_PACK_REFRESH_EVENT, warmup);

    return () => {
      cancelled = true;
      window.removeEventListener(TRIP_DATA_PACK_REFRESH_EVENT, warmup);
    };
  }, [queryClient, user?.id]);

  return null;
}
