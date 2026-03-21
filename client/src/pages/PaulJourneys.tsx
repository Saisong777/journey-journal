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
  Loader2,
  Navigation,
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

// ── Urban Space Types ─────────────────────────────────────────────────────────
const SPACE_TYPES = [
  {
    id: "synagogue",
    label: "會堂",
    emoji: "✡",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-800 dark:text-blue-200",
    desc: "猶太人宗教聚會所，保羅每到新城必先造訪",
    keywords: ["會堂"],
  },
  {
    id: "agora",
    label: "廣場",
    emoji: "🏛",
    bg: "bg-stone-100 dark:bg-stone-800/50",
    text: "text-stone-700 dark:text-stone-300",
    desc: "城市公共中心，哲學家辯論、市民聚集之處",
    keywords: ["廣場", "市集", "市場"],
  },
  {
    id: "areopagus",
    label: "亞略巴古",
    emoji: "⛰",
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-800 dark:text-purple-200",
    desc: "雅典議會山丘，知識精英辯論與裁決之地",
    keywords: ["亞略巴古"],
  },
  {
    id: "riverside",
    label: "河邊",
    emoji: "💧",
    bg: "bg-sky-100 dark:bg-sky-900/30",
    text: "text-sky-800 dark:text-sky-200",
    desc: "無會堂城市中猶太人的戶外禱告場所",
    keywords: ["河邊", "河旁", "水邊", "水旁"],
  },
  {
    id: "house",
    label: "住宅",
    emoji: "🏠",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-800 dark:text-amber-200",
    desc: "早期家庭教會的搖籃，私人空間成為聖所",
    keywords: ["家", "住宅", "房子"],
  },
  {
    id: "lecture",
    label: "講堂",
    emoji: "📖",
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-800 dark:text-green-200",
    desc: "租用的教學場所，吸引各族群的文化橋樑",
    keywords: ["講堂", "學堂", "推喇奴"],
  },
  {
    id: "theatre",
    label: "劇場",
    emoji: "🎭",
    bg: "bg-rose-100 dark:bg-rose-900/30",
    text: "text-rose-800 dark:text-rose-200",
    desc: "可容納數萬人的城市最大集會場所",
    keywords: ["劇場"],
  },
  {
    id: "temple",
    label: "神廟",
    emoji: "⛩",
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-800 dark:text-orange-200",
    desc: "外邦偶像信仰中心，保羅宣教面對的文化衝突",
    keywords: ["神廟", "廟", "偶像", "亞底米"],
  },
  {
    id: "prison",
    label: "監獄",
    emoji: "⛓",
    bg: "bg-gray-100 dark:bg-gray-800/50",
    text: "text-gray-700 dark:text-gray-300",
    desc: "逼迫之地，卻成為書信見證與奇蹟的起源",
    keywords: ["監獄", "囚", "牢", "捆"],
  },
  {
    id: "court",
    label: "法庭",
    emoji: "⚖",
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
    text: "text-indigo-800 dark:text-indigo-200",
    desc: "羅馬法律空間，保羅在此為福音辯護",
    keywords: ["審判", "法庭", "比馬", "巡撫", "辯護"],
  },
];

// ── Key City Spatial Narratives ───────────────────────────────────────────────
const CITY_NARRATIVES: Record<
  string,
  {
    summary: string;
    spaces: Array<{ emoji: string; label: string; detail: string }>;
  }
