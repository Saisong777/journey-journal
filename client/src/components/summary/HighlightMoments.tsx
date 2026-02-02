import { Star, Heart, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Highlight {
  id: string;
  type: "experience" | "spiritual" | "fellowship";
  title: string;
  description: string;
  date: string;
}

interface HighlightMomentsProps {
  highlights: Highlight[];
}

const typeConfig = {
  experience: {
    icon: Star,
    label: "難忘體驗",
    bgColor: "bg-amber-50",
    iconColor: "text-amber-500",
  },
  spiritual: {
    icon: BookOpen,
    label: "靈性感動",
    bgColor: "bg-primary/5",
    iconColor: "text-primary",
  },
  fellowship: {
    icon: Heart,
    label: "團契時光",
    bgColor: "bg-rose-50",
    iconColor: "text-rose-500",
  },
};

export function HighlightMoments({ highlights }: HighlightMomentsProps) {
  return (
    <section className="space-y-4">
      <h3 className="text-title font-semibold">✨ 精彩時刻</h3>

      <div className="space-y-3">
        {highlights.map((highlight) => {
          const config = typeConfig[highlight.type];
          const Icon = config.icon;

          return (
            <Card key={highlight.id} className={`p-4 ${config.bgColor} border-none`}>
              <div className="flex gap-4">
                <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 ${config.iconColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-caption font-medium text-muted-foreground">
                      {config.label}
                    </span>
                    <span className="text-caption text-muted-foreground">·</span>
                    <span className="text-caption text-muted-foreground">
                      {highlight.date}
                    </span>
                  </div>
                  <h4 className="text-body font-semibold mb-1">{highlight.title}</h4>
                  <p className="text-caption text-muted-foreground leading-relaxed">
                    {highlight.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
