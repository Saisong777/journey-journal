import { BottomNav } from "@/components/ui/BottomNav";
import { Header } from "@/components/layout/Header";

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
  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
      {showHeader && <Header title={title} className={headerClassName} />}
      <main className="flex-1 overflow-y-auto overscroll-none">
        {children}
      </main>
      {showBottomNav && <BottomNav />}
    </div>
  );
}
