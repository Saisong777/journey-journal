import { useState, useMemo, useEffect } from "react";
import {
  Sun, Compass, Moon, Plus, Calendar, ChevronLeft, ChevronRight,
  Loader2, Check, BookOpen, Volume2, Heart, Bookmark, Pencil,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/ui/BottomNav";
import { JournalEntry, JournalEntryData } from "@/components/journal/JournalEntry";
import { AddJournalSheet } from "@/components/journal/AddJournalSheet";
import { ViewJournalSheet } from "@/components/journal/ViewJournalSheet";
import { useJournalEntries, useCreateJournalEntry, useDeleteJournalEntry, useUpdateJournalEntry } from "@/hooks/useJournalEntries";
import { useDevotionalEntries, useMyDevotionalEntry, useSaveDevotional } from "@/hooks/useDevotional";
import { useEveningReflection, useSaveEveningReflection } from "@/hooks/useEveningReflection";
import { useTrip } from "@/hooks/useTrip";
import { useAuth } from "@/hooks/useAuth";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, addDays, startOfDay, parseISO, differenceInDays } from "date-fns";
import { zhTW } from "date-fns/locale";
import { ScriptureData } from "@/components/devotional/ScriptureCard";

function transformPhotoUrl(photoUrl: string): string {
  if (photoUrl.includes("storage.googleapis.com") && photoUrl.includes("/uploads/")) {
    const match = photoUrl.match(/\/uploads\/([a-f0-9-]+)/);
    if (match) {
      return `/api/uploads/file/${match[1]}`;
    }
  }
  if (photoUrl.startsWith("/objects/uploads/")) {
    const objectId = photoUrl.replace("/objects/uploads/", "");
    return `/api/uploads/file/${objectId}`;
  }
  return photoUrl;
}

const dailyScriptures: Record<number, ScriptureData> = {
  1: {
    reference: "以賽亞書 40:31",
    theme: "啟程 - 出發的心志",
    verses: [
      { number: 31, text: "但那等候耶和華的必重新得力。他們必如鷹展翅上騰；他們奔跑卻不困倦，行走卻不疲乏。" },
    ],
    reflection: "願我們帶著信心踏上這趟朝聖之旅，經歷神更新的力量。",
  },
  2: {
    reference: "馬可福音 1:16-20",
    theme: "加利利 - 耶穌的呼召",
    verses: [
      { number: 16, text: "耶穌順著加利利的海邊走，看見西門和西門的兄弟安得烈在海裡撒網；他們本是打魚的。" },
      { number: 17, text: "耶穌對他們說：來跟從我，我要叫你們得人如得魚一樣。" },
    ],
    reflection: "在加利利海邊，耶穌呼召門徒。今天，祂也在呼召我們。",
  },
  3: {
    reference: "詩篇 122:1-4",
    theme: "耶路撒冷 - 聖城的喜樂",
    verses: [
      { number: 1, text: "人對我說：我們往耶和華的殿去，我就歡喜。" },
      { number: 2, text: "耶路撒冷啊，我們的腳站在你的門內。" },
      { number: 3, text: "耶路撒冷被建造，如同連絡整齊的一座城。" },
      { number: 4, text: "眾支派，就是耶和華的支派，上那裡去，按以色列的常例稱讚耶和華的名。" },
    ],
    reflection: "想像自己正走向聖殿，心中充滿期待與喜樂。",
  },
  4: {
    reference: "路加福音 19:41-44",
    theme: "橄欖山 - 主的心腸",
    verses: [
      { number: 41, text: "耶穌快到耶路撒冷，看見城，就為它哀哭。" },
      { number: 42, text: "說：巴不得你在這日子知道關係你平安的事；無奈這事現在是隱藏的，叫你的眼看不出來。" },
    ],
    reflection: "站在橄欖山上，感受主對這座城市的愛與憐憫。",
  },
  5: {
    reference: "馬太福音 26:36-39",
    theme: "客西馬尼 - 順服的功課",
    verses: [
      { number: 36, text: "耶穌同門徒來到一個地方，名叫客西馬尼，就對他們說：你們坐在這裡，等我到那邊去禱告。" },
      { number: 39, text: "他就稍往前走，俯伏在地，禱告說：我父啊，倘若可行，求你叫這杯離開我。然而，不要照我的意思，只要照你的意思。" },
    ],
    reflection: "在客西馬尼園，學習主完全順服的榜樣。",
  },
};

