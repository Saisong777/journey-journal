import { useState } from "react";
import { Clock, MapPin, Utensils, Home, Info, PenLine, Book, Users, Compass, Clock3, DollarSign, Shirt, Camera, Star, Shield, Accessibility, UtensilsCrossed, BedDouble, Map, Landmark, Search, MessageCircleQuestion, Bus, Coffee, Settings2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/queryClient";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AddJournalSheet } from "@/components/journal/AddJournalSheet";
import { useCreateJournalEntry } from "@/hooks/useJournalEntries";
import { useScheduleItems, type ScheduleItem as DbScheduleItem } from "@/hooks/useScheduleItems";
import { ScheduleManagerSheet } from "@/components/schedule/ScheduleManagerSheet";

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
  country?: string;
  dayNo: number;
  date?: string;
  modernLocation?: string;
  ancientToponym?: string;
  gps?: string;
  openingHours?: string;
  admission?: string;
  duration?: string;
  scriptureRefs?: string;
  bibleBooks?: string;
  storySummary?: string;
  keyFigures?: string;
  historicalEra?: string;
  theologicalSignificance?: string;
  lifeApplication?: string;
  discussionQuestions?: string;
  archaeologicalFindings?: string;
  historicalStrata?: string;
  accuracyRating?: string;
  keyArtifacts?: string;
  tourRoutePosition?: string;
  bestTime?: string;
  dressCode?: string;
  photoRestrictions?: string;
  crowdLevels?: string;
  safetyNotes?: string;
  accessibility?: string;
  nearbyDining?: string;
  accommodation?: string;
  nearbyBiblicalSites?: string;
  localProducts?: string;
  recommendationScore?: string;
  physicalComment?: string;
  mdContent?: string;
}

interface LocalScheduleItem {
  time: string;
  title: string;
  location: string;
  icon: "activity" | "meal" | "lodging" | "boarding" | "gathering" | "free_time" | "custom";
  isNext?: boolean;
}

interface TodayScheduleProps {
  todaySchedule: TripDay | null | undefined;
  isLoading: boolean;
}

function dbItemsToSchedule(dbItems: DbScheduleItem[]): LocalScheduleItem[] {
  const iconMap: Record<DbScheduleItem["type"], LocalScheduleItem["icon"]> = {
    meal: "meal",
    activity: "activity",
    boarding: "boarding",
    gathering: "gathering",
    accommodation: "lodging",
    free_time: "free_time",
    custom: "custom",
  };
  const sorted = [...dbItems].sort((a, b) => a.time.localeCompare(b.time));
  const items: LocalScheduleItem[] = sorted.map(item => ({
    time: item.time,
    title: item.title,
    location: item.location ?? "",
    icon: iconMap[item.type],
  }));
  // Mark next upcoming item
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

function parseHighlightsToSchedule(tripDay: TripDay): LocalScheduleItem[] {
  const items: LocalScheduleItem[] = [];

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
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-caption font-semibold text-muted-foreground uppercase tracking-wide">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <p className="text-body text-foreground leading-loose whitespace-pre-line">{value}</p>
    </div>
  );
}

