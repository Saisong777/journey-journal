import { useQuery } from "@tanstack/react-query";
import { useTrip } from "./useTrip";
import { useJournalEntries } from "./useJournalEntries";
import { useDevotionalEntries } from "./useDevotional";
import { useMembers } from "./useMembers";
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
  const { data: members } = useMembers();
  const { data: journalEntries } = useJournalEntries();
  const { data: devotionalEntries } = useDevotionalEntries();

  return useQuery({
    queryKey: ["trip-stats", members?.length, journalEntries?.length, devotionalEntries?.length],
    queryFn: async (): Promise<TripStats> => {
      const memberCount = members?.length || 0;
      const journalCount = journalEntries?.length || 0;
      const photoCount = journalEntries?.reduce((acc, entry) => acc + (entry.photos?.length || 0), 0) || 0;
      const devotionalCount = devotionalEntries?.length || 0;

      return { memberCount, journalCount, photoCount, devotionalCount };
    },
    enabled: true,
  });
}

export function useTripPhotos() {
  const { data: journalEntries } = useJournalEntries();

  return useQuery({
    queryKey: ["trip-photos", journalEntries?.length],
    queryFn: async (): Promise<PhotoItem[]> => {
      if (!journalEntries) return [];

      const photos: PhotoItem[] = [];
      for (const entry of journalEntries) {
        for (const photo of entry.photos || []) {
          photos.push({
            id: photo.id,
            url: photo.photoUrl,
            caption: photo.caption || entry.title,
            date: format(parseISO(entry.entryDate), "M月d日", { locale: zhTW }),
            location: entry.location || "未知地點",
          });
        }
      }

      return photos;
    },
    enabled: !!journalEntries,
  });
}

export function useTripHighlights() {
  const { data: journalEntries } = useJournalEntries();
  const { data: devotionalEntries } = useDevotionalEntries();

  return useQuery({
    queryKey: ["trip-highlights", journalEntries?.length, devotionalEntries?.length],
    queryFn: async () => {
      const highlights: Array<{
        id: string;
        type: "spiritual" | "experience" | "fellowship";
        title: string;
        description: string;
        date: string;
      }> = [];

      for (const d of devotionalEntries?.slice(0, 5) || []) {
        if (d.reflection) {
          highlights.push({
            id: d.id,
            type: "spiritual",
            title: d.scriptureReference,
            description: d.reflection,
            date: format(parseISO(d.entryDate), "M月d日", { locale: zhTW }),
          });
        }
      }

      for (const j of journalEntries?.slice(0, 5) || []) {
        if (j.content) {
          highlights.push({
            id: j.id,
            type: "experience",
            title: j.title,
            description: j.content,
            date: format(parseISO(j.entryDate), "M月d日", { locale: zhTW }),
          });
        }
      }

      return highlights.slice(0, 6);
    },
    enabled: !!journalEntries || !!devotionalEntries,
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
