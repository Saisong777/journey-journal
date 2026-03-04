import { useState } from "react";
import { Calculator, Info, ClipboardCheck } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/ui/BottomNav";
import { CurrencyConverter } from "@/components/tools/CurrencyConverter";
import { TripChecklist } from "@/components/tools/TripChecklist";
import { TripBriefing } from "@/components/tools/TripBriefing";
import { WeatherInfo } from "@/components/tools/WeatherInfo";
import { cn } from "@/lib/utils";

type ViewMode = "currency" | "checklist" | "briefing";

export default function Tools() {
  const [viewMode, setViewMode] = useState<ViewMode>("briefing");

  return (
    <div className="min-h-screen bg-background pb-safe-bottom">
      <Header title="旅遊工具" />

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6 animate-fade-in">
        <WeatherInfo />

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
      </main>

      <BottomNav />
    </div>
  );
}
