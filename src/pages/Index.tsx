import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/ui/BottomNav";
import { TripCard } from "@/components/ui/TripCard";
import { QuickActions } from "@/components/home/QuickActions";
import { TodaySchedule } from "@/components/home/TodaySchedule";
import { DailyDevotional } from "@/components/home/DailyDevotional";

const Index = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      
      <main className="px-4 py-6 max-w-lg mx-auto space-y-8 animate-fade-in">
        {/* Welcome Section */}
        <section className="text-center space-y-2">
          <p className="text-muted-foreground text-body">早安，旅者</p>
          <h1 className="text-display text-foreground">聖地朝聖之旅</h1>
          <p className="text-body-lg text-muted-foreground">
            第 3 天 · 耶路撒冷
          </p>
        </section>

        {/* Current Trip Card */}
        <TripCard
          title="2024 聖地朝聖之旅"
          destination="以色列 · 約旦"
          dateRange="2024年3月15日 - 3月25日"
          memberCount={28}
          isActive
        />

        {/* Today's Schedule */}
        <TodaySchedule />

        {/* Daily Devotional */}
        <DailyDevotional />

        {/* Quick Actions */}
        <QuickActions />
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
