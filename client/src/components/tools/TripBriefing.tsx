import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, UtensilsCrossed, CloudSun, Hotel, Plane, Shield, Luggage, Info } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface TripNoteWithOrder {
  id: string;
  title: string;
  content: string;
  sortOrder: number;
}

const ICON_MAP: Record<string, typeof Info> = {
  "餐食": UtensilsCrossed,
  "天氣": CloudSun,
  "服裝": CloudSun,
  "住宿": Hotel,
  "出行": Plane,
  "保險": Shield,
  "出入境": Luggage,
};

function getIcon(title: string) {
  for (const [key, Icon] of Object.entries(ICON_MAP)) {
    if (title.includes(key)) return Icon;
  }
  return Info;
}

export function TripBriefing() {
  const { data: notes = [], isLoading } = useQuery<TripNoteWithOrder[]>({
    queryKey: ["/api/trips/current/notes"],
  });

  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-card rounded-lg p-4 animate-pulse">
            <div className="h-5 bg-muted rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Info className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p className="text-body">尚無出團說明資料</p>
        <p className="text-caption mt-1">管理員尚未為此旅程設定說明</p>
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="trip-briefing-list">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-title font-semibold">出團說明資料</h3>
        <span className="text-caption text-muted-foreground">共 {notes.length} 項</span>
      </div>
      {notes.map((note) => {
        const isOpen = expanded.has(note.id);
        const Icon = getIcon(note.title);
        return (
          <div
            key={note.id}
            className="bg-card rounded-lg border border-border overflow-hidden"
            data-testid={`briefing-note-${note.id}`}
          >
            <button
              onClick={() => toggle(note.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
              data-testid={`button-toggle-note-${note.id}`}
            >
              <Icon className="w-5 h-5 text-primary shrink-0" />
              <span className="flex-1 font-medium text-body">{note.title}</span>
              {isOpen ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
            </button>
            <div
              className={cn(
                "transition-all duration-200 overflow-hidden",
                isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
              )}
            >
              <div className="px-4 pb-4 pt-1 border-t border-border">
                <div className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                  {note.content}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
