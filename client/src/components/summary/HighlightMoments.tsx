import { useState } from "react";
import { Star, Heart, BookOpen, Trash2, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

export interface Highlight {
  id: string;
  type: "experience" | "spiritual" | "fellowship";
  title: string;
  description: string;
  date: string;
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

  return (
    <section className="space-y-4">
      <h3 className="text-title font-semibold">✨ 精彩時刻</h3>

      <div className="space-y-3">
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
                    <div className="flex items-center gap-2">
                      <span className="text-caption font-medium text-muted-foreground">
                        {config.label}
                      </span>
                      <span className="text-caption text-muted-foreground">·</span>
                      <span className="text-caption text-muted-foreground">
                        {highlight.date}
                      </span>
                    </div>
                    {(onEdit || onDelete) && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onEdit(highlight)}
                          >
                            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setDeleteTarget(highlight)}
                          >
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
