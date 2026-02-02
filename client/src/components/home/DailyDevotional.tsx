import { Book, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function DailyDevotional() {
  const navigate = useNavigate();

  return (
    <section className="space-y-4">
      <h2 className="text-title px-1">今日靈修</h2>
      
      <button 
        onClick={() => navigate("/devotional")}
        className="w-full bg-card rounded-lg shadow-card p-5 text-left hover:shadow-elevated transition-all active:scale-[0.99]"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full gradient-olive flex items-center justify-center flex-shrink-0">
            <Book className="w-6 h-6 text-secondary-foreground" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-caption text-muted-foreground">詩篇 122:1-4</span>
              <span className="bg-primary/10 text-primary text-caption px-2 py-0.5 rounded-full">
                今日經文
              </span>
            </div>
            
            <p className="text-body text-foreground leading-relaxed line-clamp-3">
              「人對我說：我們往耶和華的殿去，我就歡喜。耶路撒冷啊，我們的腳站在你的門內。」
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
