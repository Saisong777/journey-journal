import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Info,
  Wrench,
  Users,
  Library,
  ClipboardCheck,
} from "lucide-react";
import { FeatureCard } from "@/components/ui/FeatureCard";

type CardVariant = "primary" | "olive-light" | "warm-light" | "olive";

const colorPattern: CardVariant[] = ["primary", "olive-light", "warm-light", "olive"];

const baseFeatures = [
  {
    icon: BookOpen,
    title: "每日旅程",
    description: "靈修、日誌、感恩",
    path: "/daily-journey",
  },
  {
    icon: Info,
    title: "景點資訊",
    description: "景點介紹與歷史背景",
    path: "/attractions",
  },
  {
    icon: Wrench,
    title: "旅遊工具",
    description: "出團說明、檢查表、匯率",
    path: "/tools",
  },
  {
    icon: Users,
    title: "團員管理",
    description: "查看團員資訊",
    path: "/members",
  },
  {
    icon: ClipboardCheck,
    title: "點名",
    description: "出席點名與紀錄",
    path: "/roll-call",
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
      path: "/bible-library",
    });
  }

  return (
    <section className="space-y-4">
      <h2 className="text-title px-1">快速功能</h2>
      <div className="grid grid-cols-2 gap-4">
        {features.map((feature, index) => (
          <FeatureCard
            key={feature.title}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            variant={colorPattern[index % colorPattern.length]}
            onClick={() => navigate(feature.path)}
          />
        ))}
      </div>
    </section>
  );
}
