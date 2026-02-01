import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  User,
  ChevronRight,
  Bell,
  Globe,
  Moon,
  MapPin,
  Shield,
  HelpCircle,
  LogOut,
  FileText,
  Share2,
  MessageSquare,
  Info,
  Settings2,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/ui/BottomNav";
import { ProfileEditSheet, ProfileData } from "@/components/settings/ProfileEditSheet";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";

interface SettingItem {
  icon: typeof User;
  label: string;
  description?: string;
  action?: "navigate" | "toggle" | "info";
  value?: boolean;
  onClick?: () => void;
}

const defaultProfile: ProfileData = {
  name: "林雅婷",
  phone: "0967-890-123",
  email: "lin.yt@example.com",
  emergencyContact: "林媽媽",
  emergencyPhone: "0977-111-222",
  dietaryRestrictions: "素食",
  medicalNotes: "",
};

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData>({
    ...defaultProfile,
    email: user?.email || defaultProfile.email,
    name: user?.user_metadata?.name || defaultProfile.name,
  });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleSaveProfile = (newProfile: ProfileData) => {
    setProfile(newProfile);
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
          icon: Globe,
          label: "語言",
          description: "繁體中文",
          action: "navigate" as const,
        },
        {
          icon: Moon,
          label: "深色模式",
          description: "減少眼睛疲勞",
          action: "toggle" as const,
          value: darkMode,
          onClick: () => setDarkMode(!darkMode),
        },
      ],
    },
    {
      title: "旅程資料",
      items: [
        {
          icon: FileText,
          label: "我的日誌",
          description: "查看所有旅途記錄",
          action: "navigate" as const,
          onClick: () => navigate("/journal"),
        },
        {
          icon: Share2,
          label: "匯出旅遊簡表",
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
          icon: HelpCircle,
          label: "使用說明",
          description: "了解如何使用此應用",
          action: "navigate" as const,
        },
        {
          icon: MessageSquare,
          label: "意見回饋",
          description: "告訴我們你的想法",
          action: "navigate" as const,
        },
        {
          icon: Shield,
          label: "隱私權政策",
          action: "navigate" as const,
        },
        {
          icon: Info,
          label: "關於",
          description: "版本 1.0.0",
          action: "info" as const,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="設定" />

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6 animate-fade-in">
        {/* Profile Card */}
        <section
          onClick={() => setIsProfileOpen(true)}
          className="bg-card rounded-lg shadow-card p-5 flex items-center gap-4 cursor-pointer hover:shadow-elevated transition-all active:scale-[0.99]"
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
            <span className="text-title text-muted-foreground">
              {profile.name.charAt(0)}
            </span>
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
              {section.items.map((item, index) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={cn(
                    "w-full p-4 flex items-center gap-4 text-left",
                    "hover:bg-muted/50 transition-colors",
                    index < section.items.length - 1 && "border-b border-border"
                  )}
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
                </button>
              ))}
            </div>
          </section>
        ))}

        {/* Admin Access */}
        {isAdmin && (
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
          <p className="text-caption text-muted-foreground">朝聖之旅 v1.0.0</p>
          <p className="text-caption text-muted-foreground">© 2024 All rights reserved</p>
        </section>
      </main>

      <ProfileEditSheet
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
        profile={profile}
        onSave={handleSaveProfile}
      />

      <BottomNav />
    </div>
  );
}
