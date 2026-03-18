import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { PageLayout } from "@/components/layout/PageLayout";
import { transformPhotoUrl } from "@/lib/photoUtils";
import { Loader2, FileDown, ChevronRight, ArrowLeft } from "lucide-react";

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
  moduleType?: string;
}

const markdownComponents = {
  p: ({ children }: any) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }: any) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
  li: ({ children }: any) => <li className="text-sm">{children}</li>,
  h1: ({ children }: any) => <h3 className="text-base font-bold mt-3 mb-1 text-foreground">{children}</h3>,
  h2: ({ children }: any) => <h3 className="text-base font-bold mt-3 mb-1 text-foreground">{children}</h3>,
  h3: ({ children }: any) => <h4 className="text-sm font-bold mt-2 mb-1 text-foreground">{children}</h4>,
  h4: ({ children }: any) => <h4 className="text-sm font-semibold mt-2 mb-1 text-foreground">{children}</h4>,
  strong: ({ children }: any) => <strong className="font-bold text-foreground">{children}</strong>,
  blockquote: ({ children }: any) => <blockquote className="border-l-2 border-amber-400 pl-3 italic my-2">{children}</blockquote>,
  hr: () => <hr className="my-3 border-border" />,
  table: ({ children }: any) => <div className="overflow-x-auto my-3"><table className="w-full text-sm border-collapse border border-border">{children}</table></div>,
  thead: ({ children }: any) => <thead className="bg-muted">{children}</thead>,
  th: ({ children }: any) => <th className="border border-border px-3 py-2 text-left font-semibold">{children}</th>,
  td: ({ children }: any) => <td className="border border-border px-3 py-2">{children}</td>,
};

function getPreview(content: string | null, maxLen = 80): string {
  if (!content) return "";
  // Strip markdown syntax for preview
  const plain = content
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[>\-*_`]/g, "")
    .replace(/\n+/g, " ")
    .trim();
  return plain.length > maxLen ? plain.slice(0, maxLen) + "..." : plain;
}

export default function BibleModulePage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const { data: modules } = useQuery<ModuleInfo[]>({
    queryKey: ["/api/bible-library/modules"],
  });
  const module = modules?.find(m => m.id === moduleId);

  const { data: items, isLoading } = useQuery<ModuleItem[]>({
    queryKey: [`/api/bible-library/modules/${moduleId}/items`],
    enabled: !!moduleId,
  });

  const isDocumentLibrary = module?.moduleType === "document-library";
  const selectedItem = selectedItemId ? items?.find(i => i.id === selectedItemId) : null;

  // Document library: reading a single document
  if (isDocumentLibrary && selectedItem) {
    return (
      <PageLayout title={selectedItem.title} showBack>
        <div className="px-4 py-6 max-w-lg mx-auto space-y-4 animate-fade-in">
          <button
            onClick={() => setSelectedItemId(null)}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            返回列表
          </button>

          <article className="bg-card rounded-xl border border-border p-5">
            <h2 className="text-lg font-bold mb-4">{selectedItem.title}</h2>
            {selectedItem.content && (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                components={markdownComponents}
              >
                {selectedItem.content}
              </ReactMarkdown>
            )}
            {selectedItem.fileUrl && (
              <a
                href={transformPhotoUrl(selectedItem.fileUrl)}
                download
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-4"
              >
                <FileDown className="w-4 h-4" />
                下載附件
              </a>
            )}
          </article>
        </div>
      </PageLayout>
    );
  }

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
          isDocumentLibrary ? (
            /* Document library: title list */
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{items.length} 份文件</p>
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className="w-full bg-card rounded-xl border border-border p-4 text-left hover:shadow-md transition-all active:brightness-95"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-body font-semibold text-foreground">{item.title}</h3>
                      {item.content && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {getPreview(item.content)}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* Standard module: expanded view */
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
                        components={markdownComponents}
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
          )
        ) : (
          <p className="text-center text-muted-foreground py-8">目前沒有內容</p>
        )}
      </div>
    </PageLayout>
  );
}
