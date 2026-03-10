import { useState, useMemo } from "react";
import { BookOpen, Calendar, Users, Sparkles, Loader2 } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { ScriptureCard, ScriptureData } from "@/components/devotional/ScriptureCard";
import { DevotionalProgress } from "@/components/devotional/DevotionalProgress";
import { ReflectionSheet } from "@/components/devotional/ReflectionSheet";
import { useDevotionalEntries, useMyDevotionalEntry, useSaveDevotional } from "@/hooks/useDevotional";
import { useTrip } from "@/hooks/useTrip";
import { useMembers } from "@/hooks/useMembers";
import { cn } from "@/lib/utils";
import { format, differenceInDays, parseISO, addDays } from "date-fns";

// Daily scriptures for the trip - imported from devotional CSV
const dailyScriptures: Record<number, ScriptureData> = {
  1: {
    reference: "創12:1",
    theme: "離開，是看見自己的開始",
    verses: [],
    place: "機上→伊斯坦堡",
    reflection: "飛機起飛的那一刻，你離開了熟悉的一切——日常節奏、角色責任、習慣軌道。旅行的意義不只是去哪裡，而是離開之後，你才發現自己一直抓著什麼不放。亞伯拉罕被呼召離開時，目的地是「我要指示你的地方」——連地址都沒有。離開，需要的不是資訊，是信任。",
    action: "寫下兩句話：「這趟旅程，我最想放下的是＿＿＿」和「我最怕發生的是＿＿＿」。寫完後不修改，收起來。",
    prayer: "神啊，我帶著期待也帶著不安出發。在三萬英尺的高空，讓我開始卸下平日的面具，進入祢的節奏。",
    lifeQuestion: "離開日常軌道後，你心裡第一個浮上來的情緒是什麼？它透露了你內心真正的狀態嗎？",
  },
  2: {
    reference: "彼前2:11",
    theme: "不舒服的地方，往往是成長的入口",
    verses: [],
    place: "伊斯坦堡（接機／自由活動）",
    reflection: "踏上陌生的土地，語言不通、路不熟、食物不同。這種「不舒服感」其實是好的——它打破你的自動駕駛模式，讓感官重新甦醒。彼得寫信給「分散各處」的信徒，提醒他們本來就是客旅。當我們承認自己不是什麼都懂，反而變得柔軟、開放、謙卑。",
    action: "今天遇到任何不順——延誤、迷路、溝通不良——練習一句話：「這正在教我什麼？」不急著抱怨，先觀察自己的反應。",
    prayer: "主啊，讓我在陌生中不急著掌控，而是學會放鬆、信任、接受。讓不舒服成為我柔軟的起點。",
    lifeQuestion: "你上一次處在完全陌生的環境是什麼時候？那段經驗，改變了你什麼？",
  },
  3: {
    reference: "傳3:11",
    theme: "壯觀的建築背後，是人心深處對「永恆」的渴望",
    verses: [],
    place: "伊斯坦堡（聖索菲亞／藍色清真寺／跑馬場／托普卡匹）",
    reflection: "聖索菲亞大教堂一千五百年來從教堂變清真寺、變博物館、又變回清真寺。外在形式不斷翻轉，但人心對「比我更大的存在」的渴望從未消失。仰頭看穹頂時，無論你信什麼，那份「被震撼」的感覺是真實的——那就是永恆在你心裡回響。",
    action: "找一個角落，三分鐘不拍照、不打卡，只是抬頭看、深呼吸，然後問自己：「我心裡最深的渴望是什麼？」",
    prayer: "造物主啊，千年來人類不斷蓋起壯觀的殿堂尋找祢。此刻，我也站在這裡，帶著我的渴望和疑問。",
    lifeQuestion: "站在壯觀的古蹟前，那種「被震撼」的感覺從何而來？你覺得那份渴望指向什麼？",
  },
  4: {
    reference: "雅1:14",
    theme: "最大的威脅，常是你親手請進來的",
    verses: [],
    place: "恰納卡萊／達達尼爾海峽／特洛伊",
    reflection: "特洛伊人打了十年仗沒有輸，卻被一匹「禮物」毀滅。木馬最可怕的地方不是它的設計，而是有人決定把它拉進城門。我們的生命也一樣——真正的威脅往往不是外來的壓力，而是我們以為無害、甚至以為是安慰的習慣或依賴。",
    action: "寫下你生命中的一匹「木馬」（手機成癮、討好、比較心、逃避衝突、用忙碌麻痺自己……），然後寫一句：「我看見你了，你不再是我的保護。」",
    prayer: "主啊，給我誠實面對自己的勇氣。幫助我辨認那些偽裝成安慰的破壞，不再讓它進門。",
    lifeQuestion: "如果你的生活是一座城，什麼是你明知有風險、卻一直捨不得關門拒絕的「木馬」？",
  },
  5: {
    reference: "詩46:10",
    theme: "在噪音中刻意安靜，是一種勇敢",
    verses: [],
    place: "特羅亞Troas／亞朔Assos",
    reflection: "特羅亞是保羅跨向歐洲宣教的起點——也是少年猶推古因疲憊睡著而墜樓的地方（徒20:9）。旅程到了中段，興奮感退去，疲憊感上來——這時最容易「靈性墜樓」。但在亞朔，保羅刻意讓同工搭船，自己選擇獨自步行。在最忙的時候爭取安靜，不是浪費時間，是為了聽見最重要的聲音。",
    action: "今天安排十分鐘「獨行時間」：不說話、不拍照、不看手機，只是走路、呼吸、聽風。把一個重擔在心裡默默交出去。",
    prayer: "神啊，在所有聲音之下，讓我聽見祢安靜的聲音——或者至少，讓我聽見自己真正的心聲。",
    lifeQuestion: "你最近一次在完全安靜中待超過十分鐘是什麼時候？那時你腦海裡浮現了什麼？",
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
    return Math.max(1, Math.min(diff, 16));
  }, [trip?.startDate]);

  // Get today's scripture
  const todayScripture = dailyScriptures[currentDay] || dailyScriptures[3];

  // Generate progress days
  const progressDays = useMemo(() => {
    if (!trip?.startDate) return [];
    const start = parseISO(trip.startDate);
    
    return Array.from({ length: 16 }, (_, i) => {
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
    <PageLayout title="靈修禱告">
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6 animate-fade-in">
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
            totalDays={16}
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
      </div>

      <ReflectionSheet
        open={isReflectionOpen}
        onOpenChange={setIsReflectionOpen}
        scripture={todayScripture.reference}
        onSave={handleSaveReflection}
      />
    </PageLayout>
  );
}
