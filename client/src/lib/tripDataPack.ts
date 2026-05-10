export type TripDataPackStatus = "idle" | "refreshing" | "ready" | "partial" | "offline" | "failed";

export type TripDataPackMeta = {
  status: TripDataPackStatus;
  tripId?: string;
  tripTitle?: string;
  updatedAt?: number;
  successful: number;
  total: number;
  failedLabels: string[];
};

export const TRIP_DATA_PACK_STORAGE_KEY = "trip_data_pack_status";
export const TRIP_DATA_PACK_EVENT = "trip-data-pack-status";
export const TRIP_DATA_PACK_REFRESH_EVENT = "trip-data-pack-refresh";

export function readTripDataPackMeta(): TripDataPackMeta | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TRIP_DATA_PACK_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TripDataPackMeta) : null;
  } catch {
    return null;
  }
}

export function writeTripDataPackMeta(meta: TripDataPackMeta) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TRIP_DATA_PACK_STORAGE_KEY, JSON.stringify(meta));
  window.dispatchEvent(new CustomEvent<TripDataPackMeta>(TRIP_DATA_PACK_EVENT, { detail: meta }));
}
