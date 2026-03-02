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
      <div className="bg-card rounded-lg shadow-card p-4">
        <h3 className="text-body font-semibold mb-2">注意事項</h3>
        <p className="text-caption text-muted-foreground">
          行前必讀資訊，點擊各項展開詳細內容
        </p>
      </div>

      {notes.map((note) => {
        const sections = parseContentSections(note.content);
        const hasSections = sections.length > 1 || (sections.length === 1 && sections[0].title !== "說明");

        return (
          <div key={note.id} data-testid={`briefing-note-${note.id}`}>
            {notes.length > 1 && (
              <div className="flex items-center gap-2 mb-3 mt-2">
                <Globe className="w-4 h-4 text-primary" />
                <h4 className="text-body font-semibold text-foreground">{note.title}</h4>
              </div>
            )}

            <div className="space-y-3">
              {hasSections ? (
                sections.map((section, i) => (
                  <SectionCard key={section.key} section={section} index={i} />
                ))
              ) : (
                <div className="bg-card rounded-lg shadow-soft border-l-4 border-l-primary bg-primary/5 p-4">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-primary bg-primary/10">
                      <Globe className="w-5 h-5" />
                    </div>
                    <h4 className="font-semibold text-body">{note.title}</h4>
                  </div>
                  <div className="ml-14">
                    <p className="text-caption text-muted-foreground leading-relaxed whitespace-pre-line">
                      {note.content}
                    </p>
                  </div>
                </div>
              )}
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
