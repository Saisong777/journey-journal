import { BottomNav } from "@/components/ui/BottomNav";
import { SidebarNav } from "@/components/ui/SidebarNav";
import { Header } from "@/components/layout/Header";
import { OfflineBanner } from "@/components/OfflineBanner";
import { useOfflineSyncStatus } from "@/lib/offlineSyncContext";

import { motion } from "framer-motion";

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  showHeader?: boolean;
  showBottomNav?: boolean;
  headerClassName?: string;
}

export function PageLayout({
  children,
  title,
  showHeader = true,
  showBottomNav = true,
  headerClassName,
}: PageLayoutProps) {
  const { pendingCount } = useOfflineSyncStatus();

  return (
    <div className="h-[100dvh] flex overflow-hidden bg-background">
      {/* 桌面版/平板版側邊欄 */}
      {showBottomNav && <SidebarNav />}

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <OfflineBanner pendingCount={pendingCount} />

        {/* 手機版 Header (桌面版也可以共用或隱藏) */}
        {showHeader && (
          <div className="md:hidden">
            <Header title={title} className={headerClassName} />
          </div>
        )}

        <motion.main
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex-1 overflow-y-auto overscroll-none scroll-smooth"
        >
          {children}
        </motion.main>

        {/* 手機版底部導覽列 */}
        {showBottomNav && (
          <div className="md:hidden mt-auto">
            <BottomNav />
          </div>
        )}
      </div>
    </div>
  );
}
