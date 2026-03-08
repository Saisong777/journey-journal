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

  const dayNumber = trip?.startDate ? calculateDayNumber(trip.startDate) : 1;
  const countdown = trip?.startDate ? calculateCountdown(trip.startDate) : 0;
  const isTripStarted = dayNumber >= 1;
  const userName = profile?.name || "旅者";
  const hasBibleRefs = !!todaySchedule?.bibleRefs && todaySchedule.bibleRefs.trim().length > 0;

  return (
    <PageLayout showHeader={false}>
      <div className="px-4 md:px-8 py-6 pb-32 container max-w-5xl mx-auto space-y-8 animate-fade-in">
        {tripLoading ? (
          <section className="text-center space-y-3">
            <Skeleton className="h-5 w-32 mx-auto" />
            <Skeleton className="h-8 w-56 mx-auto" />
            <Skeleton className="h-12 w-40 mx-auto" />
          </section>
        ) : trip ? (
          <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 rounded-2xl p-6 md:p-8 text-center space-y-4 shadow-card border border-primary/10" data-testid="section-hero">
            <h1 className="text-display text-foreground" data-testid="text-trip-title">{trip.title}</h1>

            {isTripStarted ? (
              <>
                <p className="text-body-lg text-muted-foreground">
                  {getGreeting()}，{userName}，願神與您同在，今天是
                </p>
                <p className="text-6xl font-bold text-primary" data-testid="text-day-number">
                  第 {dayNumber} 天
                </p>
                {todaySchedule?.title && (
                  <div className="flex items-center justify-center gap-2 text-body-lg text-foreground mt-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span className="font-medium">{todaySchedule.title}</span>
                  </div>
                )}
                {todaySchedule?.cityArea && (
                  <p className="text-body text-muted-foreground">{todaySchedule.cityArea}</p>
                )}
              </>
            ) : (
              <>
                <p className="text-body text-muted-foreground">
                  平安，{userName}，距離旅遊時間還有倒數
                </p>
                <p className="text-5xl font-bold text-primary" data-testid="text-countdown">
                  {countdown} 天
                </p>
                {todaySchedule?.title && (
                  <div className="flex items-center justify-center gap-2 text-sm text-foreground/80 mt-1">
                    <Plane className="w-4 h-4 text-primary" />
                    <span>{todaySchedule.title}</span>
                  </div>
                )}
              </>
            )}
          </section>
        ) : (
          <section className="text-center space-y-2">
            <p className="text-muted-foreground text-body">{getGreeting()}，{userName}</p>
            <h1 className="text-display text-foreground">朝聖之旅</h1>
            <p className="text-body-lg text-muted-foreground">
              尚未加入任何旅程
            </p>
          </section>
        )}

        {hasBibleRefs && (
          <DailyDevotional bibleRefs={todaySchedule?.bibleRefs} />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <TodaySchedule todaySchedule={todaySchedule} isLoading={scheduleLoading} />
          </div>
          <div>
            <QuickActions />
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Index;
