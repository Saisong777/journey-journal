import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { PageLayout } from "@/components/layout/PageLayout";
import { transformPhotoUrl } from "@/lib/photoUtils";
import { Loader2, FileDown } from "lucide-react";

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
              <div key={item.id} className="bg-card rounded-xl border border-border">
                {item.imageUrl && (
                  <img
                    src={transformPhotoUrl(item.imageUrl)}
                    alt={item.title}
                    className="w-full rounded-t-xl"
                    loading="lazy"
                  />
                )}
                <div className="p-4 space-y-2">
                  <h3 className="text-body font-semibold">{item.title}</h3>
                  {item.content && (
                    <ReactMarkdown
                      className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="text-sm">{children}</li>,
                        h1: ({ children }) => <h3 className="text-base font-bold mt-3 mb-1 text-foreground">{children}</h3>,
                        h2: ({ children }) => <h3 className="text-base font-bold mt-3 mb-1 text-foreground">{children}</h3>,
                        h3: ({ children }) => <h4 className="text-sm font-bold mt-2 mb-1 text-foreground">{children}</h4>,
                        h4: ({ children }) => <h4 className="text-sm font-semibold mt-2 mb-1 text-foreground">{children}</h4>,
                        strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
                        blockquote: ({ children }) => <blockquote className="border-l-2 border-amber-400 pl-3 italic my-2">{children}</blockquote>,
                        hr: () => <hr className="my-3 border-border" />,
                      }}
                    >
                      {item.content}
                    </ReactMarkdown>
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
