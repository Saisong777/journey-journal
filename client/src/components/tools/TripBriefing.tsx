import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Globe, FileText, Info, ChevronDown, ChevronRight,
  UtensilsCrossed, CloudSun, Hotel, Plane, Shield, Luggage,
  AlertTriangle, Phone, CreditCard, Shirt, Camera
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TripNoteWithOrder {
  id: string;
  title: string;
  content: string;
  sortOrder: number;
}

interface Section {
  title: string;
  content: string;
  key: string;
}

type NoteType = "warning" | "info" | "tip";

const SECTION_ICON_MAP: Record<string, typeof Info> = {
  "餐食": UtensilsCrossed,
  "天氣": CloudSun,
  "服裝": Shirt,
  "住宿": Hotel,
  "出行": Plane,
  "保險": Shield,
  "出入境": Luggage,
  "安全": AlertTriangle,
  "緊急": Phone,
  "貨幣": CreditCard,
  "拍照": Camera,
};

const SECTION_TYPE_MAP: Record<string, NoteType> = {
  "保險": "warning",
  "出入境": "warning",
  "注意": "warning",
  "安全": "warning",
  "緊急": "warning",
  "餐食": "info",
  "住宿": "info",
  "出行": "info",
  "貨幣": "info",
  "天氣": "tip",
  "服裝": "tip",
  "拍照": "tip",
};

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

function getSectionIcon(title: string) {
  for (const [key, Icon] of Object.entries(SECTION_ICON_MAP)) {
    if (title.includes(key)) return Icon;
  }
  return Info;
}

function getSectionType(title: string, index: number): NoteType {
  for (const [key, type] of Object.entries(SECTION_TYPE_MAP)) {
    if (title.includes(key)) return type;
  }
  const cycle: NoteType[] = ["info", "tip", "warning"];
  return cycle[index % 3];
}

function parseContentSections(content: string): Section[] {
  const sections: Section[] = [];
  const lines = content.split("\n");
  let currentTitle = "";
  let currentLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^【(.+)】$/);
    if (match) {
      if (currentTitle || currentLines.length > 0) {
        const text = currentLines.join("\n").trim();
        if (text) {
          sections.push({
            title: currentTitle || "說明",
            content: text,
            key: `${currentTitle}-${sections.length}`,
          });
        }
      }
      currentTitle = match[1];
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  if (currentTitle || currentLines.length > 0) {
    const text = currentLines.join("\n").trim();
    if (text) {
      sections.push({
        title: currentTitle || "說明",
        content: text,
        key: `${currentTitle}-${sections.length}`,
      });
    }
  }

  return sections;
}

function SectionCard({ section, index }: { section: Section; index: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = getSectionIcon(section.title);
  const noteType = getSectionType(section.title, index);

  return (
    <div
      className={cn(
        "bg-card rounded-lg shadow-soft border-l-4 overflow-hidden",
        typeStyles[noteType]
      )}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-4 px-4 py-3 text-left hover:brightness-95 transition-all"
        data-testid={`button-toggle-section-${section.key}`}
      >
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
          iconStyles[noteType]
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="flex-1 font-semibold text-body">{section.title}</span>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>
      <div
        className={cn(
          "transition-all duration-200 overflow-hidden",
          isOpen ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-4 pb-4 pt-1 ml-14">
          <p className="text-caption text-muted-foreground leading-relaxed whitespace-pre-line">
            {section.content}
          </p>
        </div>
      </div>
    </div>
  );
}

function getPreview(content: string) {
  const compact = content.replace(/\s+/g, " ").trim();
  if (compact.length <= 96) return compact;
  return `${compact.slice(0, 96)}...`;
}

function PlainNoteCard({ note, index }: { note: TripNoteWithOrder; index: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = getSectionIcon(note.title);
  const noteType = getSectionType(note.title, index);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-sm border border-border bg-card shadow-soft",
        typeStyles[noteType]
      )}
      data-testid={`briefing-note-${note.id}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
      >
        <div className={cn(
          "mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm",
          iconStyles[noteType]
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-body font-semibold text-foreground">{note.title}</h4>
            <span className="rounded-sm bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {isOpen ? "收合" : "查看"}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-caption leading-relaxed text-muted-foreground">
            {getPreview(note.content)}
          </p>
        </div>
        {isOpen ? (
          <ChevronDown className="mt-3 h-4 w-4 flex-shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="mt-3 h-4 w-4 flex-shrink-0 text-muted-foreground" />
        )}
      </button>
      <div
        className={cn(
          "border-t border-border/70 px-4 transition-all duration-200",
          isOpen ? "max-h-[3200px] py-4 opacity-100" : "max-h-0 overflow-hidden py-0 opacity-0"
        )}
      >
        <p className="whitespace-pre-line text-caption leading-7 text-muted-foreground">
          {note.content}
        </p>
      </div>
    </div>
  );
}

export function TripBriefing() {
  const { data: notes = [], isLoading } = useQuery<TripNoteWithOrder[]>({
    queryKey: ["/api/trips/current/notes"],
  });

  const { data: remarksData } = useQuery<{ specialRemarks: string | null }>({
    queryKey: ["/api/trips/current/remarks"],
  });

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

  const hasRemarks = remarksData?.specialRemarks && remarksData.specialRemarks.trim().length > 0;

  if (notes.length === 0 && !hasRemarks) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Info className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p className="text-body">尚無注意事項資料</p>
        <p className="text-caption mt-1">管理員尚未為此旅程設定注意事項</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="trip-briefing-list">
      <div className="rounded-sm border border-border/70 bg-card p-4 shadow-card">
        <p className="text-caption text-muted-foreground">Travel Briefing</p>
        <h3 className="mt-1 text-title">出發前先看重點</h3>
        <p className="mt-1 text-caption text-muted-foreground">
          每張卡片先看摘要，需要時再展開細節。
        </p>
      </div>

      {notes.map((note, noteIndex) => {
        const sections = parseContentSections(note.content);
        const hasSections = sections.length > 1 || (sections.length === 1 && sections[0].title !== "說明");

        return (
          <div key={`${note.id}-${note.sortOrder}-${noteIndex}`} data-testid={`briefing-note-${note.id}`}>
            {notes.length > 1 && (
              <div className="flex items-center gap-2 mb-3 mt-2">
                <Globe className="w-4 h-4 text-primary" />
                <h4 className="text-body font-semibold text-foreground">{note.title}</h4>
              </div>
            )}

            <div className="space-y-3">
              {hasSections
                ? sections.map((section, i) => (
                    <SectionCard key={section.key} section={section} index={i} />
                  ))
                : <PlainNoteCard note={note} index={noteIndex} />}
            </div>
          </div>
        );
      })}

      {hasRemarks && (
        <div
          className="bg-card rounded-lg shadow-soft border-l-4 border-l-amber-500 bg-amber-50/50 overflow-hidden"
          data-testid="special-remarks"
        >
          <div className="flex items-center gap-4 px-4 py-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-amber-600 bg-amber-100">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="flex-1 font-semibold text-body">特別備注</h3>
          </div>
          <div className="px-4 pb-4 ml-14">
            <p className="text-caption text-muted-foreground leading-relaxed whitespace-pre-line">
              {remarksData!.specialRemarks}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
