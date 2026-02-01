import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useTrip } from "./useTrip";
import { useToast } from "./use-toast";

export interface JournalEntryDB {
  id: string;
  title: string;
  content: string | null;
  location: string | null;
  entry_date: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  trip_id: string;
  photos?: Array<{
    id: string;
    photo_url: string;
    caption: string | null;
  }>;
}

export function useJournalEntries(date?: string) {
  const { user } = useAuth();
  const { data: trip } = useTrip();

  return useQuery({
    queryKey: ["journal-entries", trip?.id, date],
    queryFn: async () => {
      if (!trip?.id) return [];

      let query = supabase
        .from("journal_entries")
        .select(`
          *,
          journal_photos (
            id,
            photo_url,
            caption
          )
        `)
        .eq("trip_id", trip.id)
        .order("created_at", { ascending: false });

      if (date) {
        query = query.eq("entry_date", date);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return (data || []).map(entry => ({
        ...entry,
        photos: entry.journal_photos || [],
      })) as JournalEntryDB[];
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

      // Create the journal entry
      const { data: journalEntry, error: entryError } = await supabase
        .from("journal_entries")
        .insert({
          user_id: user.id,
          trip_id: trip.id,
          title: entry.title || entry.location,
          content: entry.content,
          location: entry.location,
          entry_date: new Date().toISOString().split("T")[0],
        })
        .select()
        .single();

      if (entryError) throw entryError;

      // Add photos if any
      if (entry.photos.length > 0) {
        const photoInserts = entry.photos.map((photo_url) => ({
          journal_entry_id: journalEntry.id,
          photo_url,
        }));

        const { error: photoError } = await supabase
          .from("journal_photos")
          .insert(photoInserts);

        if (photoError) throw photoError;
      }

      return journalEntry;
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
      const { error } = await supabase
        .from("journal_entries")
        .delete()
        .eq("id", entryId);

      if (error) throw error;
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
