import { MapPin, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface DaySchedule {
  day: number;
  date: string;
  title: string;
  locations: string[];
  highlights: string;
  completed: boolean;
}

interface DailyItineraryProps {
  schedule: DaySchedule[];
}

export function DailyItinerary({ schedule }: DailyItineraryProps) {
  return (
    <section className="space-y-4">
      <h3 className="text-title font-semibold">📅 每日行程回顧</h3>
      
      <div className="space-y-3">
        {schedule.map((day, index) => (
          <div
            key={day.day}
            className={cn(
              "relative pl-8 pb-6",
              index !== schedule.length - 1 && "border-l-2 border-primary/20 ml-3"
            )}
          >
            {/* Timeline dot */}
            <div className={cn(
              "absolute left-0 top-0 w-7 h-7 rounded-full flex items-center justify-center -translate-x-1/2",
              day.completed 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted border-2 border-primary/30"
            )}>
              {day.completed ? (
                <Check className="w-4 h-4" />
              ) : (
                <span className="text-caption font-medium">{day.day}</span>
              )}
            </div>

            {/* Content */}
            <div className="bg-card rounded-xl p-4 border border-border shadow-sm ml-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-caption text-muted-foreground">{day.date}</p>
                  <h4 className="text-body font-semibold">第 {day.day} 天：{day.title}</h4>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {day.locations.map((location) => (
                  <span
                    key={location}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-full text-caption"
                  >
                    <MapPin className="w-3 h-3" />
                    {location}
                  </span>
                ))}
              </div>

              <p className="text-caption text-muted-foreground leading-relaxed">
                {day.highlights}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
