import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Calculator, Info, ClipboardCheck, Library, ChevronRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/ui/BottomNav";
import { CurrencyConverter } from "@/components/tools/CurrencyConverter";
import { TripChecklist } from "@/components/tools/TripChecklist";
import { TripBriefing } from "@/components/tools/TripBriefing";
import { cn } from "@/lib/utils";
import { Clock, Thermometer, MapPin } from "lucide-react";

type ViewMode = "currency" | "checklist" | "briefing";

export default function Tools() {
  const [viewMode, setViewMode] = useState<ViewMode>("briefing");
  const navigate = useNavigate();
  const { data: bibleLibraryStatus } = useQuery<{ enabled: boolean }>({
    queryKey: ["/api/trips/current/bible-library-enabled"],
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="旅遊工具" />

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6 animate-fade-in">
        <section className="bg-card rounded-lg shadow-card p-4">
          <div className="flex items-center justify-around text-center">
            <div className="flex flex-col items-center gap-1">
              <Clock className="w-5 h-5 text-primary" />
              <p className="text-caption text-muted-foreground">當地時間</p>
              <p className="text-body font-semibold">15:30</p>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="flex flex-col items-center gap-1">
              <Thermometer className="w-5 h-5 text-terracotta" />
              <p className="text-caption text-muted-foreground">氣溫</p>
              <p className="text-body font-semibold">24°C</p>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="flex flex-col items-center gap-1">
              <MapPin className="w-5 h-5 text-secondary" />
              <p className="text-caption text-muted-foreground">時差</p>
              <p className="text-body font-semibold">-6 小時</p>
            </div>
          </div>
        </section>

        <section className="flex gap-2">
          {[
            { key: "briefing", label: "注意事項", icon: Info },
            { key: "checklist", label: "行前檢查表", icon: ClipboardCheck },
            { key: "currency", label: "匯率轉換", icon: Calculator },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setViewMode(tab.key as ViewMode)}
              className={cn(
                "flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition-all touch-target",
                viewMode === tab.key
                  ? "gradient-warm text-primary-foreground shadow-card"
                  : "bg-card text-foreground hover:bg-muted"
              )}
              data-testid={`tab-${tab.key}`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-body font-medium">{tab.label}</span>
            </button>
          ))}
        </section>

        {viewMode === "briefing" && <TripBriefing />}
        {viewMode === "currency" && <CurrencyConverter />}
        {viewMode === "checklist" && <TripChecklist />}

        {bibleLibraryStatus?.enabled && (
          <section>
            <button
              onClick={() => navigate("/bible-library")}
              className="w-full bg-card rounded-xl border border-border p-4 flex items-center gap-4 hover:shadow-card transition-all text-left"
              data-testid="button-bible-library"
            >
              <div className="w-10 h-10 rounded-lg gradient-warm flex items-center justify-center flex-shrink-0">
                <Library className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-body font-semibold text-foreground">聖經資料館</h3>
                <p className="text-caption text-muted-foreground">探索聖經中的歷史足跡</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            </button>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
