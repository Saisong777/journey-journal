import { Clock, MapPin, Utensils, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

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

export function TodaySchedule({ todaySchedule, isLoading }: TodayScheduleProps) {
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

  if (!todaySchedule) {
    return null;
  }

  if (todaySchedule.isPreTrip) {
    return null;
  }

  const scheduleItems = parseHighlightsToSchedule(todaySchedule);

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
          scheduleItems.map((item, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center gap-4 p-5 border-b border-border/50 last:border-0 transition-colors hover:bg-muted/30",
                item.isNext && "bg-primary/5 border-primary/20"
              )}
              data-testid={`schedule-item-${index}`}
            >
              <div className={cn(
                "text-center min-w-[64px]",
                item.isNext ? "text-primary font-bold" : "text-muted-foreground"
              )}>
                {item.icon === "meal" ? (
                  <Utensils className="w-5 h-5 mx-auto mb-1.5 opacity-80" />
                ) : item.icon === "lodging" ? (
                  <Home className="w-5 h-5 mx-auto mb-1.5 opacity-80" />
                ) : (
                  <Clock className="w-5 h-5 mx-auto mb-1.5 opacity-80" />
                )}
                <span className="text-body-lg">{item.time}</span>
              </div>

              <div className="relative flex flex-col items-center self-stretch py-2">
                <div className={cn(
                  "w-3.5 h-3.5 rounded-full z-10 shadow-sm",
                  item.isNext ? "bg-primary ring-4 ring-primary/20" : "bg-muted border-2 border-border"
                )} />
                {index < scheduleItems.length - 1 && (
                  <div className="absolute top-5 w-0.5 h-[calc(100%+12px)] bg-gradient-to-b from-border to-border/50" />
                )}
              </div>

              <div className="flex-1 py-1">
                <h3 className={cn(
                  "text-body-lg font-semibold",
                  item.isNext ? "text-primary" : "text-foreground"
                )}>
                  {item.title}
                </h3>
                {item.location && (
                  <div className="flex items-center gap-1.5 text-muted-foreground text-body mt-1">
                    <MapPin className="w-4 h-4 opacity-70" />
                    {item.location}
                  </div>
                )}
              </div>

              {item.isNext && (
                <span className="hidden sm:inline-block bg-primary text-primary-foreground px-3 py-1 rounded-full text-caption font-bold shadow-sm animate-pulse">
                  即將前往
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
