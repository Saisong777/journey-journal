import { CalendarDays, MapPin, Plane } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { DailyDevotional } from "@/components/home/DailyDevotional";
import { TodaySchedule } from "@/components/home/TodaySchedule";
import { QuickActions } from "@/components/home/QuickActions";

const previewSchedule = {
  id: "preview-day-1",
  tripId: "preview-trip",
  dayNo: 1,
  dayNumber: 1,
  date: "2026-05-09",
  cityArea: "耶路撒冷",
  title: "橄欖山到聖城",
  highlights: "橄欖山/客西馬尼園/苦路/聖墓教堂",
  bibleRefs: "詩篇 121; 路加福音 19:37-44",
  breakfast: "飯店早餐",
  lunch: "舊城區餐廳",
  dinner: "團體晚餐",
  lodging: "Jerusalem Hotel",
};

export default function PreviewHome() {
  return (
    <PageLayout showHeader={false}>
      <div className="mx-auto max-w-5xl animate-fade-in space-y-6 px-4 pb-20 pt-6 md:px-6 md:pb-8 lg:px-8">
        <section className="overflow-hidden rounded-sm border border-primary/10 bg-[linear-gradient(135deg,hsl(var(--primary)/0.14)_0%,hsl(var(--background))_48%,hsl(var(--secondary)/0.16)_100%)] px-4 py-4 shadow-card sm:px-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="text-caption text-muted-foreground">早安，旅者</p>
              <h1 className="truncate text-xl font-semibold leading-tight text-foreground sm:text-2xl">
                聖地旅程 · 與神同行
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-caption text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  以色列 / 約旦
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  5月9日 - 5月18日
                </span>
              </div>
            </div>

            <div className="flex-shrink-0 rounded-sm bg-card/86 px-3 py-2 text-center shadow-soft ring-1 ring-border/60">
              <p className="text-caption text-muted-foreground">今日</p>
              <p className="text-2xl font-bold leading-none text-primary">D1</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 rounded-sm border border-white/50 bg-white/58 px-3 py-2 text-caption text-foreground/80 backdrop-blur-sm">
            <span className="inline-flex min-w-0 items-center gap-2">
              <Plane className="h-4 w-4 flex-shrink-0 text-secondary" />
              <span className="truncate">耶路撒冷</span>
            </span>
            <span className="flex-shrink-0 font-medium text-primary">與神同行</span>
          </div>
        </section>

        <DailyDevotional bibleRefs={previewSchedule.bibleRefs} />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <TodaySchedule todaySchedule={previewSchedule} isLoading={false} />
          <QuickActions />
        </div>
      </div>
    </PageLayout>
  );
}
