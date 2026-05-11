import { ReactNode, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Map, 
  Users, 
  CalendarDays,
  BookOpen,
  Ticket,
  FileText,
  ArrowLeft,
  Library,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/admin", label: "總覽", icon: LayoutDashboard },
  { path: "/admin/trips", label: "旅程控制台", icon: Map },
  { path: "/admin/trip-days", label: "行程日程", icon: CalendarDays },
  { path: "/admin/devotionals", label: "每日靈修", icon: BookOpen },
  { path: "/admin/trip-notes", label: "注意事項", icon: FileText },
  { path: "/admin/invitations", label: "邀請與發布", icon: Ticket },
  { path: "/admin/members", label: "帳號權限", icon: Users },
  { path: "/admin/attractions", label: "景點導覽", icon: Map },
  { path: "/admin/bible-library", label: "資料館", icon: Library },
  { path: "/admin/help-guide", label: "使用說明", icon: HelpCircle },
];

function isNavActive(pathname: string, itemPath: string) {
  if (itemPath === "/admin") return pathname === "/admin";
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const active = activeRef.current;
      const scrollLeft = active.offsetLeft - container.offsetWidth / 2 + active.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  }, [location.pathname]);

  return (
    <div className="min-h-[100svh] overflow-x-hidden bg-background md:min-h-[100dvh]">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 pt-[env(safe-area-inset-top,0px)] backdrop-blur">
        <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between px-4 py-1">
          <div className="flex items-center gap-3">
            <Link 
              to="/" 
              className="flex min-h-[44px] items-center gap-1.5 rounded-full text-muted-foreground transition-colors hover:text-foreground active:bg-muted"
              data-testid="link-back-frontend"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs hidden sm:inline">返回前台</span>
            </Link>
            <div className="w-px h-5 bg-border" />
            <h1 className="text-sm font-semibold">管理後台</h1>
          </div>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-40 overflow-x-auto border-b border-border bg-card/95 backdrop-blur-sm scrollbar-hide md:hidden"
      >
        <div className="flex min-w-max gap-1 px-3 py-2">
          {navItems.map((item) => {
            const isActive = isNavActive(location.pathname, item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                ref={isActive ? activeRef : undefined}
                className={cn(
                  "flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
                data-testid={`admin-nav-${item.path.split('/').pop()}`}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex">
        <aside className="w-56 min-h-[calc(100vh-3.5rem)] border-r border-border bg-card hidden md:block">
          <nav className="p-3 space-y-0.5">
            {navItems.map((item) => {
              const isActive = isNavActive(location.pathname, item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors text-sm",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-foreground"
                  )}
                  data-testid={`admin-sidebar-${item.path.split('/').pop()}`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
