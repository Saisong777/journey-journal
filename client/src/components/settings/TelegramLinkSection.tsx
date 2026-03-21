import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MessageCircle, Link2, Unlink, Copy, ExternalLink, Bell, BellOff, RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TelegramStatus {
  linked: boolean;
  telegramUsername: string | null;
  telegramFirstName: string | null;
  notifyDevotional: boolean;
  notifySchedule: boolean;
  notifyRollCall: boolean;
  botUsername: string | null;
  botConfigured: boolean;
}

interface LinkCodeResponse {
  code: string;
  expiresAt: string;
  botUsername: string;
  deepLink: string | null;
}

export function TelegramLinkSection() {
  const { toast } = useToast();
  const [linkCode, setLinkCode] = useState<LinkCodeResponse | null>(null);

  const { data: status, isLoading } = useQuery<TelegramStatus>({
    queryKey: ["/api/telegram/status"],
  });

  const generateCodeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/telegram/link-code");
      return res.json() as Promise<LinkCodeResponse>;
    },
    onSuccess: (data) => {
      setLinkCode(data);
    },
    onError: (error: Error) => {
      toast({ title: "錯誤", description: error.message, variant: "destructive" });
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/telegram/unlink");
    },
    onSuccess: () => {
      setLinkCode(null);
      queryClient.invalidateQueries({ queryKey: ["/api/telegram/status"] });
      toast({ title: "已解除綁定", description: "Telegram 帳號已解除連接" });
    },
    onError: (error: Error) => {
      toast({ title: "錯誤", description: error.message, variant: "destructive" });
    },
  });

  const updatePrefsMutation = useMutation({
    mutationFn: async (prefs: Partial<{ notifyDevotional: boolean; notifySchedule: boolean; notifyRollCall: boolean }>) => {
      await apiRequest("PATCH", "/api/telegram/preferences", prefs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/telegram/status"] });
    },
    onError: (error: Error) => {
      toast({ title: "更新失敗", description: error.message, variant: "destructive" });
    },
  });

  const copyCode = () => {
    if (linkCode?.code) {
      navigator.clipboard.writeText(linkCode.code);
      toast({ title: "已複製", description: "綁定碼已複製到剪貼簿" });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg shadow-card p-4 animate-pulse">
        <div className="h-5 bg-muted rounded w-40 mb-2" />
        <div className="h-4 bg-muted rounded w-60" />
      </div>
    );
  }

  if (!status?.botConfigured) {
    return null; // Don't show if bot is not configured
  }

  // Already linked
  if (status.linked) {
    return (
      <section className="space-y-3">
        <h3 className="text-caption font-semibold text-muted-foreground px-1">
          Telegram 連接
        </h3>
        <div className="bg-card rounded-lg shadow-card overflow-hidden">
          {/* Status */}
          <div className="p-4 flex items-center gap-4 border-b border-border">
            <div className="w-10 h-10 rounded-full bg-[#2AABEE]/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-[#2AABEE]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body font-medium">Telegram 已連接</p>
              <p className="text-caption text-muted-foreground truncate">
                {status.telegramFirstName && `${status.telegramFirstName} `}
                {status.telegramUsername && `@${status.telegramUsername}`}
              </p>
            </div>
            <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
              已綁定
            </span>
          </div>

          {/* Notification preferences */}
          <div className="p-4 flex items-center gap-4 border-b border-border">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Bell className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-body font-medium">靈修提醒</p>
              <p className="text-caption text-muted-foreground">每日靈修通知</p>
            </div>
            <Switch
              checked={status.notifyDevotional}
              onCheckedChange={(checked) => updatePrefsMutation.mutate({ notifyDevotional: checked })}
            />
          </div>

          <div className="p-4 flex items-center gap-4 border-b border-border">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Bell className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-body font-medium">行程通知</p>
              <p className="text-caption text-muted-foreground">行程更新通知</p>
            </div>
            <Switch
              checked={status.notifySchedule}
              onCheckedChange={(checked) => updatePrefsMutation.mutate({ notifySchedule: checked })}
            />
          </div>

          <div className="p-4 flex items-center gap-4 border-b border-border">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Bell className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-body font-medium">點名通知</p>
              <p className="text-caption text-muted-foreground">團隊集合點名</p>
            </div>
            <Switch
              checked={status.notifyRollCall}
              onCheckedChange={(checked) => updatePrefsMutation.mutate({ notifyRollCall: checked })}
            />
          </div>

          {/* Unlink */}
          <button
            onClick={() => unlinkMutation.mutate()}
            disabled={unlinkMutation.isPending}
            className="w-full p-4 flex items-center gap-4 text-left hover:bg-muted/50 transition-colors text-destructive"
          >
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <Unlink className="w-5 h-5 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="text-body font-medium">解除綁定</p>
              <p className="text-caption text-muted-foreground">取消 Telegram 連接</p>
            </div>
          </button>
        </div>
      </section>
    );
  }

  // Not linked — show link flow
  return (
    <section className="space-y-3">
      <h3 className="text-caption font-semibold text-muted-foreground px-1">
        Telegram 連接
      </h3>
      <div className="bg-card rounded-lg shadow-card overflow-hidden">
        <div className="p-4 flex items-center gap-4 border-b border-border">
          <div className="w-10 h-10 rounded-full bg-[#2AABEE]/10 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-[#2AABEE]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-body font-medium">連接 Telegram</p>
            <p className="text-caption text-muted-foreground">
              綁定後可接收旅程通知、查看行程、快速寫日誌
            </p>
          </div>
        </div>

        {!linkCode ? (
          <button
            onClick={() => generateCodeMutation.mutate()}
            disabled={generateCodeMutation.isPending}
            className="w-full p-4 flex items-center justify-center gap-2 text-primary hover:bg-primary/5 transition-colors"
          >
            {generateCodeMutation.isPending ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Link2 className="w-5 h-5" />
            )}
            <span className="text-body font-medium">
              {generateCodeMutation.isPending ? "產生中..." : "取得綁定碼"}
            </span>
          </button>
        ) : (
          <div className="p-4 space-y-4">
            {/* Link code display */}
            <div className="text-center space-y-2">
              <p className="text-caption text-muted-foreground">您的綁定碼（10 分鐘內有效）：</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-mono font-bold tracking-[0.3em] bg-muted px-4 py-2 rounded-lg">
                  {linkCode.code}
                </span>
                <button
                  onClick={copyCode}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  title="複製綁定碼"
                >
                  <Copy className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-caption">
              <p className="font-medium">綁定步驟：</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>開啟 Telegram 搜尋 Bot</li>
                <li>傳送綁定碼 <span className="font-mono font-bold">{linkCode.code}</span> 給 Bot</li>
                <li>綁定完成後重新整理此頁面</li>
              </ol>
            </div>

            {/* Deep link button */}
            {linkCode.deepLink && (
              <a
                href={linkCode.deepLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#2AABEE] text-white rounded-lg p-3 hover:bg-[#229ED9] transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="font-medium">在 Telegram 中開啟</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            {/* Refresh button */}
            <button
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/telegram/status"] });
                setLinkCode(null);
              }}
              className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors p-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-caption">重新整理綁定狀態</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
