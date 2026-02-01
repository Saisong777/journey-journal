import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTrip } from "./useTrip";
import { format, differenceInDays, parseISO } from "date-fns";
import { zhTW } from "date-fns/locale";

export interface TripStats {
  memberCount: number;
  journalCount: number;
  photoCount: number;
  devotionalCount: number;
}

export interface PhotoItem {
  id: string;
  url: string;
  caption: string;
  date: string;
  location: string;
}

export function useTripStats() {
  const { data: trip } = useTrip();

  return useQuery({
    queryKey: ["trip-stats", trip?.id],
    queryFn: async (): Promise<TripStats> => {
      if (!trip?.id) {
        return { memberCount: 0, journalCount: 0, photoCount: 0, devotionalCount: 0 };
      }

      // Get member count via user_roles
      const { count: memberCount, error: memberError } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("trip_id", trip.id);

      if (memberError) console.error("Error fetching member count:", memberError);

      // Get journal count
      const { count: journalCount, error: journalError } = await supabase
        .from("journal_entries")
        .select("*", { count: "exact", head: true })
        .eq("trip_id", trip.id);

      if (journalError) console.error("Error fetching journal count:", journalError);

      // Get photo count
      const { data: journalIds, error: journalIdError } = await supabase
        .from("journal_entries")
        .select("id")
        .eq("trip_id", trip.id);

      let photoCount = 0;
      if (!journalIdError && journalIds && journalIds.length > 0) {
        const { count, error: photoError } = await supabase
          .from("journal_photos")
          .select("*", { count: "exact", head: true })
          .in("journal_entry_id", journalIds.map(j => j.id));

        if (!photoError) photoCount = count || 0;
      }

      // Get devotional count
      const { count: devotionalCount, error: devotionalError } = await supabase
        .from("devotional_entries")
        .select("*", { count: "exact", head: true })
        .eq("trip_id", trip.id);

      if (devotionalError) console.error("Error fetching devotional count:", devotionalError);

      return {
        memberCount: memberCount || 0,
        journalCount: journalCount || 0,
        photoCount,
        devotionalCount: devotionalCount || 0,
      };
    },
    enabled: !!trip?.id,
  });
}

export function useTripPhotos() {
  const { data: trip } = useTrip();

  return useQuery({
    queryKey: ["trip-photos", trip?.id],
    queryFn: async (): Promise<PhotoItem[]> => {
      if (!trip?.id) return [];

      // Get journal entries with photos
      const { data, error } = await supabase
        .from("journal_entries")
        .select(`
          id,
          title,
          location,
          entry_date,
          journal_photos (
            id,
            photo_url,
            caption
          )
        `)
        .eq("trip_id", trip.id)
        .order("entry_date", { ascending: false });

      if (error) {
        console.error("Error fetching photos:", error);
        return [];
      }

      // Flatten photos
      const photos: PhotoItem[] = [];
      for (const entry of data || []) {
        for (const photo of entry.journal_photos || []) {
          photos.push({
            id: photo.id,
            url: photo.photo_url,
            caption: photo.caption || entry.title,
            date: format(parseISO(entry.entry_date), "M月d日", { locale: zhTW }),
            location: entry.location || "未知地點",
          });
        }
      }

      return photos;
    },
    enabled: !!trip?.id,
  });
}

export function useTripHighlights() {
  const { data: trip } = useTrip();

  return useQuery({
    queryKey: ["trip-highlights", trip?.id],
    queryFn: async () => {
      if (!trip?.id) return [];

      // Get devotional entries as spiritual highlights
      const { data: devotionals, error: devError } = await supabase
        .from("devotional_entries")
        .select("*")
        .eq("trip_id", trip.id)
        .not("reflection", "is", null)
        .order("entry_date", { ascending: false })
        .limit(10);

      if (devError) console.error("Error fetching devotionals:", devError);

      // Get journal entries as experience highlights
      const { data: journals, error: journalError } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("trip_id", trip.id)
        .not("content", "is", null)
        .order("entry_date", { ascending: false })
        .limit(10);

      if (journalError) console.error("Error fetching journals:", journalError);

      const highlights: Array<{
        id: string;
        type: "spiritual" | "experience" | "fellowship";
        title: string;
        description: string;
        date: string;
      }> = [];

      // Map devotionals to spiritual highlights
      for (const d of devotionals || []) {
        highlights.push({
          id: d.id,
          type: "spiritual",
          title: d.scripture_reference,
          description: d.reflection || "",
          date: format(parseISO(d.entry_date), "M月d日", { locale: zhTW }),
        });
      }

      // Map journals to experience highlights
      for (const j of journals || []) {
        highlights.push({
          id: j.id,
          type: "experience",
          title: j.title,
          description: j.content || "",
          date: format(parseISO(j.entry_date), "M月d日", { locale: zhTW }),
        });
      }

      // Sort by date descending
      return highlights.slice(0, 6);
    },
    enabled: !!trip?.id,
  });
}

export function formatTripDateRange(startDate: string, endDate: string): string {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  return `${format(start, "yyyy/M/d", { locale: zhTW })} - ${format(end, "M/d", { locale: zhTW })}`;
}

export function calculateTripDuration(startDate: string, endDate: string): number {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  return differenceInDays(end, start) + 1;
}
