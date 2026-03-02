import { useQuery } from "@tanstack/react-query";
import { Globe, FileText, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface TripNoteWithOrder {
  id: string;
  title: string;
  content: string;
  sortOrder: number;
}

const regionColors = [
  { border: "border-l-primary", bg: "bg-primary/5", icon: "text-primary bg-primary/10" },
  { border: "border-l-terracotta", bg: "bg-terracotta/5", icon: "text-terracotta bg-terracotta/10" },
  { border: "border-l-secondary", bg: "bg-olive-light/30", icon: "text-secondary bg-olive-light" },
];

function renderFormattedContent(content: string) {
  const lines = content.split("\n");
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (/^【.+】$/.test(trimmed)) {
      return (
        <h4 key={i} className="text-body font-semibold text-foreground mt-4 mb-2 first:mt-0">
          {trimmed}
        </h4>
      );
    }
    if (trimmed === "") {
      return <div key={i} className="h-2" />;
    }
    return (
      <p key={i} className="text-caption text-muted-foreground leading-relaxed">
        {trimmed}
      </p>
    );
  });
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
        {[1, 2].map(i => (
          <div key={i} className="bg-card rounded-lg p-4 animate-pulse">
            <div className="h-5 bg-muted rounded w-1/3 mb-3" />
            <div className="h-3 bg-muted rounded w-full mb-2" />
            <div className="h-3 bg-muted rounded w-2/3" />
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
          行前必讀資訊，請仔細閱讀
        </p>
      </div>

      <div className="space-y-4">
        {notes.map((note, index) => {
          const color = regionColors[index % regionColors.length];
          return (
            <div
              key={note.id}
              className={cn(
                "bg-card rounded-lg shadow-soft border-l-4 overflow-hidden",
                color.border, color.bg
              )}
              data-testid={`briefing-note-${note.id}`}
            >
              <div className="flex items-center gap-4 px-4 py-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                  color.icon
                )}>
                  <Globe className="w-5 h-5" />
                </div>
                <h3 className="flex-1 font-semibold text-body">{note.title}</h3>
              </div>
              <div className="px-4 pb-4 ml-14">
                {renderFormattedContent(note.content)}
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
    </div>
  );
}
