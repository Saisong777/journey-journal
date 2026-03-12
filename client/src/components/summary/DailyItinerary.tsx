import { useState } from "react";
import { MapPin, Check, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface DaySchedule {
  day: number;
  date: string;
  title: string;
  locations: string[];
  highlights: string;
  completed: boolean;
  journalId?: string;
}

interface DailyItineraryProps {
  schedule: DaySchedule[];
  onEdit?: (day: DaySchedule) => void;
  onDelete?: (day: DaySchedule) => void;
}

export function DailyItinerary({ schedule, onEdit, onDelete }: DailyItineraryProps) {
  const [deleteTarget, setDeleteTarget] = useState<DaySchedule | null>(null);

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
                {(onEdit || onDelete) && day.journalId && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onEdit(day)}
                      >
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setDeleteTarget(day)}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                )}
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

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定刪除？</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除「第 {deleteTarget?.day} 天：{deleteTarget?.title}」的日誌嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  onDelete?.(deleteTarget);
                  setDeleteTarget(null);
                }
              }}
            >
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
