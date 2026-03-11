import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PageLayout } from "@/components/layout/PageLayout";
import { transformPhotoUrl } from "@/lib/photoUtils";
import { Loader2, FileDown, Image } from "lucide-react";

interface ModuleItem {
  id: string;
  title: string;
  content: string | null;
  imageUrl: string | null;
  fileUrl: string | null;
  sortOrder: number;
}

interface ModuleInfo {
  id: string;
  title: string;
  description: string | null;
}

export default function BibleModulePage() {
  const { moduleId } = useParams<{ moduleId: string }>();

  const { data: modules } = useQuery<ModuleInfo[]>({
    queryKey: ["/api/bible-library/modules"],
  });
  const module = modules?.find(m => m.id === moduleId);

  const { data: items, isLoading } = useQuery<ModuleItem[]>({
    queryKey: [`/api/bible-library/modules/${moduleId}/items`],
    enabled: !!moduleId,
  });

  return (
    <PageLayout title={module?.title || "資料"} showBack>
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6 animate-fade-in">
        {module?.description && (
          <p className="text-sm text-muted-foreground">{module.description}</p>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : items?.length ? (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-card rounded-xl border border-border overflow-hidden">
                {item.imageUrl && (
                  <img
                    src={transformPhotoUrl(item.imageUrl)}
                    alt={item.title}
                    className="w-full object-contain"
                    loading="lazy"
                  />
                )}
                <div className="p-4 space-y-2">
                  <h3 className="text-body font-semibold">{item.title}</h3>
                  {item.content && (
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {item.content}
                    </div>
                  )}
                  {item.fileUrl && (
                    <a
                      href={transformPhotoUrl(item.fileUrl)}
                      download
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-2"
                    >
                      <FileDown className="w-4 h-4" />
                      下載附件
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">目前沒有內容</p>
        )}
      </div>
    </PageLayout>
  );
}
