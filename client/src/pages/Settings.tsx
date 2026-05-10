import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  User,
  ChevronRight,
  Moon,
  Shield,
  LogOut,
  Share2,
  Info,
  Settings2,
  Sparkles,
  Wrench,
  BookOpen,
  ClipboardCheck,
  HelpCircle,
  Library,
  HeartPulse,
  Phone,
  Utensils,
	  Users,
	  CheckCircle2,
	  Download,
	  RefreshCw,
	  WifiOff,
	} from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { ProfileEditSheet, ProfileData, type FamilyMember } from "@/components/settings/ProfileEditSheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useGroups } from "@/hooks/useMembers";
import { useTrip } from "@/hooks/useTrip";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/hooks/use-toast";
	import { apiRequest, queryClient } from "@/lib/queryClient";
	import { transformPhotoUrl } from "@/lib/photoUtils";
	import {
	  readTripDataPackMeta,
	  TRIP_DATA_PACK_EVENT,
	  TRIP_DATA_PACK_REFRESH_EVENT,
	  type TripDataPackMeta,
	} from "@/lib/tripDataPack";

interface SettingItem {
  icon: typeof User;
  label: string;
  description?: string;
  action?: "navigate" | "info";
  value?: boolean;
  onClick?: () => void;
}

function parseFamilyMembers(raw: string | null | undefined): FamilyMember[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function dbToProfileData(dbProfile: any, fallbackEmail?: string, fallbackName?: string): ProfileData {
  return {
    name: dbProfile?.name || fallbackName || "",
    phone: dbProfile?.phone || "",
    email: dbProfile?.email || fallbackEmail || "",
    birthday: dbProfile?.birthday || "",
    gender: dbProfile?.gender || "",
    familyMembers: parseFamilyMembers(dbProfile?.familyMembers),
    emergencyContact: dbProfile?.emergencyContactName || "",
    emergencyPhone: dbProfile?.emergencyContactPhone || "",
    dietaryRestrictions: dbProfile?.dietaryRestrictions || "",
    medicalNotes: dbProfile?.medicalNotes || "",
    avatarUrl: dbProfile?.avatarUrl || null,
  };
}

function profileDataToDb(profile: ProfileData) {
  return {
    name: profile.name,
    phone: profile.phone,
    email: profile.email,
    avatarUrl: profile.avatarUrl || null,
    birthday: profile.birthday || null,
    gender: profile.gender || null,
    familyMembers: profile.familyMembers.length > 0 ? JSON.stringify(profile.familyMembers) : null,
    emergencyContactName: profile.emergencyContact,
    emergencyContactPhone: profile.emergencyPhone,
    dietaryRestrictions: profile.dietaryRestrictions,
    medicalNotes: profile.medicalNotes,
  };
}

function formatPackTime(updatedAt?: number) {
  if (!updatedAt) return "尚未準備";
  const diffMinutes = Math.floor((Date.now() - updatedAt) / 60000);
  if (diffMinutes < 1) return "剛剛更新";
  if (diffMinutes < 60) return `${diffMinutes} 分鐘前更新`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} 小時前更新`;
  return `${Math.floor(diffHours / 24)} 天前更新`;
}

export default function Settings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isSetupMode = searchParams.get("setup") === "1";
  const { user, signOut } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const { data: trip } = useTrip();
  const { data: groups = [] } = useGroups();
  const { toast } = useToast();

  const { data: dbProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/profile"],
  });

  const profile: ProfileData = useMemo(
    () => dbToProfileData(dbProfile, user?.email, user?.user_metadata?.name),
    [dbProfile, user?.email, user?.user_metadata?.name]
  );

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const [packMeta, setPackMeta] = useState<TripDataPackMeta | null>(() => readTripDataPackMeta());

  useEffect(() => {
    if (isSetupMode && !profileLoading) {
      setIsProfileOpen(true);
    }
  }, [isSetupMode, profileLoading]);

  useEffect(() => {
    const handlePackStatus = (event: Event) => {
      setPackMeta((event as CustomEvent<TripDataPackMeta>).detail || readTripDataPackMeta());
    };

    window.addEventListener(TRIP_DATA_PACK_EVENT, handlePackStatus);
    return () => window.removeEventListener(TRIP_DATA_PACK_EVENT, handlePackStatus);
  }, []);

  const saveProfileMutation = useMutation({
    mutationFn: async (newProfile: ProfileData) => {
      const res = await apiRequest("PATCH", "/api/profile", profileDataToDb(newProfile));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["profile-setup"] });
      setIsProfileOpen(false);
      toast({ title: "儲存成功", description: "個人資料已更新" });
      if (isSetupMode) {
        navigate("/", { replace: true });
      }
    },
    onError: (error: Error) => {
      toast({ title: "儲存失敗", description: error.message, variant: "destructive" });
    },
  });

  const handleSaveProfile = (newProfile: ProfileData) => {
    saveProfileMutation.mutate(newProfile);
  };

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "已登出",
      description: "您已成功登出帳號",
    });
    navigate("/auth");
  };

  const moreActions = [
    {
      icon: ClipboardCheck,
      label: "集合簽到",
      description: "集合時快速確認自己已到",
      to: "/roll-call",
      tone: "primary",
    },
    {
      icon: Share2,
      label: "旅程回憶錄",
      description: "旅後產生回顧與照片整理",
      to: "/summary",
      tone: "warm",
    },
    {
      icon: Wrench,
      label: "行前工具",
      description: "匯率、天氣、穿搭與行李提醒",
      to: "/tools",
      tone: "default",
    },
    {
      icon: BookOpen,
      label: "景點導覽",
      description: "查看景點故事、經文與歷史背景",
      to: "/attractions",
      tone: "default",
    },
    {
      icon: HelpCircle,
      label: "使用說明",
      description: "不熟悉功能時先看這裡",
      to: "/help",
      tone: "default",
    },
    {
      icon: Library,
      label: "聖經資料館",
      description: "保羅旅程、經文與地圖資料",
      to: "/bible-library",
      tone: "default",
    },
  ];

  const settingSections: Array<{ title: string; items: SettingItem[] }> = [
    {
      title: "個人與安全",
      items: [
        {
          icon: User,
          label: "個人資料",
          description: "姓名、電話、緊急聯絡與飲食醫療",
          action: "navigate",
          onClick: () => setIsProfileOpen(true),
        },
        {
          icon: Shield,
          label: "隱私權政策",
          description: "查看資料使用與隱私說明",
          action: "navigate",
          onClick: () => navigate("/privacy"),
        },
      ],
    },
    {
      title: "App 偏好",
      items: [
        {
          icon: Moon,
          label: "深色模式",
          description: isDark ? "目前使用深色介面" : "目前使用淺色介面",
          action: "navigate",
          onClick: toggleTheme,
        },
        {
          icon: Info,
          label: "關於",
          description: "版本 1.0.0",
          action: "navigate",
          onClick: () => navigate("/about"),
        },
      ],
    },
  ];

  const currentGroup = Array.isArray(groups)
    ? groups.find((group: any) => group.id === dbProfile?.groupId)
    : null;
  const roleLabels: Record<string, string> = {
    admin: "管理者",
    leader: "小組長",
    guide: "領隊",
    member: "團員",
  };
  const roleLabel = roleLabels[trip?.userRole || "member"] || "團員";
  const safetyItems = [
    {
      icon: User,
      label: "姓名",
      done: Boolean(profile.name?.trim()),
      detail: profile.name || "尚未填寫",
    },
    {
      icon: Phone,
      label: "緊急聯絡",
      done: Boolean(profile.emergencyContact?.trim() && profile.emergencyPhone?.trim()),
      detail: profile.emergencyContact && profile.emergencyPhone ? `${profile.emergencyContact} · ${profile.emergencyPhone}` : "旅途中很重要",
    },
    {
      icon: Utensils,
      label: "飲食需求",
      done: Boolean(profile.dietaryRestrictions?.trim()),
      detail: profile.dietaryRestrictions || "沒有特殊需求也可填「無」",
    },
    {
      icon: HeartPulse,
      label: "醫療備註",
      done: Boolean(profile.medicalNotes?.trim()),
      detail: profile.medicalNotes || "過敏、慢性病或用藥提醒",
    },
  ];
  const safetyDoneCount = safetyItems.filter((item) => item.done).length;
  const packStatus = packMeta?.status || "idle";
  const packReady = packStatus === "ready";
  const packPartial = packStatus === "partial";
  const packRefreshing = packStatus === "refreshing";
  const packOffline = packStatus === "offline";
  const packTitle = packReady
    ? "旅程資料包已準備好"
    : packPartial
      ? "旅程資料包部分完成"
      : packRefreshing
        ? "正在更新旅程資料包"
        : packOffline
          ? "目前離線，使用已快取資料"
          : "旅程資料包尚未更新";
  const packDescription = packMeta
    ? `${packMeta.successful}/${packMeta.total} 項資料可離線使用 · ${formatPackTime(packMeta.updatedAt)}`
    : "行程、景點、通訊錄、說明與靈修會在登入後自動準備。";

  const handleRefreshDataPack = () => {
    window.dispatchEvent(new CustomEvent(TRIP_DATA_PACK_REFRESH_EVENT));
    toast({
      title: "正在更新旅程資料包",
      description: "會重新抓取行程、景點、團員與說明資料。",
    });
  };

  return (
    <PageLayout title="更多">
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6 animate-fade-in">
        {isSetupMode && (
          <section
            className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-start gap-3"
            data-testid="banner-profile-setup"
          >
            <Sparkles className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-body font-semibold text-primary">歡迎加入旅程！</h3>
              <p className="text-caption text-muted-foreground mt-1">
                請先完善您的個人資料並修改密碼，以確保帳號安全
              </p>
            </div>
          </section>
        )}

        {/* Profile Card */}
        <section
          onClick={() => setIsProfileOpen(true)}
          className="bg-card rounded-lg shadow-card p-5 flex items-center gap-4 cursor-pointer hover:shadow-elevated transition-all active:brightness-95"
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
            {profile.avatarUrl ? (
              <img src={transformPhotoUrl(profile.avatarUrl)} alt="頭像" className="w-full h-full object-cover" />
            ) : (
              <span className="text-title text-muted-foreground">
                {profile.name.charAt(0)}
              </span>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-title">{profile.name}</h2>
            <p className="text-caption text-muted-foreground">{profile.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-caption bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {currentGroup?.name || "未分組"}
              </span>
              <span className="text-caption text-muted-foreground">{roleLabel}</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </section>

        <section className="bg-card rounded-lg shadow-card p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-title font-semibold">旅途安心檢查</h3>
              <p className="text-caption text-muted-foreground mt-1">
                領隊最需要的基本資料，建議出發前補齊。
              </p>
            </div>
            <div className="text-right">
              <p className="text-title font-bold text-primary">{safetyDoneCount}/4</p>
              <p className="text-caption text-muted-foreground">已完成</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {safetyItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/50"
              >
                <div
                  className={cn(
                    "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full",
                    item.done ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                  )}
                >
                  {item.done ? <CheckCircle2 className="h-4 w-4" /> : <item.icon className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-body font-medium">{item.label}</p>
                  <p className="text-caption text-muted-foreground truncate">{item.detail}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </section>

        <section className="bg-card rounded-lg shadow-card p-5 space-y-4" data-testid="trip-data-pack-status">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full",
                  packReady && "bg-green-100 text-green-700",
                  packPartial && "bg-amber-100 text-amber-700",
                  packRefreshing && "bg-primary/10 text-primary",
                  packOffline && "bg-muted text-muted-foreground",
                  !packReady && !packPartial && !packRefreshing && !packOffline && "bg-muted text-muted-foreground"
                )}
              >
                {packOffline ? (
                  <WifiOff className="h-5 w-5" />
                ) : packRefreshing ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Download className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-title font-semibold">離線旅程資料</h3>
                <p className="mt-1 text-body font-medium text-foreground">{packTitle}</p>
                <p className="mt-1 text-caption text-muted-foreground">{packDescription}</p>
                {packMeta?.failedLabels?.length ? (
                  <p className="mt-2 text-xs text-amber-700">
                    待補：{packMeta.failedLabels.join("、")}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRefreshDataPack}
            disabled={packRefreshing}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
          >
            <RefreshCw className={cn("h-4 w-4", packRefreshing && "animate-spin")} />
            {packRefreshing ? "更新中..." : "重新下載旅程資料"}
          </button>
        </section>

        {/* Common Tools */}
        <section className="space-y-3">
          <h3 className="text-caption font-semibold text-muted-foreground px-1">
            常用工具
          </h3>
          <div className="bg-card rounded-lg shadow-card overflow-hidden">
            {moreActions.map((item, index) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "w-full p-4 flex items-center gap-4 text-left hover:bg-muted/50 transition-colors",
                  index < moreActions.length - 1 && "border-b border-border"
                )}
                data-testid={`more-action-${item.label}`}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    item.tone === "primary" && "bg-primary text-primary-foreground",
                    item.tone === "warm" && "bg-amber-100 text-amber-700",
                    item.tone === "default" && "bg-primary/10 text-primary"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body font-medium">{item.label}</p>
                  <p className="text-caption text-muted-foreground truncate">
                    {item.description}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>

        {/* Settings Sections */}
        {settingSections.map((section) => (
          <section key={section.title} className="space-y-3">
            <h3 className="text-caption font-semibold text-muted-foreground px-1">
              {section.title}
            </h3>
            <div className="bg-card rounded-lg shadow-card overflow-hidden">
              {section.items.map((item, index) => {
                return (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className={cn(
                      "w-full p-4 flex items-center gap-4 text-left",
                      "hover:bg-muted/50 transition-colors cursor-pointer",
                      index < section.items.length - 1 && "border-b border-border"
                    )}
                    data-testid={`setting-item-${item.label}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-medium">{item.label}</p>
                      {item.description && (
                        <p className="text-caption text-muted-foreground truncate">
                          {item.description}
                        </p>
                      )}
                    </div>
                    {item.label === "深色模式" ? (
                      <span
                        className={cn(
                          "rounded-full px-2 py-1 text-caption font-medium",
                          isDark ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {isDark ? "開啟" : "關閉"}
                      </span>
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        ))}

        {/* Admin Access */}
        {isAdmin?.isAdmin && (
          <section>
            <Link
              to="/admin"
              className="w-full bg-primary/10 rounded-lg shadow-card p-4 flex items-center justify-center gap-2 text-primary hover:bg-primary/20 transition-colors"
            >
              <Settings2 className="w-5 h-5" />
              <span className="text-body font-medium">進入管理後台</span>
            </Link>
          </section>
        )}

        {/* Logout Button */}
        <section>
          <button 
            onClick={handleLogout}
            className="w-full bg-card rounded-lg shadow-card p-4 flex items-center justify-center gap-2 text-destructive hover:bg-destructive/5 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-body font-medium">登出</span>
          </button>
        </section>

        {/* App Info */}
        <section className="text-center py-4">
          <p className="text-caption text-muted-foreground">平安同行 v1.0.0</p>
          <p className="text-caption text-muted-foreground">2026 © Sai. All Glory to God.</p>
        </section>
      </div>

      <ProfileEditSheet
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
        profile={profile}
        onSave={handleSaveProfile}
        isSaving={saveProfileMutation.isPending}
      />
    </PageLayout>
  );
}
