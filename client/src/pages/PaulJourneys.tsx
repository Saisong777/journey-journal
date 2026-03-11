import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageLayout } from "@/components/layout/PageLayout";
import { cn } from "@/lib/utils";
import {
  MapPin,
  Users,
  BookOpen,
  Scroll,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Calendar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScriptureLink } from "@/components/ScriptureLink";
import type { PaulJourney } from "@shared/schema";

const JOURNEY_TABS = [
  { key: "第一次旅行佈道", label: "第一次", short: "一" },
  { key: "第二次旅行佈道", label: "第二次", short: "二" },
  { key: "第三次旅行佈道", label: "第三次", short: "三" },
  { key: "羅馬之旅(解送羅馬)", label: "羅馬之旅", short: "羅" },
];

export default function PaulJourneys() {
  const [activeJourney, setActiveJourney] = useState(JOURNEY_TABS[0].key);
  const [expandedStops, setExpandedStops] = useState<Set<number>>(new Set());
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: allJourneys, isLoading } = useQuery<PaulJourney[]>({
    queryKey: ["/api/paul-journeys"],
  });

  const stops = allJourneys?.filter((j) => j.journey === activeJourney) ?? [];

  const toggleStop = (id: number) => {
    setExpandedStops((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    if (expandedStops.size === stops.length) {
      setExpandedStops(new Set());
    } else {
      setExpandedStops(new Set(stops.map((s) => s.id)));
    }
  };

  const copyEvents = (stop: PaulJourney) => {
    const parts = [stop.location];
    if (stop.year) parts.push(`年份：${stop.year}`);
    if (stop.scripture) parts.push(`經文：${stop.scripture}`);
    if (stop.companions) parts.push(`同伴：${stop.companions}`);
    if (stop.events) parts.push(`事件：${stop.events}`);
    if (stop.epistles) parts.push(`書信：${stop.epistles}`);
    navigator.clipboard.writeText(parts.join("\n"));
    setCopiedId(stop.id);
    toast({ title: "已複製到剪貼簿" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const uniqueCompanions = new Set<string>();
  const totalEpistles: string[] = [];
  stops.forEach((s) => {
    if (s.companions) s.companions.split(/[、,]/).forEach((c) => uniqueCompanions.add(c.trim()));
    if (s.epistles) totalEpistles.push(s.epistles);
  });

  return (
    <PageLayout title="保羅行蹤">
      <div className="px-4 py-4 max-w-lg mx-auto space-y-4 animate-fade-in">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {JOURNEY_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveJourney(tab.key);
                setExpandedStops(new Set());
              }}
              className={cn(
                "px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 min-h-[44px] min-w-[44px]",
                activeJourney === tab.key
                  ? "gradient-warm text-primary-foreground shadow-card"
                  : "bg-card text-foreground border border-border hover:bg-muted"
              )}
              data-testid={`tab-journey-${tab.short}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="bg-card rounded-xl border border-border p-4" data-testid="card-journey-summary">
              <h3 className="text-body font-semibold mb-3 text-primary">{activeJourney}</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xl font-bold text-foreground">{stops.length}</p>
                  <p className="text-caption text-muted-foreground">站點</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{uniqueCompanions.size}</p>
                  <p className="text-caption text-muted-foreground">同伴</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{totalEpistles.length}</p>
                  <p className="text-caption text-muted-foreground">書信</p>
                </div>
              </div>
              {uniqueCompanions.size > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(uniqueCompanions).map((c) => (
                      <span
                        key={c}
                        className="px-2 py-0.5 rounded-full bg-secondary/20 text-secondary text-xs"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={expandAll}
                className="text-xs text-primary flex items-center gap-1 min-h-[44px] px-2"
                data-testid="button-expand-all"
              >
                {expandedStops.size === stops.length ? "全部收合" : "全部展開"}
                {expandedStops.size === stops.length ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-primary/20" />

              {stops.map((stop, idx) => {
                const isExpanded = expandedStops.has(stop.id);

                return (
                  <div key={stop.id} className="relative pl-12 pb-6" data-testid={`stop-${stop.id}`}>
                    <div
                      className={cn(
                        "absolute left-3.5 w-3.5 h-3.5 rounded-full border-2 border-primary z-10 top-1.5",
                        isExpanded ? "bg-primary" : "bg-card"
                      )}
                    />
                    {idx === 0 && (
                      <div className="absolute left-[11px] -top-1 w-5 h-3 bg-background" />
                    )}

                    <div className="w-full text-left bg-card rounded-xl border border-border p-4 hover:shadow-card transition-all">
                      <button
                        onClick={() => toggleStop(stop.id)}
                        className="w-full text-left min-h-[44px]"
                        data-testid={`button-stop-${stop.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-body font-semibold text-foreground flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                                {stop.location}
                              </h4>
                              {stop.year && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                                  <Calendar className="w-3 h-3" />
                                  {stop.year}
                                </span>
                              )}
                            </div>
                            {stop.epistles && (
                              <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-medium">
                                <Scroll className="w-3 h-3" />
                                {stop.epistles}
                              </span>
                            )}
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-border space-y-3">
                          {stop.companions && (
                            <div className="flex items-start gap-2">
                              <Users className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">同伴</p>
                                <div className="flex flex-wrap gap-1">
                                  {stop.companions.split(/[、,]/).map((c) => (
                                    <span
                                      key={c}
                                      className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-xs"
                                    >
                                      {c.trim()}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {stop.events && (
                            <div className="flex items-start gap-2">
                              <BookOpen className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">事件</p>
                                <p className="text-sm text-foreground leading-relaxed">{stop.events}</p>
                              </div>
                            </div>
                          )}

                          {stop.scripture && (
                            <div className="flex items-start gap-2">
                              <BookOpen className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">經文</p>
                                <ScriptureLink reference={stop.scripture} className="text-sm text-amber-700 dark:text-amber-400 font-medium hover:underline cursor-pointer inline-flex items-center gap-1" />
                              </div>
                            </div>
                          )}

                          <button
                            onClick={() => copyEvents(stop)}
                            className="flex items-center gap-1.5 text-xs text-primary mt-2 hover:underline min-h-[44px]"
                            data-testid={`button-copy-${stop.id}`}
                          >
                            {copiedId === stop.id ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            {copiedId === stop.id ? "已複製" : "複製內容"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
}
