import { Book, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DailyDevotionalProps {
  bibleRefs?: string;
}

export function DailyDevotional({ bibleRefs }: DailyDevotionalProps) {
  const navigate = useNavigate();

  const displayRefs = bibleRefs?.split(";").map(r => r.trim()).filter(Boolean).slice(0, 2).join("; ") || "詩篇 122:1-4";
  const hasCustomRefs = !!bibleRefs && bibleRefs.length > 0;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <p className="text-caption text-muted-foreground">Devotional</p>
          <h2 className="text-title">今日靈修</h2>
        </div>
        <span className="rounded-sm bg-primary/10 px-2.5 py-1 text-caption font-medium text-primary">
          {hasCustomRefs ? "行程經文" : "預設經文"}
        </span>
      </div>
      
      <button 
        onClick={() => navigate("/daily-journey")}
        className="w-full rounded-sm border border-primary/10 bg-[linear-gradient(135deg,hsl(var(--card))_0%,hsl(var(--primary)/0.08)_100%)] p-4 text-left shadow-card transition-all hover:shadow-elevated active:brightness-95"
        data-testid="button-devotional"
      >
        <div className="flex items-start gap-3.5">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-sm gradient-olive shadow-soft">
            <Book className="h-6 w-6 text-secondary-foreground" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <span className="truncate text-caption font-medium text-primary" data-testid="text-bible-refs">{displayRefs}</span>
            </div>
            
            <p className="text-body text-foreground leading-relaxed line-clamp-3">
              {hasCustomRefs 
                ? "根據今日行程的相關經文，一起來靈修默想吧！"
                : "「人對我說：我們往耶和華的殿去，我就歡喜。耶路撒冷啊，我們的腳站在你的門內。」"
              }
            </p>
            
            <div className="mt-3 flex items-center gap-1 text-body font-medium text-primary">
              開始靈修
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </button>
    </section>
  );
}