type TabType = "morning" | "adventure" | "evening";

const prayerTopics = [
  "感恩讚美", "認罪悔改", "為自己禱告",
  "為家人禱告", "為團員禱告", "為世界禱告",
];

export default function DailyJourney() {
  const [activeTab, setActiveTab] = useState<TabType>("morning");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewingEntry, setViewingEntry] = useState<JournalEntryData | null>(null);

  const [reflection, setReflection] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [prayerContent, setPrayerContent] = useState("");

  const [gratitude, setGratitude] = useState("");
  const [highlight, setHighlight] = useState("");
  const [prayerForTomorrow, setPrayerForTomorrow] = useState("");

  const [isEditingDevotional, setIsEditingDevotional] = useState(false);
  const [isEditingEvening, setIsEditingEvening] = useState(false);

  useEffect(() => {
    setIsEditingDevotional(false);
    setIsEditingEvening(false);
    setReflection("");
    setSelectedTopics([]);
    setPrayerContent("");
    setGratitude("");
    setHighlight("");
    setPrayerForTomorrow("");
  }, [selectedDate]);

  const { user } = useAuth();
  const { data: trip } = useTrip();
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const { data: entries, isLoading: journalLoading } = useJournalEntries(dateStr);
  const createEntry = useCreateJournalEntry();
  const deleteEntry = useDeleteJournalEntry();
  const updateEntry = useUpdateJournalEntry();

  const { data: myDevotional, isLoading: devotionalLoading } = useMyDevotionalEntry(dateStr);
  const saveDevotional = useSaveDevotional();

  const { data: eveningData, isLoading: eveningLoading } = useEveningReflection(dateStr);
  const saveEvening = useSaveEveningReflection();

  const currentDay = useMemo(() => {
    if (!trip?.startDate) return 1;
    const start = parseISO(trip.startDate);
    const diff = differenceInDays(selectedDate, start) + 1;
    return Math.max(1, diff);
  }, [trip?.startDate, selectedDate]);

  const todayScripture = dailyScriptures[currentDay] || dailyScriptures[((currentDay - 1) % 5) + 1];

  const days = useMemo(() => {
    const selected = startOfDay(selectedDate);
    const dayOfWeek = selected.getDay();
    const weekStart = addDays(selected, -dayOfWeek);
    const today = startOfDay(new Date());

    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      return {
        date: format(date, "M/d"),
        day: format(date, "EEEEE", { locale: zhTW }),
        fullDate: date,
        isToday: startOfDay(date).getTime() === today.getTime(),
      };
    });
  }, [selectedDate]);

  const selectedDayIndex = days.findIndex(
    (d) => format(d.fullDate, "yyyy-MM-dd") === dateStr
  );

  const morningCompleted = !!myDevotional?.reflection;
  const adventureCompleted = (entries || []).length > 0;
  const eveningCompleted = !!eveningData?.gratitude;

  const transformedEntries: JournalEntryData[] = (entries || []).map((entry) => ({
    id: entry.id,
    location: entry.location || "",
    time: entry.createdAt ? format(parseISO(entry.createdAt), "HH:mm") : "",
    content: entry.content || "",
    photos: entry.photos?.map((p) => transformPhotoUrl(p.photoUrl)) || [],
    originalPhotoPaths: entry.photos?.map((p) => p.photoUrl) || [],
    mood: undefined,
  }));

  const handleSaveDevotional = async () => {
    await saveDevotional.mutateAsync({
      scriptureReference: todayScripture.reference,
      reflection,
      prayer: [...selectedTopics, prayerContent].filter(Boolean).join("; "),
      date: dateStr,
      id: myDevotional?.id,
    });
    setReflection("");
    setSelectedTopics([]);
    setPrayerContent("");
    setIsEditingDevotional(false);
  };

  const handleEditDevotional = () => {
    if (myDevotional) {
      setReflection(myDevotional.reflection || "");
      const existingPrayer = myDevotional.prayer || "";
      const parts = existingPrayer.split("; ").filter(Boolean);
      const topics = parts.filter(p => prayerTopics.includes(p));
      const freeText = parts.filter(p => !prayerTopics.includes(p)).join("; ");
      setSelectedTopics(topics);
      setPrayerContent(freeText);
      setIsEditingDevotional(true);
    }
  };

  const handleSaveEvening = async () => {
    await saveEvening.mutateAsync({
      gratitude,
      highlight,
      prayerForTomorrow,
      entryDate: dateStr,
    });
    setGratitude("");
    setHighlight("");
    setPrayerForTomorrow("");
    setIsEditingEvening(false);
  };

  const handleEditEvening = () => {
    if (eveningData) {
      setGratitude(eveningData.gratitude || "");
      setHighlight(eveningData.highlight || "");
      setPrayerForTomorrow(eveningData.prayerForTomorrow || "");
      setIsEditingEvening(true);
    }
  };

  const handleSaveJournal = async (newEntry: {
    location: string;
    content: string;
    photos: string[];
    mood: string;
  }) => {
    await createEntry.mutateAsync({
      title: newEntry.location || "日誌",
      content: newEntry.content,
      location: newEntry.location,
      photos: newEntry.photos,
    });
  };

  const handleDeleteEntry = async (id: string) => {
    await deleteEntry.mutateAsync(id);
    setViewingEntry(null);
  };

  const handleUpdateEntry = async (id: string, data: { content: string; location: string; photos?: string[] }) => {
    await updateEntry.mutateAsync({
      id,
      content: data.content,
      location: data.location,
      title: data.location || "日誌",
      photos: data.photos,
    });
    setViewingEntry(prev => {
      if (!prev) return null;
      const updated = { ...prev, content: data.content, location: data.location };
      if (data.photos) {
        updated.originalPhotoPaths = data.photos;
        updated.photos = data.photos.map(p => transformPhotoUrl(p));
      }
      return updated;
    });
  };

  const tabs: { key: TabType; label: string; icon: typeof Sun; completed: boolean }[] = [
    { key: "morning", label: "晨光靈修", icon: Sun, completed: morningCompleted },
    { key: "adventure", label: "旅途探險", icon: Compass, completed: adventureCompleted },
    { key: "evening", label: "夜間感恩", icon: Moon, completed: eveningCompleted },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="每日旅程" />

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6 animate-fade-in">
        {/* Date Selector */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-title">
              {format(selectedDate, "yyyy年M月", { locale: zhTW })}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedDate(prev => addDays(prev, -7))}
                className="p-2 rounded-lg hover:bg-muted transition-colors touch-target"
                data-testid="button-prev-week"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setSelectedDate(new Date())}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                data-testid="button-today"
              >
                今天
              </button>
              <button
                onClick={() => setSelectedDate(prev => addDays(prev, 7))}
                className="p-2 rounded-lg hover:bg-muted transition-colors touch-target"
                data-testid="button-next-week"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {days.map((day, index) => (
              <button
                key={index}
                onClick={() => setSelectedDate(day.fullDate)}
                data-testid={`button-day-${index}`}
                className={cn(
                  "flex-shrink-0 w-16 py-3 rounded-xl flex flex-col items-center gap-1 transition-all touch-target",
                  selectedDayIndex === index
                    ? "gradient-warm text-primary-foreground shadow-card"
                    : "bg-card text-foreground hover:bg-muted"
                )}
              >
                <span className="text-caption">{day.day}</span>
                <span className="text-title">{day.date.split("/")[1]}</span>
                {day.isToday && selectedDayIndex !== index && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Step Tabs */}
        <section className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              data-testid={`tab-${tab.key}`}
              className={cn(
                "flex-1 py-3 rounded-lg flex items-center justify-center gap-1.5 transition-all touch-target relative",
                activeTab === tab.key
                  ? tab.key === "morning"
                    ? "bg-amber-100 text-amber-800 shadow-card dark:bg-amber-900/30 dark:text-amber-200"
                    : tab.key === "adventure"
                    ? "bg-emerald-100 text-emerald-800 shadow-card dark:bg-emerald-900/30 dark:text-emerald-200"
                    : "bg-indigo-100 text-indigo-800 shadow-card dark:bg-indigo-900/30 dark:text-indigo-200"
                  : "bg-card text-muted-foreground hover:bg-muted"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-caption font-medium">{tab.label}</span>
              {tab.completed && (
                <Check className="w-3.5 h-3.5 absolute top-1.5 right-1.5 text-green-600" />
              )}
            </button>
          ))}
        </section>

        {/* Morning Devotion Tab */}
        {activeTab === "morning" && (
          <section className="space-y-5 animate-fade-in">
            {devotionalLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : myDevotional?.reflection && !isEditingDevotional ? (
              <div className="space-y-4">
                <div className="bg-card rounded-lg shadow-card overflow-hidden">
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                        <BookOpen className="w-5 h-5" />
                        <span className="text-body font-semibold">{todayScripture.reference}</span>
                      </div>
                      <button
                        onClick={handleEditDevotional}
                        className="p-2 rounded-lg bg-white/40 hover:bg-white/60 transition-colors"
                        data-testid="button-edit-devotional"
                      >
                        <Pencil className="w-4 h-4 text-amber-800 dark:text-amber-200" />
                      </button>
                    </div>
                    <p className="text-caption text-amber-700/80 dark:text-amber-300/80 mt-1">{todayScripture.theme}</p>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="bg-amber-50/60 dark:bg-amber-900/10 rounded-lg p-3 space-y-2">
                      {todayScripture.verses.map((verse) => (
                        <p key={verse.number} className="text-body text-foreground leading-relaxed">
                          <span className="text-caption font-semibold text-amber-700 dark:text-amber-400 mr-1">{verse.number}</span>
                          {verse.text}
                        </p>
                      ))}
                      <p className="text-body text-muted-foreground italic leading-relaxed pt-1 border-t border-amber-200/50 dark:border-amber-700/30">
                        {todayScripture.reflection}
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-caption font-medium text-green-700 dark:text-green-300">我的靈修心得</p>
                        <p className="text-body text-foreground mt-1">{myDevotional.reflection}</p>
                      </div>
                    </div>
                    {myDevotional.prayer && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-caption font-medium text-muted-foreground mb-1">禱告</p>
                        <p className="text-body text-foreground">{myDevotional.prayer}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Scripture Card */}
                <div className="bg-card rounded-lg shadow-card overflow-hidden">
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                        <BookOpen className="w-5 h-5" />
                        <span className="text-body font-semibold">{todayScripture.reference}</span>
                      </div>
                      <button className="p-2 rounded-full bg-white/40 hover:bg-white/60 transition-colors">
                        <Volume2 className="w-4 h-4 text-amber-800 dark:text-amber-200" />
                      </button>
                    </div>
                    <p className="text-caption text-amber-700/80 dark:text-amber-300/80 mt-1">{todayScripture.theme}</p>
                  </div>
                  <div className="p-5 space-y-4">
                    {todayScripture.verses.map((verse) => (
                      <p key={verse.number} className="text-body leading-relaxed">
                        <span className="text-primary font-semibold text-caption align-super mr-1">{verse.number}</span>
                        {verse.text}
                      </p>
                    ))}
                    <div className="border-t border-border" />
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                      <h4 className="text-caption font-semibold text-amber-700 dark:text-amber-300 mb-2">默想引導</h4>
                      <p className="text-body text-muted-foreground leading-relaxed">{todayScripture.reflection}</p>
                    </div>
                  </div>
                </div>

                {/* Reflection Form */}
                <div className="bg-card rounded-lg shadow-card p-5 space-y-4">
                  <div className="space-y-3">
                    <label className="text-body font-medium flex items-center gap-2">
                      <Heart className="w-5 h-5 text-terracotta" />
                      今日感動
                    </label>
                    <Textarea
                      value={reflection}
                      onChange={(e) => setReflection(e.target.value)}
                      placeholder="這段經文對我說了什麼？我有什麼感動或領受..."
                      className="min-h-[100px] text-body resize-none"
                      data-testid="input-reflection"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-body font-medium">禱告主題</label>
                    <div className="flex flex-wrap gap-2">
                      {prayerTopics.map((topic) => (
                        <button
                          key={topic}
                          onClick={() => setSelectedTopics(prev =>
                            prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
                          )}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-caption transition-all touch-target",
                            selectedTopics.includes(topic)
                              ? "bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200"
                              : "bg-muted text-foreground hover:bg-muted/80"
                          )}
                          data-testid={`topic-${topic}`}
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-body font-medium">禱告內容</label>
                    <Textarea
                      value={prayerContent}
                      onChange={(e) => setPrayerContent(e.target.value)}
                      placeholder="親愛的天父，感謝祢..."
                      className="min-h-[80px] text-body resize-none"
                      data-testid="input-prayer"
                    />
                  </div>

                  {isEditingDevotional && (
                    <Button
                      onClick={() => {
                        setIsEditingDevotional(false);
                        setReflection("");
                        setSelectedTopics([]);
                        setPrayerContent("");
                      }}
                      variant="outline"
                      className="w-full h-12 rounded-xl"
                      data-testid="button-cancel-devotional"
                    >
                      取消編輯
                    </Button>
                  )}
                  <Button
                    onClick={handleSaveDevotional}
                    disabled={!reflection.trim() || saveDevotional.isPending}
                    className="w-full h-12 gradient-warm text-primary-foreground rounded-xl"
                    data-testid="button-save-devotional"
                  >
                    {saveDevotional.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isEditingDevotional ? (
                      "儲存修改"
                    ) : (
                      "完成靈修"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Adventure Tab */}
        {activeTab === "adventure" && (
          <section className="space-y-4 animate-fade-in">
            <div className="bg-card rounded-lg shadow-card p-4">
              <div className="flex items-center justify-around text-center">
                <div>
                  <p className="text-display text-primary" data-testid="text-entry-count">{transformedEntries.length}</p>
                  <p className="text-caption text-muted-foreground">今日記錄</p>
                </div>
                <div className="w-px h-12 bg-border" />
                <div>
                  <p className="text-display text-secondary" data-testid="text-photo-count">
                    {transformedEntries.reduce((acc, e) => acc + e.photos.length, 0)}
                  </p>
                  <p className="text-caption text-muted-foreground">照片數量</p>
                </div>
                <div className="w-px h-12 bg-border" />
                <div>
                  <p className="text-display text-terracotta" data-testid="text-location-count">
                    {new Set(transformedEntries.filter(e => e.location).map(e => e.location)).size}
                  </p>
                  <p className="text-caption text-muted-foreground">景點打卡</p>
                </div>
              </div>
            </div>

            {journalLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : transformedEntries.length > 0 ? (
              <div className="space-y-4">
                {transformedEntries.map((entry) => (
                  <JournalEntry
                    key={entry.id}
                    entry={entry}
                    onClick={() => setViewingEntry(entry)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-lg shadow-card p-8 text-center">
                <Compass className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-body text-muted-foreground">
                  今天還沒有探險記錄，點擊下方按鈕開始記錄吧！
                </p>
              </div>
            )}

            <button
              onClick={() => setIsAddOpen(true)}
              disabled={createEntry.isPending}
              data-testid="button-add-journal"
              className={cn(
                "fixed right-4 bottom-24 w-16 h-16 rounded-full z-40",
                "bg-emerald-500 text-white shadow-elevated",
                "flex items-center justify-center",
                "hover:scale-105 active:scale-95 transition-transform",
                "focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2",
                "disabled:opacity-50"
              )}
            >
              {createEntry.isPending ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <Plus className="w-8 h-8" strokeWidth={2} />
              )}
            </button>
          </section>
        )}

        {/* Evening Tab */}
        {activeTab === "evening" && (
          <section className="space-y-5 animate-fade-in">
            {eveningLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : eveningData?.gratitude && !isEditingEvening ? (
              <div className="bg-card rounded-lg shadow-card overflow-hidden">
                <div className="bg-indigo-100 dark:bg-indigo-900/30 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-200">
                      <Moon className="w-5 h-5" />
                      <span className="text-body font-semibold">今日回顧</span>
                    </div>
                    <button
                      onClick={handleEditEvening}
                      className="p-2 rounded-lg bg-white/40 hover:bg-white/60 transition-colors"
                      data-testid="button-edit-evening"
                    >
                      <Pencil className="w-4 h-4 text-indigo-800 dark:text-indigo-200" />
                    </button>
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-caption font-medium text-green-700 dark:text-green-300">已完成今日回顧</p>
                  </div>
                  {eveningData.gratitude && (
                    <div className="space-y-1">
                      <p className="text-caption font-medium text-muted-foreground">感恩的事</p>
                      <p className="text-body text-foreground">{eveningData.gratitude}</p>
                    </div>
                  )}
                  {eveningData.highlight && (
                    <div className="space-y-1">
                      <p className="text-caption font-medium text-muted-foreground">最美好的時刻</p>
                      <p className="text-body text-foreground">{eveningData.highlight}</p>
                    </div>
                  )}
                  {eveningData.prayerForTomorrow && (
                    <div className="space-y-1">
                      <p className="text-caption font-medium text-muted-foreground">為明天的禱告</p>
                      <p className="text-body text-foreground">{eveningData.prayerForTomorrow}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-lg shadow-card p-5 space-y-5">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 text-center">
                  <Moon className="w-8 h-8 text-indigo-600 dark:text-indigo-300 mx-auto mb-2" />
                  <p className="text-body font-medium text-indigo-800 dark:text-indigo-200">睡前回顧與感恩</p>
                  <p className="text-caption text-indigo-600/70 dark:text-indigo-300/70 mt-1">回顧今天，數算恩典</p>
                </div>

                <div className="space-y-3">
                  <label className="text-body font-medium">今日最感恩的事</label>
                  <Textarea
                    value={gratitude}
                    onChange={(e) => setGratitude(e.target.value)}
                    placeholder="今天最讓我感恩的是..."
                    className="min-h-[80px] text-body resize-none"
                    data-testid="input-gratitude"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-body font-medium">今天最美好的時刻</label>
                  <Textarea
                    value={highlight}
                    onChange={(e) => setHighlight(e.target.value)}
                    placeholder="今天讓我最印象深刻的事情是..."
                    className="min-h-[80px] text-body resize-none"
                    data-testid="input-highlight"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-body font-medium">為明天的禱告</label>
                  <Textarea
                    value={prayerForTomorrow}
                    onChange={(e) => setPrayerForTomorrow(e.target.value)}
                    placeholder="求主帶領明天的旅程..."
                    className="min-h-[80px] text-body resize-none"
                    data-testid="input-prayer-tomorrow"
                  />
                </div>

                {isEditingEvening && (
                  <Button
                    onClick={() => {
                      setIsEditingEvening(false);
                      setGratitude("");
                      setHighlight("");
                      setPrayerForTomorrow("");
                    }}
                    variant="outline"
                    className="w-full h-12 rounded-xl"
                    data-testid="button-cancel-evening"
                  >
                    取消編輯
                  </Button>
                )}
                <Button
                  onClick={handleSaveEvening}
                  disabled={!gratitude.trim() || saveEvening.isPending}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                  data-testid="button-save-evening"
                >
                  {saveEvening.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isEditingEvening ? (
                    "儲存修改"
                  ) : (
                    "完成今日回顧"
                  )}
                </Button>
              </div>
            )}
          </section>
        )}
      </main>

      <AddJournalSheet
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSave={handleSaveJournal}
      />

      <ViewJournalSheet
        entry={viewingEntry}
        open={!!viewingEntry}
        onOpenChange={(open) => !open && setViewingEntry(null)}
        onDelete={handleDeleteEntry}
        onUpdate={handleUpdateEntry}
      />

      <BottomNav />
    </div>
  );
}
