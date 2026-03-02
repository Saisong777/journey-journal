import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  MapPin,
  Info,
  Wrench,
  Users,
  FileText,
  Library,
} from "lucide-react";
import { FeatureCard } from "@/components/ui/FeatureCard";

const baseFeatures = [
  {
    icon: BookOpen,
    title: "每日旅程",
    description: "靈修、日誌、感恩",
    variant: "primary" as const,
    path: "/daily-journey",
  },
  {
    icon: MapPin,
    title: "定位分享",
    description: "即時查看團員位置",
    variant: "olive" as const,
    path: "/location",
  },
  {
    icon: FileText,
    title: "旅遊簡表",
    description: "行程總覽與精選回顧",
    variant: "olive" as const,
    path: "/summary",
  },
  {
    icon: Info,
    title: "景點資訊",
    description: "景點介紹與歷史背景",
    variant: "secondary" as const,
    path: "/attractions",
  },
  {
    icon: Wrench,
    title: "旅遊工具",
    description: "出團說明、檢查表、匯率",
    variant: "secondary" as const,
    path: "/tools",
  },
  {
    icon: Users,
    title: "團員管理",
    description: "查看團員資訊",
    variant: "secondary" as const,
    path: "/members",
  },
];

export function QuickActions() {
  const navigate = useNavigate();
  const { data: bibleLibraryStatus } = useQuery<{ enabled: boolean }>({
    queryKey: ["/api/trips/current/bible-library-enabled"],
  });

  const features = [...baseFeatures];
  if (bibleLibraryStatus?.enabled) {
    features.splice(4, 0, {
      icon: Library,
      title: "聖經資料館",
      description: "保羅行蹤與聖經探索",
      variant: "primary" as const,
      path: "/bible-library",
    });
  }

  return (
    <section className="space-y-4">
      <h2 className="text-title px-1">快速功能</h2>
      <div className="grid grid-cols-2 gap-4">
        {features.map((feature) => (
          <FeatureCard
            key={feature.title}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            variant={feature.variant}
            onClick={() => navigate(feature.path)}
          />
        ))}
      </div>
    </section>
  );
}
