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
    title: "今日記錄",
    description: "靈修、日誌、感恩",
    path: "/daily-journey",
  },
  {
    icon: Info,
    title: "景點導覽",
    description: "景點故事與歷史背景",
    path: "/attractions",
  },
  {
    icon: Wrench,
    title: "行前工具",
    description: "出團說明、檢查表、匯率",
    path: "/tools",
  },
  {
    icon: Users,
    title: "通訊錄",
    description: "查看團員與組長資訊",
    path: "/members",
  },
  {
    icon: ClipboardCheck,
    title: "集合簽到",
    description: "集合簽到與出席紀錄",
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
      <div className="px-1">
        <p className="text-caption text-muted-foreground">Actions</p>
        <h2 className="text-title">現在可能會用到</h2>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
