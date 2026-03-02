import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/ui/BottomNav";
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
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken } from "@/lib/queryClient";
import type { PaulJourney } from "@shared/schema";

const JOURNEY_TABS = [
  { key: "第一次旅行佈道", label: "第一次", short: "一" },
  { key: "第二次旅行佈道", label: "第二次", short: "二" },
  { key: "第三次旅行佈道", label: "第三次", short: "三" },
  { key: "羅馬之旅(解送羅馬)", label: "羅馬之旅", short: "羅" },
];

interface BibleVerse {
  number: number;
  text: string;
}

interface BibleLookupResult {
  reference: string;
  bookName: string;
  chapter: number;
  verses: BibleVerse[];
}

export default function PaulJourneys() {
  const [activeJourney, setActiveJourney] = useState(JOURNEY_TABS[0].key);
  const [expandedStops, setExpandedStops] = useState<Set<number>>(new Set());
  const [expandedScriptures, setExpandedScriptures] = useState<Set<number>>(new Set());
  const [verseCache, setVerseCache] = useState<Record<string, BibleLookupResult | null>>({});
  const [loadingVerses, setLoadingVerses] = useState<Set<string>>(new Set());
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

  const fetchVerses = useCallback(async (ref: string) => {
    if (verseCache[ref] !== undefined || loadingVerses.has(ref)) return;

    setLoadingVerses((prev) => new Set(prev).add(ref));
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/bible/lookup?ref=${encodeURIComponent(ref)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        setVerseCache((prev) => ({ ...prev, [ref]: data }));
      } else {
        setVerseCache((prev) => ({ ...prev, [ref]: null }));
      }
    } catch {
      setVerseCache((prev) => ({ ...prev, [ref]: null }));
    } finally {
      setLoadingVerses((prev) => {
        const next = new Set(prev);
        next.delete(ref);
        return next;
      });
    }
  }, [verseCache, loadingVerses]);

  const toggleScripture = (stopId: number, ref: string) => {
    setExpandedScriptures((prev) => {
      const next = new Set(prev);
      if (next.has(stopId)) {
        next.delete(stopId);
      } else {
        next.add(stopId);
        fetchVerses(ref);
      }
      return next;
    });
  };

  const copyVerses = (ref: string, verses: BibleVerse[]) => {
    const text = `${ref}\n${verses.map((v) => `${v.number} ${v.text}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    toast({ title: "經文已複製到剪貼簿" });
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
    <div className="min-h-screen bg-background pb-24">
      <Header title="保羅行蹤" />

      <main className="px-4 py-4 max-w-lg mx-auto space-y-4 animate-fade-in">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {JOURNEY_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveJourney(tab.key);
                setExpandedStops(new Set());
                setExpandedScriptures(new Set());
              }}
              className={cn(
                "px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0",
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
                className="text-xs text-primary flex items-center gap-1"
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
                const isScriptureExpanded = expandedScriptures.has(stop.id);
                const cachedVerses = stop.scripture ? verseCache[stop.scripture] : null;
                const isVersesLoading = stop.scripture ? loadingVerses.has(stop.scripture) : false;

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
                        className="w-full text-left"
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
                            <div className="space-y-2">
                              <button
                                onClick={() => toggleScripture(stop.id, stop.scripture!)}
                                className="flex items-center gap-2 w-full text-left"
                                data-testid={`button-scripture-${stop.id}`}
                              >
                                <BookOpen className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="text-xs text-muted-foreground">經文</p>
                                  <p className="text-sm text-amber-700 font-medium">{stop.scripture}</p>
                                </div>
                                {isScriptureExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                                )}
                              </button>

                              {isScriptureExpanded && (
                                <div className="ml-6 bg-amber-50 rounded-lg p-3 space-y-1.5 border border-amber-200/50">
                                  {isVersesLoading ? (
                                    <div className="flex items-center gap-2 py-2">
                                      <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                                      <span className="text-xs text-amber-600">載入經文中...</span>
                                    </div>
                                  ) : cachedVerses && cachedVerses.verses.length > 0 ? (
                                    <>
                                      {cachedVerses.verses.map((v) => (
                                        <p key={v.number} className="text-sm text-foreground leading-relaxed">
                                          <span className="text-xs text-amber-600 font-bold mr-1">{v.number}</span>
                                          {v.text}
                                        </p>
                                      ))}
                                      <button
                                        onClick={() => copyVerses(stop.scripture!, cachedVerses.verses)}
                                        className="flex items-center gap-1 text-xs text-amber-700 mt-2 hover:underline"
                                        data-testid={`button-copy-verses-${stop.id}`}
                                      >
                                        <Copy className="w-3 h-3" />
                                        複製經文
                                      </button>
                                    </>
                                  ) : (
                                    <p className="text-xs text-muted-foreground py-1">無法載入經文內容</p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          <button
                            onClick={() => copyEvents(stop)}
                            className="flex items-center gap-1.5 text-xs text-primary mt-2 hover:underline"
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
      </main>

      <BottomNav />
    </div>
  );
}