> = {
  腓立比: {
    summary: "從河邊到監獄：歐洲第一個教會的誕生",
    spaces: [
      { emoji: "💧", label: "河邊禱告處", detail: "呂底亞等人在此禱告，保羅為她施洗，歐洲福音從這裡開始" },
      { emoji: "🏠", label: "呂底亞家", detail: "第一個歐洲家庭教會，成為宣教基地" },
      { emoji: "⛓", label: "腓立比監獄", detail: "地震、深夜敬拜、獄卒一家信主歸向基督" },
    ],
  },
  帖撒羅尼迦: {
    summary: "三個安息日：從會堂到住宅的快速建立",
    spaces: [
      { emoji: "✡", label: "猶太會堂", detail: "連續三個安息日講解彌賽亞聖經預言" },
      { emoji: "🏠", label: "耶孫家", detail: "遭暴徒衝擊的庇護所，成為早期教會聚點" },
    ],
  },
  雅典: {
    summary: "從市集到山丘：與希臘哲學的正面交鋒",
    spaces: [
      { emoji: "✡", label: "猶太會堂", detail: "先向猶太人與虔誠的外邦人傳講" },
      { emoji: "🏛", label: "廣場（Agora）", detail: "每天在廣場與哲學家辯論，伊壁鳩魯與斯多亞門徒相遇" },
      { emoji: "⛰", label: "亞略巴古", detail: "「未識之神」的演講，以希臘詩人引出創造主" },
    ],
  },
  哥林多: {
    summary: "帳篷工坊到講堂：18個月扎根最世俗的城市",
    spaces: [
      { emoji: "✡", label: "猶太會堂", detail: "與亞居拉、百基拉同工，先在會堂傳道" },
      { emoji: "🏠", label: "提多猶士都家", detail: "緊鄰會堂的家庭教會，連猶太會堂長都信了" },
      { emoji: "⚖", label: "比馬審判台", detail: "迦流宣判保羅無罪，為福音傳播留下法律空間" },
    ],
  },
  以弗所: {
    summary: "從會堂到劇場：兩年讓全亞細亞聽見福音",
    spaces: [
      { emoji: "✡", label: "以弗所會堂", detail: "初三個月在此大膽講論神國" },
      { emoji: "📖", label: "推喇奴講堂", detail: "每天授課五小時，持續兩年，全亞細亞都聽到主道" },
      { emoji: "🎭", label: "以弗所大劇場", detail: "銀匠暴動，兩萬人高呼「以弗所人的亞底米」，福音的代價顯現" },
    ],
  },
};

const KEY_CITIES = Object.keys(CITY_NARRATIVES);

function detectSpaces(stop: PaulJourney) {
  const text = `${stop.events ?? ""} ${stop.location ?? ""}`;
  return SPACE_TYPES.filter((st) => st.keywords.some((kw) => text.includes(kw)));
}

function findCityNarrative(location: string) {
  const match = KEY_CITIES.find((city) => location.includes(city));
  return match ? CITY_NARRATIVES[match] : null;
}

