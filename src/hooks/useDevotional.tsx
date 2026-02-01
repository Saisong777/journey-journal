import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
      if (!trip?.id) return [];

      let query = supabase
        .from("devotional_entries")
        .select("*")
        .eq("trip_id", trip.id)
        .order("created_at", { ascending: false });

      if (date) {
        query = query.eq("entry_date", date);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as DevotionalEntryDB[];
    },
    enabled: !!trip?.id,
  });
}

export function useMyDevotionalEntry(date: string) {
  const { user } = useAuth();
  const { data: trip } = useTrip();

  return useQuery({
    queryKey: ["my-devotional", trip?.id, date, user?.id],
    queryFn: async () => {
      if (!trip?.id || !user?.id) return null;

      const { data, error } = await supabase
        .from("devotional_entries")
        .select("*")
        .eq("trip_id", trip.id)
        .eq("user_id", user.id)
        .eq("entry_date", date)
        .maybeSingle();

      if (error) throw error;
      return data as DevotionalEntryDB | null;
    },
    enabled: !!trip?.id && !!user?.id,
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

      // Check if entry exists for this date
      const { data: existing } = await supabase
        .from("devotional_entries")
        .select("id")
        .eq("user_id", user.id)
        .eq("trip_id", trip.id)
        .eq("entry_date", entryDate)
        .maybeSingle();

      if (existing) {
        // Update existing entry
        const { data, error } = await supabase
          .from("devotional_entries")
          .update({
            scripture_reference: entry.scripture_reference,
            reflection: entry.reflection,
            prayer: entry.prayer,
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new entry
        const { data, error } = await supabase
          .from("devotional_entries")
          .insert({
            user_id: user.id,
            trip_id: trip.id,
            entry_date: entryDate,
            scripture_reference: entry.scripture_reference,
            reflection: entry.reflection,
            prayer: entry.prayer,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
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
