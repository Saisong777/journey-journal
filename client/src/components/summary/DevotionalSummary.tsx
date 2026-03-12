import { useState } from "react";
import { BookOpen, Moon, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import type { DevotionalEntryDB } from "@/hooks/useDevotional";
import type { EveningReflectionDB } from "@/hooks/useEveningReflection";
import { format, parseISO } from "date-fns";
import { zhTW } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DevotionalSummaryProps {
  devotionals: DevotionalEntryDB[];
  eveningReflections: EveningReflectionDB[];
}

export function DevotionalSummary({ devotionals, eveningReflections }: DevotionalSummaryProps) {
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

  return (
    <section className="space-y-3">
      {sortedDates.map((date) => (
        <DaySection key={date} date={date} data={dateMap.get(date)!} />
      ))}
    </section>
  );
}

function DaySection({ date, data }: { date: string; data: { devotional?: DevotionalEntryDB; evening?: EveningReflectionDB } }) {
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
                  <p className="text-caption font-medium text-primary">晨光靈修</p>
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
                  <p className="text-caption font-medium text-indigo-600 dark:text-indigo-400">夜間感恩</p>
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
