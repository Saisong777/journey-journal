import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/ui/BottomNav";
import { TripCard } from "@/components/ui/TripCard";
import { QuickActions } from "@/components/home/QuickActions";
import { TodaySchedule } from "@/components/home/TodaySchedule";
import { DailyDevotional } from "@/components/home/DailyDevotional";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthToken } from "@/lib/queryClient";

interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  userRole: string;
}

interface TripDay {
  id: string;
  tripId: string;
  dayNo: number;
  date: string;
  cityArea: string;
  title: string;
  highlights: string;
  bibleRefs: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  lodging: string;
  dayNumber: number;
  isPreTrip?: boolean;
  isPostTrip?: boolean;
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startStr = `${start.getFullYear()}年${start.getMonth() + 1}月${start.getDate()}日`;
  const endStr = `${end.getMonth() + 1}月${end.getDate()}日`;
  return `${startStr} - ${endStr}`;
}

function calculateDayNumber(startDate: string): number {
  const start = new Date(startDate);
  const today = new Date();
  const diffTime = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "早安，旅者";
  if (hour < 18) return "午安，旅者";
  return "晚安，旅者";
}

const Index = () => {
  const { user } = useAuth();

  const { data: trip, isLoading: tripLoading } = useQuery<Trip>({
    queryKey: ["/api/trip"],
    queryFn: async () => {
      const token = getAuthToken();
      const response = await fetch("/api/trip", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!user,
  });

  const { data: todaySchedule, isLoading: scheduleLoading } = useQuery<TripDay>({
    queryKey: ["/api/trip-days/today"],
    queryFn: async () => {
      const token = getAuthToken();
      const response = await fetch("/api/trip-days/today", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!user,
  });

  const { data: memberCount } = useQuery<number>({
    queryKey: ["/api/members", "count"],
    queryFn: async () => {
      const token = getAuthToken();
      const response = await fetch("/api/members", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) return 0;
      const members = await response.json();
      return members.length;
    },
    enabled: !!user,
  });

  const dayNumber = trip?.startDate ? calculateDayNumber(trip.startDate) : 1;
  const currentCity = todaySchedule?.cityArea || "準備中";

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      
      <main className="px-4 py-6 max-w-lg mx-auto space-y-8 animate-fade-in">
        {tripLoading ? (
          <section className="text-center space-y-2">
            <Skeleton className="h-5 w-24 mx-auto" />
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-5 w-32 mx-auto" />
          </section>
        ) : trip ? (
          <section className="text-center space-y-2">
            <p className="text-muted-foreground text-body">{getGreeting()}</p>
            <h1 className="text-display text-foreground" data-testid="text-trip-title">{trip.title}</h1>
            <p className="text-body-lg text-muted-foreground" data-testid="text-day-info">
              第 {dayNumber} 天 · {currentCity}
            </p>
          </section>
        ) : (
          <section className="text-center space-y-2">
            <p className="text-muted-foreground text-body">{getGreeting()}</p>
            <h1 className="text-display text-foreground">朝聖之旅</h1>
            <p className="text-body-lg text-muted-foreground">
              尚未加入任何旅程
            </p>
          </section>
        )}

        {tripLoading ? (
          <Skeleton className="h-32 w-full rounded-lg" />
        ) : trip ? (
          <TripCard
            title={trip.title}
            destination={trip.destination || ""}
            dateRange={formatDateRange(trip.startDate, trip.endDate)}
            memberCount={memberCount || 0}
            isActive
          />
        ) : null}

        <TodaySchedule todaySchedule={todaySchedule} isLoading={scheduleLoading} />

        <DailyDevotional bibleRefs={todaySchedule?.bibleRefs} />

        <QuickActions />
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
