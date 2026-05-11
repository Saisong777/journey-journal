import { BottomNav } from "@/components/ui/BottomNav";
import { SidebarNav } from "@/components/ui/SidebarNav";
import { Header } from "@/components/layout/Header";
import { OfflineBanner } from "@/components/OfflineBanner";
import { useOfflineSyncStatus } from "@/lib/offlineSyncContext";
import { cn } from "@/lib/utils";

import { motion, useReducedMotion } from "framer-motion";

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  showHeader?: boolean;
  showBottomNav?: boolean;
  showBack?: boolean;
  headerClassName?: string;
}

export function PageLayout({
  children,
  title,
  showHeader = true,
  showBottomNav = true,
  showBack = false,
  headerClassName,
}: PageLayoutProps) {
  const { pendingCount } = useOfflineSyncStatus();
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex h-[100svh] overflow-hidden bg-background md:h-[100dvh]">
      {/* 桌面版/平板版側邊欄 */}
      {showBottomNav && <SidebarNav />}

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <OfflineBanner pendingCount={pendingCount} />

        {/* 手機版 Header (桌面版也可以共用或隱藏) */}
        {showHeader && (
          <div className="md:hidden">
            <Header title={title} className={headerClassName} showBack={showBack} />
          </div>
        )}

        <motion.main
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, scale: 0.99 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className={cn(
            "flex-1 overflow-y-auto overscroll-contain scroll-smooth",
            "[-webkit-overflow-scrolling:touch] scroll-pb-[calc(5rem+env(safe-area-inset-bottom,0px))]",
            showBottomNav ? "pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-0" : "pb-[env(safe-area-inset-bottom,0px)]"
          )}
        >
          {children}
        </motion.main>

        {/* 手機版底部導覽列 */}
        {showBottomNav && (
          <div className="md:hidden">
            <BottomNav />
          </div>
        )}
      </div>
    </div>
  );
}
