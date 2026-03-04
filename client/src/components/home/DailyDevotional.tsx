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
      <h2 className="text-title px-1">今日靈修</h2>
      
      <button 
        onClick={() => navigate("/daily-journey")}
        className="w-full bg-card rounded-lg shadow-card p-5 text-left hover:shadow-elevated transition-all active:brightness-95"
        data-testid="button-devotional"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full gradient-olive flex items-center justify-center flex-shrink-0">
            <Book className="w-6 h-6 text-secondary-foreground" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-caption text-muted-foreground" data-testid="text-bible-refs">{displayRefs}</span>
              <span className="bg-primary/10 text-primary text-caption px-2 py-0.5 rounded-full">
                {hasCustomRefs ? "今日經文" : "默認經文"}
              </span>
            </div>
            
            <p className="text-body text-foreground leading-relaxed line-clamp-3">
              {hasCustomRefs 
                ? "根據今日行程的相關經文，一起來靈修默想吧！"
                : "「人對我說：我們往耶和華的殿去，我就歡喜。耶路撒冷啊，我們的腳站在你的門內。」"
              }
            </p>
            
            <div className="flex items-center gap-1 mt-3 text-primary text-body font-medium">
              開始靈修
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </button>
    </section>
  );
}
