import { useState } from "react";
import { Star, Heart, BookOpen, Trash2, Pencil, ChevronDown } from "lucide-react";
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
import { cn } from "@/lib/utils";

export interface Highlight {
  id: string;
  type: "experience" | "spiritual" | "fellowship";
  title: string;
  description: string;
  date: string;
  entryDate?: string; // raw yyyy-MM-dd for navigation
}

interface HighlightMomentsProps {
  highlights: Highlight[];
  onEdit?: (highlight: Highlight) => void;
  onDelete?: (highlight: Highlight) => void;
}

const typeConfig = {
  experience: {
    icon: Star,
    label: "難忘體驗",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    iconColor: "text-amber-500",
  },
  spiritual: {
    icon: BookOpen,
    label: "靈性感動",
    bgColor: "bg-primary/5",
    iconColor: "text-primary",
  },
  fellowship: {
    icon: Heart,
    label: "團契時光",
    bgColor: "bg-rose-50 dark:bg-rose-950/30",
    iconColor: "text-rose-500",
  },
};

export function HighlightMoments({ highlights, onEdit, onDelete }: HighlightMomentsProps) {
  const [deleteTarget, setDeleteTarget] = useState<Highlight | null>(null);

  // Group by entryDate (raw) for correct sorting, display formatted date
  const dateGroups = new Map<string, { display: string; items: Highlight[] }>();
  for (const h of highlights) {
    const key = h.entryDate || h.date || "未知日期";
    const existing = dateGroups.get(key) || { display: h.date || "未知日期", items: [] };
    existing.items.push(h);
    dateGroups.set(key, existing);
  }

  const sortedDates = Array.from(dateGroups.keys()).sort();

  return (
    <section className="space-y-4">
      <h3 className="text-title font-semibold">精彩時刻</h3>

      <div className="space-y-3">
        {sortedDates.map((key) => {
          const group = dateGroups.get(key)!;
          return (
            <DateGroup
              key={key}
              date={group.display}
              highlights={group.items}
              onEdit={onEdit}
              onDelete={(h) => setDeleteTarget(h)}
            />
          );
        })}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定刪除？</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除「{deleteTarget?.title}」嗎？此操作無法復原。
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

function DateGroup({
  date,
  highlights,
  onEdit,
  onDelete,
}: {
  date: string;
  highlights: Highlight[];
  onEdit?: (h: Highlight) => void;
  onDelete?: (h: Highlight) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
          <span className="text-caption font-semibold">{date}（{highlights.length} 項）</span>
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-2 pt-2">
          {highlights.map((highlight) => {
            const config = typeConfig[highlight.type];
            const Icon = config.icon;

            return (
              <Card key={highlight.id} className={`p-4 ${config.bgColor} border-none`}>
                <div className="flex gap-4">
                  <div className={`w-10 h-10 rounded-full bg-white dark:bg-card flex items-center justify-center flex-shrink-0 ${config.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-caption font-medium text-muted-foreground">
                        {config.label}
                      </span>
                      {(onEdit || onDelete) && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {onEdit && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(highlight)}>
                              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(highlight)}>
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                    <h4 className="text-body font-semibold mb-1">{highlight.title}</h4>
                    <p className="text-caption text-muted-foreground leading-relaxed">
                      {highlight.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
