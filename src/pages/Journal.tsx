import { useState } from "react";
import { Plus, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/ui/BottomNav";
import { JournalEntry, JournalEntryData } from "@/components/journal/JournalEntry";
import { AddJournalSheet } from "@/components/journal/AddJournalSheet";
import { cn } from "@/lib/utils";

// Demo data
const demoEntries: JournalEntryData[] = [
  {
    id: "1",
    location: "橄欖山",
    time: "09:45",
    content: "站在橄欖山上俯瞰整個耶路撒冷老城，金頂清真寺在陽光下閃耀。想起耶穌曾在這裡俯瞰這座城市流淚，此刻我也感受到那份深沉的愛。",
    photos: [
      "https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=400",
    ],
    mood: "peaceful",
  },
  {
    id: "2",
    location: "客西馬尼園",
    time: "11:30",
    content: "園中的橄欖樹據說有兩千年歷史，可能見證過耶穌禱告的那一夜。在這裡默禱，心中充滿感恩。",
    photos: [
      "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400",
      "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400",
    ],
    mood: "grateful",
  },
];

const days = [
  { date: "3/15", day: "五", isToday: false },
  { date: "3/16", day: "六", isToday: false },
  { date: "3/17", day: "日", isToday: true },
  { date: "3/18", day: "一", isToday: false },
  { date: "3/19", day: "二", isToday: false },
];

export default function Journal() {
  const [entries, setEntries] = useState<JournalEntryData[]>(demoEntries);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(2); // Index of today

  const handleSaveEntry = (newEntry: {
    location: string;
    content: string;
    photos: string[];
    mood: string;
  }) => {
    const entry: JournalEntryData = {
      id: Date.now().toString(),
      location: newEntry.location,
      time: new Date().toLocaleTimeString("zh-TW", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      content: newEntry.content,
      photos: newEntry.photos,
      mood: newEntry.mood as JournalEntryData["mood"],
    };
    setEntries([entry, ...entries]);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="每日日誌" />

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6 animate-fade-in">
        {/* Date Selector */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-title">2024年3月</h2>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg hover:bg-muted transition-colors touch-target">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg hover:bg-muted transition-colors touch-target">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {days.map((day, index) => (
              <button
                key={index}
                onClick={() => setSelectedDay(index)}
                className={cn(
                  "flex-shrink-0 w-16 py-3 rounded-xl flex flex-col items-center gap-1 transition-all touch-target",
                  selectedDay === index
                    ? "gradient-warm text-primary-foreground shadow-card"
                    : "bg-card text-foreground hover:bg-muted"
                )}
              >
                <span className="text-caption">{day.day}</span>
                <span className="text-title">{day.date.split("/")[1]}</span>
                {day.isToday && selectedDay !== index && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="bg-card rounded-lg shadow-card p-4">
          <div className="flex items-center justify-around text-center">
            <div>
              <p className="text-display text-primary">{entries.length}</p>
              <p className="text-caption text-muted-foreground">今日記錄</p>
            </div>
            <div className="w-px h-12 bg-border" />
            <div>
              <p className="text-display text-secondary">{entries.reduce((acc, e) => acc + e.photos.length, 0)}</p>
              <p className="text-caption text-muted-foreground">照片數量</p>
            </div>
            <div className="w-px h-12 bg-border" />
            <div>
              <p className="text-display text-terracotta">2</p>
              <p className="text-caption text-muted-foreground">景點打卡</p>
            </div>
          </div>
        </section>

        {/* Journal Entries */}
        <section className="space-y-4">
          <h2 className="text-title">今日感言</h2>
          
          {entries.length > 0 ? (
            <div className="space-y-4">
              {entries.map((entry) => (
                <JournalEntry key={entry.id} entry={entry} />
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-lg shadow-card p-8 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-body text-muted-foreground">
                還沒有記錄，點擊下方按鈕開始記錄今天的感動吧！
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Floating Add Button */}
      <button
        onClick={() => setIsAddOpen(true)}
        className={cn(
          "fixed right-4 bottom-24 w-16 h-16 rounded-full",
          "gradient-warm text-primary-foreground shadow-elevated",
          "flex items-center justify-center",
          "hover:scale-105 active:scale-95 transition-transform",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        )}
      >
        <Plus className="w-8 h-8" strokeWidth={2} />
      </button>

      <AddJournalSheet
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSave={handleSaveEntry}
      />

      <BottomNav />
    </div>
  );
}
