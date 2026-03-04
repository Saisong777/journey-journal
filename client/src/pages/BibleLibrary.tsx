import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { Footprints, ChevronRight } from "lucide-react";

const features = [
  {
    key: "paul-journeys",
    title: "保羅行蹤",
    description: "探索使徒保羅的四次宣教旅程，包含地點、同伴、事件與相關經文",
    icon: Footprints,
    path: "/bible-library/paul-journeys",
  },
];

export default function BibleLibrary() {
  const navigate = useNavigate();

  return (
    <PageLayout title="聖經資料館">
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6 animate-fade-in">
        <p className="text-sm text-muted-foreground" data-testid="text-library-intro">
          透過互動式資料探索聖經中的歷史足跡與人物故事
        </p>

        <div className="space-y-3">
          {features.map((feature) => (
            <button
              key={feature.key}
              onClick={() => navigate(feature.path)}
              className="w-full bg-card rounded-xl border border-border p-5 flex items-center gap-4 hover:shadow-card transition-all text-left"
              data-testid={`card-feature-${feature.key}`}
            >
              <div className="w-12 h-12 rounded-xl gradient-warm flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-body font-semibold text-foreground">{feature.title}</h3>
                <p className="text-caption text-muted-foreground mt-1 line-clamp-2">{feature.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
