import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { PageLayout } from "@/components/layout/PageLayout";
import { Skeleton } from "@/components/ui/skeleton";

const markdownComponents = {
  p: ({ children }: any) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
  ul: ({ children }: any) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
  li: ({ children }: any) => <li className="text-body">{children}</li>,
  h1: ({ children }: any) => <h1 className="text-xl font-bold mt-6 mb-3 text-foreground">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-lg font-bold mt-5 mb-2 text-foreground">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-base font-bold mt-4 mb-2 text-foreground">{children}</h3>,
  h4: ({ children }: any) => <h4 className="text-sm font-semibold mt-3 mb-1 text-foreground">{children}</h4>,
  strong: ({ children }: any) => <strong className="font-bold text-foreground">{children}</strong>,
  blockquote: ({ children }: any) => <blockquote className="border-l-3 border-primary/40 pl-4 italic my-3 text-muted-foreground">{children}</blockquote>,
  hr: () => <hr className="my-4 border-border" />,
  table: ({ children }: any) => <div className="overflow-x-auto my-3"><table className="w-full text-sm border-collapse border border-border">{children}</table></div>,
  thead: ({ children }: any) => <thead className="bg-muted">{children}</thead>,
  th: ({ children }: any) => <th className="border border-border px-3 py-2 text-left font-semibold">{children}</th>,
  td: ({ children }: any) => <td className="border border-border px-3 py-2">{children}</td>,
};

export default function HelpGuide() {
  const { data, isLoading } = useQuery<{ content: string }>({
    queryKey: ["/api/app-settings/help-content"],
  });

  return (
    <PageLayout title="使用說明" showBack>
      <div className="px-4 py-6 max-w-lg mx-auto space-y-4 animate-fade-in">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : data?.content ? (
          <article className="bg-card rounded-xl border border-border p-5">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
              components={markdownComponents}
            >
              {data.content}
            </ReactMarkdown>
          </article>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-body">尚無使用說明</p>
            <p className="text-sm mt-1">管理員可在後台編輯使用說明內容</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
