import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Calendar, Book, ChevronRight, Clock, Ticket, Users, Footprints, Mountain, Compass } from "lucide-react";
import { ScriptureText } from "@/components/ScriptureLink";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AttractionsMap } from "@/components/attractions/AttractionsMap";
import { useQuery } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface AttractionDB {
  id: string;
  tripId: string;
  dayNo: number;
  seq: number;
  nameZh: string;
  nameEn: string | null;
  nameAlt: string | null;
  country: string | null;
  date: string | null;
  modernLocation: string | null;
  ancientToponym: string | null;
  gps: string | null;
  openingHours: string | null;
  admission: string | null;
  duration: string | null;
  scriptureRefs: string | null;
  bibleBooks: string | null;
  storySummary: string | null;
  keyFigures: string | null;
  historicalEra: string | null;
  theologicalSignificance: string | null;
  lifeApplication: string | null;
  discussionQuestions: string | null;
  archaeologicalFindings: string | null;
  historicalStrata: string | null;
  accuracyRating: string | null;
  keyArtifacts: string | null;
  tourRoutePosition: string | null;
  bestTime: string | null;
  dressCode: string | null;
  photoRestrictions: string | null;
  crowdLevels: string | null;
  safetyNotes: string | null;
  accessibility: string | null;
  nearbyDining: string | null;
  accommodation: string | null;
  nearbyBiblicalSites: string | null;
  localProducts: string | null;
  recommendationScore: string | null;
  physicalComment: string | null;
}

