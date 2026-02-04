import { useState, useMemo } from "react";
import { Plus, Calendar, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/ui/BottomNav";
import { JournalEntry, JournalEntryData } from "@/components/journal/JournalEntry";
import { AddJournalSheet } from "@/components/journal/AddJournalSheet";
import { ViewJournalSheet } from "@/components/journal/ViewJournalSheet";
import { useJournalEntries, useCreateJournalEntry, useDeleteJournalEntry, useUpdateJournalEntry } from "@/hooks/useJournalEntries";
import { useTrip } from "@/hooks/useTrip";
import { cn } from "@/lib/utils";
import { format, addDays, startOfDay, parseISO } from "date-fns";
import { zhTW } from "date-fns/locale";

// Helper function to transform photo URLs to use the backend proxy
function transformPhotoUrl(photoUrl: string): string {
  // If it's a GCS URL, extract the object ID and use our proxy endpoint
  if (photoUrl.includes("storage.googleapis.com") && photoUrl.includes("/uploads/")) {
    const match = photoUrl.match(/\/uploads\/([a-f0-9-]+)/);
    if (match) {
      return `/api/uploads/file/${match[1]}`;
    }
  }
  // Return as-is if it's already a proper URL or local path
  return photoUrl;
}

export default function Journal() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewingEntry, setViewingEntry] = useState<JournalEntryData | null>(null);
  
  const { data: trip } = useTrip();
  const { data: entries, isLoading } = useJournalEntries(
    format(selectedDate, "yyyy-MM-dd")
  );
  const createEntry = useCreateJournalEntry();
  const deleteEntry = useDeleteJournalEntry();
  const updateEntry = useUpdateJournalEntry();

  // Generate days based on trip dates or current week
  const days = useMemo(() => {
    const tripStart = trip?.startDate ? parseISO(trip.startDate) : addDays(new Date(), -2);
    const today = startOfDay(new Date());
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(tripStart, i);
      return {
        date: format(date, "M/d"),
        day: format(date, "EEEEE", { locale: zhTW }),
        fullDate: date,
        isToday: startOfDay(date).getTime() === today.getTime(),
      };
    });
  }, [trip?.startDate]);

  const selectedDayIndex = days.findIndex(
    (d) => format(d.fullDate, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
  );

  // Transform database entries to component format with proper photo URLs
  const transformedEntries: JournalEntryData[] = (entries || []).map((entry) => ({
    id: entry.id,
    location: entry.location || "",
    time: entry.createdAt ? format(parseISO(entry.createdAt), "HH:mm") : "",
    content: entry.content || "",
    photos: entry.photos?.map((p) => transformPhotoUrl(p.photoUrl)) || [],
    mood: undefined,
  }));

  const handleSaveEntry = async (newEntry: {
    location: string;
    content: string;
    photos: string[];
    mood: string;
  }) => {
    await createEntry.mutateAsync({
      title: newEntry.location || "日誌",
      content: newEntry.content,
      location: newEntry.location,
      photos: newEntry.photos,
    });
  };

  const handleDeleteEntry = async (id: string) => {
    await deleteEntry.mutateAsync(id);
    setViewingEntry(null);
  };

  const handleUpdateEntry = async (id: string, data: { content: string; location: string }) => {
    await updateEntry.mutateAsync({
      id,
      content: data.content,
      location: data.location,
      title: data.location || "日誌",
    });
    // Update the viewing entry with new data
    setViewingEntry(prev => prev ? { ...prev, content: data.content, location: data.location } : null);
  };

  const handleEntryClick = (entry: JournalEntryData) => {
    setViewingEntry(entry);
  };

  const totalPhotos = transformedEntries.reduce(
    (acc, e) => acc + e.photos.length,
    0
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="每日日誌" />

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6 animate-fade-in">
        {/* Date Selector */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-title">
              {format(selectedDate, "yyyy年M月", { locale: zhTW })}
            </h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setSelectedDate(prev => addDays(prev, -7))}
                className="p-2 rounded-lg hover:bg-muted transition-colors touch-target"
                data-testid="button-prev-week"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setSelectedDate(prev => addDays(prev, 7))}
                className="p-2 rounded-lg hover:bg-muted transition-colors touch-target"
                data-testid="button-next-week"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {days.map((day, index) => (
              <button
                key={index}
                onClick={() => setSelectedDate(day.fullDate)}
                data-testid={`button-day-${index}`}
                className={cn(
                  "flex-shrink-0 w-16 py-3 rounded-xl flex flex-col items-center gap-1 transition-all touch-target",
                  selectedDayIndex === index
                    ? "gradient-warm text-primary-foreground shadow-card"
                    : "bg-card text-foreground hover:bg-muted"
                )}
              >
                <span className="text-caption">{day.day}</span>
                <span className="text-title">{day.date.split("/")[1]}</span>
                {day.isToday && selectedDayIndex !== index && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="bg-card rounded-lg shadow-card p-4">
          <div className="flex items-center justify-around text-center">
            <div>
              <p className="text-display text-primary">
                {transformedEntries.length}
              </p>
              <p className="text-caption text-muted-foreground">今日記錄</p>
            </div>
            <div className="w-px h-12 bg-border" />
            <div>
              <p className="text-display text-secondary">{totalPhotos}</p>
              <p className="text-caption text-muted-foreground">照片數量</p>
            </div>
            <div className="w-px h-12 bg-border" />
            <div>
              <p className="text-display text-terracotta">
                {new Set(transformedEntries.filter(e => e.location).map((e) => e.location)).size}
              </p>
              <p className="text-caption text-muted-foreground">景點打卡</p>
            </div>
          </div>
        </section>

        {/* Journal Entries */}
        <section className="space-y-4">
          <h2 className="text-title">今日感言</h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : transformedEntries.length > 0 ? (
            <div className="space-y-4">
              {transformedEntries.map((entry) => (
                <JournalEntry 
                  key={entry.id} 
                  entry={entry} 
                  onClick={() => handleEntryClick(entry)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-lg shadow-card p-8 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-body text-muted-foreground">
                還沒有記錄，點擊下方按鈕開始記錄今天的感動吧！
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Floating Add Button */}
      <button
        onClick={() => setIsAddOpen(true)}
        disabled={createEntry.isPending}
        data-testid="button-add-journal"
        className={cn(
          "fixed right-4 bottom-24 w-16 h-16 rounded-full",
          "gradient-warm text-primary-foreground shadow-elevated",
          "flex items-center justify-center",
          "hover:scale-105 active:scale-95 transition-transform",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          "disabled:opacity-50"
        )}
      >
        {createEntry.isPending ? (
          <Loader2 className="w-8 h-8 animate-spin" />
        ) : (
          <Plus className="w-8 h-8" strokeWidth={2} />
        )}
      </button>

      <AddJournalSheet
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSave={handleSaveEntry}
      />

      <ViewJournalSheet
        entry={viewingEntry}
        open={!!viewingEntry}
        onOpenChange={(open) => !open && setViewingEntry(null)}
        onDelete={handleDeleteEntry}
        onUpdate={handleUpdateEntry}
      />

      <BottomNav />
    </div>
  );
}
