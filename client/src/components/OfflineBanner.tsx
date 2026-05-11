import { WifiOff, Wifi } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { cn } from "@/lib/utils";

interface OfflineBannerProps {
  pendingCount?: number;
}

export function OfflineBanner({ pendingCount = 0 }: OfflineBannerProps) {
  const { isOnline, wasOffline } = useNetworkStatus();

  if (isOnline && !wasOffline) return null;

  return (
    <div
      className={cn(
        "sticky top-0 z-[60] flex min-h-10 items-center justify-center gap-2 px-3 py-2 text-center text-caption font-medium transition-colors duration-300",
        isOnline
          ? "bg-green-100 text-green-800"
          : "bg-amber-100 text-amber-800"
      )}
      role="status"
      aria-live="polite"
      data-testid="offline-banner"
    >
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4" />
          <span>連線已恢復，資料會自動更新</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span className="line-clamp-2">
            離線模式：已載入資料仍可查看
            {pendingCount > 0 && `（${pendingCount} 筆資料待同步）`}
          </span>
        </>
      )}
    </div>
  );
}