function formatDate(dateStr: string): string {
  const parts = dateStr.split("/");
  if (parts.length === 2) return `${parts[0]}月${parts[1]}日`;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function InfoBlock({ title, icon: Icon, children, className }: { title: string; icon: any; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg p-4", className)}>
      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {title}
      </h4>
      <div className="text-body leading-relaxed">{children}</div>
    </div>
  );
}

const Attractions = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedAttraction, setSelectedAttraction] = useState<AttractionDB | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: attractionsData, isLoading } = useQuery<AttractionDB[]>({
    queryKey: ["/api/attractions"],
    queryFn: async () => {
      const token = getAuthToken();
      const response = await fetch("/api/attractions", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user,
    staleTime: Infinity,
  });

  const { data: trip } = useQuery({
    queryKey: ["/api/trip"],
    queryFn: async () => {
      const token = getAuthToken();
      const response = await fetch("/api/trip", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!user,
  });

  const attractions = attractionsData || [];

  const uniqueDays = [...new Set(attractions.map(a => a.dayNo))].sort((a, b) => a - b);

  const filteredAttractions = attractions.filter((a) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      a.nameZh.toLowerCase().includes(q) ||
      (a.nameEn || "").toLowerCase().includes(q) ||
      (a.modernLocation || "").toLowerCase().includes(q) ||
      (a.ancientToponym || "").toLowerCase().includes(q);
    const matchesDay = selectedDay === null || a.dayNo === selectedDay;
    return matchesSearch && matchesDay;
  });

  const handleAttractionClick = (attraction: AttractionDB) => {
    setSelectedAttraction(attraction);
    setSheetOpen(true);
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-12 w-full" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-8 w-16" />)}
          </div>
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </PageLayout>
    );
  }

  if (attractions.length === 0) {
    return (
      <PageLayout>
        <div className="px-4 py-6 max-w-lg mx-auto space-y-6 animate-fade-in">
          <section className="space-y-2">
            <h1 className="text-display">景點資訊</h1>
            <p className="text-body text-muted-foreground">
              探索朝聖之旅的歷史與故事
            </p>
          </section>
          <div className="text-center py-12 bg-card rounded-lg">
            <p className="text-body text-muted-foreground">目前沒有景點資料</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="px-4 py-6 pb-20 max-w-lg mx-auto space-y-6 animate-fade-in">
        <section className="space-y-2">
          <h1 className="text-display" data-testid="text-attractions-title">景點資訊</h1>
          <p className="text-body text-muted-foreground">
            {trip?.title || "探索朝聖之旅的歷史與故事"}
          </p>
        </section>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="搜尋景點名稱或地點..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-body"
            data-testid="input-search-attractions"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          <Button
            variant={selectedDay === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedDay(null)}
            className="rounded-full whitespace-nowrap"
            data-testid="button-filter-all"
          >
            全部
          </Button>
          {uniqueDays.map((dayNo) => (
            <Button
              key={dayNo}
              variant={selectedDay === dayNo ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDay(dayNo)}
              className={cn(
                "rounded-full whitespace-nowrap",
                selectedDay === dayNo && "shadow-md"
              )}
              data-testid={`button-filter-day-${dayNo}`}
            >
              第{dayNo}天
            </Button>
          ))}
        </div>

        <AttractionsMap
          attractions={filteredAttractions}
          onMarkerClick={(id) => {
            const a = filteredAttractions.find((x) => x.id === id);
            if (a) handleAttractionClick(a);
          }}
        />

        <div className="flex items-center justify-between text-body text-muted-foreground">
          <span>共 {filteredAttractions.length} 個景點</span>
        </div>

        <div className="space-y-3">
          {filteredAttractions.map((a) => (
            <button
              key={a.id}
              onClick={() => handleAttractionClick(a)}
              className="w-full bg-card rounded-lg shadow-card p-4 text-left hover:shadow-elevated transition-all active:brightness-95"
              data-testid={`card-attraction-${a.id}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-body font-semibold text-foreground line-clamp-2">
                    {a.nameZh}
                    {a.nameEn && <span className="text-muted-foreground font-normal text-caption ml-1.5">{a.nameEn}</span>}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 text-caption text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      第{a.dayNo}天{a.date && ` · ${formatDate(a.date)}`}
                    </span>
                    {a.modernLocation && (
                      <span className="inline-flex items-center gap-1 text-caption text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span className="line-clamp-1">{a.modernLocation.length > 20 ? a.modernLocation.slice(0, 20) + "…" : a.modernLocation}</span>
                      </span>
                    )}
                  </div>
                  {a.scriptureRefs && (
                    <div className="flex items-center gap-1 mt-2 text-caption text-primary">
                      <Book className="w-3 h-3" />
                      <span className="line-clamp-1">{a.scriptureRefs.split(";")[0].split("／")[0]}</span>
                    </div>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
              </div>
            </button>
          ))}
        </div>

        {filteredAttractions.length === 0 && (
          <div className="text-center py-12 bg-card rounded-lg">
            <p className="text-body text-muted-foreground">找不到符合條件的景點</p>
          </div>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
          {selectedAttraction && (
            <>
              <SheetHeader className="text-left pb-4 border-b">
                <SheetTitle className="text-xl">{selectedAttraction.nameZh}</SheetTitle>
                {selectedAttraction.nameEn && (
                  <p className="text-sm text-muted-foreground">{selectedAttraction.nameEn}</p>
                )}
                {selectedAttraction.nameAlt && (
                  <p className="text-xs text-muted-foreground/70">{selectedAttraction.nameAlt}</p>
                )}
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    第{selectedAttraction.dayNo}天{selectedAttraction.date && ` · ${formatDate(selectedAttraction.date)}`}
                  </span>
                  {selectedAttraction.country && (
                    <span className="inline-flex items-center gap-1">
                      <Compass className="w-4 h-4" />
                      {selectedAttraction.country}
                    </span>
                  )}
                </div>
              </SheetHeader>

              <div className="py-4 space-y-4 overflow-y-auto max-h-[calc(85vh-10rem)]">
                {/* Quick info badges */}
                <div className="flex flex-wrap gap-2">
                  {selectedAttraction.duration && (
                    <span className="inline-flex items-center gap-1 text-xs bg-muted px-2.5 py-1 rounded-full">
                      <Clock className="w-3 h-3" /> {selectedAttraction.duration}
                    </span>
                  )}
                  {selectedAttraction.admission && (
                    <span className="inline-flex items-center gap-1 text-xs bg-muted px-2.5 py-1 rounded-full">
                      <Ticket className="w-3 h-3" /> {selectedAttraction.admission}
                    </span>
                  )}
                  {selectedAttraction.openingHours && (
                    <span className="inline-flex items-center gap-1 text-xs bg-muted px-2.5 py-1 rounded-full">
                      <Clock className="w-3 h-3" /> {selectedAttraction.openingHours.length > 30 ? selectedAttraction.openingHours.slice(0, 30) + "…" : selectedAttraction.openingHours}
                    </span>
                  )}
                  {selectedAttraction.recommendationScore && (
                    <span className="inline-flex items-center gap-1 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-2.5 py-1 rounded-full">
                      {selectedAttraction.recommendationScore}
                    </span>
                  )}
                </div>

                {/* Scripture */}
                {selectedAttraction.scriptureRefs && (
                  <InfoBlock title="相關經文" icon={Book} className="bg-primary/10 text-primary">
                    <div className="text-foreground flex flex-wrap gap-x-2 gap-y-1">
                      <ScriptureText text={selectedAttraction.scriptureRefs} />
                    </div>
                  </InfoBlock>
                )}

                {/* Story Summary */}
                {selectedAttraction.storySummary && (
                  <InfoBlock title="聖經故事" icon={Book} className="bg-card border border-border">
                    <p className="text-muted-foreground whitespace-pre-line">{selectedAttraction.storySummary}</p>
                  </InfoBlock>
                )}

                {/* Key Figures */}
                {selectedAttraction.keyFigures && (
                  <InfoBlock title="關鍵人物" icon={Users} className="bg-card border border-border">
                    <p className="text-muted-foreground">{selectedAttraction.keyFigures}</p>
                  </InfoBlock>
                )}

                {/* Theological Significance */}
                {selectedAttraction.theologicalSignificance && (
                  <InfoBlock title="神學意義" icon={Book} className="bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-700/40">
                    <p className="text-amber-900 dark:text-amber-100 whitespace-pre-line">{selectedAttraction.theologicalSignificance}</p>
                  </InfoBlock>
                )}

                {/* Life Application */}
                {selectedAttraction.lifeApplication && (
                  <InfoBlock title="生活應用" icon={Footprints} className="bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-700/40">
                    <p className="text-emerald-900 dark:text-emerald-100 whitespace-pre-line">{selectedAttraction.lifeApplication}</p>
                  </InfoBlock>
                )}

                {/* Discussion Questions */}
                {selectedAttraction.discussionQuestions && (
                  <InfoBlock title="討論問題" icon={Users} className="bg-card border border-border">
                    <p className="text-muted-foreground whitespace-pre-line">{selectedAttraction.discussionQuestions.replace(/\s*[｜|]\s*/g, "\n")}</p>
                  </InfoBlock>
                )}

                {/* Archaeological */}
                {selectedAttraction.archaeologicalFindings && (
                  <InfoBlock title="考古發現" icon={Mountain} className="bg-card border border-border">
                    <p className="text-muted-foreground whitespace-pre-line">{selectedAttraction.archaeologicalFindings}</p>
                  </InfoBlock>
                )}

                {/* Practical info */}
                {(selectedAttraction.dressCode || selectedAttraction.safetyNotes || selectedAttraction.physicalComment) && (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <h4 className="text-sm font-semibold text-foreground">實用資訊</h4>
                    {selectedAttraction.dressCode && (
                      <p className="text-body text-muted-foreground"><span className="font-medium">服裝要求：</span>{selectedAttraction.dressCode}</p>
                    )}
                    {selectedAttraction.safetyNotes && (
                      <p className="text-body text-muted-foreground"><span className="font-medium">安全提醒：</span>{selectedAttraction.safetyNotes}</p>
                    )}
                    {selectedAttraction.physicalComment && (
                      <p className="text-body text-muted-foreground"><span className="font-medium">體力備註：</span>{selectedAttraction.physicalComment}</p>
                    )}
                    {selectedAttraction.modernLocation && (
                      <p className="text-body text-muted-foreground"><span className="font-medium">位置：</span>{selectedAttraction.modernLocation}</p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </PageLayout>
  );
};

export default Attractions;
