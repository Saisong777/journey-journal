import { PageLayout } from "@/components/layout/PageLayout";
import { TripOverview } from "@/components/summary/TripOverview";
import { DailyItinerary } from "@/components/summary/DailyItinerary";
import { PhotoGallery } from "@/components/summary/PhotoGallery";
import { HighlightMoments } from "@/components/summary/HighlightMoments";
import { ExportOptions } from "@/components/summary/ExportOptions";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrip } from "@/hooks/useTrip";
import { useTripStats, useTripPhotos, useTripHighlights, formatTripDateRange, calculateTripDuration } from "@/hooks/useTripSummary";
import { useJournalEntries } from "@/hooks/useJournalEntries";
import { transformPhotoUrl } from "@/lib/photoUtils";
import { queryClient } from "@/lib/queryClient";
import { format, parseISO } from "date-fns";
import { zhTW } from "date-fns/locale";

// Default cover image
const defaultCoverImage = "https://images.unsplash.com/photo-1547036346-0e63c72f8a4d?w=800&auto=format&fit=crop";

const TripSummary = () => {
  const { data: trip, isLoading: tripLoading } = useTrip();
  const { data: stats, isLoading: statsLoading } = useTripStats();
  const { data: photos, isLoading: photosLoading } = useTripPhotos();
  const { data: highlights, isLoading: highlightsLoading } = useTripHighlights();
  const { data: journals, isLoading: journalsLoading } = useJournalEntries();
  // Build schedule data from journals
  const scheduleData = (journals || []).filter(j => j.entryDate).map((journal, index) => ({
    day: index + 1,
    date: format(parseISO(journal.entryDate), "M月d日（EEEE）", { locale: zhTW }),
    title: journal.title,
    locations: journal.location ? [journal.location] : [],
    highlights: journal.content || "",
    completed: true,
  }));

  // Fallback schedule if no journals
  const defaultSchedule = [
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
  const photoData = (photos || []).map(photo => ({
    id: photo.id,
    url: photo.url,
    caption: photo.caption,
    date: photo.date,
    location: photo.location,
  }));

  // Build highlight data
  const highlightData = (highlights || []).map(h => ({
    id: h.id,
    type: h.type,
    title: h.title,
    description: (h.description || "").length > 100 ? (h.description || "").slice(0, 100) + "..." : (h.description || ""),
    date: h.date,
  }));

  const handleCoverChange = (url: string) => {
    queryClient.invalidateQueries({ queryKey: ["trip"] });
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
              <HighlightMoments highlights={highlightData} />
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
              <DailyItinerary schedule={scheduleData.length > 0 ? scheduleData : defaultSchedule} />
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
              <PhotoGallery photos={photoData} />
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
