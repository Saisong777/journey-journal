import { PageLayout } from "@/components/layout/PageLayout";
import { QuickActions } from "@/components/home/QuickActions";
import { TodaySchedule } from "@/components/home/TodaySchedule";
import { DailyDevotional } from "@/components/home/DailyDevotional";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthToken } from "@/lib/queryClient";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, BookOpen, CalendarDays, CheckCircle2, ClipboardCheck, Compass, MapPin, Moon, PenLine, Plane, Sparkles } from "lucide-react";
import { useJournalEntries } from "@/hooks/useJournalEntries";
import { useDevotionalEntries } from "@/hooks/useDevotional";
import { useEveningReflection } from "@/hooks/useEveningReflection";

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
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  dietaryRestrictions?: string | null;
  medicalNotes?: string | null;
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

function formatDateRange(startDate: string, endDate: string): string {
  const formatter = new Intl.DateTimeFormat("zh-TW", {
    month: "short",
    day: "numeric",
  });
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${startDate} - ${endDate}`;
  }

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

function getTripPhase(todaySchedule: TripDay | undefined, countdown: number, dayNumber: number) {
  if (todaySchedule?.isPostTrip) {
    return { eyebrow: "旅程回顧", value: "回顧" };
  }
  if (todaySchedule?.isPreTrip || countdown > 0) {
    return { eyebrow: "倒數", value: `${Math.max(countdown, 0)}天` };
  }
  return { eyebrow: "今日", value: `D${dayNumber}` };
}

function TodayActionRail({ hasBibleRefs, hasSchedule }: { hasBibleRefs: boolean; hasSchedule: boolean }) {
  const actions = [
    {
      label: "看今日行程",
      description: hasSchedule ? "確認下一站與餐宿" : "等待行程發布",
      icon: CalendarDays,
      to: "#today-schedule",
      disabled: !hasSchedule,
    },
    {
      label: "開始靈修",
      description: hasBibleRefs ? "使用今日經文" : "記錄默想與禱告",
      icon: BookOpen,
      to: "/daily-journey",
      disabled: false,
    },
    {
      label: "隨手記錄",
      description: "照片、感動、感恩",
      icon: PenLine,
      to: "/daily-journey",
      disabled: false,
    },
    {
      label: "集合簽到",
      description: "集合時確認狀態",
      icon: ClipboardCheck,
      to: "/roll-call",
      disabled: false,
    },
  ];

  return (
    <section className="rounded-sm border border-border/70 bg-card/90 p-3 shadow-card" data-testid="section-today-actions">
      <div className="mb-3 flex items-center justify-between px-1">
        <div>
          <p className="text-caption text-muted-foreground">Today</p>
          <h2 className="text-title">今天先做這幾件事</h2>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;
          const content = (
            <>
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 text-left">
                <p className="truncate text-sm font-semibold text-foreground">{action.label}</p>
                <p className="line-clamp-1 text-xs text-muted-foreground">{action.description}</p>
              </div>
            </>
          );

          if (action.disabled) {
            return (
              <div
                key={action.label}
                className="flex min-h-[72px] items-center gap-2 rounded-sm border border-border/60 bg-muted/40 p-2.5 opacity-70"
              >
                {content}
              </div>
            );
          }

          if (action.to.startsWith("#")) {
            return (
              <a
                key={action.label}
                href={action.to}
                className="flex min-h-[72px] items-center gap-2 rounded-sm border border-border/60 bg-background p-2.5 transition-colors hover:bg-muted/60"
              >
                {content}
              </a>
            );
          }

          return (
            <Link
              key={action.label}
              to={action.to}
              className="flex min-h-[72px] items-center gap-2 rounded-sm border border-border/60 bg-background p-2.5 transition-colors hover:bg-muted/60"
            >
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function TodayMissionCenter({
  date,
  hasSchedule,
  hasBibleRefs,
}: {
  date?: string;
  hasSchedule: boolean;
  hasBibleRefs: boolean;
}) {
  const { data: journalEntries = [] } = useJournalEntries(date);
  const { data: devotionalEntries = [] } = useDevotionalEntries(date);
  const { data: eveningReflection } = useEveningReflection(date || "");

  const journalDone = journalEntries.length > 0;
  const devotionalDone = devotionalEntries.length > 0;
  const eveningDone = Boolean(
    eveningReflection?.gratitude || eveningReflection?.highlight || eveningReflection?.prayerForTomorrow
  );

  const missions = [
    {
      label: "確認今日行程",
      detail: hasSchedule ? "先知道下一站、餐食與住宿" : "行程發布後會出現在這裡",
      icon: Compass,
      done: hasSchedule,
      to: "#today-schedule",
      disabled: !hasSchedule,
    },
    {
      label: "完成今日靈修",
      detail: hasBibleRefs ? "讀經、默想、禱告" : "沒有指定經文也可寫下禱告",
      icon: BookOpen,
      done: devotionalDone,
      to: `/daily-journey?tab=morning${date ? `&date=${date}` : ""}`,
      disabled: false,
    },
    {
      label: "留下旅途記錄",
      detail: "照片、地點、感動與看見",
      icon: PenLine,
      done: journalDone,
      to: `/daily-journey?tab=adventure&newJournal=1${date ? `&date=${date}` : ""}`,
      disabled: false,
    },
    {
      label: "夜間感恩回顧",
      detail: "睡前記下今天的恩典",
      icon: Moon,
      done: eveningDone,
      to: `/daily-journey?tab=evening${date ? `&date=${date}` : ""}`,
      disabled: false,
    },
  ];

  const doneCount = missions.filter((mission) => mission.done).length;
  const nextMission = missions.find((mission) => !mission.done && !mission.disabled) || missions.find((mission) => !mission.disabled);

  return (
    <section className="rounded-sm border border-border/70 bg-card p-4 shadow-card" data-testid="section-today-missions">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-caption text-muted-foreground">Mission</p>
          <h2 className="text-title">今日任務中心</h2>
          <p className="mt-1 text-caption text-muted-foreground">
            {doneCount}/4 完成，旅途中照這個順序走就好。
          </p>
        </div>
        {nextMission && (
          <Link
            to={nextMission.to}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            下一步：{nextMission.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      <div className="mt-4 h-2 rounded-full bg-muted">
        <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${(doneCount / missions.length) * 100}%` }} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {missions.map((mission) => {
          const Icon = mission.icon;
          const content = (
            <>
              <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${mission.done ? "bg-green-100 text-green-700" : "bg-primary/10 text-primary"}`}>
                {mission.done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{mission.label}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{mission.detail}</p>
              </div>
            </>
          );

          if (mission.disabled) {
            return (
              <div key={mission.label} className="flex min-h-[82px] items-center gap-3 rounded-md border border-border bg-muted/40 p-3 opacity-70">
                {content}
              </div>
            );
          }

          return (
            <Link
              key={mission.label}
              to={mission.to}
              className="flex min-h-[82px] items-center gap-3 rounded-md border border-border bg-background p-3 transition-colors hover:bg-muted/60"
            >
              {content}
            </Link>
          );
        })}
      </div>

      {doneCount === missions.length && (
        <div className="mt-4 flex items-start gap-3 rounded-md border border-green-200 bg-green-50 p-3 text-green-900">
          <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p className="text-sm font-medium">今天的核心記錄都完成了，可以安心享受旅程與休息。</p>
        </div>
      )}
    </section>
  );
}

function HomeSafetyNudge({ profile }: { profile?: Profile }) {
  if (!profile) return null;

  const checks = [
    { label: "姓名", done: Boolean(profile.name?.trim()) },
    { label: "緊急聯絡", done: Boolean(profile.emergencyContactName?.trim() && profile.emergencyContactPhone?.trim()) },
    { label: "飲食需求", done: Boolean(profile.dietaryRestrictions?.trim()) },
    { label: "醫療備註", done: Boolean(profile.medicalNotes?.trim()) },
  ];
  const doneCount = checks.filter((check) => check.done).length;
  const missing = checks.filter((check) => !check.done);

  if (missing.length === 0) {
    return (
      <section className="flex items-center gap-3 rounded-sm border border-green-200 bg-green-50 p-3 text-green-900 shadow-card">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold">旅途安心資料已補齊</p>
          <p className="text-xs text-green-800/80">領隊需要聯絡或照顧特殊需求時，可以更快處理。</p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-sm border border-amber-200 bg-amber-50 p-3 text-amber-950 shadow-card">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold">旅途安心資料 {doneCount}/4</p>
              <p className="mt-0.5 text-xs text-amber-900/80">
                還缺 {missing.map((item) => item.label).join("、")}，出發前補齊會更安心。
              </p>
            </div>
            <Link
              to="/settings?setup=1"
              className="inline-flex flex-shrink-0 items-center justify-center rounded-sm bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700"
            >
              補齊資料
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
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
  const tripPhase = getTripPhase(todaySchedule, countdown, dayNumber);

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
          <section className="overflow-hidden rounded-sm border border-primary/10 bg-[linear-gradient(135deg,hsl(var(--primary)/0.14)_0%,hsl(var(--background))_48%,hsl(var(--secondary)/0.16)_100%)] px-4 py-4 shadow-card sm:px-5" data-testid="section-hero">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="text-caption text-muted-foreground">{getGreeting()}，{userName}</p>
                <h1 className="truncate text-xl font-semibold leading-tight text-foreground sm:text-2xl" data-testid="text-trip-title">
                  {trip.title}
                </h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-caption text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {trip.destination}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDateRange(trip.startDate, trip.endDate)}
                  </span>
                </div>
              </div>

              <div className="flex-shrink-0 rounded-sm bg-card/86 px-3 py-2 text-center shadow-soft ring-1 ring-border/60">
                <p className="text-caption text-muted-foreground">{tripPhase.eyebrow}</p>
                <p className="text-2xl font-bold leading-none text-primary" data-testid="text-trip-phase">{tripPhase.value}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-sm border border-white/50 bg-white/58 px-3 py-2 text-caption text-foreground/80 backdrop-blur-sm">
              <span className="inline-flex min-w-0 items-center gap-2">
                <Plane className="h-4 w-4 flex-shrink-0 text-secondary" />
                <span className="truncate">
                  {todaySchedule?.cityArea || (isTripStarted ? "今日行程準備中" : "預備出發")}
                </span>
              </span>
              <span className="flex-shrink-0 font-medium text-primary">
                {todaySchedule?.isPostTrip ? "回顧恩典" : isTripStarted ? "與神同行" : "旅程將啟程"}
              </span>
            </div>
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

        {trip && <HomeSafetyNudge profile={profile} />}

        {trip && (
          <TodayMissionCenter date={todaySchedule?.date} hasBibleRefs={hasBibleRefs} hasSchedule={hasSchedule} />
        )}

        {trip && <TodayActionRail hasBibleRefs={hasBibleRefs} hasSchedule={hasSchedule} />}

        {hasBibleRefs && (
          <DailyDevotional bibleRefs={todaySchedule?.bibleRefs} />
        )}

        {hasSchedule ? (
          <div id="today-schedule" className="grid scroll-mt-4 grid-cols-1 gap-6 md:grid-cols-2">
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
