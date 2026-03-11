import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Calendar, Book, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AttractionsMap } from "@/components/attractions/AttractionsMap";
import { AttractionDetailSheet, type AttractionDB } from "@/components/attractions/AttractionDetailSheet";
import { useQuery } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

function formatDate(dateStr: string): string {
  const parts = dateStr.split("/");
  if (parts.length === 2) return `${parts[0]}月${parts[1]}日`;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return `${date.getMonth() + 1}月${date.getDate()}日`;
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

      <AttractionDetailSheet
        attraction={selectedAttraction}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </PageLayout>
  );
};

export default Attractions;
