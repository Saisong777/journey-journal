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
  Library
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/admin", label: "總覽", icon: LayoutDashboard },
  { path: "/admin/trips", label: "旅程管理", icon: Map },
  { path: "/admin/trip-days", label: "每日行程", icon: CalendarDays },
  { path: "/admin/devotionals", label: "靈修管理", icon: BookOpen },
  { path: "/admin/trip-notes", label: "注意事項", icon: FileText },
  { path: "/admin/invitations", label: "邀請碼", icon: Ticket },
  { path: "/admin/members", label: "會員管理", icon: Users },
  { path: "/admin/bible-library", label: "聖經資料館", icon: Library },
];

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
    <div className="min-h-screen bg-background overflow-x-hidden">
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              to="/" 
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
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
        className="md:hidden sticky top-14 z-40 bg-card/95 backdrop-blur-sm border-b border-border overflow-x-auto scrollbar-hide"
      >
        <div className="flex gap-1 px-3 py-2 min-w-max">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                ref={isActive ? activeRef : undefined}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0",
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
              const isActive = location.pathname === item.path;
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

        <main className="flex-1 min-w-0 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
