import { useState, useMemo } from "react";
import { BookOpen, Calendar, Users, Sparkles, Loader2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/ui/BottomNav";
import { ScriptureCard, ScriptureData } from "@/components/devotional/ScriptureCard";
import { DevotionalProgress } from "@/components/devotional/DevotionalProgress";
import { ReflectionSheet } from "@/components/devotional/ReflectionSheet";
import { useDevotionalEntries, useMyDevotionalEntry, useSaveDevotional } from "@/hooks/useDevotional";
import { useTrip } from "@/hooks/useTrip";
import { useMembers } from "@/hooks/useMembers";
import { cn } from "@/lib/utils";
import { format, differenceInDays, parseISO, addDays } from "date-fns";

// Daily scriptures for the trip
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
    reflection: "想像自己正走向聖殿，心中充滿期待與喜樂。今天我們親身踏足這塊聖地，讓我們的心也像詩人一樣，向神獻上感恩與讚美。",
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

type ViewMode = "today" | "progress" | "sharing";

export default function Devotional() {
  const [viewMode, setViewMode] = useState<ViewMode>("today");
  const [isReflectionOpen, setIsReflectionOpen] = useState(false);

  const { data: trip } = useTrip();
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: myEntry, isLoading: isLoadingMy } = useMyDevotionalEntry(today);
  const { data: allEntries, isLoading: isLoadingAll } = useDevotionalEntries();
  const { data: members } = useMembers();
  const saveDevotional = useSaveDevotional();

  // Calculate current day of trip
  const currentDay = useMemo(() => {
    if (!trip?.startDate) return 1;
    const start = parseISO(trip.startDate);
    const diff = differenceInDays(new Date(), start) + 1;
    return Math.max(1, Math.min(diff, 10));
  }, [trip?.startDate]);

  // Get today's scripture
  const todayScripture = dailyScriptures[currentDay] || dailyScriptures[3];

  // Generate progress days
  const progressDays = useMemo(() => {
    if (!trip?.startDate) return [];
    const start = parseISO(trip.startDate);
    
    return Array.from({ length: 10 }, (_, i) => {
      const day = i + 1;
      const date = addDays(start, i);
      const scripture = dailyScriptures[day] || { theme: `第 ${day} 天` };
      const hasEntry = allEntries?.some(
        (e) => e.entryDate === format(date, "yyyy-MM-dd") && e.userId === myEntry?.userId
      );
      
      return {
        day,
        date: format(date, "M/d"),
        title: scripture.theme,
        completed: day < currentDay || hasEntry || false,
        isToday: day === currentDay,
      };
    });
  }, [trip?.startDate, currentDay, allEntries, myEntry?.userId]);

  // Get shared reflections from other members
  const sharedReflections = useMemo(() => {
    if (!allEntries || !members) return [];
    
    return allEntries
      .filter((e) => e.reflection)
      .slice(0, 10)
      .map((entry) => {
        const member = members.find((m) => m.userId === entry.userId);
        return {
          name: member?.name || "團員",
          time: entry.createdAt ? format(parseISO(entry.createdAt), "今天 HH:mm") : "",
          content: entry.reflection || "",
          likes: Math.floor(Math.random() * 15),
        };
      });
  }, [allEntries, members]);

  const handleStartReading = () => {
    setIsReflectionOpen(true);
  };

  const handleSaveReflection = async (data: {
    content: string;
    prayerPoints: string[];
  }) => {
    await saveDevotional.mutateAsync({
      scriptureReference: todayScripture.reference,
      reflection: data.content,
      prayer: data.prayerPoints.join(", "),
    });
  };

  // Calculate stats
  const completedDays = progressDays.filter((d) => d.completed).length;
  const totalReflections = allEntries?.filter((e) => e.reflection).length || 0;
  const totalPrayers = allEntries?.filter((e) => e.prayer).length || 0;

  return (
    <div className="min-h-screen bg-background pb-safe-bottom">
      <Header title="靈修禱告" />

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6 animate-fade-in">
        {/* Daily Greeting */}
        <section className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
            <Sparkles className="w-4 h-4" />
            <span className="text-caption font-medium">
              第 {currentDay} 天靈修
            </span>
          </div>
          <h1 className="text-title">今日靈糧</h1>
          <p className="text-body text-muted-foreground">
            {format(new Date(), "yyyy年M月d日")} · {trip?.destination || "聖地"}
          </p>
        </section>

        {/* View Toggle */}
        <section className="flex gap-2">
          {[
            { key: "today", label: "今日靈修", icon: BookOpen },
            { key: "progress", label: "進度", icon: Calendar },
            { key: "sharing", label: "分享", icon: Users },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setViewMode(tab.key as ViewMode)}
              className={cn(
                "flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition-all touch-target",
                viewMode === tab.key
                  ? "gradient-olive text-secondary-foreground shadow-card"
                  : "bg-card text-foreground hover:bg-muted"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-caption font-medium">{tab.label}</span>
            </button>
          ))}
        </section>

        {/* Today View */}
        {viewMode === "today" && (
          <section className="space-y-6">
            {isLoadingMy ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <ScriptureCard
                scripture={todayScripture}
                onStartReading={handleStartReading}
              />
            )}

            {/* Quick Stats */}
            <div className="bg-card rounded-lg shadow-card p-4">
              <div className="flex items-center justify-around text-center">
                <div>
                  <p className="text-display text-primary">{completedDays}</p>
                  <p className="text-caption text-muted-foreground">已完成天數</p>
                </div>
                <div className="w-px h-12 bg-border" />
                <div>
                  <p className="text-display text-secondary">{totalReflections}</p>
                  <p className="text-caption text-muted-foreground">感言記錄</p>
                </div>
                <div className="w-px h-12 bg-border" />
                <div>
                  <p className="text-display text-terracotta">{totalPrayers}</p>
                  <p className="text-caption text-muted-foreground">禱告主題</p>
                </div>
              </div>
            </div>

            {/* Show existing reflection if any */}
            {myEntry?.reflection && (
              <div className="bg-olive-light/30 rounded-lg p-4 space-y-2">
                <p className="text-caption font-medium text-secondary">
                  今日感言
                </p>
                <p className="text-body text-foreground">{myEntry.reflection}</p>
              </div>
            )}
          </section>
        )}

        {/* Progress View */}
        {viewMode === "progress" && (
          <DevotionalProgress
            days={progressDays}
            currentDay={currentDay}
            totalDays={10}
          />
        )}

        {/* Sharing View */}
        {viewMode === "sharing" && (
          <section className="space-y-4">
            <div className="bg-primary/10 rounded-lg p-4">
              <h3 className="text-body font-semibold text-primary mb-1">
                團員分享
              </h3>
              <p className="text-caption text-muted-foreground">
                查看其他團員的靈修感言，一起彼此代禱
              </p>
            </div>

            {isLoadingAll ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : sharedReflections.length > 0 ? (
              sharedReflections.map((share, index) => (
                <div
                  key={index}
                  className="bg-card rounded-lg shadow-card p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-body font-medium text-muted-foreground">
                          {share.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-body font-medium">{share.name}</p>
                        <p className="text-caption text-muted-foreground">
                          {share.time}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-body text-foreground leading-relaxed">
                    {share.content}
                  </p>
                  <div className="flex items-center gap-4 text-caption text-muted-foreground">
                    <button className="flex items-center gap-1 hover:text-terracotta transition-colors">
                      ❤️ {share.likes}
                    </button>
                    <button className="hover:text-primary transition-colors">
                      回應
                    </button>
                    <button className="hover:text-primary transition-colors">
                      為他禱告
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-body">還沒有團員分享</p>
              </div>
            )}
          </section>
        )}
      </main>

      <ReflectionSheet
        open={isReflectionOpen}
        onOpenChange={setIsReflectionOpen}
        scripture={todayScripture.reference}
        onSave={handleSaveReflection}
      />

      <BottomNav />
    </div>
  );
}
