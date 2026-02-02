import { Book, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressDay {
  day: number;
  date: string;
  title: string;
  completed: boolean;
  isToday: boolean;
}

interface DevotionalProgressProps {
  days: ProgressDay[];
  currentDay: number;
  totalDays: number;
  onSelectDay?: (day: number) => void;
}

export function DevotionalProgress({
  days,
  currentDay,
  totalDays,
  onSelectDay,
}: DevotionalProgressProps) {
  const progress = Math.round((days.filter((d) => d.completed).length / totalDays) * 100);

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="bg-card rounded-lg shadow-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Book className="w-5 h-5 text-primary" />
            <span className="text-body font-semibold">靈修進度</span>
          </div>
          <span className="text-caption text-muted-foreground">
            {currentDay} / {totalDays} 天
          </span>
        </div>
        
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full gradient-warm rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <p className="text-caption text-muted-foreground mt-2 text-center">
          已完成 {progress}% 的靈修旅程
        </p>
      </div>

      {/* Day List */}
      <div className="space-y-2">
        {days.map((day) => (
          <button
            key={day.day}
            onClick={() => onSelectDay?.(day.day)}
            className={cn(
              "w-full bg-card rounded-lg p-4 flex items-center gap-4",
              "transition-all hover:shadow-card active:scale-[0.99]",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              day.isToday && "ring-2 ring-primary"
            )}
          >
            {/* Status Icon */}
            {day.completed ? (
              <CheckCircle2 className="w-6 h-6 text-secondary flex-shrink-0" />
            ) : (
              <Circle className={cn(
                "w-6 h-6 flex-shrink-0",
                day.isToday ? "text-primary" : "text-muted-foreground"
              )} />
            )}

            {/* Content */}
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="text-body font-medium">第 {day.day} 天</span>
                {day.isToday && (
                  <span className="bg-primary/10 text-primary text-caption px-2 py-0.5 rounded-full">
                    今日
                  </span>
                )}
              </div>
              <p className="text-caption text-muted-foreground">{day.title}</p>
            </div>

            {/* Date */}
            <span className="text-caption text-muted-foreground">{day.date}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
