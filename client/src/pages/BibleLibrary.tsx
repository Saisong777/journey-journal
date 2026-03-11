import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PageLayout } from "@/components/layout/PageLayout";
import { Footprints, ChevronRight, BookOpen } from "lucide-react";

interface BibleModule {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  iconName: string | null;
  isBuiltin: boolean;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Footprints,
  BookOpen,
};

export default function BibleLibrary() {
  const navigate = useNavigate();
  const { data: modules = [] } = useQuery<BibleModule[]>({
    queryKey: ["/api/bible-library/modules"],
  });

  // Always show Paul Journeys as first item even if not assigned
  const hasPaulJourneys = modules.some(m => m.slug === "paul-journeys");
  const allModules = hasPaulJourneys ? modules : [
    { id: "builtin-paul", slug: "paul-journeys", title: "保羅行蹤", description: "探索使徒保羅的四次宣教旅程，包含地點、同伴、事件與相關經文", iconName: "Footprints", isBuiltin: true },
    ...modules,
  ];

  const getPath = (mod: BibleModule) => {
    if (mod.slug === "paul-journeys") return "/bible-library/paul-journeys";
    return `/bible-library/modules/${mod.id}`;
  };

  return (
    <PageLayout title="聖經資料館">
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6 animate-fade-in">
        <p className="text-sm text-muted-foreground">
          透過互動式資料探索聖經中的歷史足跡與人物故事
        </p>

        <div className="space-y-3">
          {allModules.map((mod) => {
            const Icon = ICON_MAP[mod.iconName || "BookOpen"] || BookOpen;
            return (
              <button
                key={mod.id}
                onClick={() => navigate(getPath(mod))}
                className="w-full bg-card rounded-xl border border-border p-5 flex items-center gap-4 hover:shadow-card transition-all text-left"
              >
                <div className="w-12 h-12 rounded-xl gradient-warm flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-body font-semibold text-foreground">{mod.title}</h3>
                  {mod.description && (
                    <p className="text-caption text-muted-foreground mt-1 line-clamp-2">{mod.description}</p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
}