// ── Space Guide Card ──────────────────────────────────────────────────────────
function SpaceGuideCard() {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200/60 dark:border-amber-700/40 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 min-h-[44px]"
      >
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-semibold text-amber-900 dark:text-amber-100">
            城市空間導讀
          </span>
          <span className="text-xs text-amber-700/70 dark:text-amber-300/70">
            認識保羅傳道的場景
          </span>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-amber-600 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-amber-600 flex-shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
            保羅並不在教堂中傳福音——那時根本沒有教堂。他穿梭在古代城市的各種公共空間，接觸不同社會階層的人。了解這些空間，能幫助我們更真實地想像保羅的宣教策略。
          </p>
          <div className="grid grid-cols-2 gap-2">
            {SPACE_TYPES.map((st) => (
              <div
                key={st.id}
                className={cn("rounded-lg px-3 py-2", st.bg)}
              >
                <div className={cn("text-xs font-semibold flex items-center gap-1.5", st.text)}>
                  <span>{st.emoji}</span>
                  <span>{st.label}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Space Index Card ──────────────────────────────────────────────────────────
function SpaceIndexCard({ stops }: { stops: PaulJourney[] }) {
  const [openSpaceId, setOpenSpaceId] = useState<string | null>(null);

  // Build map: spaceId → matching stops
  const spaceStopMap = new Map<string, PaulJourney[]>();
  for (const stop of stops) {
    for (const st of detectSpaces(stop)) {
      if (!spaceStopMap.has(st.id)) spaceStopMap.set(st.id, []);
      spaceStopMap.get(st.id)!.push(stop);
    }
  }

  const activeSpaces = SPACE_TYPES.filter((st) => spaceStopMap.has(st.id));
  if (activeSpaces.length === 0) return null;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">城市空間導覽</span>
        <span className="text-xs text-muted-foreground">點選空間查看相關經文</span>
      </div>
      <div className="divide-y divide-border">
        {activeSpaces.map((st) => {
          const matchedStops = spaceStopMap.get(st.id)!;
          const isOpen = openSpaceId === st.id;
          return (
            <div key={st.id}>
              <button
                onClick={() => setOpenSpaceId(isOpen ? null : st.id)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 min-h-[44px] hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                      st.bg,
                      st.text
                    )}
                  >
                    <span className="text-[10px]">{st.emoji}</span>
                    {st.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {matchedStops.length} 個地點
                  </span>
                </div>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="px-4 pb-3 space-y-2">
                  <p className="text-xs text-muted-foreground">{st.desc}</p>
                  <div className="space-y-2 mt-2">
                    {matchedStops.map((stop) => (
                      <div
                        key={stop.id}
                        className="rounded-lg bg-muted/40 px-3 py-2.5 space-y-1"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-primary" />
                            {stop.location}
                          </span>
                          {stop.year && (
                            <span className="text-xs text-muted-foreground">{stop.year}</span>
                          )}
                        </div>
                        {stop.scripture ? (
                          <ScriptureLink
                            reference={stop.scripture}
                            className="text-xs text-amber-700 dark:text-amber-400 font-medium hover:underline cursor-pointer inline-flex items-center gap-1"
                          />
                        ) : (
                          <p className="text-xs text-muted-foreground italic">無經文記載</p>
                        )}
                        {stop.events && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{stop.events}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── City Narrative Card ───────────────────────────────────────────────────────
function CityNarrativeCard({ narrative }: { narrative: NonNullable<ReturnType<typeof findCityNarrative>> }) {
  return (
    <div className="mt-3 rounded-lg bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-700/40 p-3 space-y-2">
      <div className="flex items-center gap-1.5">
        <Navigation className="w-3.5 h-3.5 text-amber-600" />
        <p className="text-xs font-semibold text-amber-900 dark:text-amber-100">城市動線</p>
      </div>
      <p className="text-xs text-amber-700 dark:text-amber-300 italic">{narrative.summary}</p>
      <div className="space-y-1.5">
        {narrative.spaces.map((s, i) => (
          <div key={i} className="flex items-start gap-2">
            {i < narrative.spaces.length - 1 && (
              <div className="absolute ml-[9px] mt-5 w-px h-3 bg-amber-300/60 dark:bg-amber-600/40" />
            )}
            <span className="text-base flex-shrink-0 mt-0.5">{s.emoji}</span>
            <div>
              <span className="text-xs font-medium text-amber-900 dark:text-amber-100">{s.label}</span>
              <span className="text-xs text-muted-foreground ml-1.5">{s.detail}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PaulJourneys() {
  const [activeJourney, setActiveJourney] = useState(JOURNEY_TABS[0].key);
  const [expandedStops, setExpandedStops] = useState<Set<number>>(new Set());
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: allJourneys, isLoading, error } = useQuery<PaulJourney[]>({
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
    <PageLayout title="保羅行蹤" showBack>
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
        ) : error ? (
          <div className="text-center py-12 space-y-2">
            <p className="text-destructive font-medium">載入失敗</p>
            <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
          </div>
        ) : (
          <>
            {/* Journey summary */}
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

            {/* Space guide */}
            <SpaceGuideCard />

            {/* Space index */}
            <SpaceIndexCard stops={stops} />

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
                const spaces = detectSpaces(stop);
                const cityNarrative = isExpanded ? findCityNarrative(stop.location ?? "") : null;

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
                            {/* Space type badges */}
                            {spaces.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {spaces.map((st) => (
                                  <span
                                    key={st.id}
                                    className={cn(
                                      "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium",
                                      st.bg,
                                      st.text
                                    )}
                                  >
                                    <span className="text-[10px]">{st.emoji}</span>
                                    {st.label}
                                  </span>
                                ))}
                              </div>
                            )}
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

                          {/* City spatial narrative for key cities */}
                          {cityNarrative && <CityNarrativeCard narrative={cityNarrative} />}

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
