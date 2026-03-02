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

type NoteType = "warning" | "info" | "tip";

const ICON_MAP: Record<string, typeof Info> = {
  "餐食": UtensilsCrossed,
  "天氣": CloudSun,
  "服裝": CloudSun,
  "住宿": Hotel,
  "出行": Plane,
  "保險": Shield,
  "出入境": Luggage,
};

const TYPE_MAP: Record<string, NoteType> = {
  "保險": "warning",
  "出入境": "warning",
  "注意": "warning",
  "安全": "warning",
  "餐食": "info",
  "住宿": "info",
  "出行": "info",
  "天氣": "tip",
  "服裝": "tip",
};

function getIcon(title: string) {
  for (const [key, Icon] of Object.entries(ICON_MAP)) {
    if (title.includes(key)) return Icon;
  }
  return Info;
}

function getNoteType(title: string, index: number): NoteType {
  for (const [key, type] of Object.entries(TYPE_MAP)) {
    if (title.includes(key)) return type;
  }
  const cycle: NoteType[] = ["info", "tip", "warning"];
  return cycle[index % 3];
}

const typeStyles = {
  warning: "border-l-terracotta bg-terracotta/5",
  info: "border-l-primary bg-primary/5",
  tip: "border-l-secondary bg-olive-light/30",
};

const iconStyles = {
  warning: "text-terracotta bg-terracotta/10",
  info: "text-primary bg-primary/10",
  tip: "text-secondary bg-olive-light",
};

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
    <div className="space-y-4" data-testid="trip-briefing-list">
      <div className="bg-card rounded-lg shadow-card p-4">
        <h3 className="text-body font-semibold mb-2">出團說明資料</h3>
        <p className="text-caption text-muted-foreground">
          行前必讀資訊，共 {notes.length} 項說明
        </p>
      </div>

      <div className="space-y-3">
        {notes.map((note, index) => {
          const isOpen = expanded.has(note.id);
          const Icon = getIcon(note.title);
          const noteType = getNoteType(note.title, index);
          return (
            <div
              key={note.id}
              className={cn(
                "bg-card rounded-lg shadow-soft border-l-4 overflow-hidden",
                typeStyles[noteType]
              )}
              data-testid={`briefing-note-${note.id}`}
            >
              <button
                onClick={() => toggle(note.id)}
                className="w-full flex items-center gap-4 px-4 py-3 text-left hover:brightness-95 transition-all"
                data-testid={`button-toggle-note-${note.id}`}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                  iconStyles[noteType]
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="flex-1 font-semibold text-body">{note.title}</span>
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
                <div className="px-4 pb-4 pt-1 ml-14">
                  <p className="text-caption text-muted-foreground leading-relaxed whitespace-pre-line">
                    {note.content}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
