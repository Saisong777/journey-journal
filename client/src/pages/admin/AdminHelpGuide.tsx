import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2, Eye, Pencil, RotateCcw, FileText, Wand2, ExternalLink, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DEFAULT_HELP_CONTENT } from "@shared/helpContent";

const quickBlocks = [
  {
    title: "集合提醒",
    description: "補充集合、點名、遲到處理",
    content: `## 集合與點名提醒

- 請依照領隊公告的時間抵達集合點。
- 到達後請先完成「集合簽到」，再等待小組長確認。
- 若會晚到，請立刻通知小組長或領隊，不要只在 App 留言。
`,
  },
  {
    title: "網路不穩",
    description: "給旅客的排除步驟",
    content: `## 網路不穩時

1. 先確認手機是否已連上當地網路或 Wi-Fi。
2. 重新整理目前頁面。
3. 若仍看不到資料，請截圖並回報小組長。
`,
  },
  {
    title: "行前檢查",
    description: "護照、保險、行李提醒",
    content: `## 行前檢查

- 護照、簽證、保險資料請放在隨身包。
- 常用藥品、充電器、轉接頭請提前準備。
- 出發前請確認 App 可正常登入。
`,
  },
];

const markdownComponents = {
  p: ({ children }: any) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
  ul: ({ children }: any) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
  li: ({ children }: any) => <li className="text-sm">{children}</li>,
  h1: ({ children }: any) => <h1 className="text-xl font-bold mt-6 mb-3 text-foreground">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-lg font-bold mt-5 mb-2 text-foreground">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-base font-bold mt-4 mb-2 text-foreground">{children}</h3>,
  h4: ({ children }: any) => <h4 className="text-sm font-semibold mt-3 mb-1 text-foreground">{children}</h4>,
  strong: ({ children }: any) => <strong className="font-bold text-foreground">{children}</strong>,
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-2 border-primary/40 pl-4 italic my-3 text-muted-foreground">{children}</blockquote>
  ),
  hr: () => <hr className="my-4 border-border" />,
  table: ({ children }: any) => (
    <div className="overflow-x-auto my-3">
      <table className="w-full text-sm border-collapse border border-border">{children}</table>
    </div>
  ),
  thead: ({ children }: any) => <thead className="bg-muted">{children}</thead>,
  th: ({ children }: any) => <th className="border border-border px-3 py-2 text-left font-semibold">{children}</th>,
  td: ({ children }: any) => <td className="border border-border px-3 py-2">{children}</td>,
};

export default function AdminHelpGuide() {
  const { toast } = useToast();
  const [content, setContent] = useState("");

  const { data, isLoading } = useQuery<{ content: string; isDefault?: boolean }>({
    queryKey: ["/api/app-settings/help-content"],
  });

  useEffect(() => {
    if (data?.content !== undefined) {
      setContent(data.content);
    }
  }, [data?.content]);

  const saveMutation = useMutation({
    mutationFn: async (newContent: string) => {
      const res = await apiRequest("PATCH", "/api/admin/app-settings/help-content", { content: newContent });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/app-settings/help-content"] });
      toast({ title: "儲存成功", description: "旅客端使用說明已更新" });
    },
    onError: () => {
      toast({ title: "儲存失敗", description: "請稍後再試一次", variant: "destructive" });
    },
  });

  const savedContent = data?.content || "";
  const hasChanges = content !== savedContent;
  const trimmedLength = content.trim().length;
  const sectionCount = (content.match(/^#{1,3}\s+/gm) || []).length;

  const applyDefaultTemplate = () => {
    setContent(DEFAULT_HELP_CONTENT);
  };

  const appendBlock = (blockContent: string) => {
    setContent((current) => `${current.trimEnd()}\n\n${blockContent.trim()}\n`);
  };

  const resetChanges = () => {
    setContent(savedContent);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">使用說明</h1>
              {data?.isDefault && <Badge variant="secondary">使用預設內容</Badge>}
              {hasChanges && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">尚未儲存</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              編輯旅客在「更多 → 使用說明」看到的內容。建議寫成短句、分段、可現場照做。
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/help">
                <Eye className="mr-1.5 h-4 w-4" />
                看旅客版
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={resetChanges} disabled={!hasChanges || saveMutation.isPending}>
              <RotateCcw className="mr-1.5 h-4 w-4" />
              還原
            </Button>
            <Button onClick={() => saveMutation.mutate(content)} disabled={saveMutation.isPending || !hasChanges} size="sm">
              {saveMutation.isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-1.5 h-4 w-4" />
              )}
              儲存發布
            </Button>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">內容長度</p>
            <p className="mt-1 text-2xl font-bold">{trimmedLength}</p>
            <p className="text-xs text-muted-foreground">字元</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">段落標題</p>
            <p className="mt-1 text-2xl font-bold">{sectionCount}</p>
            <p className="text-xs text-muted-foreground">個</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">狀態</p>
            <p className="mt-1 text-lg font-semibold">{hasChanges ? "等待儲存" : "已同步"}</p>
            <p className="text-xs text-muted-foreground">旅客端讀取同一份內容</p>
          </div>
        </section>

        <section className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
            <div>
              <p className="font-semibold text-foreground">寫給旅客，不是寫給系統</p>
              <p className="mt-1 text-sm text-muted-foreground">
                最有效的使用說明通常是「遇到什麼情況 → 點哪裡 → 做什麼」。避免只列功能名稱，旅客在路上會更快找到答案。
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">快速套用</h2>
              </div>
              <div className="mt-4 space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={applyDefaultTemplate}>
                  <FileText className="mr-2 h-4 w-4" />
                  套用完整範本
                </Button>
                {quickBlocks.map((block) => (
                  <button
                    key={block.title}
                    type="button"
                    onClick={() => appendBlock(block.content)}
                    className="w-full rounded-md border border-border bg-background p-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
                  >
                    <span className="block text-sm font-semibold text-foreground">{block.title}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{block.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <h2 className="font-semibold">Markdown 提醒</h2>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <p>
                  <code className="rounded bg-muted px-1 py-0.5">## 標題</code> 用來分段。
                </p>
                <p>
                  <code className="rounded bg-muted px-1 py-0.5">- 項目</code> 適合提醒事項。
                </p>
                <p>
                  <code className="rounded bg-muted px-1 py-0.5">| 表格 |</code> 適合功能對照。
                </p>
              </div>
            </div>
          </aside>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <Pencil className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold">編輯內容</h2>
                </div>
                {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="# 使用說明"
                className="min-h-[620px] resize-none rounded-none border-0 bg-transparent font-mono text-sm focus-visible:ring-0"
              />
            </section>

            <section className="rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <Eye className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">旅客預覽</h2>
              </div>
              <div className="min-h-[620px] p-5">
                {content.trim() ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex min-h-[560px] items-center justify-center text-center text-muted-foreground">
                    <div>
                      <FileText className="mx-auto mb-3 h-8 w-8 opacity-50" />
                      <p className="text-sm">尚無內容</p>
                      <p className="mt-1 text-xs">可先套用完整範本，再依旅程調整。</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
