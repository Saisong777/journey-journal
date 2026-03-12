import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { TripOverview } from "@/components/summary/TripOverview";
import { PhotoGallery, Photo } from "@/components/summary/PhotoGallery";
import { HighlightMoments, Highlight } from "@/components/summary/HighlightMoments";
import { DevotionalSummary } from "@/components/summary/DevotionalSummary";
import { JournalWithPhotos } from "@/components/summary/JournalWithPhotos";
import { ExportOptions } from "@/components/summary/ExportOptions";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrip } from "@/hooks/useTrip";
import { useTripStats, useTripPhotos, useTripHighlights, formatTripDateRange, calculateTripDuration } from "@/hooks/useTripSummary";
import { useJournalEntries, useDeleteJournalEntry, useUpdateJournalEntry } from "@/hooks/useJournalEntries";
import { useDevotionalEntries, useDeleteDevotionalEntry } from "@/hooks/useDevotional";
import { useAllEveningReflections } from "@/hooks/useEveningReflection";
import { transformPhotoUrl } from "@/lib/photoUtils";
import { queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
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
  const { data: devotionals, isLoading: devotionalsLoading } = useDevotionalEntries();
  const { data: allEveningReflections, isLoading: eveningLoading } = useAllEveningReflections();

  const { data: myCover } = useQuery<{ summaryCoverUrl: string | null }>({
    queryKey: ["/api/my-summary-cover"],
  });

  const deleteJournal = useDeleteJournalEntry();
  const updateJournal = useUpdateJournalEntry();
  const deleteDevotional = useDeleteDevotionalEntry();

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
    coverImage: myCover?.summaryCoverUrl
      ? transformPhotoUrl(myCover.summaryCoverUrl)
      : trip?.coverImageUrl
        ? transformPhotoUrl(trip.coverImageUrl)
        : defaultCoverImage,
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
    queryClient.invalidateQueries({ queryKey: ["/api/my-summary-cover"] });
  };

  // --- Highlight handlers ---
  const handleHighlightEdit = (highlight: Highlight) => {
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

  // --- Photo handlers ---
  const handlePhotoDelete = (photo: Photo) => {
    if (!photo.journalEntryId) return;
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
          <TabsList className="grid w-full grid-cols-5 h-12 gap-0.5">
            <TabsTrigger value="overview" className="text-xs px-0.5 min-h-[44px]" data-testid="tab-overview">總覽</TabsTrigger>
            <TabsTrigger value="devotional" className="text-xs px-0.5 min-h-[44px]" data-testid="tab-devotional">靈修</TabsTrigger>
            <TabsTrigger value="journal" className="text-xs px-0.5 min-h-[44px]" data-testid="tab-journal">日誌</TabsTrigger>
            <TabsTrigger value="photos" className="text-xs px-0.5 min-h-[44px]" data-testid="tab-photos">照片</TabsTrigger>
            <TabsTrigger value="export" className="text-xs px-0.5 min-h-[44px]" data-testid="tab-export">匯出</TabsTrigger>
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

          <TabsContent value="devotional" className="mt-6">
            {devotionalsLoading || eveningLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
            ) : (
              <DevotionalSummary
                devotionals={devotionals || []}
                eveningReflections={allEveningReflections || []}
              />
            )}
          </TabsContent>

          <TabsContent value="journal" className="mt-6">
            {journalsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
            ) : (
              <JournalWithPhotos
                journals={journals || []}
                onEdit={() => navigate("/daily-journey")}
                onDelete={(journal) => deleteJournal.mutate(journal.id)}
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
