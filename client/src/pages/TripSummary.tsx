import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { TripOverview } from "@/components/summary/TripOverview";
import { DailyItinerary, DaySchedule } from "@/components/summary/DailyItinerary";
import { PhotoGallery, Photo } from "@/components/summary/PhotoGallery";
import { HighlightMoments, Highlight } from "@/components/summary/HighlightMoments";
import { ExportOptions } from "@/components/summary/ExportOptions";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrip } from "@/hooks/useTrip";
import { useTripStats, useTripPhotos, useTripHighlights, formatTripDateRange, calculateTripDuration } from "@/hooks/useTripSummary";
import { useJournalEntries, useDeleteJournalEntry, useUpdateJournalEntry } from "@/hooks/useJournalEntries";
import { useDeleteDevotionalEntry } from "@/hooks/useDevotional";
import { transformPhotoUrl } from "@/lib/photoUtils";
import { queryClient } from "@/lib/queryClient";
import { format, parseISO } from "date-fns";
import { zhTW } from "date-fns/locale";

// Default cover image
const defaultCoverImage = "https://images.unsplash.com/photo-1547036346-0e63c72f8a4d?w=800&auto=format&fit=crop";

const TripSummary = () => {
  const navigate = useNavigate();
  const { data: trip, isLoading: tripLoading } = useTrip();
  const { data: stats, isLoading: statsLoading } = useTripStats();
  const { data: photos, isLoading: photosLoading } = useTripPhotos();
  const { data: highlights, isLoading: highlightsLoading } = useTripHighlights();
  const { data: journals, isLoading: journalsLoading } = useJournalEntries();

  const deleteJournal = useDeleteJournalEntry();
  const updateJournal = useUpdateJournalEntry();
  const deleteDevotional = useDeleteDevotionalEntry();

  // Build schedule data from journals
  const scheduleData: DaySchedule[] = (journals || []).filter(j => j.entryDate).map((journal, index) => ({
    day: index + 1,
    date: format(parseISO(journal.entryDate), "M月d日（EEEE）", { locale: zhTW }),
    title: journal.title,
    locations: journal.location ? [journal.location] : [],
    highlights: journal.content || "",
    completed: true,
    journalId: journal.id,
  }));

  // Fallback schedule if no journals
  const defaultSchedule: DaySchedule[] = [
    {
      day: 1,
      date: "尚未開始",
      title: "開始您的旅程",
      locations: [],
      highlights: "開始記錄您的平安同行，每一天的經歷都將成為珍貴的回憶。",
      completed: false,
    },
  ];

  // Build trip data from database or fallback
  const tripData = {
    title: trip?.title || "平安同行",
    destination: trip?.destination || "目的地",
    dateRange: trip?.startDate && trip?.endDate
      ? formatTripDateRange(trip.startDate, trip.endDate)
      : "尚未設定日期",
    duration: trip?.startDate && trip?.endDate
      ? calculateTripDuration(trip.startDate, trip.endDate)
      : 0,
    memberCount: stats?.memberCount || 0,
    coverImage: trip?.coverImageUrl ? transformPhotoUrl(trip.coverImageUrl) : defaultCoverImage,
    tripId: trip?.id,
  };

  // Build photo data
  const photoData: Photo[] = (photos || []).map(photo => ({
    id: photo.id,
    url: photo.url,
    caption: photo.caption,
    date: photo.date,
    location: photo.location,
    journalEntryId: photo.journalEntryId,
  }));

  // Build highlight data
  const highlightData: Highlight[] = (highlights || []).map(h => ({
    id: h.id,
    type: h.type,
    title: h.title,
    description: (h.description || "").length > 100 ? (h.description || "").slice(0, 100) + "..." : (h.description || ""),
    date: h.date,
  }));

  const handleCoverChange = () => {
    queryClient.invalidateQueries({ queryKey: ["trip"] });
  };

  // --- Highlight handlers ---
  const handleHighlightEdit = (highlight: Highlight) => {
    // Navigate to the appropriate edit page based on type
    if (highlight.type === "spiritual") {
      navigate("/devotional");
    } else {
      navigate("/journal");
    }
  };

  const handleHighlightDelete = (highlight: Highlight) => {
    if (highlight.type === "spiritual") {
      deleteDevotional.mutate(highlight.id);
    } else {
      deleteJournal.mutate(highlight.id);
    }
  };

  // --- Itinerary handlers ---
  const handleItineraryEdit = (day: DaySchedule) => {
    navigate("/journal");
  };

  const handleItineraryDelete = (day: DaySchedule) => {
    if (day.journalId) {
      deleteJournal.mutate(day.journalId);
    }
  };

  // --- Photo handlers ---
  const handlePhotoDelete = (photo: Photo) => {
    if (!photo.journalEntryId) return;
    // Find the journal entry and remove just this photo
    const journal = journals?.find(j => j.id === photo.journalEntryId);
    if (!journal) return;
    const remainingPhotos = (journal.photos || [])
      .filter(p => p.id !== photo.id)
      .map(p => ({ photoUrl: p.photoUrl, latitude: p.latitude, longitude: p.longitude }));
    updateJournal.mutate({
      id: journal.id,
      photos: remainingPhotos as any,
    });
  };

  const isLoading = tripLoading || statsLoading;

  return (
    <PageLayout>
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6 animate-fade-in">
        {/* Title */}
        <section className="text-center space-y-2">
          <h1 className="text-display">旅程回憶錄</h1>
          <p className="text-body text-muted-foreground">
            珍藏這趟平安同行的美好記憶
          </p>
        </section>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-12 gap-1">
            <TabsTrigger value="overview" className="text-xs sm:text-sm px-1 min-h-[44px]" data-testid="tab-overview">總覽</TabsTrigger>
            <TabsTrigger value="itinerary" className="text-xs sm:text-sm px-1 min-h-[44px]" data-testid="tab-itinerary">行程</TabsTrigger>
            <TabsTrigger value="photos" className="text-xs sm:text-sm px-1 min-h-[44px]" data-testid="tab-photos">照片</TabsTrigger>
            <TabsTrigger value="export" className="text-xs sm:text-sm px-1 min-h-[44px]" data-testid="tab-export">匯出</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-56 w-full rounded-2xl" />
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </div>
              </div>
            ) : (
              <TripOverview
                {...tripData}
                editable={true}
                onCoverChange={handleCoverChange}
              />
            )}
            <Separator />
            {highlightsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
            ) : highlightData.length > 0 ? (
              <HighlightMoments
                highlights={highlightData}
                onEdit={handleHighlightEdit}
                onDelete={handleHighlightDelete}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>尚無精彩時刻</p>
                <p className="text-sm">開始記錄日誌和靈修心得吧！</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="itinerary" className="mt-6">
            {journalsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
            ) : (
              <DailyItinerary
                schedule={scheduleData.length > 0 ? scheduleData : defaultSchedule}
                onEdit={handleItineraryEdit}
                onDelete={handleItineraryDelete}
              />
            )}
          </TabsContent>

          <TabsContent value="photos" className="mt-6">
            {photosLoading ? (
              <div className="grid grid-cols-3 gap-2">
                {[...Array(9)].map((_, i) => (
                  <Skeleton key={i} className="aspect-square" />
                ))}
              </div>
            ) : photoData.length > 0 ? (
              <PhotoGallery
                photos={photoData}
                onDelete={handlePhotoDelete}
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>尚無照片</p>
                <p className="text-sm">在日誌中上傳照片即可在此顯示</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="export" className="mt-6">
            <ExportOptions />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default TripSummary;
