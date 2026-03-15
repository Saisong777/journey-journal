import { PageLayout } from "@/components/layout/PageLayout";
import { QuickActions } from "@/components/home/QuickActions";
import { TodaySchedule } from "@/components/home/TodaySchedule";
import { DailyDevotional } from "@/components/home/DailyDevotional";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthToken } from "@/lib/queryClient";
import { MapPin, Plane } from "lucide-react";

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

interface Profile {
  id: string;
  name: string;
  email: string;
}

function calculateDayNumber(startDate: string): number {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
}

function calculateCountdown(startDate: string): number {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = start.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "早安";
  if (hour < 18) return "午安";
  return "晚安";
}

const Index = () => {
  const { user } = useAuth();

  const { data: profile } = useQuery<Profile>({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

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

  const calculatedDay = trip?.startDate ? calculateDayNumber(trip.startDate) : 1;
  const dayNumber = todaySchedule?.dayNumber ?? calculatedDay;
  const countdown = trip?.startDate ? calculateCountdown(trip.startDate) : 0;
  const isTripStarted = dayNumber >= 1;
  const userName = profile?.name || "旅者";
  const hasBibleRefs = !!todaySchedule?.bibleRefs && todaySchedule.bibleRefs.trim().length > 0;
  const hasSchedule = !!todaySchedule && !todaySchedule.isPreTrip;

  return (
    <PageLayout showHeader={false}>
      <div className="px-4 md:px-6 lg:px-8 pt-6 pb-20 md:pb-8 max-w-5xl mx-auto space-y-6 animate-fade-in">
        {tripLoading ? (
          <section className="text-center space-y-3">
            <Skeleton className="h-5 w-32 mx-auto" />
            <Skeleton className="h-8 w-56 mx-auto" />
            <Skeleton className="h-12 w-40 mx-auto" />
          </section>
        ) : trip ? (
          <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 rounded-xl px-4 py-3 text-center shadow-card border border-primary/10" data-testid="section-hero">
            {isTripStarted ? (
              <div className="flex items-center justify-between gap-3">
                <div className="text-left min-w-0 flex-1">
                  <p className="text-caption text-muted-foreground">{getGreeting()}，{userName}</p>
                  <p className="text-body font-medium text-foreground truncate" data-testid="text-trip-title">{trip.title}</p>
                </div>
                <div className="text-center flex-shrink-0">
                  <p className="text-2xl font-bold text-primary leading-none" data-testid="text-day-number">第{dayNumber}天</p>
                  {todaySchedule?.cityArea && (
                    <p className="text-caption text-muted-foreground mt-0.5">{todaySchedule.cityArea}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="text-left min-w-0 flex-1">
                  <p className="text-caption text-muted-foreground">平安，{userName}</p>
                  <p className="text-body font-medium text-foreground truncate" data-testid="text-trip-title">{trip.title}</p>
                </div>
                <div className="text-center flex-shrink-0">
                  <p className="text-caption text-muted-foreground">出發倒數</p>
                  <p className="text-2xl font-bold text-primary leading-none" data-testid="text-countdown">{countdown}天</p>
                </div>
              </div>
            )}
          </section>
        ) : (
          <section className="text-center space-y-2">
            <p className="text-muted-foreground text-body">{getGreeting()}，{userName}</p>
            <h1 className="text-display text-foreground">平安同行</h1>
            <p className="text-body-lg text-muted-foreground">
              尚未加入任何旅程
            </p>
          </section>
        )}

        {hasBibleRefs && (
          <DailyDevotional bibleRefs={todaySchedule?.bibleRefs} />
        )}

        {hasSchedule ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TodaySchedule todaySchedule={todaySchedule} isLoading={scheduleLoading} />
            <QuickActions />
          </div>
        ) : (
          <div className="space-y-6">
            {scheduleLoading && <TodaySchedule todaySchedule={todaySchedule} isLoading={scheduleLoading} />}
            <QuickActions />
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Index;
