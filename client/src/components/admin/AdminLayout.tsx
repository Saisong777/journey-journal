import { ReactNode } from "react";
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
  { path: "/admin/trip-notes", label: "注意事項管理", icon: FileText },
  { path: "/admin/invitations", label: "邀請碼管理", icon: Ticket },
  { path: "/admin/members", label: "會員管理", icon: Users },
  { path: "/admin/bible-library", label: "聖經資料館", icon: Library },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              to="/" 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-caption hidden sm:inline">返回前台</span>
            </Link>
            <div className="w-px h-6 bg-border" />
            <h1 className="text-title font-semibold">管理後台</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-[calc(100vh-4rem)] border-r border-border bg-card hidden md:block">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-body">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
          <div className="flex justify-around py-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-caption">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
