import { useState } from "react";
import { Clock, MapPin, Utensils, Home, Info, PenLine, Book, Users, Compass, Clock3, DollarSign, Shirt } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddJournalSheet } from "@/components/journal/AddJournalSheet";
import { useCreateJournalEntry } from "@/hooks/useJournalEntries";

interface TripDay {
  id: string;
  tripId: string;
  dayNo: number;
  date: string;
  cityArea: string;
  title: string;
  highlights: string;
  bibleRefs: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  lodging: string;
  dayNumber: number;
  isPreTrip?: boolean;
  isPostTrip?: boolean;
}

interface Attraction {
  id: string;
  nameZh: string;
  nameEn?: string;
  nameAlt?: string;
  dayNo: number;
  scriptureRefs?: string;
  storySummary?: string;
  keyFigures?: string;
  historicalEra?: string;
  theologicalSignificance?: string;
  lifeApplication?: string;
  openingHours?: string;
  admission?: string;
  duration?: string;
  dressCode?: string;
  photoRestrictions?: string;
  safetyNotes?: string;
  physicalComment?: string;
  gps?: string;
}

interface ScheduleItem {
  time: string;
  title: string;
  location: string;
  icon: "activity" | "meal" | "lodging";
  isNext?: boolean;
}

interface TodayScheduleProps {
  todaySchedule: TripDay | null | undefined;
  isLoading: boolean;
}

function parseHighlightsToSchedule(tripDay: TripDay): ScheduleItem[] {
  const items: ScheduleItem[] = [];

  if (tripDay.breakfast && tripDay.breakfast !== "X" && tripDay.breakfast !== "x") {
    items.push({
      time: "07:30",
      title: "早餐",
      location: tripDay.breakfast,
      icon: "meal",
    });
  }

  const highlights = tripDay.highlights?.split("/").map(h => h.trim()).filter(Boolean) || [];
  const times = ["09:00", "10:30", "14:00", "15:30", "16:30"];
  highlights.slice(0, 5).forEach((highlight, index) => {
    items.push({
      time: times[index] || "11:00",
      title: highlight,
      location: tripDay.cityArea || "",
      icon: "activity",
      isNext: index === 0,
    });
  });

  if (tripDay.lunch && tripDay.lunch !== "X" && tripDay.lunch !== "x") {
    items.push({
      time: "12:00",
      title: "午餐",
      location: tripDay.lunch,
      icon: "meal",
    });
  }

  if (tripDay.dinner && tripDay.dinner !== "X" && tripDay.dinner !== "x") {
    items.push({
      time: "18:30",
      title: "晚餐",
      location: tripDay.dinner,
      icon: "meal",
    });
  }

  if (tripDay.lodging && tripDay.lodging !== "X" && tripDay.lodging !== "x") {
    items.push({
      time: "20:00",
      title: "住宿",
      location: tripDay.lodging,
      icon: "lodging",
    });
  }

  items.sort((a, b) => a.time.localeCompare(b.time));

  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  let nextFound = false;
  items.forEach(item => {
    item.isNext = false;
    if (!nextFound && item.time >= currentTime) {
      item.isNext = true;
      nextFound = true;
    }
  });

  return items;
}

function AttractionInfoSection({ label, icon: Icon, value }: { label: string; icon: React.ComponentType<{ className?: string }>; value?: string }) {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-caption font-medium text-muted-foreground">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <p className="text-body text-foreground leading-relaxed whitespace-pre-line">{value}</p>
    </div>
  );
}

