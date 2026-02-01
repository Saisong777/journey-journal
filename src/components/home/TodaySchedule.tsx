import { Clock, MapPin, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScheduleItem {
  time: string;
  title: string;
  location: string;
  isNext?: boolean;
}

const scheduleItems: ScheduleItem[] = [
  { time: "08:00", title: "早餐", location: "飯店餐廳" },
  { time: "09:30", title: "橄欖山", location: "耶路撒冷", isNext: true },
  { time: "12:00", title: "午餐", location: "當地餐廳" },
  { time: "14:00", title: "聖墓教堂", location: "舊城區" },
];

export function TodaySchedule() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-title">今日行程</h2>
        <button className="text-primary text-body font-medium flex items-center gap-1 hover:underline">
          查看全部
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-card rounded-lg shadow-card overflow-hidden">
        {scheduleItems.map((item, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-4 p-4 border-b border-border last:border-0",
              item.isNext && "bg-primary/5"
            )}
          >
            {/* Time */}
            <div className={cn(
              "text-center min-w-[60px]",
              item.isNext ? "text-primary font-semibold" : "text-muted-foreground"
            )}>
              <Clock className="w-4 h-4 mx-auto mb-1" />
              <span className="text-body">{item.time}</span>
            </div>

            {/* Divider */}
            <div className="relative flex flex-col items-center">
              <div className={cn(
                "w-3 h-3 rounded-full",
                item.isNext ? "bg-primary" : "bg-muted"
              )} />
              {index < scheduleItems.length - 1 && (
                <div className="absolute top-3 w-0.5 h-12 bg-muted" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1">
              <h3 className={cn(
                "text-body font-medium",
                item.isNext && "text-primary"
              )}>
                {item.title}
              </h3>
              <div className="flex items-center gap-1 text-muted-foreground text-caption">
                <MapPin className="w-3 h-3" />
                {item.location}
              </div>
            </div>

            {item.isNext && (
              <span className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-caption font-medium">
                下一站
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
