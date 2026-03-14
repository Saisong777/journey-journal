import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  User,
  ChevronRight,
  Bell,
  Moon,
  MapPin,
  Shield,
  LogOut,
  Share2,
  Info,
  Settings2,
  Sparkles,
} from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { ProfileEditSheet, ProfileData } from "@/components/settings/ProfileEditSheet";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { transformPhotoUrl } from "@/lib/photoUtils";

interface SettingItem {
  icon: typeof User;
  label: string;
  description?: string;
  action?: "navigate" | "toggle" | "info";
  value?: boolean;
  onClick?: () => void;
}

function dbToProfileData(dbProfile: any, fallbackEmail?: string, fallbackName?: string): ProfileData {
  return {
    name: dbProfile?.name || fallbackName || "",
    phone: dbProfile?.phone || "",
    email: dbProfile?.email || fallbackEmail || "",
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
    emergencyContactName: profile.emergencyContact,
    emergencyContactPhone: profile.emergencyPhone,
    dietaryRestrictions: profile.dietaryRestrictions,
    medicalNotes: profile.medicalNotes,
  };
}

export default function Settings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isSetupMode = searchParams.get("setup") === "1";
  const { user, signOut } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const { toast } = useToast();

  const { data: dbProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/profile"],
  });

  const profile: ProfileData = useMemo(
    () => dbToProfileData(dbProfile, user?.email, user?.user_metadata?.name),
    [dbProfile, user?.email, user?.user_metadata?.name]
  );

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    if (isSetupMode && !profileLoading) {
      setIsProfileOpen(true);
    }
  }, [isSetupMode, profileLoading]);

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

  const settingSections = [
    {
      title: "帳戶設定",
      items: [
        {
          icon: User,
          label: "個人資料",
          description: "編輯姓名、聯絡方式",
          action: "navigate" as const,
          onClick: () => setIsProfileOpen(true),
        },
        {
          icon: Bell,
          label: "通知設定",
          description: "接收行程提醒和團員消息",
          action: "toggle" as const,
          value: notifications,
          onClick: () => setNotifications(!notifications),
        },
        {
          icon: MapPin,
          label: "位置分享",
          description: "讓團員可以看到你的位置",
          action: "toggle" as const,
          value: locationSharing,
          onClick: () => setLocationSharing(!locationSharing),
        },
      ],
    },
    {
      title: "應用設定",
      items: [
        {
          icon: Moon,
          label: "深色模式",
          description: "減少眼睛疲勞",
          action: "toggle" as const,
          value: isDark,
          onClick: toggleTheme,
        },
      ],
    },
    {
      title: "旅程資料",
      items: [
        {
          icon: Share2,
          label: "旅程回憶錄",
          description: "產生精美的旅遊回憶錄",
          action: "navigate" as const,
          onClick: () => navigate("/summary"),
        },
      ],
    },
    {
      title: "其他",
      items: [
        {
          icon: Shield,
          label: "隱私權政策",
          action: "navigate" as const,
          onClick: () => navigate("/privacy"),
        },
        {
          icon: Info,
          label: "關於",
          description: "版本 1.0.0",
          action: "navigate" as const,
          onClick: () => navigate("/about"),
        },
      ],
    },
  ];

  return (
    <PageLayout title="設定">
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
                第一組
              </span>
              <span className="text-caption text-muted-foreground">團員</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </section>

        {/* Settings Sections */}
        {settingSections.map((section) => (
          <section key={section.title} className="space-y-3">
            <h3 className="text-caption font-semibold text-muted-foreground px-1">
              {section.title}
            </h3>
            <div className="bg-card rounded-lg shadow-card overflow-hidden">
              {section.items.map((item, index) => {
                const Wrapper = item.action === "toggle" ? "div" : "button";
                return (
                  <Wrapper
                    key={item.label}
                    onClick={item.action !== "toggle" ? item.onClick : undefined}
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
                    {item.action === "navigate" && (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                    {item.action === "toggle" && (
                      <Switch
                        checked={item.value}
                        onCheckedChange={item.onClick}
                      />
                    )}
                  </Wrapper>
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
