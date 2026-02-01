import { useState } from "react";
import { BookOpen, Calendar, Users, ChevronRight, Sparkles } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/ui/BottomNav";
import { ScriptureCard, ScriptureData } from "@/components/devotional/ScriptureCard";
import { DevotionalProgress } from "@/components/devotional/DevotionalProgress";
import { ReflectionSheet } from "@/components/devotional/ReflectionSheet";
import { cn } from "@/lib/utils";

// Demo data
const todayScripture: ScriptureData = {
  reference: "詩篇 122:1-4",
  theme: "進入聖城的喜樂",
  verses: [
    { number: 1, text: "人對我說：我們往耶和華的殿去，我就歡喜。" },
    { number: 2, text: "耶路撒冷啊，我們的腳站在你的門內。" },
    { number: 3, text: "耶路撒冷被建造，如同連絡整齊的一座城。" },
    { number: 4, text: "眾支派，就是耶和華的支派，上那裡去，按以色列的常例稱讚耶和華的名。" },
  ],
  reflection:
    "想像自己正走向聖殿，心中充滿期待與喜樂。今天我們親身踏足這塊聖地，讓我們的心也像詩人一樣，向神獻上感恩與讚美。",
};

const progressDays = [
  { day: 1, date: "3/15", title: "啟程 - 出發的心志", completed: true, isToday: false },
  { day: 2, date: "3/16", title: "加利利 - 耶穌的腳蹤", completed: true, isToday: false },
  { day: 3, date: "3/17", title: "耶路撒冷 - 聖城的喜樂", completed: false, isToday: true },
  { day: 4, date: "3/18", title: "橄欖山 - 禱告的榜樣", completed: false, isToday: false },
  { day: 5, date: "3/19", title: "客西馬尼 - 順服的功課", completed: false, isToday: false },
];

type ViewMode = "today" | "progress" | "sharing";

export default function Devotional() {
  const [viewMode, setViewMode] = useState<ViewMode>("today");
  const [isReflectionOpen, setIsReflectionOpen] = useState(false);

  const handleStartReading = () => {
    setIsReflectionOpen(true);
  };

  const handleSaveReflection = (data: { content: string; prayerPoints: string[] }) => {
    console.log("Saved reflection:", data);
    // TODO: Save to backend
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="靈修禱告" />

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6 animate-fade-in">
        {/* Daily Greeting */}
        <section className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
            <Sparkles className="w-4 h-4" />
            <span className="text-caption font-medium">第 3 天靈修</span>
          </div>
          <h1 className="text-title">今日靈糧</h1>
          <p className="text-body text-muted-foreground">
            2024年3月17日 · 耶路撒冷
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
            <ScriptureCard
              scripture={todayScripture}
              onStartReading={handleStartReading}
            />

            {/* Quick Stats */}
            <div className="bg-card rounded-lg shadow-card p-4">
              <div className="flex items-center justify-around text-center">
                <div>
                  <p className="text-display text-primary">3</p>
                  <p className="text-caption text-muted-foreground">已完成天數</p>
                </div>
                <div className="w-px h-12 bg-border" />
                <div>
                  <p className="text-display text-secondary">5</p>
                  <p className="text-caption text-muted-foreground">感言記錄</p>
                </div>
                <div className="w-px h-12 bg-border" />
                <div>
                  <p className="text-display text-terracotta">12</p>
                  <p className="text-caption text-muted-foreground">禱告主題</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Progress View */}
        {viewMode === "progress" && (
          <DevotionalProgress
            days={progressDays}
            currentDay={3}
            totalDays={10}
          />
        )}

        {/* Sharing View */}
        {viewMode === "sharing" && (
          <section className="space-y-4">
            <div className="bg-primary/10 rounded-lg p-4">
              <h3 className="text-body font-semibold text-primary mb-1">團員分享</h3>
              <p className="text-caption text-muted-foreground">
                查看其他團員的靈修感言，一起彼此代禱
              </p>
            </div>

            {/* Shared Reflections */}
            {[
              {
                name: "王大明",
                time: "今天 08:30",
                content: "今天讀到這段經文，想起我們即將踏入耶路撒冷老城，心中充滿感恩...",
                likes: 5,
              },
              {
                name: "李小華",
                time: "今天 07:15",
                content: "詩人的喜樂也是我的喜樂！感謝神讓我有機會來到這裡朝聖。",
                likes: 8,
              },
              {
                name: "張美玲",
                time: "昨天 22:00",
                content: "在加利利的經歷讓我更深認識耶穌的愛，今天繼續靈修收穫滿滿！",
                likes: 12,
              },
            ].map((share, index) => (
              <div key={index} className="bg-card rounded-lg shadow-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-body font-medium text-muted-foreground">
                        {share.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-body font-medium">{share.name}</p>
                      <p className="text-caption text-muted-foreground">{share.time}</p>
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
            ))}
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
