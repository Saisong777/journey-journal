import { useState } from "react";
import { BookOpen, Moon, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
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
import type { DevotionalEntryDB } from "@/hooks/useDevotional";
import type { EveningReflectionDB } from "@/hooks/useEveningReflection";
import { format, parseISO } from "date-fns";
import { zhTW } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DevotionalSummaryProps {
  devotionals: DevotionalEntryDB[];
  eveningReflections: EveningReflectionDB[];
  onEditDevotional?: (entry: DevotionalEntryDB) => void;
  onDeleteDevotional?: (entry: DevotionalEntryDB) => void;
  onDeleteEvening?: (entry: EveningReflectionDB) => void;
}

export function DevotionalSummary({ devotionals, eveningReflections, onEditDevotional, onDeleteDevotional, onDeleteEvening }: DevotionalSummaryProps) {
  const [deleteTarget, setDeleteTarget] = useState<{ type: "devotional" | "evening"; id: string; label: string } | null>(null);

  // Merge by date
  const dateMap = new Map<string, { devotional?: DevotionalEntryDB; evening?: EveningReflectionDB }>();

  for (const d of devotionals) {
    const existing = dateMap.get(d.entryDate) || {};
    existing.devotional = d;
    dateMap.set(d.entryDate, existing);
  }
  for (const e of eveningReflections) {
    const existing = dateMap.get(e.entryDate) || {};
    existing.evening = e;
    dateMap.set(e.entryDate, existing);
  }

  const sortedDates = Array.from(dateMap.keys()).sort();

  if (sortedDates.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>尚無靈修記錄</p>
        <p className="text-sm">開始記錄每日靈修與晚間感恩吧！</p>
      </div>
    );
  }

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "devotional") {
      const entry = devotionals.find(d => d.id === deleteTarget.id);
      if (entry) onDeleteDevotional?.(entry);
    } else {
      const entry = eveningReflections.find(e => e.id === deleteTarget.id);
      if (entry) onDeleteEvening?.(entry);
    }
    setDeleteTarget(null);
  };

  return (
    <section className="space-y-3">
      {sortedDates.map((date) => (
        <DaySection
          key={date}
          date={date}
          data={dateMap.get(date)!}
          onEditDevotional={onEditDevotional}
          onDeleteDevotional={onDeleteDevotional ? (d) => setDeleteTarget({ type: "devotional", id: d.id, label: d.scriptureReference || "靈修記錄" }) : undefined}
          onDeleteEvening={onDeleteEvening ? (e) => setDeleteTarget({ type: "evening", id: e.id, label: "晚間感恩" }) : undefined}
        />
      ))}

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定刪除？</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除「{deleteTarget?.label}」嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
            >
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function DaySection({ date, data, onEditDevotional, onDeleteDevotional, onDeleteEvening }: {
  date: string;
  data: { devotional?: DevotionalEntryDB; evening?: EveningReflectionDB };
  onEditDevotional?: (entry: DevotionalEntryDB) => void;
  onDeleteDevotional?: (entry: DevotionalEntryDB) => void;
  onDeleteEvening?: (entry: EveningReflectionDB) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const formattedDate = format(parseISO(date), "M月d日（EEEE）", { locale: zhTW });

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
          <span className="text-body font-semibold">{formattedDate}</span>
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-3 pt-3">
          {data.devotional && (
            <Card className="p-4 bg-primary/5 border-none">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-white dark:bg-card flex items-center justify-center flex-shrink-0 text-primary">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-caption font-medium text-primary">晨光靈修</p>
                    {(onEditDevotional || onDeleteDevotional) && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {onEditDevotional && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEditDevotional(data.devotional!)}>
                            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                        )}
                        {onDeleteDevotional && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDeleteDevotional(data.devotional!)}>
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  {data.devotional.scriptureReference && (
                    <p className="text-body font-semibold">{data.devotional.scriptureReference}</p>
                  )}
                  {data.devotional.reflection && (
                    <p className="text-caption text-muted-foreground leading-relaxed">{data.devotional.reflection}</p>
                  )}
                  {data.devotional.prayer && (
                    <p className="text-caption text-muted-foreground leading-relaxed italic">{data.devotional.prayer}</p>
                  )}
                </div>
              </div>
            </Card>
          )}
          {data.evening && (
            <Card className="p-4 bg-indigo-50 dark:bg-indigo-950/30 border-none">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-white dark:bg-card flex items-center justify-center flex-shrink-0 text-indigo-500">
                  <Moon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-caption font-medium text-indigo-600 dark:text-indigo-400">夜間感恩</p>
                    {onDeleteEvening && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDeleteEvening(data.evening!)}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                  {data.evening.gratitude && (
                    <p className="text-caption text-muted-foreground leading-relaxed">{data.evening.gratitude}</p>
                  )}
                  {data.evening.highlight && (
                    <p className="text-caption text-muted-foreground leading-relaxed">{data.evening.highlight}</p>
                  )}
                  {data.evening.prayerForTomorrow && (
                    <p className="text-caption text-muted-foreground leading-relaxed italic">{data.evening.prayerForTomorrow}</p>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