export function TodaySchedule({ todaySchedule, isLoading }: TodayScheduleProps) {
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
  const [journalOpen, setJournalOpen] = useState(false);
  const [journalLocation, setJournalLocation] = useState("");
  const createJournal = useCreateJournalEntry();

  // Fetch attractions for today's day
  const { data: allAttractions } = useQuery<Attraction[]>({
    queryKey: ["/api/attractions"],
    queryFn: async () => {
      const token = getAuthToken();
      const res = await fetch("/api/attractions", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!todaySchedule,
  });

  // Filter to today's attractions
  const todayAttractions = allAttractions?.filter(a => a.dayNo === todaySchedule?.dayNo) || [];

  // Match schedule item title to an attraction
  function findAttraction(title: string): Attraction | undefined {
    return todayAttractions.find(a =>
      title.includes(a.nameZh) || a.nameZh.includes(title)
    );
  }

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="bg-card rounded-lg shadow-card overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b border-border last:border-0">
              <Skeleton className="w-14 h-12" />
              <Skeleton className="w-3 h-3 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!todaySchedule || todaySchedule.isPreTrip) {
    return null;
  }

  const scheduleItems = parseHighlightsToSchedule(todaySchedule);

  const handleJournalSave = async (entry: { location: string; content: string; photos: any[]; mood: string }) => {
    await createJournal.mutateAsync({
      title: entry.location || "隨手記錄",
      content: entry.content,
      location: entry.location,
      photos: entry.photos,
      entryDate: todaySchedule.date,
    });
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-title">今日行程</h2>
        <div className="text-primary text-body font-medium flex items-center gap-1">
          第 {todaySchedule.dayNumber} 天
          {todaySchedule.isPostTrip && <span className="text-muted-foreground text-caption ml-1">(已結束)</span>}
        </div>
      </div>

      <div className="bg-card/80 backdrop-blur-md rounded-xl shadow-card overflow-hidden border border-white/20">
        {scheduleItems.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-body-lg">今日為自由活動日，好好享受！</p>
          </div>
        ) : (
          scheduleItems.map((item, index) => {
            const attraction = item.icon === "activity" ? findAttraction(item.title) : undefined;
            return (
              <div
                key={index}
                className={cn(
                  "border-b border-border/50 last:border-0 transition-colors",
                  item.isNext && "bg-primary/5 border-primary/20"
                )}
                data-testid={`schedule-item-${index}`}
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className={cn(
                    "text-center min-w-[50px]",
                    item.isNext ? "text-primary font-bold" : "text-muted-foreground"
                  )}>
                    {item.icon === "meal" ? (
                      <Utensils className="w-4 h-4 mx-auto mb-1 opacity-80" />
                    ) : item.icon === "lodging" ? (
                      <Home className="w-4 h-4 mx-auto mb-1 opacity-80" />
                    ) : (
                      <Clock className="w-4 h-4 mx-auto mb-1 opacity-80" />
                    )}
                    <span className="text-body">{item.time}</span>
                  </div>

                  <div className="relative flex flex-col items-center self-stretch py-1">
                    <div className={cn(
                      "w-3 h-3 rounded-full z-10 shadow-sm",
                      item.isNext ? "bg-primary ring-3 ring-primary/20" : "bg-muted border-2 border-border"
                    )} />
                    {index < scheduleItems.length - 1 && (
                      <div className="absolute top-4 w-0.5 h-[calc(100%+8px)] bg-gradient-to-b from-border to-border/50" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 py-0.5">
                    <h3 className={cn(
                      "text-body font-semibold truncate",
                      item.isNext ? "text-primary" : "text-foreground"
                    )}>
                      {item.title}
                    </h3>
                    {item.location && (
                      <div className="flex items-center gap-1 text-muted-foreground text-caption mt-0.5">
                        <MapPin className="w-3 h-3 opacity-70 flex-shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons for activity items */}
                {item.icon === "activity" && (
                  <div className="flex gap-2 px-4 pb-3 pl-[74px]">
                    {attraction && (
                      <button
                        onClick={() => setSelectedAttraction(attraction)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-caption bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        <Info className="w-3 h-3" />
                        景點資訊
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setJournalLocation(item.title);
                        setJournalOpen(true);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-caption bg-secondary/10 text-secondary-foreground hover:bg-secondary/20 transition-colors"
                    >
                      <PenLine className="w-3 h-3" />
                      隨手記錄
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Attraction info dialog */}
      <Dialog open={!!selectedAttraction} onOpenChange={(open) => { if (!open) setSelectedAttraction(null); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {selectedAttraction?.nameZh}
              {selectedAttraction?.nameEn && (
                <span className="text-caption text-muted-foreground ml-2 font-normal">{selectedAttraction.nameEn}</span>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedAttraction && (
            <div className="space-y-4 text-sm">
              <AttractionInfoSection label="聖經經文" icon={Book} value={selectedAttraction.scriptureRefs} />
              <AttractionInfoSection label="聖經故事" icon={Book} value={selectedAttraction.storySummary} />
              <AttractionInfoSection label="關鍵人物" icon={Users} value={selectedAttraction.keyFigures} />
              <AttractionInfoSection label="歷史時期" icon={Clock3} value={selectedAttraction.historicalEra} />
              <AttractionInfoSection label="神學意義" icon={Book} value={selectedAttraction.theologicalSignificance} />
              <AttractionInfoSection label="生活應用" icon={Compass} value={selectedAttraction.lifeApplication} />
              <AttractionInfoSection label="開放時間" icon={Clock3} value={selectedAttraction.openingHours} />
              <AttractionInfoSection label="門票" icon={DollarSign} value={selectedAttraction.admission} />
              <AttractionInfoSection label="建議停留" icon={Clock} value={selectedAttraction.duration} />
              <AttractionInfoSection label="服裝要求" icon={Shirt} value={selectedAttraction.dressCode} />
              <AttractionInfoSection label="安全提醒" icon={Info} value={selectedAttraction.safetyNotes} />
              <AttractionInfoSection label="體力備註" icon={Compass} value={selectedAttraction.physicalComment} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick journal sheet */}
      <AddJournalSheet
        open={journalOpen}
        onOpenChange={setJournalOpen}
        date={todaySchedule.date}
        defaultLocation={journalLocation}
        onSave={handleJournalSave}
      />
    </section>
  );
}
