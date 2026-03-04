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
        "flex items-center justify-center gap-2 px-4 py-2 text-caption font-medium transition-colors duration-300",
        isOnline
          ? "bg-green-100 text-green-800"
          : "bg-amber-100 text-amber-800"
      )}
      data-testid="offline-banner"
    >
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4" />
          <span>已恢復連線</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span>
            目前無網路連線，顯示的是先前載入的資料
            {pendingCount > 0 && `（${pendingCount} 筆資料待同步）`}
          </span>
        </>
      )}
    </div>
  );
}
