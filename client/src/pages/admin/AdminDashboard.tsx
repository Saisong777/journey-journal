import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileText,
  HelpCircle,
  Layers,
  Map,
  MapPinned,
  Loader2,
  Ticket,
  Users,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAllGroups, useAllProfiles, useAllTrips } from "@/hooks/useAdmin";
import { getAuthToken } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type AdminTrip = {
  id: string;
  title: string;
  destination?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

type AdminGroup = {
  id: string;
  tripId: string;
  name: string;
};

type AdminMember = {
  id: string;
  groupId?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
};

type AdminAttraction = {
  id: string;
  gps?: string | null;
};

type AdminInvitation = {
  id: string;
  isActive?: boolean | null;
};

type AdminResource = {
  id: string;
};

type ChecklistItem = {
  label: string;
  detail: string;
  done: boolean;
  icon: typeof CheckCircle2;
  to: string;
};

type HelpContentResponse = {
  content: string;
  isDefault?: boolean;
};

type SystemStatusResponse = {
  ok: boolean;
  checkedAt: string;
  environment: string;
  integrations: {
    googleOAuth: boolean;
    email: boolean;
    uploads: boolean;
    sessionSecret: boolean;
  };
  counts: {
    trips: number;
    profiles: number;
    groups: number;
    roles: number;
    invitations: number;
  };
  activeTrip: null | {
    title: string;
    readiness: number;
    counts: {
      days: number;
      members: number;
      groups: number;
      attractions: number;
      devotionals: number;
      notes: number;
      invitations: number;
    };
    risks: {
      membersMissingEmergency: number;
      membersWithoutGroup: number;
      attractionsMissingGps: number;
    };
  };
};

const SELECTED_TRIP_STORAGE_KEY = "admin_dashboard_selected_trip_id";

function getInclusiveDays(startDate?: string | null, endDate?: string | null) {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.max(1, Math.round((end - start) / 86400000) + 1);
}

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function useTripResource<T>(tripId: string | null, resource: string) {
  return useQuery<T[]>({
    queryKey: ["admin-dashboard", tripId, resource],
    queryFn: async () => {
      const response = await fetch(`/api/admin/trips/${tripId}/${resource}`, {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error(`Failed to fetch ${resource}`);
      return response.json();
    },
    enabled: !!tripId,
  });
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const { data: trips = [], isLoading: tripsLoading } = useAllTrips();
  const { data: profiles = [], isLoading: profilesLoading } = useAllProfiles();
  const { data: groups = [], isLoading: groupsLoading } = useAllGroups();
  const allTrips = trips as AdminTrip[];
  const allProfiles = profiles as AdminResource[];
  const allGroups = groups as AdminGroup[];
  const [selectedTripId, setSelectedTripId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(SELECTED_TRIP_STORAGE_KEY);
  });

  const sortedTrips = useMemo(() => {
    return [...allTrips].sort((a, b) => {
      const aTime = a.startDate ? new Date(a.startDate).getTime() : 0;
      const bTime = b.startDate ? new Date(b.startDate).getTime() : 0;
      return bTime - aTime;
    });
  }, [allTrips]);

  useEffect(() => {
    if (sortedTrips.length === 0) return;
    const selectedTripStillExists = selectedTripId && sortedTrips.some((trip) => trip.id === selectedTripId);
    if (!selectedTripStillExists) {
      setSelectedTripId(sortedTrips[0].id);
    }
  }, [selectedTripId, sortedTrips]);

  useEffect(() => {
    if (!selectedTripId || typeof window === "undefined") return;
    window.localStorage.setItem(SELECTED_TRIP_STORAGE_KEY, selectedTripId);
  }, [selectedTripId]);

  const selectedTrip = sortedTrips.find((trip) => trip.id === selectedTripId) || null;
  const { data: tripDays = [] } = useTripResource<AdminResource>(selectedTripId, "days");
  const { data: tripMembers = [] } = useTripResource<AdminMember>(selectedTripId, "members");
  const { data: attractions = [] } = useTripResource<AdminAttraction>(selectedTripId, "attractions");
  const { data: devotionals = [] } = useTripResource<AdminResource>(selectedTripId, "devotional-courses");
  const { data: invitations = [] } = useTripResource<AdminInvitation>(selectedTripId, "invitations");
  const { data: notes = [] } = useTripResource<AdminResource>(selectedTripId, "notes");
  const { data: helpContent } = useQuery<HelpContentResponse>({
    queryKey: ["/api/app-settings/help-content"],
  });
  const { data: systemStatus } = useQuery<SystemStatusResponse>({
    queryKey: ["/api/admin/system-status"],
    staleTime: 60_000,
  });

  const tripGroups = allGroups.filter((group) => group.tripId === selectedTripId);
  const activeInvitations = invitations.filter((invitation) => invitation.isActive !== false);
  const hasTripDates = Boolean(selectedTrip?.startDate && selectedTrip?.endDate);
  const expectedTripDays = getInclusiveDays(selectedTrip?.startDate, selectedTrip?.endDate);
  const membersMissingEmergency = tripMembers.filter((member) => !member.emergencyContactName || !member.emergencyContactPhone).length;
  const ungroupedMembers = tripMembers.filter((member) => !member.groupId).length;
  const attractionsMissingGps = attractions.filter((attraction) => !attraction.gps).length;
  const devotionalCoverage = expectedTripDays ? Math.min(100, Math.round((devotionals.length / expectedTripDays) * 100)) : 0;
  const riskItems = [
    {
      label: "緊急聯絡",
      value: membersMissingEmergency ? `${membersMissingEmergency} 位未補` : "完整",
      detail: membersMissingEmergency ? "旅途中最需要先補齊的安全資料" : "團員安全資料可支援突發狀況",
      tone: membersMissingEmergency ? "warning" : "good",
      to: "/admin/members",
      action: "整理名單",
    },
    {
      label: "分組狀態",
      value: ungroupedMembers ? `${ungroupedMembers} 位未分組` : "完整",
      detail: ungroupedMembers ? "分組不完整會影響集合與聯絡" : "集合、通訊錄與定位可依小組使用",
      tone: ungroupedMembers ? "warning" : "good",
      to: "/admin/trips",
      action: "調整分組",
    },
    {
      label: "景點座標",
      value: attractionsMissingGps ? `${attractionsMissingGps} 筆缺 GPS` : "完整",
      detail: attractionsMissingGps ? "缺座標的景點不會出現在地圖上" : "景點導覽可穩定顯示在地圖",
      tone: attractionsMissingGps ? "warning" : "good",
      to: selectedTripId ? `/admin/attractions/${selectedTripId}` : "/admin/attractions",
      action: "補景點資料",
    },
    {
      label: "靈修覆蓋",
      value: expectedTripDays ? `${devotionalCoverage}%` : "待設定",
      detail: expectedTripDays
        ? `${devotionals.length}/${expectedTripDays} 天有靈修內容`
        : "先設定旅程日期，才能檢查每日靈修",
      tone: devotionalCoverage >= 80 ? "good" : "warning",
      to: selectedTripId ? `/admin/devotionals/${selectedTripId}` : "/admin/devotionals",
      action: "補每日靈修",
    },
  ];

  const checklist: ChecklistItem[] = [
    {
      label: "基本資料",
      detail: selectedTrip?.destination && hasTripDates ? selectedTrip.destination : "補齊目的地與日期",
      done: Boolean(selectedTrip?.destination && hasTripDates),
      icon: Map,
      to: "/admin/trips",
    },
    {
      label: "每日行程",
      detail: tripDays.length ? `${tripDays.length} 天已建立` : "先建立每天的行程內容",
      done: tripDays.length > 0,
      icon: Calendar,
      to: selectedTripId ? `/admin/trip-days/${selectedTripId}` : "/admin/trip-days",
    },
    {
      label: "團員名單",
      detail: tripMembers.length ? `${tripMembers.length} 位團員` : "匯入或新增團員",
      done: tripMembers.length > 0,
      icon: Users,
      to: "/admin/trips",
    },
    {
      label: "分組",
      detail: tripGroups.length ? `${tripGroups.length} 個小組` : "建立小組，方便簽到與聯絡",
      done: tripGroups.length > 0,
      icon: Layers,
      to: "/admin/trips",
    },
    {
      label: "景點導覽",
      detail: attractions.length ? `${attractions.length} 筆景點資料` : "匯入景點故事、經文與背景",
      done: attractions.length > 0,
      icon: MapPinned,
      to: selectedTripId ? `/admin/attractions/${selectedTripId}` : "/admin/attractions",
    },
    {
      label: "每日靈修",
      detail: devotionals.length ? `${devotionals.length} 天靈修` : "補上每天的經文與反思",
      done: devotionals.length > 0,
      icon: BookOpen,
      to: selectedTripId ? `/admin/devotionals/${selectedTripId}` : "/admin/devotionals",
    },
    {
      label: "注意事項",
      detail: notes.length ? `${notes.length} 份給旅客看的提醒` : "放入行前提醒、集合規則與緊急資訊",
      done: notes.length > 0,
      icon: FileText,
      to: "/admin/trip-notes",
    },
    {
      label: "使用說明",
      detail: helpContent?.isDefault ? "目前使用預設說明，可依旅程調整" : "旅客可查看操作與緊急處理說明",
      done: Boolean(helpContent?.content?.trim()),
      icon: HelpCircle,
      to: "/admin/help-guide",
    },
    {
      label: "邀請與發布",
      detail: activeInvitations.length ? `${activeInvitations.length} 組邀請碼啟用中` : "建立邀請碼讓旅客加入",
      done: activeInvitations.length > 0,
      icon: Ticket,
      to: selectedTripId ? `/admin/invitations/${selectedTripId}` : "/admin/invitations",
    },
  ];

  const completedCount = checklist.filter((item) => item.done).length;
  const nextStep = checklist.find((item) => !item.done);
  const readiness = checklist.length ? Math.round((completedCount / checklist.length) * 100) : 0;
  const warningItems = riskItems.filter((item) => item.tone === "warning");
  const copyReadinessReport = async () => {
    const lines = [
      `旅程：${selectedTrip?.title || "未選擇"}`,
      `發布準備度：${readiness}% (${completedCount}/${checklist.length})`,
      "",
      "發布檢查：",
      ...checklist.map((item) => `${item.done ? "OK" : "待補"} ${item.label} - ${item.detail}`),
      "",
      "現場風險：",
      ...riskItems.map((item) => `${item.tone === "good" ? "OK" : "注意"} ${item.label} - ${item.value}｜${item.detail}｜處理：${item.action}`),
    ];

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      toast({
        title: "已複製出團檢查報告",
        description: "可以貼給同事、領隊或旅行社窗口確認。",
      });
    } catch {
      toast({
        title: "無法複製",
        description: "瀏覽器暫時不允許剪貼簿操作，請稍後再試。",
        variant: "destructive",
      });
    }
  };
  const quickLinks = [
    {
      label: "前台首頁",
      detail: "用目前登入身分查看旅客端",
      icon: Eye,
      to: "/",
    },
    {
      label: "行程日程",
      detail: "調整每天時間與活動",
      icon: Calendar,
      to: selectedTripId ? `/admin/trip-days/${selectedTripId}` : "/admin/trip-days",
    },
    {
      label: "邀請與發布",
      detail: "建立邀請碼給旅客加入",
      icon: Ticket,
      to: selectedTripId ? `/admin/invitations/${selectedTripId}` : "/admin/invitations",
    },
    {
      label: "使用說明",
      detail: "把旅客常見問題寫清楚",
      icon: HelpCircle,
      to: "/admin/help-guide",
    },
  ];

  const stats = [
    { label: "旅程", value: tripsLoading ? "..." : sortedTrips.length, icon: Map },
    { label: "會員帳號", value: profilesLoading ? "..." : allProfiles.length, icon: Users },
    { label: "分組", value: groupsLoading ? "..." : allGroups.length, icon: Layers },
  ];
  const integrationItems = systemStatus
    ? [
      { label: "登入", ok: systemStatus.integrations.googleOAuth || systemStatus.integrations.sessionSecret },
      { label: "郵件", ok: systemStatus.integrations.email },
      { label: "上傳", ok: systemStatus.integrations.uploads },
      { label: "Session", ok: systemStatus.integrations.sessionSecret },
    ]
    : [];
  const operationalRiskCount = systemStatus?.activeTrip
    ? systemStatus.activeTrip.risks.membersMissingEmergency
      + systemStatus.activeTrip.risks.membersWithoutGroup
      + systemStatus.activeTrip.risks.attractionsMissingGps
    : 0;
  const isInitialLoading = tripsLoading || profilesLoading || groupsLoading;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-display mb-2">出團工作台</h2>
            <p className="text-body text-muted-foreground">
              選一趟旅程，確認發布前最重要的內容是否已經準備好。
            </p>
          </div>
          <Link
            to="/admin/trips"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            管理旅程
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-lg bg-card p-5 shadow-card">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-display">{stat.value}</p>
                  <p className="text-caption text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {systemStatus && (
          <section className="rounded-lg border border-border bg-card p-5 shadow-card">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <h3 className="text-title font-semibold">系統交付狀態</h3>
                </div>
                <p className="mt-1 text-caption text-muted-foreground">
                  {systemStatus.environment} · {systemStatus.counts.trips} 趟旅程 · {systemStatus.counts.profiles} 位旅客資料
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {integrationItems.map((item) => (
                  <div
                    key={item.label}
                    className={cn(
                      "rounded-md border px-3 py-2 text-center text-xs font-semibold",
                      item.ok ? "border-green-200 bg-green-50 text-green-800" : "border-amber-200 bg-amber-50 text-amber-900"
                    )}
                  >
                    {item.ok ? "已設定" : "待設定"} · {item.label}
                  </div>
                ))}
              </div>
            </div>
            {systemStatus.activeTrip && (
              <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-4 md:grid-cols-3">
                <div>
                  <p className="text-caption text-muted-foreground">最新旅程</p>
                  <p className="mt-1 text-body font-semibold">{systemStatus.activeTrip.title}</p>
                </div>
                <div>
                  <p className="text-caption text-muted-foreground">後台準備度</p>
                  <p className="mt-1 text-body font-semibold">{systemStatus.activeTrip.readiness}%</p>
                </div>
                <div>
                  <p className="text-caption text-muted-foreground">出團資料風險</p>
                  <p className={cn("mt-1 text-body font-semibold", operationalRiskCount ? "text-amber-700" : "text-green-700")}>
                    {operationalRiskCount ? `${operationalRiskCount} 筆待補` : "目前完整"}
                  </p>
                </div>
              </div>
            )}
          </section>
        )}

        {isInitialLoading ? (
          <section className="rounded-lg bg-card p-8 text-center shadow-card">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <h3 className="mt-4 text-title font-semibold">正在讀取旅程資料</h3>
            <p className="mt-2 text-body text-muted-foreground">
              後台會在資料載入後顯示發布檢查表。
            </p>
          </section>
        ) : sortedTrips.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
            <section className="rounded-lg bg-card p-5 shadow-card">
              <h3 className="text-title font-semibold">選擇旅程</h3>
              <div className="mt-4 space-y-2">
                {sortedTrips.slice(0, 6).map((trip) => {
                  const isActive = trip.id === selectedTripId;
                  return (
                    <button
                      key={trip.id}
                      onClick={() => setSelectedTripId(trip.id)}
                      className={cn(
                        "w-full rounded-lg border p-3 text-left transition-colors",
                        isActive ? "border-primary bg-primary/10" : "border-border hover:bg-muted/60"
                      )}
                    >
                      <p className="text-body font-semibold">{trip.title}</p>
                      <p className="mt-1 text-caption text-muted-foreground">
                        {trip.startDate && trip.endDate
                          ? `${format(new Date(trip.startDate), "MM/dd", { locale: zhTW })} - ${format(new Date(trip.endDate), "MM/dd", { locale: zhTW })}`
                          : "尚未設定日期"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-lg bg-card p-5 shadow-card">
              <div className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-title font-semibold">{selectedTrip?.title || "尚未選擇旅程"}</h3>
                  <p className="text-caption text-muted-foreground">
                    {selectedTrip?.destination || "尚未設定目的地"}
                  </p>
                </div>
                <div className="min-w-[160px]">
                  <div className="flex items-center justify-between text-caption text-muted-foreground">
                    <span>發布準備度</span>
                    <span>{readiness}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${readiness}%` }} />
                  </div>
                  <button
                    type="button"
                    onClick={copyReadinessReport}
                    className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                  >
                    複製檢查報告
                  </button>
                </div>
              </div>

              {nextStep ? (
                <Link
                  to={nextStep.to}
                  className="mt-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950 transition-colors hover:bg-amber-100"
                >
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-body font-semibold">下一步：{nextStep.label}</p>
                    <p className="text-caption">{nextStep.detail}</p>
                  </div>
                  <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0" />
                </Link>
              ) : (
                <div className="mt-5 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-900">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="text-body font-semibold">這趟旅程看起來已可發布</p>
                    <p className="text-caption">接下來可以確認邀請碼與旅客端顯示是否正確。</p>
                  </div>
                </div>
              )}

              <div className="mt-5 rounded-lg border border-border bg-card p-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-title font-semibold">現場風險雷達</p>
                    <p className="text-caption text-muted-foreground">這些不是後台資料而已，會直接影響出團現場是否順。</p>
                  </div>
	                  {expectedTripDays > 0 && (
	                    <p className="text-caption text-muted-foreground">
	                      預計 {expectedTripDays} 天 · {warningItems.length ? `${warningItems.length} 項需注意` : "無明顯風險"}
	                    </p>
	                  )}
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {riskItems.map((item) => (
                    <Link
                      key={item.label}
                      to={item.to}
                      className={cn(
                        "rounded-lg border p-3 transition-colors hover:bg-muted/60",
                        item.tone === "good" ? "border-green-200 bg-green-50/70" : "border-amber-200 bg-amber-50/70"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-caption font-medium text-muted-foreground">{item.label}</p>
                          <p className="mt-1 text-body font-semibold text-foreground">{item.value}</p>
                        </div>
                        {item.tone === "good" ? (
                          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-700" />
                        )}
                      </div>
	                      <p className="mt-2 text-xs text-muted-foreground">{item.detail}</p>
	                      <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
	                        {item.action}
	                        <ArrowRight className="h-3.5 w-3.5" />
	                      </div>
	                    </Link>
	                  ))}
                </div>
              </div>

              <div className="mt-5 rounded-lg border border-border bg-muted/20 p-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-title font-semibold">常用發布捷徑</p>
                    <p className="text-caption text-muted-foreground">管理者最常需要確認的幾個地方，放在這裡直接進。</p>
                  </div>
                  <p className="text-caption text-muted-foreground">{completedCount}/{checklist.length} 項完成</p>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {quickLinks.map((link) => (
                    <Link
                      key={link.label}
                      to={link.to}
                      className="flex min-h-[88px] items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/60"
                    >
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <link.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{link.label}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{link.detail}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                {checklist.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="flex items-start gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/60"
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full",
                        item.done ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {item.done ? <CheckCircle2 className="h-5 w-5" /> : <item.icon className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-body font-semibold">{item.label}</p>
                      <p className="mt-0.5 text-caption text-muted-foreground">{item.detail}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <section className="rounded-lg bg-card p-8 text-center shadow-card">
            <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-title font-semibold">還沒有旅程</h3>
            <p className="mt-2 text-body text-muted-foreground">
              先建立第一趟旅程，後台就會開始顯示發布檢查表。
            </p>
            <Link
              to="/admin/trips"
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              建立旅程
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        )}
      </div>
    </AdminLayout>
  );
}
