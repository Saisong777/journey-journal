import {
  BookOpen,
  MapPin,
  Info,
  Book,
  Wrench,
  Users,
} from "lucide-react";
import { FeatureCard } from "@/components/ui/FeatureCard";

const features = [
  {
    icon: BookOpen,
    title: "每日日誌",
    description: "記錄感言與拍照留念",
    variant: "primary" as const,
  },
  {
    icon: MapPin,
    title: "定位分享",
    description: "即時查看團員位置",
    variant: "olive" as const,
  },
  {
    icon: Info,
    title: "景點資訊",
    description: "景點介紹與歷史背景",
    variant: "secondary" as const,
  },
  {
    icon: Book,
    title: "靈修禱告",
    description: "每日靈修與感言",
    variant: "secondary" as const,
  },
  {
    icon: Wrench,
    title: "旅遊工具",
    description: "匯率轉換與注意事項",
    variant: "secondary" as const,
  },
  {
    icon: Users,
    title: "團員管理",
    description: "查看團員資訊",
    variant: "secondary" as const,
  },
];

export function QuickActions() {
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
          />
        ))}
      </div>
    </section>
  );
}