export function TodaySchedule({ todaySchedule, isLoading }: TodayScheduleProps) {
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
  const [journalOpen, setJournalOpen] = useState(false);
  const [journalLocation, setJournalLocation] = useState("");
  const [managerOpen, setManagerOpen] = useState(false);
  const createJournal = useCreateJournalEntry();

  // Fetch DB-driven schedule items
  const { data: scheduleData } = useScheduleItems(todaySchedule?.dayNumber ?? null);
  const dbItems = scheduleData?.items ?? [];
  const canManage = scheduleData?.canManage ?? false;

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

  // Match schedule item title to an attraction
  // Normalize: strip particles, punctuation, spaces — compare pure Chinese chars
  function findAttraction(title: string): Attraction | undefined {
    if (!allAttractions) return undefined;
    const normalize = (s: string) =>
      s.replace(/[的了之在於記]/g, "").replace(/[(（）)\/／\s·・\-–—]/g, "");
    const normTitle = normalize(title);
    return allAttractions.find(a => {
      const normName = normalize(a.nameZh);
      return normTitle.includes(normName) || normName.includes(normTitle);
    });
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

  // Use DB items if available, otherwise fall back to parsed highlights
  const scheduleItems = dbItems.length > 0
    ? dbItemsToSchedule(dbItems)
    : parseHighlightsToSchedule(todaySchedule);

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
        <div className="flex items-center gap-2">
          {canManage && (
            <button
              onClick={() => setManagerOpen(true)}
              className="flex items-center gap-1 text-caption text-muted-foreground hover:text-primary transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
              管理
            </button>
          )}
          <div className="text-primary text-body font-medium flex items-center gap-1">
            第 {todaySchedule.dayNumber} 天
            {todaySchedule.isPostTrip && <span className="text-muted-foreground text-caption ml-1">(已結束)</span>}
          </div>
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
                    ) : item.icon === "boarding" ? (
                      <Bus className="w-4 h-4 mx-auto mb-1 opacity-80" />
                    ) : item.icon === "gathering" ? (
                      <Users className="w-4 h-4 mx-auto mb-1 opacity-80" />
                    ) : item.icon === "free_time" ? (
                      <Coffee className="w-4 h-4 mx-auto mb-1 opacity-80" />
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
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-caption bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors"
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

      {/* Attraction info sheet - full screen for comfortable reading */}
      <Sheet open={!!selectedAttraction} onOpenChange={(open: boolean) => { if (!open) setSelectedAttraction(null); }}>
        <SheetContent side="bottom" className="h-[92vh] rounded-t-3xl flex flex-col">
          <SheetHeader className="flex-shrink-0 pb-2 border-b border-border">
            <SheetTitle className="text-lg leading-snug text-center">
              {selectedAttraction?.nameZh}
            </SheetTitle>
            {(selectedAttraction?.nameEn || selectedAttraction?.nameAlt) && (
              <p className="text-caption text-muted-foreground text-center">
                {[selectedAttraction.nameEn, selectedAttraction.nameAlt].filter(Boolean).join(" / ")}
              </p>
            )}
          </SheetHeader>
          <div className="flex-1 overflow-y-auto py-5 px-1">
          {selectedAttraction && (
            selectedAttraction.mdContent ? (
              <div className="prose prose-sm max-w-none
                prose-headings:text-primary
                prose-h1:text-lg prose-h1:mt-0 prose-h1:mb-3
                prose-h2:text-base prose-h2:mt-6 prose-h2:mb-3
                prose-h3:text-sm prose-h3:mt-4 prose-h3:mb-2
                prose-p:text-foreground prose-p:leading-loose prose-p:mb-4
                prose-blockquote:border-primary/30 prose-blockquote:text-muted-foreground prose-blockquote:bg-muted/30 prose-blockquote:rounded-r-lg prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:my-4 prose-blockquote:not-italic
                prose-li:text-foreground prose-li:leading-loose prose-li:mb-1
                prose-ul:my-3 prose-ol:my-3
                prose-strong:text-foreground
                prose-hr:my-6 prose-hr:border-border">
                <ReactMarkdown>{selectedAttraction.mdContent}</ReactMarkdown>
              </div>
            ) : (
              <div className="space-y-8 text-sm">
                {/* Basic info badges */}
                <div className="flex flex-wrap gap-2">
                  {selectedAttraction.country && (
                    <span className="px-3 py-1 rounded-full bg-muted text-caption">{selectedAttraction.country}</span>
                  )}
                  {selectedAttraction.historicalEra && (
                    <span className="px-3 py-1 rounded-full bg-muted text-caption">{selectedAttraction.historicalEra}</span>
                  )}
                  {selectedAttraction.recommendationScore && (
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-caption flex items-center gap-1">
                      <Star className="w-3 h-3" /> {selectedAttraction.recommendationScore}
                    </span>
                  )}
                  {selectedAttraction.accuracyRating && (
                    <span className="px-3 py-1 rounded-full bg-muted text-caption">考古準確度：{selectedAttraction.accuracyRating}</span>
                  )}
                </div>

                {/* Section: 聖經與信仰 */}
                {(selectedAttraction.scriptureRefs || selectedAttraction.storySummary || selectedAttraction.keyFigures || selectedAttraction.theologicalSignificance || selectedAttraction.lifeApplication || selectedAttraction.discussionQuestions) && (
                  <div className="space-y-4">
                    <h3 className="text-body font-bold text-primary border-b border-primary/20 pb-1.5">聖經與信仰</h3>
                    <AttractionInfoSection label="經文參考" icon={Book} value={selectedAttraction.scriptureRefs} />
                    <AttractionInfoSection label="相關書卷" icon={Book} value={selectedAttraction.bibleBooks} />
                    <AttractionInfoSection label="聖經故事摘要" icon={Book} value={selectedAttraction.storySummary} />
                    <AttractionInfoSection label="關鍵人物" icon={Users} value={selectedAttraction.keyFigures} />
                    <AttractionInfoSection label="神學意義" icon={Book} value={selectedAttraction.theologicalSignificance} />
                    <AttractionInfoSection label="生活應用" icon={Compass} value={selectedAttraction.lifeApplication} />
                    <AttractionInfoSection label="討論問題" icon={MessageCircleQuestion} value={selectedAttraction.discussionQuestions} />
                  </div>
                )}

                {/* Section: 歷史與考古 */}
                {(selectedAttraction.historicalStrata || selectedAttraction.archaeologicalFindings || selectedAttraction.keyArtifacts || selectedAttraction.ancientToponym || selectedAttraction.modernLocation) && (
                  <div className="space-y-4">
                    <h3 className="text-body font-bold text-primary border-b border-primary/20 pb-1.5">歷史與考古</h3>
                    <AttractionInfoSection label="古代地名" icon={Landmark} value={selectedAttraction.ancientToponym} />
                    <AttractionInfoSection label="現代位置" icon={MapPin} value={selectedAttraction.modernLocation} />
                    <AttractionInfoSection label="歷史分層" icon={Search} value={selectedAttraction.historicalStrata} />
                    <AttractionInfoSection label="考古發現" icon={Search} value={selectedAttraction.archaeologicalFindings} />
                    <AttractionInfoSection label="重要文物" icon={Landmark} value={selectedAttraction.keyArtifacts} />
                  </div>
                )}

                {/* Section: 參觀資訊 */}
                {(selectedAttraction.openingHours || selectedAttraction.admission || selectedAttraction.duration || selectedAttraction.bestTime || selectedAttraction.dressCode || selectedAttraction.photoRestrictions || selectedAttraction.crowdLevels || selectedAttraction.tourRoutePosition) && (
                  <div className="space-y-4">
                    <h3 className="text-body font-bold text-primary border-b border-primary/20 pb-1.5">參觀資訊</h3>
                    <AttractionInfoSection label="開放時間" icon={Clock3} value={selectedAttraction.openingHours} />
                    <AttractionInfoSection label="門票費用" icon={DollarSign} value={selectedAttraction.admission} />
                    <AttractionInfoSection label="建議停留時間" icon={Clock} value={selectedAttraction.duration} />
                    <AttractionInfoSection label="最佳造訪時間" icon={Clock3} value={selectedAttraction.bestTime} />
                    <AttractionInfoSection label="行程位置" icon={Map} value={selectedAttraction.tourRoutePosition} />
                    <AttractionInfoSection label="服裝要求" icon={Shirt} value={selectedAttraction.dressCode} />
                    <AttractionInfoSection label="拍照限制" icon={Camera} value={selectedAttraction.photoRestrictions} />
                    <AttractionInfoSection label="人潮程度" icon={Users} value={selectedAttraction.crowdLevels} />
                  </div>
                )}

                {/* Section: 安全與無障礙 */}
                {(selectedAttraction.safetyNotes || selectedAttraction.physicalComment || selectedAttraction.accessibility) && (
                  <div className="space-y-4">
                    <h3 className="text-body font-bold text-primary border-b border-primary/20 pb-1.5">安全與體力</h3>
                    <AttractionInfoSection label="安全提醒" icon={Shield} value={selectedAttraction.safetyNotes} />
                    <AttractionInfoSection label="體力備註" icon={Compass} value={selectedAttraction.physicalComment} />
                    <AttractionInfoSection label="無障礙資訊" icon={Accessibility} value={selectedAttraction.accessibility} />
                  </div>
                )}

                {/* Section: 周邊資訊 */}
                {(selectedAttraction.nearbyDining || selectedAttraction.accommodation || selectedAttraction.nearbyBiblicalSites || selectedAttraction.localProducts) && (
                  <div className="space-y-4">
                    <h3 className="text-body font-bold text-primary border-b border-primary/20 pb-1.5">周邊資訊</h3>
                    <AttractionInfoSection label="附近餐飲" icon={UtensilsCrossed} value={selectedAttraction.nearbyDining} />
                    <AttractionInfoSection label="住宿" icon={BedDouble} value={selectedAttraction.accommodation} />
                    <AttractionInfoSection label="附近聖經景點" icon={MapPin} value={selectedAttraction.nearbyBiblicalSites} />
                    <AttractionInfoSection label="當地特產" icon={Info} value={selectedAttraction.localProducts} />
                  </div>
                )}
              </div>
            )
          )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Quick journal sheet */}
      <AddJournalSheet
        open={journalOpen}
        onOpenChange={setJournalOpen}
        date={todaySchedule.date}
        defaultLocation={journalLocation}
        onSave={handleJournalSave}
      />

      {/* Schedule manager sheet (leader/guide/admin only) */}
      {canManage && (
        <ScheduleManagerSheet
          open={managerOpen}
          onOpenChange={setManagerOpen}
          dayNo={todaySchedule.dayNumber}
          items={dbItems}
          hasItems={dbItems.length > 0}
        />
      )}
    </section>
  );
}
