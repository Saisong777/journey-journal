import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Loader2, Eye, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import ReactMarkdown from "react-markdown";

const markdownComponents = {
  p: ({ children }: any) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
  ul: ({ children }: any) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
  li: ({ children }: any) => <li className="text-sm">{children}</li>,
  h1: ({ children }: any) => <h1 className="text-xl font-bold mt-6 mb-3">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-lg font-bold mt-5 mb-2">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-base font-bold mt-4 mb-2">{children}</h3>,
  h4: ({ children }: any) => <h4 className="text-sm font-semibold mt-3 mb-1">{children}</h4>,
  strong: ({ children }: any) => <strong className="font-bold">{children}</strong>,
  blockquote: ({ children }: any) => <blockquote className="border-l-2 border-primary/40 pl-4 italic my-3 text-muted-foreground">{children}</blockquote>,
  hr: () => <hr className="my-4 border-border" />,
};

export default function AdminHelpGuide() {
  const { toast } = useToast();
  const [content, setContent] = useState("");

  const { data, isLoading } = useQuery<{ content: string }>({
    queryKey: ["/api/app-settings/help-content"],
  });

  useEffect(() => {
    if (data?.content) {
      setContent(data.content);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (newContent: string) => {
      const res = await apiRequest("PATCH", "/api/admin/app-settings/help-content", { content: newContent });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/app-settings/help-content"] });
      toast({ title: "儲存成功", description: "使用說明已更新" });
    },
    onError: () => {
      toast({ title: "儲存失敗", variant: "destructive" });
    },
  });

  const hasChanges = content !== (data?.content || "");

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">使用說明編輯</h1>
          <Button
            onClick={() => saveMutation.mutate(content)}
            disabled={saveMutation.isPending || !hasChanges}
            size="sm"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-1.5" />
            )}
            儲存
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          使用 Markdown 格式編輯使用說明，團員可在「設定 → 使用說明」查看。
        </p>

        <Tabs defaultValue="edit" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit" className="gap-1.5">
              <Pencil className="w-3.5 h-3.5" />
              編輯
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              預覽
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="mt-4">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={"# 使用說明\n\n## 如何開始\n\n1. 登入帳號\n2. ...\n\n支援 Markdown 格式"}
              className="min-h-[500px] font-mono text-sm"
            />
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <div className="bg-card rounded-xl border border-border p-5 min-h-[500px]">
              {content ? (
                <ReactMarkdown
                  className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                  components={markdownComponents}
                >
                  {content}
                </ReactMarkdown>
              ) : (
                <p className="text-muted-foreground text-sm">尚無內容，請在「編輯」分頁中輸入 Markdown 內容</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
