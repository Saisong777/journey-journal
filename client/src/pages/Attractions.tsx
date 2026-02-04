import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/ui/BottomNav";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Calendar, Book, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

interface TripDay {
  id: string;
  tripId: string;
  dayNo: number;
  date: string;
  cityArea: string;
  title: string;
  highlights: string;
  attractions: string | null;
  bibleRefs: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  lodging: string;
  notes: string;
}

interface Attraction {
  id: string;
  name: string;
  dayNo: number;
  date: string;
  cityArea: string;
  bibleRefs: string;
  notes: string;
}

function parseAttractionsFromTripDays(days: TripDay[]): Attraction[] {
  const attractions: Attraction[] = [];
  
  days.forEach(day => {
    const attractionsStr = day.attractions || "";
    if (!attractionsStr) return;
    
    const attractionsList = attractionsStr.split("/").map(a => a.trim()).filter(Boolean);
    
    attractionsList.forEach((attraction, index) => {
      if (attraction.length > 1) {
        attractions.push({
          id: `${day.id}-${index}`,
          name: attraction,
          dayNo: day.dayNo,
          date: day.date,
          cityArea: day.cityArea || "",
          bibleRefs: day.bibleRefs || "",
          notes: day.notes || "",
        });
      }
    });
  });
  
  return attractions;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

const Attractions = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: tripDays, isLoading } = useQuery<TripDay[]>({
    queryKey: ["/api/trip-days"],
    queryFn: async () => {
      const token = getAuthToken();
      const response = await fetch("/api/trip-days", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user,
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

  const attractions = tripDays ? parseAttractionsFromTripDays(tripDays) : [];
  
  const uniqueDays = tripDays 
    ? [...new Set(tripDays.map(d => d.dayNo))].sort((a, b) => a - b)
    : [];

  const filteredAttractions = attractions.filter((attraction) => {
    const matchesSearch =
      attraction.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attraction.cityArea.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDay = selectedDay === null || attraction.dayNo === selectedDay;
    return matchesSearch && matchesDay;
  });

  const handleAttractionClick = (attraction: Attraction) => {
    setSelectedAttraction(attraction);
    setSheetOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header />
        <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-12 w-full" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-8 w-16" />)}
          </div>
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </main>
        <BottomNav />
      </div>
    );
  }

  if (!tripDays || tripDays.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header />
        <main className="px-4 py-6 max-w-lg mx-auto space-y-6 animate-fade-in">
          <section className="space-y-2">
            <h1 className="text-display">景點資訊</h1>
            <p className="text-body text-muted-foreground">
              探索朝聖之旅的歷史與故事
            </p>
          </section>
          <div className="text-center py-12 bg-card rounded-lg">
            <p className="text-body text-muted-foreground">目前沒有行程資料</p>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6 animate-fade-in">
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

        <div className="flex items-center justify-between text-body text-muted-foreground">
          <span>共 {filteredAttractions.length} 個景點</span>
        </div>

        <div className="space-y-3">
          {filteredAttractions.map((attraction) => (
            <button
              key={attraction.id}
              onClick={() => handleAttractionClick(attraction)}
              className="w-full bg-card rounded-lg shadow-card p-4 text-left hover:shadow-elevated transition-all active:scale-[0.99]"
              data-testid={`card-attraction-${attraction.id}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-body font-semibold text-foreground line-clamp-2">
                    {attraction.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 text-caption text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      第{attraction.dayNo}天 · {formatDate(attraction.date)}
                    </span>
                    {attraction.cityArea && (
                      <span className="inline-flex items-center gap-1 text-caption text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {attraction.cityArea}
                      </span>
                    )}
                  </div>
                  {attraction.bibleRefs && (
                    <div className="flex items-center gap-1 mt-2 text-caption text-primary">
                      <Book className="w-3 h-3" />
                      <span className="line-clamp-1">{attraction.bibleRefs.split(";")[0]}</span>
                    </div>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
              </div>
            </button>
          ))}
        </div>

        {filteredAttractions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-body text-muted-foreground">找不到符合條件的景點</p>
          </div>
        )}
      </main>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
          {selectedAttraction && (
            <>
              <SheetHeader className="text-left pb-4 border-b">
                <SheetTitle className="text-xl">{selectedAttraction.name}</SheetTitle>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    第{selectedAttraction.dayNo}天 · {formatDate(selectedAttraction.date)}
                  </span>
                  {selectedAttraction.cityArea && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {selectedAttraction.cityArea}
                    </span>
                  )}
                </div>
              </SheetHeader>
              
              <div className="py-6 space-y-6 overflow-y-auto">
                {selectedAttraction.bibleRefs && (
                  <div className="bg-primary/10 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                      <Book className="w-4 h-4" />
                      相關經文
                    </h4>
                    <p className="text-body text-foreground">
                      {selectedAttraction.bibleRefs.split(";").map((ref, i) => (
                        <span key={i} className="block">{ref.trim()}</span>
                      ))}
                    </p>
                  </div>
                )}

                {selectedAttraction.notes && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">景點介紹</h4>
                    <p className="text-body text-muted-foreground leading-relaxed">
                      {selectedAttraction.notes}
                    </p>
                  </div>
                )}

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-foreground mb-2">行程安排</h4>
                  <p className="text-body text-muted-foreground">
                    此景點安排在第 {selectedAttraction.dayNo} 天（{formatDate(selectedAttraction.date)}）的行程中
                    {selectedAttraction.cityArea && `，位於${selectedAttraction.cityArea}地區`}。
                  </p>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <BottomNav />
    </div>
  );
};

export default Attractions;
